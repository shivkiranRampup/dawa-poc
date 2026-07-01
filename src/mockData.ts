import { Coupon, Product, UserProfile, ReferralProgram, Referral, Promotion, PromotionUsage, RuleCondition, FlashSaleItem, SmartFeeConfig, GiftRule } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PROD_ZYV_M_FORTE',
    name: 'Zyvana M Forte 2mg/1000mg Tablet SR',
    price: 63.28,
    mrp: 70.31,
    category: 'Medicine',
    isRx: true,
    description: 'Bilayer sustained release anti-diabetic medication containing Glimepiride and Metformin.',
    brand: 'Converge Biotech',
    form: 'Tablet',
    packageType: 'Box',
    suggestedProducts: ['PROD_ZYV_MV1']
  },
  {
    id: 'PROD_ZYV_MV1',
    name: 'Zyvana MV 1 Tablet',
    price: 91.13,
    mrp: 101.25,
    category: 'Medicine',
    isRx: true,
    description: 'Multivitamin and mineral formulation specifically balanced to manage nutritional needs.',
    brand: 'Converge Biotech',
    form: 'Tablet',
    packageType: 'Box',
    suggestedProducts: ['PROD_ZYV_M_FORTE']
  },
  {
    id: 'PROD_ZYPLANIN',
    name: 'Zyplanin 200mg Injection',
    price: 680.40,
    mrp: 756.00,
    category: 'Medicine',
    isRx: true,
    description: 'Teicoplanin antibiotic injection for treating serious Gram-positive bacterial infections.',
    brand: 'Zyphar\'s Pharmaceuticals Pvt Ltd',
    form: 'Ampule',
    packageType: 'Bottle',
    suggestedProducts: []
  },
  {
    id: 'PROD_GLUCOTAG',
    name: 'Glucotag M 25mg/500mg Tablet',
    price: 82.69,
    mrp: 91.88,
    category: 'Medicine',
    isRx: true,
    description: 'Combination medication for type 2 diabetes mellitus to help control blood sugar levels.',
    brand: 'Ikon Remedies Pvt Ltd',
    form: 'Tablet',
    packageType: 'Box',
    suggestedProducts: []
  },
  {
    id: 'PROD_GLUCORD',
    name: 'Glucord M 25 Tablet',
    price: 85.22,
    mrp: 94.69,
    category: 'Medicine',
    isRx: true,
    description: 'Antidiabetic agent containing Gliclazide and Metformin to control glycemic levels.',
    brand: 'Agrosaf Pharmaceuticals',
    form: 'Tablet',
    packageType: 'Box',
    suggestedProducts: []
  },
  {
    id: 'PROD_GLUCOBAY',
    name: 'Glucobay M 25 Tablet',
    price: 100.40,
    mrp: 111.56,
    category: 'Medicine',
    isRx: true,
    description: 'Alpha-glucosidase inhibitor containing Acarbose and Metformin for effective glycemic control.',
    brand: 'Bayer Zydus Pharma Pvt Ltd',
    form: 'Tablet',
    packageType: 'Box',
    suggestedProducts: []
  },
  {
    id: 'PROD_GLUCODAC',
    name: 'Glucodac M 25mg/500mg Tablet',
    price: 85.22,
    mrp: 94.69,
    category: 'Medicine',
    isRx: true,
    description: 'Combination oral hypoglycemic tablet formulated for type 2 diabetes management.',
    brand: 'Innovative Pharmaceuticals',
    form: 'Tablet',
    packageType: 'Box',
    suggestedProducts: []
  },
  {
    id: 'PROD_DISORB',
    name: 'Disorb M 25mg/500mg Tablet',
    price: 101.25,
    mrp: 112.50,
    category: 'Medicine',
    isRx: true,
    description: 'Provides synergistic control of blood sugar in adult patients with diabetes.',
    brand: 'Elder Pharmaceuticals Ltd',
    form: 'Tablet',
    packageType: 'Box',
    suggestedProducts: []
  },
  {
    id: 'PROD_ALPHADOL',
    name: 'Alphadol 1mcg Soft Gelatin Capsule',
    price: 294.20,
    mrp: 326.89,
    category: 'Personal Care',
    isRx: false,
    description: 'Alfacalcidol (Vitamin D3 analogue) for building bone strength, density, and general wellbeing.',
    brand: 'Elder Pharmaceuticals Ltd',
    form: 'AliCap',
    packageType: 'Bottle',
    suggestedProducts: ['PROD_ALTONIL']
  },
  {
    id: 'PROD_ALTONIL',
    name: 'Altonil Plus 10 Tablet',
    price: 110.00,
    mrp: 122.22,
    category: 'Medicine',
    isRx: true,
    description: 'Therapeutic neuro-health agent. Requires prescription verification.',
    brand: 'Alteus Biogenics Pvt Ltd',
    form: 'Tablet',
    packageType: 'Box',
    suggestedProducts: ['PROD_ALRISTA']
  },
  {
    id: 'PROD_ALRISTA',
    name: 'Alrista Forte Tablet',
    price: 160.00,
    mrp: 177.78,
    category: 'Medicine',
    isRx: true,
    description: 'Epalrestat formulation for management of diabetic neuropathy symptoms.',
    brand: 'Macleods Pharmaceuticals',
    form: 'Tablet',
    packageType: 'Box',
    suggestedProducts: ['PROD_ALTONIL']
  },
  {
    id: 'PROD_ALOJA',
    name: 'Aloja 25 Tablet',
    price: 180.00,
    mrp: 200.00,
    category: 'Medicine',
    isRx: true,
    description: 'Alogliptin daily oral medication used to lower blood sugar in type 2 diabetes.',
    brand: 'Indoco Remedies',
    form: 'Tablet',
    packageType: 'Box',
    suggestedProducts: []
  },
  {
    id: 'PROD_BABY_LOTION',
    name: 'Himalaya Baby Lotion & Cream',
    price: 120.00,
    mrp: 140.00,
    category: 'Child Care',
    isRx: false,
    description: 'Nourishing lotion formulated with natural oils to protect baby skin from dryness.',
    brand: 'Himalaya',
    form: 'Bottle',
    packageType: 'Bottle',
    suggestedProducts: []
  },
  {
    id: 'PROD_TOY_GIFT',
    name: 'Premium Soft Teddy Bear',
    price: 350.00,
    mrp: 350.00,
    category: 'Toys & Gifts',
    isRx: false,
    description: 'Ultra-soft premium plush brown teddy bear. Perfect gift companion for babies.',
    brand: 'Zeno Gifts',
    form: 'Toy',
    packageType: 'Box',
    suggestedProducts: []
  },
  {
    id: 'PROD_WOMEN_FACEWASH',
    name: 'Himalaya Women Neem Facewash',
    price: 150.00,
    mrp: 175.00,
    category: 'Women Care',
    isRx: false,
    description: 'Purifying neem face wash that cleanses impurities and helps prevent acne for clear skin.',
    brand: 'Himalaya',
    form: 'Bottle',
    packageType: 'Bottle',
    suggestedProducts: []
  },
  {
    id: 'PROD_HOODIE_GIFT',
    name: 'Cozy Women Pastel Pink Hoodie',
    price: 1200.00,
    mrp: 1200.00,
    category: 'Apparel & Comfort',
    isRx: false,
    description: 'Premium brushed cotton pastel pink pullover hoodie. Soft, oversized, and ultra-comfortable.',
    brand: 'Zeno Apparel',
    form: 'Hoodie',
    packageType: 'Box',
    suggestedProducts: []
  },
  {
    id: 'PROD_Y_GIFT',
    name: 'Zeno Wellness Daily Multi-Vitamin',
    price: 250.00,
    mrp: 250.00,
    category: 'Vitamins & Supplements',
    isRx: false,
    description: 'Premium daily multivitamin formulation with key minerals and active antioxidants.',
    brand: 'Zeno Wellness',
    form: 'Tablet',
    packageType: 'Bottle',
    suggestedProducts: []
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: '1',
    code: 'SAVE200',
    name: 'Flat Rs 200 off above Rs 799',
    description: 'Saves Rs 200 on cart totals of Rs 799 or more. Valid on OTC healthcare items only (excludes Rx items).',
    discountType: 'flat',
    discountValue: 200,
    minCartValue: 799,
    startDate: '2026-01-01T00:00',
    endDate: '2027-12-31T23:59',
    isStackable: false,
    categoryRestrictions: [],
    locationRestrictions: [],
    deviceRestrictions: [],
    minPreviousOrders: 0,
    perUserLimit: 2,
    creatorRole: 'Admin',
    usageCount: 15,
    isActive: true,
    points: 1290,
    storeGroupId: 1,
    drugId: '502956',
    priority: 3,
    campaignUrl: 'https://rewards.zeno.health/s/save200',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '2',
    code: 'HEALTH20',
    name: '20% Off up to Rs 250',
    description: 'Get 20% off on OTC items, capped at a maximum of Rs 250. Requires Rs 400 minimum cart.',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountCap: 250,
    minCartValue: 400,
    startDate: '2026-01-01T00:00',
    endDate: '2027-12-31T23:59',
    isStackable: true,
    categoryRestrictions: [],
    locationRestrictions: [],
    deviceRestrictions: [],
    minPreviousOrders: 0,
    perUserLimit: 5,
    creatorRole: 'Marketing Manager',
    usageCount: 42,
    isActive: true,
    points: 8900,
    storeGroupId: 7,
    drugId: '754858',
    priority: 3,
    campaignUrl: 'https://rewards.zeno.health/s/health20',
    imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '3',
    code: 'FIRST150',
    name: 'First User Bonus - Rs 150 Flat',
    description: 'Flat Rs 150 off with no minimum purchase requirement. Strictly 1 use per user account.',
    discountType: 'flat',
    discountValue: 150,
    minCartValue: 0,
    startDate: '2026-01-01T00:00',
    endDate: '2027-12-31T23:59',
    isStackable: false,
    categoryRestrictions: [],
    locationRestrictions: [],
    deviceRestrictions: [],
    minPreviousOrders: 0,
    perUserLimit: 1,
    creatorRole: 'Admin',
    usageCount: 128,
    isActive: true,
    points: 1500,
    storeGroupId: 3,
    drugId: '109282',
    priority: 1,
    campaignUrl: 'https://rewards.zeno.health/s/first150',
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '4',
    code: 'MUMBAI50',
    name: 'Mumbai Special Delivery Offer',
    description: 'Flat Rs 50 off on OTC items. Exclusive for deliveries within Mumbai city limits.',
    discountType: 'flat',
    discountValue: 50,
    minCartValue: 299,
    startDate: '2026-01-01T00:00',
    endDate: '2027-12-31T23:59',
    isStackable: true,
    categoryRestrictions: [],
    locationRestrictions: ['Mumbai'],
    deviceRestrictions: [],
    minPreviousOrders: 0,
    perUserLimit: 3,
    creatorRole: 'Partner',
    usageCount: 8,
    isActive: true,
    points: 500,
    storeGroupId: 1,
    drugId: '119284',
    priority: 3,
    campaignUrl: 'https://rewards.zeno.health/s/mumbai50',
    imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '5',
    code: 'APPONLY30',
    name: 'Exclusive Mobile App Discount',
    description: '30% off OTC products up to Rs 150. Valid only when placing orders via the mobile application.',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscountCap: 150,
    minCartValue: 350,
    startDate: '2026-01-01T00:00',
    endDate: '2027-12-31T23:59',
    isStackable: false,
    categoryRestrictions: [],
    locationRestrictions: [],
    deviceRestrictions: ['app'],
    minPreviousOrders: 0,
    perUserLimit: 2,
    creatorRole: 'Marketing Manager',
    usageCount: 94,
    isActive: true,
    points: 3000,
    storeGroupId: 7,
    drugId: '829103',
    priority: 2,
    campaignUrl: 'https://rewards.zeno.health/s/apponly30',
    imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '6',
    code: 'VIP1000',
    name: 'Loyalty Reward - Rs 1000 Off',
    description: 'Flat Rs 1000 discount on cart value Rs 2000 or more. Only accessible to users who completed 100+ orders.',
    discountType: 'flat',
    discountValue: 1000,
    minCartValue: 2000,
    startDate: '2026-01-01T00:00',
    endDate: '2027-12-31T23:59',
    isStackable: false,
    categoryRestrictions: [],
    locationRestrictions: [],
    deviceRestrictions: [],
    minPreviousOrders: 100, // VIP / Loyalty Order requirement
    perUserLimit: 1,
    creatorRole: 'Admin',
    usageCount: 3,
    isActive: true,
    points: 10000,
    storeGroupId: 1,
    drugId: '992019',
    priority: 3,
    campaignUrl: 'https://rewards.zeno.health/s/vip1000',
    imageUrl: 'https://images.unsplash.com/photo-1616671276441-2f2c277b8bf4?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '7',
    code: 'DIABETES15',
    name: '15% Off Diabetes Care Products',
    description: 'Save 15% on items under the Diabetes Care category. Max Rs 300 discount. Excludes insulin/Rx drugs.',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscountCap: 300,
    minCartValue: 500,
    startDate: '2026-01-01T00:00',
    endDate: '2027-12-31T23:59',
    isStackable: true,
    categoryRestrictions: ['Diabetes Care'],
    locationRestrictions: [],
    deviceRestrictions: [],
    minPreviousOrders: 0,
    perUserLimit: 10,
    creatorRole: 'Partner',
    usageCount: 19,
    isActive: true,
    points: 1500,
    storeGroupId: 4,
    drugId: '382910',
    priority: 2,
    campaignUrl: 'https://rewards.zeno.health/s/diabetes15',
    imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '8',
    code: 'FREEDEL10',
    name: 'Loyal Web Free Delivery',
    description: 'Waives the delivery fee (Rs 49) completely. Exclusive to loyal users with 10+ completed orders on our website.',
    discountType: 'free_delivery',
    discountValue: 0,
    minCartValue: 0,
    startDate: '2026-01-01T00:00',
    endDate: '2027-12-31T23:59',
    isStackable: true,
    categoryRestrictions: [],
    locationRestrictions: [],
    deviceRestrictions: ['web'],
    minPreviousOrders: 10,
    perUserLimit: 1,
    creatorRole: 'Admin',
    usageCount: 0,
    isActive: true,
    points: 490,
    storeGroupId: 1,
    drugId: '482910',
    priority: 1,
    campaignUrl: 'https://rewards.zeno.health/s/freedel10',
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400'
  }
];

