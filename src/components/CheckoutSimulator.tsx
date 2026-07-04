import React, { useState, useMemo } from 'react';
import { Coupon, Product, CartItem, UserProfile, Promotion, PromotionUsage, FlashSaleItem, SmartFeeConfig, GiftRule, Voucher, VoucherTransaction } from '../types';
import { INITIAL_PRODUCTS, saveStoredPromotions, saveStoredPromotionUsages } from '../mockData';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Tag, 
  Sparkles, 
  Check, 
  HelpCircle, 
  AlertTriangle, 
  Info, 
  Smartphone, 
  MapPin, 
  User, 
  ArrowRight, 
  Gift, 
  Heart, 
  RefreshCw,
  Clock,
  ChevronRight,
  ChevronDown,
  X,
  Lock,
  CheckCircle,
  XCircle,
  Zap,
  CloudLightning,
  Wallet,
  Ticket
} from 'lucide-react';

interface CheckoutSimulatorProps {
  coupons: Coupon[];
  userProfile: UserProfile;
  onChangeUserProfile: (profile: UserProfile) => void;
  onOrderPlaced: (couponCode?: string, discountAmount?: number) => void;
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  promotionUsages: PromotionUsage[];
  setPromotionUsages: React.Dispatch<React.SetStateAction<PromotionUsage[]>>;
  flashSaleItems?: FlashSaleItem[];
  flashSaleTitle?: string;
  cart?: CartItem[];
  setCart?: React.Dispatch<React.SetStateAction<CartItem[]>>;
  smartFeeConfig?: SmartFeeConfig;
  giftRules?: GiftRule[];
  vouchers?: Voucher[];
  voucherTransactions?: VoucherTransaction[];
  onUpdateVouchers?: (rows: Voucher[]) => void;
  onUpdateVoucherTransactions?: (rows: VoucherTransaction[]) => void;
}

