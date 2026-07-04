-- =====================================================================
--  DAWA — COUPON, VOUCHER, REFERRAL, GIFT & SALE HUB
--  PostgreSQL schema (v2)
--
--  Run order matters (foreign keys). Execute the whole file at once:
--      psql -U <user> -d <db> -f database/schema.sql
--
--  Requires PostgreSQL 13+ (for built-in gen_random_uuid()).
--  pgcrypto is enabled below so gen_random_uuid() works on older 12.x too.
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
--  ENUM TYPES
--  Native enums keep the data clean and match the "ENUM" columns in the
--  spec. If you prefer plain text + CHECK constraints, drop these and
--  swap the column types for VARCHAR (the referral/gift tables below
--  already show that style).
-- ---------------------------------------------------------------------
CREATE TYPE discount_type_enum   AS ENUM ('PERCENT', 'FLAT', 'FREE_SHIPPING');
CREATE TYPE coupon_status_enum   AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');
CREATE TYPE coupon_usage_status  AS ENUM ('RESERVED', 'USED', 'RELEASED');
CREATE TYPE voucher_status_enum  AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');
CREATE TYPE voucher_txn_type     AS ENUM ('ISSUE', 'REDEEM', 'REFUND', 'EXPIRE', 'ADJUSTMENT');

-- =====================================================================
--  REFERENCE TABLES
--  Minimal stubs so the foreign keys below resolve. If you already have
--  these tables, delete the stubs and keep only the FK references.
-- =====================================================================