export const DEFAULT_USER: UserProfile = {
  id: 'USR992',
  name: 'Shiv Kiran',
  email: 'shivkiran.chitkulwar@rampupinfotech.com',
  phone: '+91 98765 43210',
  location: 'Mumbai',
  device: 'web',
  previousOrdersCount: 105, // Starts high to let them test VIP coupons by default, can be toggled!
  usedCoupons: {
    'FIRST150': 1 // FIRST150 already used once to show per-user limit rejection!
  }
};

export const DEFAULT_REFERRALS: Referral[] = [
  {
    id: 'REF01',
    referredName: 'Aditya Sen',
    referredEmail: 'aditya.sen@example.com',
    status: 'order_completed',
    rewardEarned: 200,
    date: '2026-06-15 14:30'
  },
  {
    id: 'REF02',
    referredName: 'Pooja Sharma',
    referredEmail: 'pooja.sharma@example.com',
    status: 'registered',
    rewardEarned: 0,
    date: '2026-06-28 09:15'
  },
  {
    id: 'REF03',
    referredName: 'Rohan Mehra',
    referredEmail: 'rohan.mehra@example.com',
    status: 'invited',
    rewardEarned: 0,
    date: '2026-06-29 18:40'
  }
];

export const INITIAL_REFERRAL_PROGRAM: ReferralProgram = {
  referralCode: 'SHIVK992',
  referrerRewardAmount: 200, // Rs 200 reward for every successful referral
  refereeDiscountAmount: 150, // Rs 150 coupon for invited friend's first order
  totalRewardsEarned: 200,
  history: DEFAULT_REFERRALS
};