export default function CheckoutSimulator({
  coupons,
  userProfile,
  onChangeUserProfile,
  onOrderPlaced,
  promotions,
  setPromotions,
  promotionUsages,
  setPromotionUsages,
  flashSaleItems = [],
  flashSaleTitle = "Today's Super Saver Flash Sale!",
  cart: externalCart,
  setCart: externalSetCart,
  smartFeeConfig,
  giftRules,
  vouchers = [],
  voucherTransactions = [],
  onUpdateVouchers,
  onUpdateVoucherTransactions
}: CheckoutSimulatorProps) {
  // Cart state fallback
  const [localCart, localSetCart] = useState<CartItem[]>([]);
  const cart = externalCart !== undefined ? externalCart : localCart;
  const setCart = externalSetCart !== undefined ? externalSetCart : localSetCart;
  
  // Manual promo code entered
  const [manualCode, setManualCode] = useState('');
  // Force manual selection override (stores coupon ID if clicked manually, or null if using auto-apply)
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  
  // Dialog visibility
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showComplianceInfo, setShowComplianceInfo] = useState(false);

  // Status/feedback messages
  const [manualFeedback, setManualFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // DB Two-Phase Commit Simulation states
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [tempOrderId, setTempOrderId] = useState<string>('');
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');
  const [reservationTimeLeft, setReservationTimeLeft] = useState<number>(900); // 15 mins
  const [reservationActive, setReservationActive] = useState<boolean>(false);
  const [activeReservationId, setActiveReservationId] = useState<string>('');
  const [lastSavedVoucherDeduction, setLastSavedVoucherDeduction] = useState<number>(0);

  // Wallet voucher redemption (from the Voucher Manager / My Vouchers).
  // Customers can stack several of their own vouchers on one order, so this
  // holds an ordered list of the applied voucher ids (first applied drawn first).
  const [appliedVoucherIds, setAppliedVoucherIds] = useState<string[]>([]);

  // Reservation timer effect for distributed locks (CPN_RES expiration -> CPN_REL)
  React.useEffect(() => {
    let interval: any;
    if (reservationActive && reservationTimeLeft > 0) {
      interval = setInterval(() => {
        setReservationTimeLeft(prev => {
          if (prev <= 1) {
            setReservationActive(false);
            if (activeReservationId) {
              setPromotionUsages(prevUsages => {
                const updated = prevUsages.map(u => 
                  u.usage_id === activeReservationId 
                    ? { ...u, status_id: 'CPN_REL' as const, updated_at: new Date().toISOString() } 
                    : u
                );
                saveStoredPromotionUsages(updated);
                return updated;
              });
            }
            alert('Your 15-minute promotion lock has expired. The coupon reservation has been RELEASED (CPN_REL) in the PostgreSQL database.');
            setCheckoutStep('cart');
            return 900;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [reservationActive, reservationTimeLeft, activeReservationId, setPromotionUsages]);

  // Find if a product has an active flash sale
  const getActiveFlashSale = (productId: string) => {
    return flashSaleItems.find(item => item.productId === productId && item.isActive);
  };

  const getProductEffectivePrice = (product: Product) => {
    const flashSale = getActiveFlashSale(product.id);
    if (flashSale) {
      return flashSale.flashPoints;
    }
    return product.price;
  };

  // 1. Calculate Cart values
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.isGift ? 0 : getProductEffectivePrice(item.product) * item.quantity), 0);
  }, [cart, flashSaleItems]);

  const otcSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.isGift) return sum;
      if (!item.product.isRx) {
        return sum + (getProductEffectivePrice(item.product) * item.quantity);
      }
      return sum;
    }, 0);
  }, [cart, flashSaleItems]);

  const rxSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.isGift) return sum;
      if (item.product.isRx) {
        return sum + (getProductEffectivePrice(item.product) * item.quantity);
      }
      return sum;
    }, 0);
  }, [cart, flashSaleItems]);

  // Add/Remove item to cart
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setManualFeedback(null);
  };

  const handleDecreaseQuantity = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter(item => item.product.id !== productId);
      }
      return prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      );
    });
    setManualFeedback(null);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    setManualFeedback(null);
  };

  const handleClearCart = () => {
    setCart([]);
    setSelectedCouponId(null);
    setManualFeedback(null);
    setManualCode('');
  };

  // 2. Validate a coupon algorithmically (compliance rules & anti-abuse checks)
  const validateCoupon = (coupon: Coupon): { isValid: boolean; reason?: string; discountAmount: number } => {
    if (!coupon.isActive) {
      return { isValid: false, reason: 'This coupon is inactive.', discountAmount: 0 };
    }

    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);

    if (now < start) {
      return { isValid: false, reason: 'This coupon offer has not started yet.', discountAmount: 0 };
    }
    if (now > end) {
      return { isValid: false, reason: 'This coupon has expired.', discountAmount: 0 };
    }

    // Weather condition restriction (e.g. only valid on rainy/sunny days)
    if (coupon.weatherRestriction) {
      const config = smartFeeConfig || { weather: 'sunny' };
      if (coupon.weatherRestriction !== config.weather) {
        return {
          isValid: false,
          reason: `Weather Restriction: This coupon is only valid when it is ${coupon.weatherRestriction === 'rainy' ? 'raining in Mumbai' : 'sunny'}.`,
          discountAmount: 0
        };
      }
    }

    // Minimum cart total threshold
    if (cartSubtotal < coupon.minCartValue) {
      const diff = coupon.minCartValue - cartSubtotal;
      return { 
        isValid: false, 
        reason: `Add Rs ${diff} more to use this coupon.`, 
        discountAmount: 0 
      };
    }

    // Per-user limit restriction
    const userUsages = userProfile.usedCoupons[coupon.code] || 0;
    if (userUsages >= coupon.perUserLimit) {
      return { 
        isValid: false, 
        reason: coupon.perUserLimit === 1 
          ? 'This coupon can only be used once per account.' 
          : `You have reached the maximum limit of ${coupon.perUserLimit} uses for this coupon.`,
        discountAmount: 0 
      };
    }

    // Geo restriction
    if (coupon.locationRestrictions.length > 0 && !coupon.locationRestrictions.includes(userProfile.location)) {
      return { 
        isValid: false, 
        reason: `This offer is valid only for ${coupon.locationRestrictions.join(', ')} delivery addresses.`, 
        discountAmount: 0 
      };
    }

    // Device restriction
    if (coupon.deviceRestrictions.length > 0 && !coupon.deviceRestrictions.includes(userProfile.device)) {
      const deviceText = coupon.deviceRestrictions.includes('app') ? 'mobile app' : 'website';
      return { 
        isValid: false, 
        reason: `This coupon is exclusive to the Dawa.com ${deviceText}. Download and order there.`, 
        discountAmount: 0 
      };
    }

    // VIP / Previous orders count check
    if (userProfile.previousOrdersCount < coupon.minPreviousOrders) {
      return { 
        isValid: false, 
        reason: `Exclusive to loyal users with at least ${coupon.minPreviousOrders} completed orders. (You have: ${userProfile.previousOrdersCount})`, 
        discountAmount: 0 
      };
    }

    // PostgreSQL Schema AST rule_conditions interpreter
    const matchedPromo = promotions.find(p => p.code === coupon.code);
    if (matchedPromo) {
      // Check if promotion is suspended or inactive
      if (matchedPromo.status_id !== 'ACT' || matchedPromo.is_active === 0) {
        return { isValid: false, reason: 'Compliance alert: This promotion status is INACTIVE (INA) in PostgreSQL.', discountAmount: 0 };
      }

      if (matchedPromo.rule_conditions && matchedPromo.rule_conditions.length > 0) {
        for (const cond of matchedPromo.rule_conditions) {
          if (cond.target === 'orders.count') {
            const userVal = userProfile.previousOrdersCount;
            const reqVal = Number(cond.value);
            if (cond.operator === 'GREATER_THAN_OR_EQUAL' && userVal < reqVal) {
              return { 
                isValid: false, 
                reason: `SQL rule_conditions failure: orders.count (${userVal}) does not satisfy operator >= ${reqVal}.`, 
                discountAmount: 0 
              };
            }
          }
          if (cond.target === 'user.location') {
            const userVal = userProfile.location;
            if (cond.operator === 'EQUALS' && userVal !== cond.value) {
              return { 
                isValid: false, 
                reason: `SQL rule_conditions failure: user.location must equal '${cond.value}' (Current: ${userVal}).`, 
                discountAmount: 0 
              };
            }
          }
          if (cond.target === 'user.device') {
            const userVal = userProfile.device;
            if (cond.operator === 'EQUALS' && userVal !== cond.value) {
              return { 
                isValid: false, 
                reason: `SQL rule_conditions failure: user.device must equal '${cond.value}' (Current: ${userVal}).`, 
                discountAmount: 0 
              };
            }
          }
          if (cond.target === 'product.brand') {
            const hasBrandItem = cart.some(item => !item.product.isRx && item.product.brand?.toLowerCase() === String(cond.value).toLowerCase());
            if (cond.operator === 'EQUALS' && !hasBrandItem) {
              return {
                isValid: false,
                reason: `SQL rule_conditions failure: Cart must contain products from brand '${cond.value}'.`,
                discountAmount: 0
              };
            }
          }
          if (cond.target === 'product.id') {
            const hasProductItem = cart.some(item => item.product.id === String(cond.value));
            if (cond.operator === 'EQUALS' && !hasProductItem) {
              const pName = INITIAL_PRODUCTS.find(p => p.id === String(cond.value))?.name || cond.value;
              return {
                isValid: false,
                reason: `SQL rule_conditions failure: Cart must contain the product '${pName}'.`,
                discountAmount: 0
              };
            }
          }
        }
      }
    }

    // Pharmacy Compliance - calculate eligible items subtotal (excludes Rx, Schedule H, and matches category, brand, & product restrictions)
    let eligibleSubtotal = cart.reduce((sum, item) => {
      // Excludes prescription drugs entirely (Compliance block)
      if (item.product.isRx) return sum;

      // Check product restriction if specified
      if (coupon.productRestriction && item.product.id !== coupon.productRestriction) {
        return sum;
      }

      // Check category restriction if specified
      if (coupon.categoryRestrictions.length > 0 && !coupon.categoryRestrictions.includes(item.product.category)) {
        return sum;
      }

      // Check brand restriction if specified
      if (coupon.brandRestriction && item.product.brand?.toLowerCase() !== coupon.brandRestriction.toLowerCase()) {
        return sum;
      }

      return sum + (item.product.price * item.quantity);
    }, 0);

    if (coupon.discountType !== 'free_delivery' && eligibleSubtotal <= 0) {
      if (coupon.productRestriction) {
        const prodName = INITIAL_PRODUCTS.find(p => p.id === coupon.productRestriction)?.name || 'restricted product';
        return {
          isValid: false,
          reason: `Your cart does not contain the eligible, non-prescription product: '${prodName}'.`,
          discountAmount: 0
        };
      }
      if (coupon.brandRestriction && coupon.categoryRestrictions.length > 0) {
        return {
          isValid: false,
          reason: `Your cart has no prescription-free ${coupon.brandRestriction} products in category: ${coupon.categoryRestrictions.join(', ')}.`,
          discountAmount: 0
        };
      }
      if (coupon.brandRestriction) {
        return {
          isValid: false,
          reason: `Your cart has no prescription-free products from brand: ${coupon.brandRestriction}.`,
          discountAmount: 0
        };
      }
      if (coupon.categoryRestrictions.length > 0) {
        return {
          isValid: false,
          reason: `Your cart has no prescription-free items in restricted categories: ${coupon.categoryRestrictions.join(', ')}.`,
          discountAmount: 0
        };
      }
      return { 
        isValid: false, 
        reason: 'Compliance Lock: Discounts cannot be applied to Schedule H or Rx prescription medicines.', 
        discountAmount: 0 
      };
    }

    // Calculate discount amount
    let discount = 0;
    if (matchedPromo && matchedPromo.promo_type === 'VOUCHER') {
      // Credit wallet style deduction capped at remaining pool credit
      const creditPool = matchedPromo.remaining_credit !== undefined ? matchedPromo.remaining_credit : matchedPromo.discount_value;
      if (creditPool <= 0) {
        return { isValid: false, reason: 'This Voucher balance is Rs 0.00 (Exhausted).', discountAmount: 0 };
      }
      discount = Math.min(creditPool, otcSubtotal);
    } else if (coupon.discountType === 'percentage') {
      discount = (eligibleSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountCap) {
        discount = Math.min(discount, coupon.maxDiscountCap);
      }
    } else if (coupon.discountType === 'flat') {
      // Flat discount cannot exceed eligible subtotal value
      discount = Math.min(coupon.discountValue, eligibleSubtotal);
    } else if (coupon.discountType === 'free_delivery') {
      // Free delivery discount equals the delivery fee (normally Rs 49 if cartSubtotal < 299)
      discount = cartSubtotal >= 299 || cartSubtotal === 0 ? 0 : 49;
    }

    return { 
      isValid: true, 
      discountAmount: Math.round(discount) 
    };
  };

  // 3. Auto Apply Best Offer Engine
  // Analyzes all coupons, finds valid ones, and selects the one with the maximum saving.
  const autoApplyResult = useMemo(() => {
    if (cart.length === 0) return null;

    let bestCoupon: Coupon | null = null;
    let maxSavings = 0;
    const validCouponsWithSavings: { coupon: Coupon; savings: number }[] = [];

    coupons.forEach(coupon => {
      const res = validateCoupon(coupon);
      if (res.isValid && res.discountAmount > 0) {
        validCouponsWithSavings.push({ coupon, savings: res.discountAmount });
        if (res.discountAmount > maxSavings) {
          maxSavings = res.discountAmount;
          bestCoupon = coupon;
        }
      }
    });

    return {
      bestCoupon,
      maxSavings,
      allValidOffers: validCouponsWithSavings
    };
  }, [coupons, cart, userProfile, otcSubtotal, cartSubtotal]);

  // Selected coupon based on state (auto-applied or user-override)
  const activeCouponDetails = useMemo(() => {
    if (cart.length === 0) return null;

    // If user made a manual choice
    if (selectedCouponId) {
      const selected = coupons.find(c => c.id === selectedCouponId);
      if (selected) {
        const res = validateCoupon(selected);
        if (res.isValid) {
          return {
            coupon: selected,
            discountAmount: res.discountAmount,
            isManualOverride: true,
            isValid: true,
            reason: ''
          };
        } else {
          return {
            coupon: selected,
            discountAmount: 0,
            isManualOverride: true,
            isValid: false,
            reason: res.reason || 'Invalid coupon conditions.'
          };
        }
      }
    }

    // Otherwise, use Auto-applied best offer
    if (autoApplyResult?.bestCoupon) {
      return {
        coupon: autoApplyResult.bestCoupon,
        discountAmount: autoApplyResult.maxSavings,
        isManualOverride: false,
        isValid: true,
        reason: ''
      };
    }

    return null;
  }, [selectedCouponId, autoApplyResult, coupons, cart, userProfile]);

  // 4. Cart Threshold Promotions Config & Calculations
  // Free delivery at Rs 299, SAVE100 unlocks at Rs 599, Free Gift at Rs 999.
  const deliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    
    const config = smartFeeConfig || { weather: 'sunny', deliverySurcharge: 0, handlingSurcharge: 0, exemptionProductId: '' };
    
    // Check if exemption product is present in the cart
    const hasExemptionProduct = config.exemptionProductId && cart.some(item => item.product.id === config.exemptionProductId);
    if (hasExemptionProduct) return 0; // complete waiver!

    if (activeCouponDetails?.isValid && activeCouponDetails.coupon.discountType === 'free_delivery') return 0;
    
    const baseDelivery = 49;
    const weatherSurcharge = config.weather === 'rainy' ? config.deliverySurcharge : 0;
    
    if (cartSubtotal > 500) return 0; // free delivery over Rs 500
    
    return baseDelivery + weatherSurcharge;
  }, [cart, activeCouponDetails, cartSubtotal, smartFeeConfig]);

  const handlingFee = useMemo(() => {
    if (cart.length === 0) return 0;
    
    const config = smartFeeConfig || { weather: 'sunny', deliverySurcharge: 0, handlingSurcharge: 0, exemptionProductId: '' };
    
    // Check if exemption product is present in the cart
    const hasExemptionProduct = config.exemptionProductId && cart.some(item => item.product.id === config.exemptionProductId);
    if (hasExemptionProduct) return 0; // complete waiver!

    return config.handlingSurcharge || 0;
  }, [cart, smartFeeConfig]);

  // --- Wallet voucher redemption (Voucher Manager balances) ---
  const myRedeemableVouchers = useMemo(() => {
    const now = Date.now();
    return vouchers.filter(v =>
      v.customer_id === userProfile.id &&
      v.status === 'ACTIVE' &&
      v.remaining_amount > 0 &&
      (!v.expiry_date || new Date(v.expiry_date).getTime() > now)
    );
  }, [vouchers, userProfile.id]);

  const couponDiscount = activeCouponDetails?.isValid ? activeCouponDetails.discountAmount : 0;
  const payableBeforeVoucher = Math.max(0, cartSubtotal + deliveryFee + handlingFee - couponDiscount);

  // Applied vouchers in the order the customer added them (ignoring any that
  // are no longer redeemable, e.g. fully spent by a previous order).
  const appliedVouchers = useMemo(
    () =>
      appliedVoucherIds
        .map(id => myRedeemableVouchers.find(v => v.voucher_id === id))
        .filter((v): v is Voucher => Boolean(v)),
    [appliedVoucherIds, myRedeemableVouchers]
  );

  // Greedily draw down the remaining bill across the stacked vouchers so a
  // customer can spend the full balance of several vouchers on one order.
  const voucherAllocations = useMemo(() => {
    let remaining = payableBeforeVoucher;
    return appliedVouchers.map(voucher => {
      const used = Math.min(voucher.remaining_amount, remaining);
      remaining -= used;
      return { voucher, used };
    });
  }, [appliedVouchers, payableBeforeVoucher]);

  const voucherRedemption = voucherAllocations.reduce((sum, a) => sum + a.used, 0);
  const finalPayable = Math.max(0, payableBeforeVoucher - voucherRedemption);

  const toggleVoucher = (id: string) =>
    setAppliedVoucherIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const thresholdStatus = useMemo(() => {
    const total = cartSubtotal;
    if (total === 0) {
      return {
        currentLevel: 0,
        nextThreshold: 299,
        diff: 299,
        percent: 0,
        message: 'Add Rs 299 more and get FREE delivery on your order!',
        badge: 'Standard Delivery Rs 49'
      };
    } else if (total < 299) {
      const diff = 299 - total;
      const percent = (total / 299) * 100;
      return {
        currentLevel: 1,
        nextThreshold: 299,
        diff,
        percent,
        message: `Add Rs ${diff} more and get FREE delivery on your order!`,
        badge: 'Rs 49 Delivery Fee Appends'
      };
    } else if (total < 599) {
      const diff = 599 - total;
      const percent = ((total - 299) / (599 - 299)) * 100;
      return {
        currentLevel: 2,
        nextThreshold: 599,
        diff,
        percent,
        message: `Add just Rs ${diff} more to unlock Rs 100 discount! Use SAVE100 at checkout.`,
        badge: '✓ Free Delivery Unlocked!'
      };
    } else if (total < 999) {
      const diff = 999 - total;
      const percent = ((total - 599) / (999 - 599)) * 100;
      return {
        currentLevel: 3,
        nextThreshold: 999,
        diff,
        percent,
        message: `Add Rs ${diff} more and receive a FREE Vitamin C Supplement (worth Rs 120)!`,
        badge: '✓ Discount Threshold Unlocked!'
      };
    } else {
      return {
        currentLevel: 4,
        nextThreshold: 999,
        diff: 0,
        percent: 100,
        message: '✓ Congratulations! You have unlocked FREE Delivery, Discount Unlocks & a FREE Vitamin C supplement!',
        badge: '✓ All Rewards Unlocked!'
      };
    }
  }, [cartSubtotal]);

  // 5. Smart cross-sell product suggestions based on cart items
  const crossSellSuggestions = useMemo(() => {
    const idsInCart = cart.map(item => item.product.id);
    const suggestedIds = new Set<string>();

    cart.forEach(item => {
      if (item.product.suggestedProducts) {
        item.product.suggestedProducts.forEach(id => {
          if (!idsInCart.includes(id)) {
            suggestedIds.add(id);
          }
        });
      }
    });

    // Fallbacks if cart is empty or no suggestions
    if (suggestedIds.size === 0) {
      // suggest popular high margin OTC vitamins or diabetes strips by default
      return INITIAL_PRODUCTS.filter(p => !idsInCart.includes(p.id) && (p.id === 'PROD3' || p.id === 'PROD5')).slice(0, 2);
    }

    return INITIAL_PRODUCTS.filter(p => suggestedIds.has(p.id));
  }, [cart]);

  // Apply a manual code typed in the box
  const handleApplyManualCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const codeUpper = manualCode.trim().toUpperCase();
    const match = coupons.find(c => c.code === codeUpper);

    if (!match) {
      setManualFeedback({ type: 'error', text: `Coupon code "${codeUpper}" not found.` });
      return;
    }

    const res = validateCoupon(match);
    if (!res.isValid) {
      setManualFeedback({ type: 'error', text: res.reason || 'Coupon code conditions not met.' });
      return;
    }

    // Success! If match is found and valid, set override
    setSelectedCouponId(match.id);
    setManualCode('');
    
    // Compare savings
    const currentBestSaving = autoApplyResult?.maxSavings || 0;
    if (res.discountAmount > currentBestSaving) {
      setManualFeedback({ 
        type: 'success', 
        text: `Applied manually! Code "${codeUpper}" gives Rs ${res.discountAmount} off (saving you more than other coupons!).` 
      });
    } else if (res.discountAmount < currentBestSaving) {
      setManualFeedback({ 
        type: 'success', 
        text: `Applied "${codeUpper}" (saves Rs ${res.discountAmount}). Note: The auto-apply engine has a better coupon saving Rs ${currentBestSaving}.` 
      });
    } else {
      setManualFeedback({ 
        type: 'success', 
        text: `Applied successfully! Code "${codeUpper}" saves Rs ${res.discountAmount}.` 
      });
    }
  };

  const handleApplyCouponFromList = (couponId: string) => {
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) return;
    
    const res = validateCoupon(coupon);
    if (res.isValid) {
      setSelectedCouponId(couponId);
      setManualFeedback(null);
      setShowOffersModal(false);
    }
  };

  const handleReservePromotion = () => {
    if (cart.length === 0) return;

    const discount = activeCouponDetails?.isValid ? activeCouponDetails.discountAmount : 0;
    const code = activeCouponDetails?.isValid ? activeCouponDetails.coupon.code : null;

    const matchedPromo = code ? promotions.find(p => p.code === code) : null;
    const promoId = matchedPromo ? matchedPromo.promotion_id : 'p_generic';

    const tid = `TEMP-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const uid = `u-${Math.random().toString(36).substring(2, 11)}`;

    const newUsage: PromotionUsage = {
      usage_id: uid,
      promotion_id: promoId,
      customer_id: userProfile.id,
      temp_order_id: tid,
      order_id: null,
      discount_applied: discount,
      status_id: 'CPN_RES',
      reserved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      is_active: 1,
      is_delete: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedUsages = [newUsage, ...promotionUsages];
    setPromotionUsages(updatedUsages);
    saveStoredPromotionUsages(updatedUsages);

    setTempOrderId(tid);
    setActiveReservationId(uid);
    setLastSavedVoucherDeduction(discount);
    setReservationTimeLeft(900);
    setReservationActive(true);
    setCheckoutStep('payment');
  };

  const handleReleaseReservation = () => {
    setReservationActive(false);
    if (activeReservationId) {
      const updatedUsages = promotionUsages.map(u => 
        u.usage_id === activeReservationId 
          ? { ...u, status_id: 'CPN_REL' as const, updated_at: new Date().toISOString() } 
          : u
      );
      setPromotionUsages(updatedUsages);
      saveStoredPromotionUsages(updatedUsages);
    }
    setCheckoutStep('cart');
    setActiveReservationId('');
    setTempOrderId('');
  };

  const handleConfirmCheckout = () => {
    const finalOrdId = `ORD-${Math.floor(1000 + Math.random() * 9000)}-CONF`;
    setConfirmedOrderId(finalOrdId);
    setReservationActive(false);

    const code = activeCouponDetails?.isValid ? activeCouponDetails.coupon.code : undefined;
    const discount = activeCouponDetails?.isValid ? activeCouponDetails.discountAmount : 0;

    // 1. Update reservation log in promotion_usages table (CPN_RES -> CPN_USED)
    const updatedUsages = promotionUsages.map(u => 
      u.usage_id === activeReservationId 
        ? { 
            ...u, 
            status_id: 'CPN_USED' as const, 
            order_id: finalOrdId, 
            used_at: new Date().toISOString(),
            updated_at: new Date().toISOString() 
          } 
        : u
    );
    setPromotionUsages(updatedUsages);
    saveStoredPromotionUsages(updatedUsages);

    // 2. If it is a wallet-based VOUCHER, deduct remaining credit balance and increment used_count
    if (code) {
      const updatedPromos = promotions.map(p => {
        if (p.code === code) {
          const isVoucher = p.promo_type === 'VOUCHER';
          const newCredit = isVoucher && p.remaining_credit !== undefined 
            ? Math.max(0, p.remaining_credit - lastSavedVoucherDeduction) 
            : p.remaining_credit;
          
          return {
            ...p,
            remaining_credit: newCredit,
            used_count: p.used_count + 1,
            status_id: (isVoucher && newCredit === 0) ? 'INA' as const : p.status_id,
            updated_at: new Date().toISOString()
          };
        }
        return p;
      });
      setPromotions(updatedPromos);
      saveStoredPromotions(updatedPromos);
    }

    // 2b. Redeem the applied wallet vouchers: deduct each voucher's allocated
    //     share of the bill + write one REDEEM ledger entry per voucher.
    const redeemedAllocations = voucherAllocations.filter(a => a.used > 0);
    if (redeemedAllocations.length > 0 && onUpdateVouchers && onUpdateVoucherTransactions) {
      const balances = new Map<string, number>(
        redeemedAllocations.map(a => [a.voucher.voucher_id, Math.max(0, a.voucher.remaining_amount - a.used)])
      );
      onUpdateVouchers(
        vouchers.map(v =>
          balances.has(v.voucher_id)
            ? { ...v, remaining_amount: balances.get(v.voucher_id)!, status: balances.get(v.voucher_id)! === 0 ? 'USED' : v.status }
            : v
        )
      );
      const now = Date.now();
      onUpdateVoucherTransactions([
        ...redeemedAllocations.map((a, i) => ({
          transaction_id: `VTX-${(now + i).toString(36).toUpperCase()}`,
          voucher_id: a.voucher.voucher_id,
          order_id: finalOrdId,
          transaction_type: 'REDEEM' as const,
          amount: a.used,
          balance_after: balances.get(a.voucher.voucher_id)!,
          remarks: `Redeemed at checkout for order ${finalOrdId}`,
          created_by: userProfile.id,
          created_at: new Date().toISOString()
        })),
        ...voucherTransactions
      ]);
    }

    // 3. Complete order triggers standard state shifts (previous orders count +1, local coupon use count)
    onOrderPlaced(code, discount);

    // Clear cart and advance step
    setCart([]);
    setCheckoutStep('success');
    setActiveReservationId('');
    setSelectedCouponId(null);
    setAppliedVoucherIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Flash Sale Announcement Banner */}
      {flashSaleItems.some(i => i.isActive) && (
        <div className="bg-gradient-to-r from-amber-500 via-[#5B50BC] to-indigo-600 rounded-2xl p-1 shadow-md animate-fade-in text-white overflow-hidden">
          <div className="bg-[#483EA2]/95 rounded-[20px] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-400 text-[#483EA2] p-2 rounded-xl shrink-0 animate-bounce">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-tight text-amber-300 flex items-center gap-2">
                  Campaign Live: Ops Oracle Flash Event
                </h4>
                <p className="text-xs text-indigo-100 font-semibold mt-0.5">
                  {flashSaleTitle}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                Zone: STORE 54 (Mumbai/Pune)
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                Auto Applied at Shelf
              </span>
            </div>
          </div>
        </div>
      )}

      <div id="checkout-simulator-viewport" className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* 1. LEFT COLUMN: Persona Settings & Product Catalog */}
        <div className="xl:col-span-7 space-y-6">
        
        {/* User Simulation Settings Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              Customer Demographics Simulator
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
              Simulation Variables
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            {/* Geo Location Picker */}
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Delivery Address / Location
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {['Mumbai', 'Pune', 'Delhi', 'Bangalore'].map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => onChangeUserProfile({ ...userProfile, location: loc })}
                    className={`p-1.5 rounded-lg border text-center transition-all ${
                      userProfile.location === loc
                        ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-700'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Device Picker */}
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" /> User Platform / Device
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeUserProfile({ ...userProfile, device: 'web' })}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    userProfile.device === 'web'
                      ? 'border-blue-500 bg-blue-50 font-semibold text-blue-700'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Dawa Website
                </button>
                <button
                  type="button"
                  onClick={() => onChangeUserProfile({ ...userProfile, device: 'app' })}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    userProfile.device === 'app'
                      ? 'border-purple-500 bg-purple-50 font-semibold text-purple-700'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Mobile App
                </button>
              </div>
            </div>

            {/* Previous Order Count Simulation */}
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" /> Previous Completed Orders
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={userProfile.previousOrdersCount}
                  onChange={(e) => onChangeUserProfile({ ...userProfile, previousOrdersCount: Number(e.target.value) })}
                  className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-slate-800 font-semibold text-center focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => onChangeUserProfile({ ...userProfile, previousOrdersCount: 105 })}
                    className="text-[10px] text-emerald-600 hover:underline text-left font-medium"
                  >
                    Set VIP (105)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeUserProfile({ ...userProfile, previousOrdersCount: 3 })}
                    className="text-[10px] text-slate-500 hover:underline text-left font-medium"
                  >
                    Set New (3)
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Used to test the VIP vouchers requirement (&gt; 100 orders).</p>
            </div>
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">E-Commerce Pharmacy Shelf</h3>
              <p className="text-xs text-slate-500">Add medical products to your cart to trigger dynamic coupons.</p>
            </div>
            
            <button
              onClick={() => setShowComplianceInfo(!showComplianceInfo)}
              className="text-xs text-emerald-600 font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              Compliance Rules Explained
            </button>
          </div>

          {/* Compliance Drawer alert */}
          {showComplianceInfo && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs mb-4 space-y-2 animate-fade-in">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Hardcoded Pharmacy Compliance Standard (Schedule H / Rx Rule)
              </p>
              <p>
                Under pharmacy laws, discounts cannot be applied directly or indirectly on prescription medications (Rx) and Schedule H drugs (e.g. Crocin, Metformin). 
              </p>
              <p>
                <strong>Engine Action:</strong> The coupon logic evaluates the total cart value to verify the threshold limit. However, the discount percentage or flat rate is <strong>strictly calculated on OTC items only</strong> (Vitamins, Supplements, Personal Care, Diabetes strips). Rx item costs are zeroed out in calculations.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INITIAL_PRODUCTS.map((product) => {
              const countInCart = cart.find(i => i.product.id === product.id)?.quantity || 0;
              return (
                <div 
                  key={product.id} 
                  className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                    countInCart > 0 
                      ? 'border-emerald-400 bg-emerald-50/10' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                          product.isRx 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {product.isRx ? 'Schedule H / Rx Medicine' : 'OTC Healthcare'}
                        </span>
                        {getActiveFlashSale(product.id) && (
                          <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full w-fit flex items-center gap-0.5 shadow-2xs">
                            ⚡ FLASH {getActiveFlashSale(product.id)?.flashDiscountPercent}% OFF
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {getActiveFlashSale(product.id) ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 line-through">Rs {product.price}</span>
                            <span className="text-xs font-black text-emerald-700">Rs {getProductEffectivePrice(product)}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-800">
                            Rs {product.price}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1">{product.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{product.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">Category: {product.category}</span>
                      {product.brand && <span className="text-[10px] bg-pink-50 text-pink-700 border border-pink-100 px-1.5 py-0.5 rounded font-semibold">Brand: {product.brand}</span>}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {countInCart > 0 ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecreaseQuantity(product.id)}
                          className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-slate-800 w-6 text-center">{countInCart}</span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    )}

                    {countInCart > 0 && (
                      <span className="text-xs font-medium text-emerald-600 font-semibold">
                        Added (Rs {getProductEffectivePrice(product) * countInCart})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: Cart Summary & Promos Engine */}
      <div className="xl:col-span-5 space-y-6">
        
        {/* Shopping Cart Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-600" />
              Customer Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
            </h3>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          <div className="p-5 space-y-4">
            
            {/* Cart list */}
            {cart.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Your basket is empty</p>
                  <p className="text-xs text-slate-400">Add medical products from the shelf to start validating coupons.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  item.isGift ? (
                    /* ===== FREE GIFT ROW (auto-added by a BXGY campaign) ===== */
                    <div
                      key={`gift-${item.product.id}`}
                      className="relative flex items-center justify-between text-xs p-2.5 rounded-xl border border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-pink-50/40 animate-fade-in"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-900 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full">
                            <Gift className="w-2.5 h-2.5" /> Free Gift
                          </span>
                          <p className="font-bold text-amber-900 truncate">{item.product.name}</p>
                        </div>
                        <p className="text-[10px] text-amber-700/80 flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="font-semibold">Unlocked by a Buy&nbsp;X&nbsp;Get&nbsp;Y campaign</span>
                          <span className="text-amber-400">•</span>
                          <span className="line-through text-slate-400">Rs {item.product.price}</span>
                          <span>× {item.quantity}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-emerald-600 uppercase tracking-wide">Free</span>
                      </div>
                    </div>
                  ) : (
                    /* ===== NORMAL PAID ROW ===== */
                    <div key={item.product.id} className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-semibold text-slate-800 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                          {item.product.isRx ? (
                            <span className="text-red-500 font-semibold bg-red-50 px-1 rounded">Rx (Non-discountable)</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">OTC (Eligible)</span>
                          )}
                          {item.product.brand && (
                            <span className="text-pink-700 font-semibold bg-pink-50 px-1 rounded">Brand: {item.product.brand}</span>
                          )}
                          {getActiveFlashSale(item.product.id) ? (
                            <span>
                              <span className="line-through text-slate-400">Rs {item.product.price}</span>{' '}
                              <span className="text-emerald-700 font-bold">Rs {getProductEffectivePrice(item.product)}</span> × {item.quantity}
                            </span>
                          ) : (
                            <span>Rs {item.product.price} × {item.quantity}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">Rs {getProductEffectivePrice(item.product) * item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {cart.length > 0 && checkoutStep === 'cart' && (
              <>
                {/* 1. CART THRESHOLD PROMOTIONS NUDGE BAR */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      Cart Goal Promotions
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded-full">
                      {thresholdStatus.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {thresholdStatus.message}
                  </p>

                  {/* Animated Progress Bar */}
                  <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${thresholdStatus.percent}%` }}
                    />
                  </div>

                  {/* Multi Threshold Indicators */}
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-medium">
                    <span>Rs 0</span>
                    <span className={cartSubtotal >= 299 ? "text-emerald-600 font-bold" : ""}>Free Del. (Rs 299)</span>
                    <span className={cartSubtotal >= 599 ? "text-emerald-600 font-bold" : ""}>SAVE100 (Rs 599)</span>
                    <span className={cartSubtotal >= 999 ? "text-emerald-600 font-bold" : ""}>Free Gift (Rs 999)</span>
                  </div>
                </div>

                {/* 1.5 ACTIVE GIFT CAMPAIGNS & BXGY REWARDS TRACKER */}
                {giftRules && giftRules.length > 0 && (
                  <div className="bg-gradient-to-br from-indigo-50/50 to-pink-50/20 p-4 rounded-xl border border-indigo-100/60 space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-bounce" />
                        Smart Gift Campaigns & BXGY
                      </span>
                      <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-150">
                        {giftRules.filter(r => r.isActive).length} Campaigns Active
                      </span>
                    </div>

                    <div className="space-y-3">
                      {giftRules.map(rule => {
                        if (!rule.isActive) return null;

                        // Calculate current values
                        const userCartItems = cart.filter(item => !item.isGift);
                        const baseSubtotal = userCartItems.reduce((sum, item) => sum + (getProductEffectivePrice(item.product) * item.quantity), 0);

                        let currentVal = 0;
                        let targetVal = 0;
                        let progressPercent = 0;
                        let isUnlocked = false;
                        let trackerMessage = "";

                        const giftProduct = INITIAL_PRODUCTS.find(p => p.id === rule.giftProductId);
                        const giftName = giftProduct ? giftProduct.name : rule.giftProductId;

                        const oncePerUserEligible = !rule.oncePerUser || userProfile.previousOrdersCount === 0;

                        if (!oncePerUserEligible) {
                          isUnlocked = false;
                          progressPercent = 0;
                          trackerMessage = `🔒 First-order only promotion (already claimed or ineligible).`;
                        } else if (rule.minCartValue !== undefined && rule.minCartValue !== null && rule.minCartValue > 0) {
                          currentVal = baseSubtotal;
                          targetVal = rule.minCartValue;
                          isUnlocked = currentVal >= targetVal;
                          progressPercent = Math.min(100, Math.round((currentVal / targetVal) * 100));
                          trackerMessage = isUnlocked 
                            ? `✓ Threshold reached! Free ${giftName} added!` 
                            : `Spend ₹${targetVal - currentVal} more to unlock a free ${giftName}!`;
                        } else if (rule.requiredCategory) {
                          const categorySubtotal = userCartItems.reduce((sum, item) => {
                            if (item.product.category.toLowerCase().includes(rule.requiredCategory!.toLowerCase())) {
                              return sum + (getProductEffectivePrice(item.product) * item.quantity);
                            }
                            return sum;
                          }, 0);

                          currentVal = categorySubtotal;
                          targetVal = rule.minCategoryValue || 1;
                          isUnlocked = currentVal >= targetVal;
                          progressPercent = Math.min(100, Math.round((currentVal / targetVal) * 100));
                          trackerMessage = isUnlocked 
                            ? `✓ ₹${targetVal}+ in ${rule.requiredCategory} bought! Free ${giftName} added!` 
                            : `Add ₹${targetVal - currentVal} more of ${rule.requiredCategory} items to get a free ${giftName}!`;
                        } else if (rule.requiredProductId) {
                          const matchingItem = userCartItems.find(item => item.product.id === rule.requiredProductId);
                          currentVal = matchingItem ? matchingItem.quantity : 0;
                          targetVal = rule.requiredProductQty || 1;
                          isUnlocked = currentVal >= targetVal;
                          progressPercent = Math.min(100, Math.round((currentVal / targetVal) * 100));

                          const triggerProdName = INITIAL_PRODUCTS.find(p => p.id === rule.requiredProductId)?.name || rule.requiredProductId;
                          trackerMessage = isUnlocked 
                            ? `✓ Bought ${currentVal}x ${triggerProdName}! Free ${giftName} added!` 
                            : `Buy ${targetVal - currentVal} more of ${triggerProdName} to get a free ${giftName}!`;
                        } else {
                          isUnlocked = true;
                          progressPercent = 100;
                          trackerMessage = `✓ Special offer active! Free ${giftName} added!`;
                        }

                        return (
                          <div key={rule.id} className="bg-white/80 p-2.5 rounded-lg border border-slate-150 space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <p className="font-extrabold text-slate-800 leading-tight text-[11px]">{rule.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{trackerMessage}</p>
                              </div>
                              <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-md border ${
                                isUnlocked 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              }`}>
                                {isUnlocked ? 'UNLOCKED' : `${progressPercent}%`}
                              </span>
                            </div>

                            {/* Mini progress bar */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${isUnlocked ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. SMART PRODUCT SUGGESTIONS BASED ON CART */}
                <div className="pt-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Frequently Purchased Together (Smart Suggestions)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {crossSellSuggestions.map((product) => (
                      <div key={product.id} className="border border-slate-100 rounded-lg p-2 flex items-center justify-between bg-slate-50/30">
                        <div className="min-w-0 pr-1.5">
                          <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
                          <p className="text-[10px] text-slate-500">Rs {product.price}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="bg-slate-950 hover:bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-semibold transition-colors shrink-0"
                        >
                          + Add (Rs {product.price})
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. PROMO CODE MANIFEST & APPLIED ENGINE */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  
                  {/* Enter Promo Manual input */}
                  <form onSubmit={handleApplyManualCode} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ENTER PROMO CODE MANUALLY"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg uppercase tracking-wider focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-slate-900 text-white hover:bg-slate-800 px-3 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>

                  {/* Manual Code apply feedback */}
                  {manualFeedback && (
                    <div className={`p-2 rounded-lg text-xs flex gap-2 items-start ${
                      manualFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {manualFeedback.type === 'success' ? <Check className="w-3.5 h-3.5 mt-0.5" /> : <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />}
                      <span className="leading-snug">{manualFeedback.text}</span>
                    </div>
                  )}

                  {/* AUTO APPLY BEST OFFER ENGINE STATUS */}
                  {activeCouponDetails ? (
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md flex items-center gap-1 uppercase">
                          <Sparkles className="w-3 h-3 text-emerald-600 animate-spin" />
                          {activeCouponDetails.isManualOverride ? 'Manual Choice Applied' : 'Best Offer Applied'}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setShowOffersModal(true);
                          }}
                          className="text-[10px] text-emerald-700 hover:underline font-bold flex items-center"
                        >
                          View other offers
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-600" />
                            Code: <span className="font-mono text-emerald-700">{activeCouponDetails.coupon.code}</span>
                          </p>
                          <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                            {activeCouponDetails.coupon.name}
                          </p>
                          {activeCouponDetails.coupon.isStackable && (
                            <p className="text-[10px] text-amber-700 mt-0.5 font-medium">✓ Combinable (can stack with other codes)</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-emerald-700 font-extrabold text-[13px]">
                            Saved Rs {activeCouponDetails.discountAmount}
                          </p>
                          {activeCouponDetails.coupon.discountType === 'percentage' && (
                            <p className="text-[9px] text-slate-400">
                              {activeCouponDetails.coupon.discountValue}% Off OTC Subtotal
                            </p>
                          )}
                          {activeCouponDetails.coupon.discountType === 'free_delivery' && (
                            <p className="text-[9px] text-slate-400">
                              Waives delivery shipping fee (Rs 49)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Override details */}
                      {activeCouponDetails.isManualOverride && (
                        <div className="flex items-center justify-between border-t border-emerald-200/50 pt-2 mt-2">
                          <p className="text-[9px] text-slate-500">You opted out of auto-apply selection</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCouponId(null);
                              setManualFeedback(null);
                            }}
                            className="text-[9px] text-emerald-700 font-bold hover:underline"
                          >
                            Reset to Auto Apply Best Saving
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span>No discount coupon active or valid for this cart.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowOffersModal(true)}
                        className="text-[11px] text-slate-600 font-bold hover:underline"
                      >
                        Browse Offer Book
                      </button>
                    </div>
                  )}

                  {smartFeeConfig && smartFeeConfig.weather === 'rainy' && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-medium">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                        <CloudLightning className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Smart Fee Active ⛈️</span>
                      </div>
                      <p className="text-amber-800/95 leading-relaxed mb-2">
                        Rain alert is active in your delivery location. Surcharges of +Rs {smartFeeConfig.deliverySurcharge} Delivery & +Rs {smartFeeConfig.handlingSurcharge} Handling are applied.
                      </p>
                      
                      {/* Check waivers */}
                      {(() => {
                        const hasExemptionProduct = smartFeeConfig.exemptionProductId && cart && cart.some(item => item.product.id === smartFeeConfig.exemptionProductId);
                        const isFreeDelivery = activeCouponDetails?.isValid && activeCouponDetails.coupon.discountType === 'free_delivery';
                        
                        if (hasExemptionProduct) {
                          return (
                            <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 p-2 rounded-lg font-bold text-[10px]">
                              🎉 100% WAIVED: Smart surcharges waived due to exemption item!
                            </div>
                          );
                        } else if (isFreeDelivery) {
                          return (
                            <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 p-2 rounded-lg font-bold text-[10px] space-y-1">
                              <div>🎁 Delivery Surge Waived by Coupon!</div>
                              {smartFeeConfig.handlingSurcharge > 0 && (
                                <div className="text-amber-800 font-medium font-sans">Handling surcharge is still active. Add exemption product to waive all.</div>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-slate-500 text-[10px] bg-white/60 p-2 rounded border border-amber-100">
                              💡 <span className="font-bold text-indigo-600">Surcharge Offer:</span> Add a Child Care/Baby Care product (exemption SKU) to get 100% smart fee waiver!
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}

                  {/* Wallet Voucher Redemption */}
                  <div className="mb-4 bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                        Apply Wallet Voucher
                      </span>
                      {myRedeemableVouchers.length > 0 && (
                        <span className="text-[10px] font-semibold text-indigo-600 bg-white border border-indigo-150 px-1.5 py-0.5 rounded-full">
                          {myRedeemableVouchers.length} available
                        </span>
                      )}
                    </div>

                    {myRedeemableVouchers.length === 0 ? (
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        You have no active vouchers. Vouchers assigned to you from the Voucher Manager appear here and in “My Vouchers”.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {/* Applied vouchers (stackable) — each draws down the bill in turn */}
                        {voucherAllocations.map(({ voucher, used }) => (
                          <div
                            key={voucher.voucher_id}
                            className="flex items-center justify-between bg-white border border-indigo-200 rounded-lg px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 font-mono truncate flex items-center gap-1.5">
                                <Ticket className="w-3.5 h-3.5 text-indigo-500" /> {voucher.voucher_code}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Balance Rs {voucher.remaining_amount} • redeeming <span className="font-bold text-indigo-700">Rs {used}</span>
                                {used === 0 && <span className="text-slate-400"> (bill already covered)</span>}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleVoucher(voucher.voucher_id)}
                              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer shrink-0 ml-2"
                            >
                              Remove
                            </button>
                          </div>
                        ))}

                        {/* Remaining vouchers still available to stack */}
                        {myRedeemableVouchers
                          .filter(v => !appliedVoucherIds.includes(v.voucher_id))
                          .map(v => (
                            <button
                              key={v.voucher_id}
                              type="button"
                              onClick={() => toggleVoucher(v.voucher_id)}
                              className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-indigo-400 rounded-lg px-3 py-2 text-left transition-all cursor-pointer group"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 font-mono truncate flex items-center gap-1.5">
                                  <Ticket className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600" /> {v.voucher_code}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Balance Rs {v.remaining_amount} • expires {new Date(v.expiry_date).toLocaleDateString('en-IN')}</p>
                              </div>
                              <span className="text-[11px] font-black text-indigo-600 shrink-0 ml-2 group-hover:underline">
                                {appliedVoucherIds.length > 0 ? '+ Add' : 'Apply'}
                              </span>
                            </button>
                          ))}

                        {voucherRedemption > 0 && appliedVouchers.length > 1 && (
                          <p className="text-[10px] font-bold text-indigo-700 text-right pt-0.5">
                            {appliedVouchers.length} vouchers stacked • total credit Rs {voucherRedemption}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Checkout Cost breakdown */}
                  <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>OTC Products Subtotal</span>
                      <span>Rs {otcSubtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Rx Prescriptions Subtotal</span>
                      <span>Rs {rxSubtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Shipping Fee</span>
                      <span>
                        {activeCouponDetails?.isValid && activeCouponDetails.coupon.discountType === 'free_delivery' && deliveryFee > 0 ? (
                          <span className="flex items-center gap-1">
                            <span className="line-through text-slate-400 font-normal">Rs {deliveryFee}</span>
                            <span className="text-emerald-600 font-bold">FREE (Waived)</span>
                          </span>
                        ) : (
                          deliveryFee === 0 ? 'FREE' : `Rs ${deliveryFee}`
                        )}
                      </span>
                    </div>
                    {handlingFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Smart Handling Surcharge</span>
                        <span>Rs {handlingFee}</span>
                      </div>
                    )}
                    {activeCouponDetails?.isValid && activeCouponDetails.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50/50 p-2 rounded-lg">
                        <span>Coupon Savings ({activeCouponDetails.coupon.code})</span>
                        <span>- Rs {activeCouponDetails.discountAmount}</span>
                      </div>
                    )}
                    {voucherRedemption > 0 && (
                      <div className="flex justify-between text-indigo-700 font-semibold bg-indigo-50/60 p-2 rounded-lg">
                        <span>Voucher Redeemed ({appliedVouchers.length > 1 ? `${appliedVouchers.length} vouchers` : appliedVouchers[0]?.voucher_code})</span>
                        <span>- Rs {voucherRedemption}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-100">
                      <span>Payable Order Total</span>
                      <span>Rs {finalPayable}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReservePromotion}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700 text-center py-3.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4 hover:-translate-y-0.5"
                  >
                    Lock Coupon & Proceed (Rs {finalPayable})
                    <Lock className="w-4 h-4" />
                  </button>

                  <div className="text-[10px] text-slate-400 leading-normal flex items-start gap-1 p-2.5 bg-slate-50 rounded-lg">
                    <Info className="w-3 h-3 shrink-0 mt-0.5 text-slate-500" />
                    <span>Clicking proceed runs a Phase-1 Distributed Database Lock (status code: CPN_RES) to secure your discount for 15 minutes.</span>
                  </div>
                </div>
              </>
            )}

            {/* TWO-PHASE COMMIT SIMULATOR: PHASE 2 (PAYMENT & AUTHORIZATION) */}
            {checkoutStep === 'payment' && (
              <div className="space-y-4 animate-fade-in">
                {/* Database Lock Status Widget */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider animate-pulse">
                      <Lock className="w-3 h-3 text-amber-700" />
                      Two-Phase Commit: CPN_RES (RESERVED)
                    </span>
                    
                    <span className="text-xs font-bold text-amber-800 font-mono flex items-center gap-1 bg-amber-100/50 px-2 py-0.5 rounded-md">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      {Math.floor(reservationTimeLeft / 60)}:{(reservationTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-950 font-semibold leading-relaxed">
                    A distributed database lock is currently active on our simulated PostgreSQL instance. 
                    Your coupon savings of <span className="font-bold text-emerald-700 font-mono">Rs {lastSavedVoucherDeduction}</span> are secured until the timer expires.
                  </p>

                  <div className="border-t border-amber-200/50 pt-2.5 space-y-1.5 font-mono text-[9px] text-slate-500">
                    <p>• <span className="font-semibold text-slate-700">TEMP_ORDER_ID:</span> {tempOrderId}</p>
                    <p>• <span className="font-semibold text-slate-700">CUSTOMER_UUID:</span> {userProfile.id}</p>
                    <p>• <span className="font-semibold text-slate-700">EXPIRES_AT:</span> {new Date(Date.now() + reservationTimeLeft * 1000).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Secure E-Pharmacy Checkout Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Recipient Delivery & Payment Authorization
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Customer Email</label>
                      <input 
                        type="text" 
                        readOnly 
                        value="shivkiran.chitkulwar@rampupinfotech.com" 
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Delivery Address ({userProfile.location})</label>
                      <textarea 
                        rows={2}
                        readOnly 
                        value={`Apartment 304, Emerald Residency, Sector 15, ${userProfile.location}`} 
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none text-[11px] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Select Payment Gateway Network</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <label className="border border-emerald-500 bg-emerald-50/20 p-2 rounded-lg flex items-center gap-2 cursor-pointer">
                          <input type="radio" defaultChecked name="payment_network" className="accent-emerald-600" />
                          <span className="font-bold text-[11px] text-slate-700">UPI / GPay</span>
                        </label>
                        <label className="border border-slate-200 p-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-50">
                          <input type="radio" name="payment_network" className="accent-emerald-600" />
                          <span className="font-bold text-[11px] text-slate-600">Card (Visa/MC)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Summary of Order */}
                <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Products Subtotal</span>
                    <span>Rs {cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? 'FREE' : `Rs ${deliveryFee}`}</span>
                  </div>
                  {handlingFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Smart Handling Surcharge</span>
                      <span>Rs {handlingFee}</span>
                    </div>
                  )}
                  {lastSavedVoucherDeduction > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50/50 p-2 rounded-lg">
                      <span>Locked Coupon Savings</span>
                      <span>- Rs {lastSavedVoucherDeduction}</span>
                    </div>
                  )}
                  {voucherRedemption > 0 && (
                    <div className="flex justify-between text-indigo-700 font-semibold bg-indigo-50/60 p-2 rounded-lg">
                      <span>Voucher Redeemed ({appliedVouchers.length > 1 ? `${appliedVouchers.length} vouchers` : appliedVouchers[0]?.voucher_code})</span>
                      <span>- Rs {voucherRedemption}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2.5 border-t border-slate-100">
                    <span>Amount Authorized</span>
                    <span>Rs {finalPayable}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmCheckout}
                    className="w-full bg-slate-950 hover:bg-slate-800 text-white text-center py-3.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase"
                  >
                    Commit Transaction & Confirm Payment (Rs {finalPayable})
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </button>

                  <button
                    type="button"
                    onClick={handleReleaseReservation}
                    className="w-full bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 text-center py-2.5 rounded-xl font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel & Rollback DB Reservation
                  </button>
                </div>
              </div>
            )}

            {/* TWO-PHASE COMMIT SIMULATOR: PHASE 3 (SUCCESS RECAP) */}
            {checkoutStep === 'success' && (
              <div className="text-center py-6 px-4 space-y-5 animate-fade-in">
                <div className="bg-emerald-100 p-4 rounded-full text-emerald-700 w-16 h-16 flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">Database Transaction Committed!</h3>
                  <p className="text-xs text-slate-500">Order successfully placed and verified in real time.</p>
                </div>

                {/* Audit Information Table Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-2.5 font-mono text-[9px] text-slate-600">
                  <p className="text-[10px] font-bold text-slate-700 font-sans uppercase mb-1 border-b border-slate-200 pb-1.5 flex justify-between">
                    <span>SQL AUDIT RECORD</span>
                    <span className="text-emerald-700 font-extrabold text-[9px] font-mono">CPN_USED</span>
                  </p>
                  <p className="flex justify-between">
                    <span>TABLE_STATE:</span>
                    <span className="font-bold text-emerald-600">promotion_usages</span>
                  </p>
                  <p className="flex justify-between">
                    <span>STATUS_ID:</span>
                    <span className="font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">CPN_USED</span>
                  </p>
                  <p className="flex justify-between">
                    <span>CONFIRMED_ORDER_ID:</span>
                    <span className="font-bold text-slate-800">{confirmedOrderId}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>DISCOUNT_APPLIED:</span>
                    <span className="font-bold text-slate-800">Rs {lastSavedVoucherDeduction}.00</span>
                  </p>
                  <p className="flex justify-between">
                    <span>USED_AT:</span>
                    <span className="text-slate-500">{new Date().toLocaleString()}</span>
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 text-left leading-normal">
                  <p className="font-bold">✓ Voucher Wallet / Pool Credit Deducted</p>
                  <p className="mt-1">If you applied a balance-based Voucher, its current remaining credit has been deducted in our database. View the changes in the <strong>Database Inspector</strong> tab!</p>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Return to Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MODAL: Browse Available Coupon Book (View Other Offers) */}
      {showOffersModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">E-Pharmacy Offer Book</h3>
                <p className="text-xs text-slate-500">Evaluate conditions, restrictions, and select custom codes.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowOffersModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-xl leading-relaxed flex gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>The <strong>Auto Apply Best Offer Engine</strong> always targets the code with the absolute maximum rupee savings. You can manually force selection of any coupon below, provided its checkout rules are fulfilled.</span>
              </div>

              <div className="space-y-3">
                {coupons.map(coupon => {
                  const res = validateCoupon(coupon);
                  const isCurrentBest = autoApplyResult?.bestCoupon?.id === coupon.id;
                  const isCurrentlyApplied = activeCouponDetails?.coupon.id === coupon.id;

                  return (
                    <div 
                      key={coupon.id} 
                      className={`p-3.5 rounded-xl border transition-all ${
                        res.isValid 
                          ? isCurrentlyApplied 
                            ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-100' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-slate-50 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {coupon.code}
                            </span>
                            {isCurrentBest && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> Best Savings
                              </span>
                            )}
                            {isCurrentlyApplied && (
                              <span className="text-[9px] bg-slate-900 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                                Applied
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 mt-2">{coupon.name}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{coupon.description}</p>
                          {coupon.brandRestriction && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-pink-50 text-pink-700 border border-pink-100 px-1.5 py-0.5 rounded">
                                <Tag className="w-2.5 h-2.5" />
                                Brand: {coupon.brandRestriction}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {res.isValid ? (
                            <div>
                              <p className="text-xs text-emerald-600 font-bold">Valid Offer</p>
                              <p className="text-xs text-slate-800 font-semibold mt-1">Saves Rs {res.discountAmount}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[11px] text-red-500 font-bold">Restricted</p>
                              <p className="text-[10px] text-slate-400 mt-1">Saves Rs 0</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rejection / Validation Reasons */}
                      {!res.isValid && (
                        <div className="mt-2 p-1.5 rounded bg-red-50 text-[10px] text-red-700 flex gap-1 items-start leading-relaxed">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{res.reason}</span>
                        </div>
                      )}

                      {/* Select CTA */}
                      {res.isValid && !isCurrentlyApplied && (
                        <button
                          type="button"
                          onClick={() => handleApplyCouponFromList(coupon.id)}
                          className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                        >
                          Select and Force Apply (Save Rs {res.discountAmount})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setShowOffersModal(false)}
                className="bg-white border border-slate-200 text-slate-600 text-xs px-4 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-all cursor-pointer"
              >
                Close Offer Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
