export interface RuleCondition {
  operator: 'EQUALS' | 'CONTAINS' | 'GREATER_THAN_OR_EQUAL' | 'IN';
  target: 'cart.category' | 'orders.count' | 'user.location' | 'user.device' | 'product.brand' | 'product.id';
  value: string | number | string[];
}

export interface Promotion {
  promotion_id: string;
  code: string;
  name: string; // display name
  description: string;
  promo_type: 'COUPON' | 'VOUCHER';
  discount_type: 'PERCENT' | 'FLAT' | 'FREE_SHIPPING' | 'CREDIT';
  discount_value: number;
  max_discount_amount?: number;
  initial_credit?: number;
  remaining_credit?: number;
  rule_conditions: RuleCondition[];
  usage_limit_global?: number;
  usage_limit_per_user: number;
  used_count: number;
  valid_from: string;
  valid_to?: string;
  status_id: 'ACT' | 'INA';
  is_active: 0 | 1;
  is_delete: 0 | 1;
  created_at: string;
  updated_at: string;
  creator_role: 'Admin' | 'Marketing Manager' | 'Partner';
  brandRestriction?: string;
  productRestriction?: string;
}

export interface PromotionUsage {
  usage_id: string;
  promotion_id: string;
  customer_id: string;
  temp_order_id: string;
  order_id?: string | null;
  discount_applied: number;
  status_id: 'CPN_RES' | 'CPN_USED' | 'CPN_REL';
  reserved_at: string;
  expires_at: string;
  used_at?: string | null;
  is_active: 0 | 1;
  is_delete: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'flat' | 'free_delivery';
  discountValue: number;
  maxDiscountCap?: number; // for percentage
  minCartValue: number;
  startDate: string; // YYYY-MM-DDTHH:mm
  endDate: string; // YYYY-MM-DDTHH:mm
  isStackable: boolean; // combinable vs exclusive
  categoryRestrictions: string[]; // empty means all categories (except Rx/Schedule H)
  locationRestrictions: string[]; // empty means all locations
  deviceRestrictions: ('web' | 'app')[]; // empty means both
  minPreviousOrders: number; // e.g., 100 for loyal/VIP customers
  perUserLimit: number; // max times a user can use this coupon
  creatorRole: 'Admin' | 'Marketing Manager' | 'Partner';
  usageCount: number;
  isActive: boolean;
  promo_type?: 'COUPON' | 'VOUCHER'; // for backward mapping
  initial_credit?: number;
  remaining_credit?: number;
  rule_conditions?: RuleCondition[];
  brandRestriction?: string; // empty means any brand
  productRestriction?: string; // empty means any product (ID)
  points?: number;
  storeGroupId?: number;
  drugId?: string;
  priority?: number;
  campaignUrl?: string;
  imageUrl?: string;
  weatherRestriction?: 'sunny' | 'rainy' | '';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  isRx: boolean; // Pharmacy compliance: Rx or Schedule H
  description: string;
  suggestedProducts?: string[]; // IDs of items to suggest when this item is in cart
  brand?: string;
  mrp?: number;
  form?: string;
  packageType?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isGift?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  device: 'web' | 'app';
  previousOrdersCount: number;
  usedCoupons: { [couponCode: string]: number }; // code -> usage count
}

export interface Referral {
  id: string;
  referredName: string;
  referredEmail: string;
  status: 'invited' | 'registered' | 'order_completed';
  rewardEarned: number;
  date: string;
}

export interface ReferralProgram {
  referralCode: string;
  referrerRewardAmount: number; // reward in Rs for referrer
  refereeDiscountAmount: number; // coupon for referred friend
  totalRewardsEarned: number;
  history: Referral[];
}

export interface FlashSaleItem {
  id: string;
  productId: string;
  drugId: string;
  storeGroupId: string;
  channel: 'ALL' | 'MOBILE_APP' | 'WEB';
  originalPoints: number;
  flashPoints: number;
  flashDiscountPercent: number;
  longDescription: string;
  flashLongDesc: string;
  minOrderValue: number;
  flashMinOrder: number;
  startDate: string;
  endDate: string;
  priority: 'High' | 'Medium' | 'Low';
  isActive: boolean;
}

export interface SmartFeeConfig {
  weather: 'sunny' | 'rainy';
  deliverySurcharge: number;
  handlingSurcharge: number;
  exemptionProductId: string; // Product id that waives the delivery & handling fee
}

export interface GiftRule {
  id: string;
  name: string;
  minCartValue?: number;
  minUserOrders?: number;
  requiredCategory?: string; // e.g. 'Child Care' or 'Women Care'
  minCategoryValue?: number; // e.g., if category subtotal crosses ₹1000
  requiredProductId?: string; // Standard BXGY: buy a specific product ID
  requiredProductQty?: number; // Standard BXGY: minimum quantity of the specific product
  giftProductId: string; // The product to auto-add
  isActive: boolean;
  oncePerUser?: boolean;
}