// Local storage management helpers
const STORAGE_PREFIX = 'dawa_coupon_hub_';

export function getStoredCoupons(): Coupon[] {
  const data = localStorage.getItem(STORAGE_PREFIX + 'coupons');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_COUPONS;
}

export function saveStoredCoupons(coupons: Coupon[]) {
  localStorage.setItem(STORAGE_PREFIX + 'coupons', JSON.stringify(coupons));
}

export function getStoredUser(): UserProfile {
  const data = localStorage.getItem(STORAGE_PREFIX + 'user');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_USER;
}

export function saveStoredUser(user: UserProfile) {
  localStorage.setItem(STORAGE_PREFIX + 'user', JSON.stringify(user));
}

export function getStoredReferralProgram(): ReferralProgram {
  const data = localStorage.getItem(STORAGE_PREFIX + 'referral');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_REFERRAL_PROGRAM;
}

export function saveStoredReferralProgram(refProg: ReferralProgram) {
  localStorage.setItem(STORAGE_PREFIX + 'referral', JSON.stringify(refProg));
}

// SIMULATED DATABASE TABLES
export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    promotion_id: 'p1',
    code: 'WELCOME20',
    name: 'New User Promo',
    description: '20% off up to Rs 200 on first purchase.',
    promo_type: 'COUPON',
    discount_type: 'PERCENT',
    discount_value: 20,
    max_discount_amount: 200,
    rule_conditions: [
      { operator: 'GREATER_THAN_OR_EQUAL', target: 'orders.count', value: 0 }
    ],
    usage_limit_global: 500,
    usage_limit_per_user: 1,
    used_count: 85,
    valid_from: '2026-01-01T00:00:00',
    valid_to: '2027-12-31T23:59:59',
    status_id: 'ACT',
    is_active: 1,
    is_delete: 0,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    creator_role: 'Admin'
  },
  {
    promotion_id: 'p2',
    code: 'HEALTHY500',
    name: 'Flat Rs 500 Discount',
    description: 'Flat Rs 500 discount on cart value above Rs 1500.',
    promo_type: 'COUPON',
    discount_type: 'FLAT',
    discount_value: 500,
    rule_conditions: [
      { operator: 'GREATER_THAN_OR_EQUAL', target: 'orders.count', value: 0 }
    ],
    usage_limit_global: 200,
    usage_limit_per_user: 1,
    used_count: 42,
    valid_from: '2026-01-01T00:00:00',
    valid_to: '2027-12-31T23:59:59',
    status_id: 'ACT',
    is_active: 1,
    is_delete: 0,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    creator_role: 'Marketing Manager'
  },
  {
    promotion_id: 'p3',
    code: 'MEDVOUCH1500',
    name: 'Rs 1500 Health Wallet Voucher',
    description: 'Acts as a dynamic balance of Rs 1500. Can be used across multiple orders until exhausted!',
    promo_type: 'VOUCHER',
    discount_type: 'CREDIT',
    discount_value: 1500,
    initial_credit: 1500,
    remaining_credit: 1500,
    rule_conditions: [],
    usage_limit_global: 100,
    usage_limit_per_user: 5,
    used_count: 3,
    valid_from: '2026-01-01T00:00:00',
    valid_to: '2027-12-31T23:59:59',
    status_id: 'ACT',
    is_active: 1,
    is_delete: 0,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    creator_role: 'Admin'
  },
  {
    promotion_id: 'p4',
    code: 'FREESHIP',
    name: 'Free Shipping Campaign',
    description: 'Waives delivery shipping fee (Rs 49) automatically.',
    promo_type: 'COUPON',
    discount_type: 'FREE_SHIPPING',
    discount_value: 49,
    rule_conditions: [],
    usage_limit_global: 1000,
    usage_limit_per_user: 10,
    used_count: 147,
    valid_from: '2026-01-01T00:00:00',
    valid_to: '2027-12-31T23:59:59',
    status_id: 'ACT',
    is_active: 1,
    is_delete: 0,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    creator_role: 'Partner'
  }
];