CREATE TABLE IF NOT EXISTS customers (
    customer_id   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE,
    phone         VARCHAR(20),
    location      VARCHAR(120),
    orders_count  INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    employee_id   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
    admin_id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(50) NOT NULL DEFAULT 'ADMIN'
                    CHECK (role IN ('ADMIN', 'MARKETING_MANAGER', 'PARTNER')),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    product_id    VARCHAR(50) PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    brand         VARCHAR(255),
    category      VARCHAR(120),
    price         DECIMAL(10,2) NOT NULL DEFAULT 0,
    mrp           DECIMAL(10,2),
    is_rx         SMALLINT DEFAULT 0 CHECK (is_rx IN (0,1)),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
--  1. COUPONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS coupons (
    coupon_id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code                      VARCHAR(50) UNIQUE NOT NULL,          -- Coupon code
    name                      VARCHAR(255) NOT NULL,               -- Coupon name
    description               TEXT,                                -- Coupon description
    discount_type             discount_type_enum NOT NULL,         -- PERCENT / FLAT / FREE_SHIPPING
    discount_value            DECIMAL(10,2) NOT NULL DEFAULT 0,    -- amount or percentage
    max_discount_amount       DECIMAL(10,2),                       -- cap for PERCENT coupons
    usage_limit_global        INT,                                 -- max total uses (NULL = unlimited)
    usage_limit_per_customer  INT DEFAULT 1,                       -- max uses per customer
    current_usage             INT NOT NULL DEFAULT 0,              -- running count
    valid_from                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to                  TIMESTAMP,
    stackable                 BOOLEAN NOT NULL DEFAULT FALSE,      -- combinable with others
    auto_apply                BOOLEAN NOT NULL DEFAULT FALSE,      -- apply automatically if eligible
    priority                  INT NOT NULL DEFAULT 0,              -- tie-break when many apply
    rule_conditions           JSONB NOT NULL DEFAULT '{}'::jsonb,  -- all business validation rules
    status                    coupon_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_by                UUID REFERENCES admin_users(admin_id),
    created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_coupon_dates   CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT chk_coupon_usage   CHECK (current_usage >= 0)
);

CREATE INDEX idx_coupons_status     ON coupons(status);
CREATE INDEX idx_coupons_auto_apply ON coupons(auto_apply) WHERE auto_apply = TRUE;
CREATE INDEX idx_coupons_validity   ON coupons(valid_from, valid_to);
-- Example rule_conditions payload:
--   { "min_cart_value": 799, "categories": ["OTC"], "min_orders": 0,
--     "locations": ["Mumbai"], "devices": ["app"], "brand": "Himalaya" }
CREATE INDEX idx_coupons_rules_gin  ON coupons USING GIN (rule_conditions);

-- ---------------------------------------------------------------------
--  COUPON USAGE  (reserve -> use -> release lifecycle)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupon_usage (
    usage_id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id       UUID NOT NULL REFERENCES coupons(coupon_id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(customer_id),
    order_id        UUID,
    discount_given  DECIMAL(10,2) NOT NULL DEFAULT 0,
    reserved_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at         TIMESTAMP,
    released_at     TIMESTAMP,
    status          coupon_usage_status NOT NULL DEFAULT 'RESERVED'
);

CREATE INDEX idx_coupon_usage_coupon   ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_customer ON coupon_usage(customer_id, coupon_id);
CREATE INDEX idx_coupon_usage_status   ON coupon_usage(status);

-- =====================================================================
--  2. VOUCHERS
--     template -> issued voucher (assigned to a customer/employee)
--             -> ledger of every balance movement
-- =====================================================================
CREATE TABLE IF NOT EXISTS voucher_templates (
    template_id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name       VARCHAR(255) NOT NULL,
    description         TEXT,
    amount              DECIMAL(10,2) NOT NULL,        -- face value issued per voucher
    expiry_days         INT NOT NULL DEFAULT 365,      -- days from issue until expiry
    transferable        BOOLEAN NOT NULL DEFAULT FALSE,
    partial_redemption  BOOLEAN NOT NULL DEFAULT TRUE, -- allow partial spends
    created_by          UUID REFERENCES admin_users(admin_id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id       UUID NOT NULL REFERENCES voucher_templates(template_id),
    voucher_code      VARCHAR(50) UNIQUE NOT NULL,
    customer_id       UUID REFERENCES customers(customer_id),  -- assigned customer (nullable)
    employee_id       UUID REFERENCES employees(employee_id),  -- or assigned employee (nullable)
    initial_amount    DECIMAL(10,2) NOT NULL,
    remaining_amount  DECIMAL(10,2) NOT NULL,
    expiry_date       TIMESTAMP,
    status            voucher_status_enum NOT NULL DEFAULT 'ACTIVE',
    issued_by         UUID REFERENCES admin_users(admin_id),
    issued_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at      TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_voucher_balance CHECK (remaining_amount >= 0 AND remaining_amount <= initial_amount),
    -- assigned to at most one holder type
    CONSTRAINT chk_voucher_holder  CHECK (NOT (customer_id IS NOT NULL AND employee_id IS NOT NULL))
);

CREATE INDEX idx_vouchers_customer ON vouchers(customer_id);
CREATE INDEX idx_vouchers_employee ON vouchers(employee_id);
CREATE INDEX idx_vouchers_template ON vouchers(template_id);
CREATE INDEX idx_vouchers_status   ON vouchers(status);

-- ---------------------------------------------------------------------
--  VOUCHER TRANSACTIONS  (immutable ledger — one row per balance change)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS voucher_transactions (
    transaction_id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_id        UUID NOT NULL REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
    order_id          UUID,
    transaction_type  voucher_txn_type NOT NULL,     -- ISSUE / REDEEM / REFUND / EXPIRE / ADJUSTMENT
    amount            DECIMAL(10,2) NOT NULL,         -- signed or absolute per your convention
    balance_after     DECIMAL(10,2) NOT NULL,         -- remaining balance snapshot after this txn
    remarks           TEXT,
    created_by        UUID,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voucher_txn_voucher ON voucher_transactions(voucher_id);
CREATE INDEX idx_voucher_txn_order   ON voucher_transactions(order_id);
CREATE INDEX idx_voucher_txn_type    ON voucher_transactions(transaction_type);

-- =====================================================================
--  3. REFERRALS
-- =====================================================================
CREATE TABLE IF NOT EXISTS referral_campaigns (
    campaign_id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name                   VARCHAR(255) NOT NULL,

    -- reward for the person who shares the link
    referrer_reward_type   VARCHAR(20) CHECK (referrer_reward_type IN ('COUPON','VOUCHER')),
    referrer_reward_value  DECIMAL(10,2) NOT NULL,

    -- reward for the new user who signs up
    referee_reward_type    VARCHAR(20) CHECK (referee_reward_type IN ('COUPON','VOUCHER')),
    referee_reward_value   DECIMAL(10,2) NOT NULL,

    -- new user's first order must clear this to trigger the reward
    min_order_value        DECIMAL(10,2) DEFAULT 0,

    is_active              SMALLINT DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_referral_codes (
    code_id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id    UUID NOT NULL UNIQUE REFERENCES customers(customer_id),
    campaign_id    UUID NOT NULL REFERENCES referral_campaigns(campaign_id),
    referral_code  VARCHAR(20) UNIQUE NOT NULL,          -- e.g. 'JOHN-938A'
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_tracking (
    tracking_id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    referrer_customer_id  UUID NOT NULL REFERENCES customers(customer_id),
    referee_customer_id   UUID NOT NULL UNIQUE REFERENCES customers(customer_id),
    campaign_id           UUID NOT NULL REFERENCES referral_campaigns(campaign_id),

    status_id             VARCHAR(20) NOT NULL DEFAULT 'REF_JOINED'
        CHECK (status_id IN (
            'REF_JOINED',    -- account created
            'REF_ORDERED',   -- first order placed
            'REF_REWARDED',  -- both users rewarded
            'REF_FAILED'     -- order cancelled / fraud
        )),

    qualifying_order_id   VARCHAR(50),
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_tracking_referrer ON referral_tracking(referrer_customer_id);
CREATE INDEX idx_referral_tracking_status   ON referral_tracking(status_id);

-- =====================================================================
--  4. GIFTS  (Buy X Get Y — free product bundling)
--     gift_catalog     -> master list of giftable products (the "map")
--     gift_campaigns   -> trigger rules
--     gift_products    -> which catalog items a campaign can hand out
--     gift_tracking    -> awarded gifts per order
-- =====================================================================

-- Master list: only products added here are eligible to be given as gifts.
CREATE TABLE IF NOT EXISTS gift_catalog (
    gift_catalog_id  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id       VARCHAR(50) NOT NULL REFERENCES products(product_id),
    display_name     VARCHAR(255) NOT NULL,               -- admin-friendly label for dropdowns
    is_available     SMALLINT DEFAULT 1 CHECK (is_available IN (0,1)),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id)
);

CREATE TABLE IF NOT EXISTS gift_campaigns (
    campaign_id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name               VARCHAR(255) NOT NULL,
    description        TEXT,

    -- trigger engine: combined rules as JSON, e.g.
    -- { "min_cart_value": 10000, "location": "Mumbai",
    --   "min_category_spend": { "category": "Women", "amount": 1000 },
    --   "required_product_id": "PROD_BABY_LOTION", "required_qty": 2 }
    trigger_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,

    max_gifts_per_user INT DEFAULT 1,     -- one gift per user across this campaign
    global_usage_limit INT,               -- platform-wide trigger cap

    priority           INT DEFAULT 0,     -- resolves conflicts when many campaigns qualify

    valid_from         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to           TIMESTAMP,
    is_active          SMALLINT DEFAULT 1 CHECK (is_active IN (0,1)),

    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gift_campaigns_active ON gift_campaigns(is_active, priority);
CREATE INDEX idx_gift_campaigns_rules  ON gift_campaigns USING GIN (trigger_conditions);

-- Which catalog gifts a specific campaign can give, and how many.
CREATE TABLE IF NOT EXISTS gift_products (
    gift_id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id        UUID NOT NULL REFERENCES gift_campaigns(campaign_id) ON DELETE CASCADE,
    gift_catalog_id    UUID NOT NULL REFERENCES gift_catalog(gift_catalog_id),
    allocated_quantity INT NOT NULL,
    given_quantity     INT DEFAULT 0,
    UNIQUE (campaign_id, gift_catalog_id),
    CONSTRAINT chk_gift_allocation CHECK (given_quantity <= allocated_quantity)
);

CREATE TABLE IF NOT EXISTS gift_tracking (
    tracking_id   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id   UUID NOT NULL REFERENCES gift_campaigns(campaign_id),
    gift_id       UUID NOT NULL REFERENCES gift_products(gift_id),
    customer_id   UUID NOT NULL REFERENCES customers(customer_id),
    order_id      VARCHAR(50) NOT NULL UNIQUE,           -- one gift record per order
    product_id    VARCHAR(50) NOT NULL,                  -- snapshot of gifted product
    status        VARCHAR(20) DEFAULT 'AWARDED'
                    CHECK (status IN ('AWARDED','REVOKED','RETURNED')),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gift_tracking_customer ON gift_tracking(customer_id, campaign_id);
CREATE INDEX idx_gift_tracking_order    ON gift_tracking(order_id);

-- =====================================================================
--  5. SALE DESIGN  (Flash / seasonal sales — bulk price overrides)
--     sale_campaigns -> the sale event (title, window, store group, channel)
--     sale_items     -> per-product price/points override during the sale
-- =====================================================================
CREATE TABLE IF NOT EXISTS sale_campaigns (
    sale_id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,                -- e.g. "Today's Super Saver 20% Off"
    description     TEXT,
    sale_type       VARCHAR(20) NOT NULL DEFAULT 'FLASH'
                      CHECK (sale_type IN ('FLASH','SEASONAL','CLEARANCE','BUNDLE')),
    store_group_id  VARCHAR(50),                          -- target store group (NULL = all)
    channel         VARCHAR(20) NOT NULL DEFAULT 'ALL'
                      CHECK (channel IN ('ALL','WEB','MOBILE_APP')),
    priority        VARCHAR(10) NOT NULL DEFAULT 'Medium'
                      CHECK (priority IN ('High','Medium','Low')),
    valid_from      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to        TIMESTAMP,
    is_active       SMALLINT DEFAULT 1 CHECK (is_active IN (0,1)),
    created_by      UUID REFERENCES admin_users(admin_id),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sale_dates CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE INDEX idx_sale_campaigns_active ON sale_campaigns(is_active, valid_from, valid_to);

CREATE TABLE IF NOT EXISTS sale_items (
    sale_item_id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id           UUID NOT NULL REFERENCES sale_campaigns(sale_id) ON DELETE CASCADE,
    product_id        VARCHAR(50) NOT NULL REFERENCES products(product_id),
    drug_id           VARCHAR(50),

    original_price    DECIMAL(10,2) NOT NULL,             -- price/points before the sale
    sale_price        DECIMAL(10,2) NOT NULL,             -- discounted price/points
    discount_percent  DECIMAL(5,2)  NOT NULL DEFAULT 0,   -- convenience column

    min_order_value   DECIMAL(10,2) DEFAULT 0,            -- min cart to unlock this sale price
    sale_description  TEXT,                               -- flash long description
    is_active         SMALLINT DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (sale_id, product_id),
    CONSTRAINT chk_sale_price CHECK (sale_price >= 0 AND sale_price <= original_price)
);

CREATE INDEX idx_sale_items_sale    ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- ---------------------------------------------------------------------
--  updated_at auto-touch trigger (applied to tables that carry it)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coupons_updated        BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_referral_updated       BEFORE UPDATE ON referral_tracking
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_gift_campaigns_updated BEFORE UPDATE ON gift_campaigns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sale_campaigns_updated BEFORE UPDATE ON sale_campaigns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;

-- =====================================================================
--  END OF SCHEMA
-- =====================================================================