export const INITIAL_PROMOTION_USAGES: PromotionUsage[] = [
  {
    usage_id: 'u1',
    promotion_id: 'p1',
    customer_id: 'USR992',
    temp_order_id: 'TEMP-9981-ABC',
    order_id: 'ORD-9981-ABC',
    discount_applied: 150.00,
    status_id: 'CPN_USED',
    reserved_at: '2026-06-20T10:00:00',
    expires_at: '2026-06-20T10:15:00',
    used_at: '2026-06-20T10:08:21',
    is_active: 1,
    is_delete: 0,
    created_at: '2026-06-20T10:00:00',
    updated_at: '2026-06-20T10:08:21'
  }
];

export function getStoredPromotions(): Promotion[] {
  const data = localStorage.getItem(STORAGE_PREFIX + 'promotions');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  // Initialize from default plus map existing custom coupons if they exist
  return INITIAL_PROMOTIONS;
}

export function saveStoredPromotions(promotions: Promotion[]) {
  localStorage.setItem(STORAGE_PREFIX + 'promotions', JSON.stringify(promotions));
}

export function getStoredPromotionUsages(): PromotionUsage[] {
  const data = localStorage.getItem(STORAGE_PREFIX + 'promotion_usages');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_PROMOTION_USAGES;
}

export function saveStoredPromotionUsages(usages: PromotionUsage[]) {
  localStorage.setItem(STORAGE_PREFIX + 'promotion_usages', JSON.stringify(usages));
}

export const INITIAL_FLASH_SALE_ITEMS: FlashSaleItem[] = [
  {
    id: 'FS-PROD9',
    productId: 'PROD9',
    drugId: 'DRUG-9021',
    storeGroupId: 'GRP-54',
    channel: 'ALL',
    originalPoints: 250,
    flashPoints: 200,
    flashDiscountPercent: 20,
    longDescription: 'Gentle baby oil, ideal for baby massage and dry skin. Formulated to minimize the risk of allergies.',
    flashLongDesc: "Today's Super Deal! Flat 20% discount on Johnson's Baby Oil.",
    minOrderValue: 0,
    flashMinOrder: 0,
    startDate: '2026-06-30T00:00',
    endDate: '2027-12-31T23:59',
    priority: 'High',
    isActive: true
  }
];

export function getStoredFlashSaleItems(): FlashSaleItem[] {
  const data = localStorage.getItem(STORAGE_PREFIX + 'flash_items');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_FLASH_SALE_ITEMS;
}

export function saveStoredFlashSaleItems(items: FlashSaleItem[]) {
  localStorage.setItem(STORAGE_PREFIX + 'flash_items', JSON.stringify(items));
}

export function getStoredFlashSaleTitle(): string {
  const data = localStorage.getItem(STORAGE_PREFIX + 'flash_title');
  return data || "Today's Super Saver 20% Off Baby & Hygiene Flash Sale!";
}

export function saveStoredFlashSaleTitle(title: string) {
  localStorage.setItem(STORAGE_PREFIX + 'flash_title', title);
}

export function getStoredStoreIds(): string {
  const data = localStorage.getItem(STORAGE_PREFIX + 'flash_stores');
  return data || '54';
}

export function saveStoredStoreIds(storeIds: string) {
  localStorage.setItem(STORAGE_PREFIX + 'flash_stores', storeIds);
}

export const INITIAL_SMART_FEE_CONFIG: SmartFeeConfig = {
  weather: 'sunny',
  deliverySurcharge: 40,
  handlingSurcharge: 12,
  exemptionProductId: 'PROD_Y_GIFT'
};

export const INITIAL_GIFT_RULES: GiftRule[] = [
  {
    id: 'rule_toy',
    name: 'Free Soft Toy with Child Care Products worth ₹300+',
    requiredCategory: 'Child Care',
    minCategoryValue: 300,
    giftProductId: 'PROD_TOY_GIFT',
    isActive: true
  },
  {
    id: 'rule_hoodie_women',
    name: 'Free Pastel Pink Hoodie with Women Care Products worth ₹1000+',
    requiredCategory: 'Women Care',
    minCategoryValue: 1000,
    giftProductId: 'PROD_HOODIE_GIFT',
    isActive: true
  },
  {
    id: 'rule_bogo_lotion',
    name: 'Buy 2 Himalaya Baby Lotion, Get 1 Soft Teddy Bear Free!',
    requiredProductId: 'PROD_BABY_LOTION',
    requiredProductQty: 2,
    giftProductId: 'PROD_TOY_GIFT',
    isActive: true
  },
  {
    id: 'rule_cart_2000',
    name: 'Free Wellness Multi-Vitamin on orders above Rs 2,000',
    minCartValue: 2000,
    giftProductId: 'PROD_Y_GIFT',
    isActive: true
  },
  {
    id: 'rule_vip_10000',
    name: 'Free Cozy Hoodie for VIP orders above Rs 10,000 (1,000+ Completed Orders)',
    minCartValue: 10000,
    minUserOrders: 1000,
    giftProductId: 'PROD_HOODIE_GIFT',
    isActive: true
  }
];

export function getStoredSmartFeeConfig(): SmartFeeConfig {
  const data = localStorage.getItem(STORAGE_PREFIX + 'smart_fee_config');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_SMART_FEE_CONFIG;
}

export function saveStoredSmartFeeConfig(config: SmartFeeConfig) {
  localStorage.setItem(STORAGE_PREFIX + 'smart_fee_config', JSON.stringify(config));
}

export function getStoredGiftRules(): GiftRule[] {
  const data = localStorage.getItem(STORAGE_PREFIX + 'gift_rules');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_GIFT_RULES;
}

export function saveStoredGiftRules(rules: GiftRule[]) {
  localStorage.setItem(STORAGE_PREFIX + 'gift_rules', JSON.stringify(rules));
}


