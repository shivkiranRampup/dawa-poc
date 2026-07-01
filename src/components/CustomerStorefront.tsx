import React, { useState, useMemo } from 'react';
import { Product, Coupon, FlashSaleItem, CartItem, UserProfile, Promotion, PromotionUsage, SmartFeeConfig, GiftRule } from '../types';
import CheckoutSimulator from './CheckoutSimulator';
import { 
  ShoppingBag, 
  Tag, 
  Users, 
  Database, 
  Zap, 
  Search, 
  ShoppingCart, 
  User, 
  ChevronDown, 
  Plus, 
  Minus, 
  Trash2, 
  Edit, 
  Check, 
  MapPin, 
  AlertCircle, 
  X, 
  ArrowRight, 
  HeartHandshake, 
  Sparkles,
  RotateCcw,
  CloudLightning
} from 'lucide-react';

interface CustomerStorefrontProps {
  products: Product[];
  coupons: Coupon[];
  flashSaleItems: FlashSaleItem[];
  flashSaleTitle: string;
  onGoToDashboard: () => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  promotionUsages: PromotionUsage[];
  setPromotionUsages: React.Dispatch<React.SetStateAction<PromotionUsage[]>>;
  onOrderPlaced: (couponCode?: string, discountAmount?: number) => void;
  smartFeeConfig: SmartFeeConfig;
  giftRules: GiftRule[];
}

interface Address {
  id: string;
  label: string;
  details: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relation: string;
}

export default function CustomerStorefront({
  products,
  coupons,
  flashSaleItems,
  flashSaleTitle,
  onGoToDashboard,
  userProfile,
  onUpdateUserProfile,
  promotions,
  setPromotions,
  promotionUsages,
  setPromotionUsages,
  onOrderPlaced,
  smartFeeConfig,
  giftRules
}: CustomerStorefrontProps) {
  // Storefront active tab/page
  const [activePage, setActivePage] = useState<'browse' | 'checkout'>('browse');

  // Customer state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('Popularity');

  // Filters state
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(800);

  // Addresses & Patients local list
  const [addresses, setAddresses] = useState<Address[]>([
    { id: 'addr_1', label: 'home', details: 'house no 1, Mumbai City, 400050' },
    { id: 'addr_2', label: 'office', details: 'Andheri Railway Station East Northern Overpass, Mumbai, 400069' }
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr_1');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrDetails, setNewAddrDetails] = useState('');

  const [patients, setPatients] = useState<Patient[]>([
    { id: 'pat_1', name: 'manual3', age: 58, gender: 'Male', relation: 'Self' },
    { id: 'pat_2', name: 'shivkiran chitkulwar', age: 43, gender: 'Male', relation: 'Family' },
    { id: 'pat_3', name: 'shri chitkulwar', age: 18, gender: 'Male', relation: 'Family' }
  ]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat_1');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatName, setNewPatName] = useState('');
  const [newPatAge, setNewPatAge] = useState('');
  const [newPatGender, setNewPatGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPatRelation, setNewPatRelation] = useState('Family');

  // Coupon application state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccessMessage, setCouponSuccessMessage] = useState<string | null>(null);

  // Order Placement Modal
  const [placedOrderDetails, setPlacedOrderDetails] = useState<any | null>(null);

  // Categories ribbon
  const categories = [
    'All',
    'Medicine',
    'Personal Care',
    'Health Condition',
    'Vitamins & Supplements',
    'Diabetes Care',
    'Health Care Device',
    'Homeopathic Medicine'
  ];

  // Forms & Packages lists
  const availableForms = ['Aerosol', 'AliCap', 'Ampule', 'Autohaler', 'Bar', 'Bio-Adhesive', 'Bottle', 'Tablet'];
  const availablePackages = ['Ampoule', 'Bottle', 'Box', 'Canister', 'Cartridge', 'Combo Pack', 'Disk'];

  // 1. Calculate prices under active campaigns (Flash Sales)
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

  // Helper to get raw item price
  const getProductMRP = (product: Product) => {
    return product.mrp || Math.ceil(product.price * 1.11);
  };

  // Filter products based on search, category, forms, packages, and max price
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        // loose match just in case
        if (!product.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }

      // Search Query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = product.name.toLowerCase().includes(query);
        const matchBrand = product.brand?.toLowerCase().includes(query) || false;
        const matchCat = product.category.toLowerCase().includes(query);
        if (!matchName && !matchBrand && !matchCat) {
          return false;
        }
      }

      // Form filter
      if (selectedForms.length > 0 && (!product.form || !selectedForms.includes(product.form))) {
        return false;
      }

      // Package filter
      if (selectedPackages.length > 0 && (!product.packageType || !selectedPackages.includes(product.packageType))) {
        return false;
      }

      // Price filter (effective price)
      const price = getProductEffectivePrice(product);
      if (price > maxPrice) {
        return false;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery, selectedForms, selectedPackages, maxPrice, flashSaleItems]);

  // Evaluate and apply active gift rules
  const recalculateCartGifts = (baseCart: CartItem[]): CartItem[] => {
    // 1. Filter out all existing auto-added gifts to get user-added items
    const userCartItems = baseCart.filter(item => !item.isGift);

    if (userCartItems.length === 0) {
      return [];
    }

    // 2. Calculate the base subtotal from user items
    const baseSubtotal = userCartItems.reduce((sum, item) => {
      return sum + (getProductEffectivePrice(item.product) * item.quantity);
    }, 0);

    // 3. Keep track of which gift product IDs should be auto-added
    const giftProductIdsToAdd = new Set<string>();

    // 4. Evaluate each active rule
    giftRules.forEach(rule => {
      if (!rule.isActive) return;

      let minCartPass = true;
      if (rule.minCartValue !== undefined && rule.minCartValue !== null) {
        minCartPass = baseSubtotal >= rule.minCartValue;
      }

      let minOrdersPass = true;
      if (rule.minUserOrders !== undefined && rule.minUserOrders !== null) {
        minOrdersPass = userProfile.previousOrdersCount >= rule.minUserOrders;
      }

      let categoryPass = true;
      if (rule.requiredCategory) {
        categoryPass = userCartItems.some(item => 
          item.product.category.toLowerCase().includes(rule.requiredCategory!.toLowerCase())
        );
      }

      let minCategoryValuePass = true;
      if (rule.requiredCategory && rule.minCategoryValue !== undefined && rule.minCategoryValue !== null) {
        const categorySubtotal = userCartItems.reduce((sum, item) => {
          if (item.product.category.toLowerCase().includes(rule.requiredCategory!.toLowerCase())) {
            return sum + (getProductEffectivePrice(item.product) * item.quantity);
          }
          return sum;
        }, 0);
        minCategoryValuePass = categorySubtotal >= rule.minCategoryValue;
      }

      let requiredProductPass = true;
      if (rule.requiredProductId) {
        const matchingItem = userCartItems.find(item => item.product.id === rule.requiredProductId);
        const qtyRequired = rule.requiredProductQty || 1;
        requiredProductPass = !!matchingItem && matchingItem.quantity >= qtyRequired;
      }

      let oncePerUserPass = true;
      if (rule.oncePerUser) {
        oncePerUserPass = userProfile.previousOrdersCount === 0;
      }

      // If all configured conditions for this rule are met, trigger the gift!
      if (minCartPass && minOrdersPass && categoryPass && minCategoryValuePass && requiredProductPass && oncePerUserPass) {
        giftProductIdsToAdd.add(rule.giftProductId);
      }
    });

    // 5. Construct the final synchronized cart
    const finalCart = [...userCartItems];

    giftProductIdsToAdd.forEach(giftId => {
      const giftProduct = products.find(p => p.id === giftId);
      if (giftProduct) {
        finalCart.push({
          product: giftProduct,
          quantity: 1,
          isGift: true
        });
      }
    });

    return finalCart;
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const cleanPrev = prev.filter(item => !item.isGift);
      const existing = cleanPrev.find(item => item.product.id === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = cleanPrev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updated = [...cleanPrev, { product, quantity: 1 }];
      }
      return recalculateCartGifts(updated);
    });
  };

  const handleDecreaseQuantity = (productId: string) => {
    setCart(prev => {
      const cleanPrev = prev.filter(item => !item.isGift);
      const existing = cleanPrev.find(item => item.product.id === productId);
      let updated: CartItem[];
      if (existing && existing.quantity > 1) {
        updated = cleanPrev.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        updated = cleanPrev.filter(item => item.product.id !== productId);
      }
      return recalculateCartGifts(updated);
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => {
      const cleanPrev = prev.filter(item => !item.isGift);
      const updated = cleanPrev.filter(item => item.product.id !== productId);
      return recalculateCartGifts(updated);
    });
  };

  const handleBuyNow = (product: Product) => {
    handleAddToCart(product);
    setActivePage('checkout');
  };

  // Clear filters
  const handleResetFilters = () => {
    setSelectedForms([]);
    setSelectedPackages([]);
    setMaxPrice(800);
    setSearchQuery('');
  };

  // Toggle filter lists
  const handleToggleForm = (form: string) => {
    setSelectedForms(prev => 
      prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]
    );
  };

  const handleTogglePackage = (pkg: string) => {
    setSelectedPackages(prev => 
      prev.includes(pkg) ? prev.filter(p => p !== pkg) : [...prev, pkg]
    );
  };

  // 2. Calculations for Cart & checkout
  const cartSubtotalMRP = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.isGift ? 0 : getProductMRP(item.product) * item.quantity), 0);
  }, [cart]);

  const cartSubtotalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.isGift ? 0 : getProductEffectivePrice(item.product) * item.quantity), 0);
  }, [cart, flashSaleItems]);

  const shelfSavings = cartSubtotalMRP - cartSubtotalPrice;

  // Coupon valuation engine
  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;

    // Weather restriction check
    if (appliedCoupon.weatherRestriction && appliedCoupon.weatherRestriction !== smartFeeConfig.weather) {
      return 0;
    }

    // Minimum cart value check
    if (cartSubtotalPrice < appliedCoupon.minCartValue) {
      return 0; // won't apply, but validation helper will flag it
    }

    // Category restrictions
    let eligibleSubtotal = cartSubtotalPrice;
    if (appliedCoupon.categoryRestrictions && appliedCoupon.categoryRestrictions.length > 0) {
      eligibleSubtotal = cart.reduce((sum, item) => {
        if (item.isGift) return sum;
        const isEligible = appliedCoupon.categoryRestrictions.some(cat => 
          item.product.category.toLowerCase().includes(cat.toLowerCase())
        );
        if (isEligible) {
          return sum + (getProductEffectivePrice(item.product) * item.quantity);
        }
        return sum;
      }, 0);
    }

    // Device restriction check
    if (appliedCoupon.deviceRestrictions && appliedCoupon.deviceRestrictions.length > 0) {
      if (!appliedCoupon.deviceRestrictions.includes('web')) {
        return 0;
      }
    }

    // Location restriction check
    if (appliedCoupon.locationRestrictions && appliedCoupon.locationRestrictions.length > 0) {
      if (!appliedCoupon.locationRestrictions.includes(userProfile.location)) {
        return 0;
      }
    }

    // Calculate discount
    if (appliedCoupon.discountType === 'flat') {
      return Math.min(appliedCoupon.discountValue, eligibleSubtotal);
    } else if (appliedCoupon.discountType === 'percentage') {
      const discount = (eligibleSubtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscountCap) {
        return Math.min(discount, appliedCoupon.maxDiscountCap);
      }
      return discount;
    } else if (appliedCoupon.discountType === 'free_delivery') {
      return 0; // Handled in delivery calculations
    }

    return 0;
  }, [cart, appliedCoupon, cartSubtotalPrice, userProfile]);

  // Delivery & Fees
  const deliveryCharge = useMemo(() => {
    if (cart.length === 0) return 0;
    
    const config = smartFeeConfig || { weather: 'sunny', deliverySurcharge: 0, handlingSurcharge: 0, exemptionProductId: '' };
    
    // Check if exemption product is present in the cart
    const hasExemptionProduct = config.exemptionProductId && cart.some(item => item.product.id === config.exemptionProductId);
    if (hasExemptionProduct) return 0; // complete waiver!

    if (appliedCoupon?.discountType === 'free_delivery') return 0;
    if (cartSubtotalPrice > 500) return 0; // free delivery over Rs 500
    
    const baseDelivery = 40;
    const weatherSurcharge = config.weather === 'rainy' ? config.deliverySurcharge : 0;
    return baseDelivery + weatherSurcharge;
  }, [cart, appliedCoupon, cartSubtotalPrice, smartFeeConfig]);

  const handlingFee = useMemo(() => {
    if (cart.length === 0) return 0;
    
    const config = smartFeeConfig || { weather: 'sunny', deliverySurcharge: 0, handlingSurcharge: 0, exemptionProductId: '' };
    
    // Check if exemption product is present in the cart
    const hasExemptionProduct = config.exemptionProductId && cart.some(item => item.product.id === config.exemptionProductId);
    if (hasExemptionProduct) return 0; // complete waiver!

    return config.handlingSurcharge !== undefined ? config.handlingSurcharge : 12;
  }, [cart, smartFeeConfig]);

  const finalGrandTotal = Math.max(0, cartSubtotalPrice - couponDiscountAmount + deliveryCharge + handlingFee);

  const totalOrderSavings = shelfSavings + couponDiscountAmount + (deliveryCharge === 0 && cart.length > 0 ? 40 : 0);

  // Apply a coupon code
  const handleApplyCouponCode = (code: string) => {
    const targetCode = code.trim().toUpperCase();
    if (!targetCode) return;

    setCouponError(null);
    setCouponSuccessMessage(null);

    const coupon = coupons.find(c => c.code.toUpperCase() === targetCode);
    if (!coupon) {
      setCouponError(`Coupon "${targetCode}" is invalid or does not exist.`);
      setAppliedCoupon(null);
      return;
    }

    if (!coupon.isActive) {
      setCouponError(`Coupon "${targetCode}" is currently inactive.`);
      setAppliedCoupon(null);
      return;
    }

    // Check weather restriction
    if (coupon.weatherRestriction && coupon.weatherRestriction !== smartFeeConfig.weather) {
      setCouponError(`Weather Restriction: Coupon "${targetCode}" is only valid when it is ${coupon.weatherRestriction === 'rainy' ? 'raining in Mumbai' : 'sunny'}.`);
      setAppliedCoupon(null);
      return;
    }

    // Check conditions
    if (cartSubtotalPrice < coupon.minCartValue) {
      setCouponError(`Minimum purchase of Rs. ${coupon.minCartValue} is required for this coupon.`);
      setAppliedCoupon(null);
      return;
    }

    // Check location
    if (coupon.locationRestrictions && coupon.locationRestrictions.length > 0) {
      const matchesLocation = coupon.locationRestrictions.some(loc => 
        userProfile.location.toLowerCase().includes(loc.toLowerCase())
      );
      if (!matchesLocation) {
        setCouponError(`This coupon is only valid for deliveries in: ${coupon.locationRestrictions.join(', ')}. Current zone is ${userProfile.location}.`);
        setAppliedCoupon(null);
        return;
      }
    }

    // Check device
    if (coupon.deviceRestrictions && coupon.deviceRestrictions.length > 0) {
      if (!coupon.deviceRestrictions.includes('web')) {
        setCouponError(`This is a mobile app exclusive coupon. Switch to app device in sandbox settings.`);
        setAppliedCoupon(null);
        return;
      }
    }

    // Check previous orders count
    if (coupon.minPreviousOrders > 0 && userProfile.previousOrdersCount < coupon.minPreviousOrders) {
      setCouponError(`This VIP coupon requires at least ${coupon.minPreviousOrders} previous orders. You have ${userProfile.previousOrdersCount}.`);
      setAppliedCoupon(null);
      return;
    }

    // Check per-user limit
    const userUsages = userProfile.usedCoupons[coupon.code] || 0;
    if (userUsages >= coupon.perUserLimit) {
      setCouponError(`Limit reached! You have already used coupon "${coupon.code}" ${userUsages}/${coupon.perUserLimit} times.`);
      setAppliedCoupon(null);
      return;
    }

    // All checks pass
    setAppliedCoupon(coupon);
    if (coupon.discountType === 'free_delivery') {
      setCouponSuccessMessage(`Success: "${coupon.code}" applied! Delivery fee of Rs 40 has been waived.`);
    } else {
      const estDiscount = coupon.discountType === 'flat' 
        ? coupon.discountValue 
        : Math.round((cartSubtotalPrice * coupon.discountValue) / 100);
      const actualCap = coupon.maxDiscountCap ? Math.min(estDiscount, coupon.maxDiscountCap) : estDiscount;
      setCouponSuccessMessage(`Success: "${coupon.code}" applied! Saved Rs. ${actualCap} on eligible items.`);
    }
  };

  // Add inline addresses & patients
  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrLabel.trim() || !newAddrDetails.trim()) return;
    const newAddr: Address = {
      id: 'addr_' + Date.now(),
      label: newAddrLabel.trim().toLowerCase(),
      details: newAddrDetails.trim()
    };
    setAddresses(prev => [...prev, newAddr]);
    setSelectedAddressId(newAddr.id);
    setNewAddrLabel('');
    setNewAddrDetails('');
    setShowAddAddress(false);
  };

  const handleAddNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatName.trim() || !newPatAge.trim()) return;
    const newPat: Patient = {
      id: 'pat_' + Date.now(),
      name: newPatName.trim(),
      age: parseInt(newPatAge) || 30,
      gender: newPatGender,
      relation: newPatRelation
    };
    setPatients(prev => [...prev, newPat]);
    setSelectedPatientId(newPat.id);
    setNewPatName('');
    setNewPatAge('');
    setShowAddPatient(false);
  };

  // Place Order Action
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const selectedAddr = addresses.find(a => a.id === selectedAddressId);
    const selectedPat = patients.find(p => p.id === selectedPatientId);

    // Save coupon usage count to simulated profile
    if (appliedCoupon) {
      const updatedUsedCoupons = { ...userProfile.usedCoupons };
      updatedUsedCoupons[appliedCoupon.code] = (updatedUsedCoupons[appliedCoupon.code] || 0) + 1;
      onUpdateUserProfile({
        ...userProfile,
        usedCoupons: updatedUsedCoupons,
        previousOrdersCount: userProfile.previousOrdersCount + 1
      });
    } else {
      onUpdateUserProfile({
        ...userProfile,
        previousOrdersCount: userProfile.previousOrdersCount + 1
      });
    }

    setPlacedOrderDetails({
      orderId: 'DAWA-OD-' + Math.floor(100000 + Math.random() * 900000),
      items: [...cart],
      address: selectedAddr,
      patient: selectedPat,
      discountApplied: couponDiscountAmount,
      shelfSavings,
      delivery: deliveryCharge,
      handling: handlingFee,
      grandTotal: finalGrandTotal,
      savings: totalOrderSavings,
      coupon: appliedCoupon ? appliedCoupon.code : null,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleCloseOrderModal = () => {
    setPlacedOrderDetails(null);
    setCart([]);
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponSuccessMessage(null);
    setCouponError(null);
    setActivePage('browse');
  };

  // Last minute buy list (items not in cart)
  const lastMinuteBuys = useMemo(() => {
    const cartIds = cart.map(i => i.product.id);
    return products.filter(p => !cartIds.includes(p.id)).slice(0, 4);
  }, [products, cart]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F3F7F9]">
      
      {/* BRAND HEADER */}
      <header className="sticky top-0 z-30 bg-white shadow-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* Logo in DAWA deep teal style */}
            <div className="flex items-center gap-3 shrink-0">
              <div 
                onClick={() => setActivePage('browse')}
                className="bg-[#007C7A] text-white w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-2xl shadow-sm cursor-pointer select-none transition-transform hover:scale-105"
              >
                D
              </div>
              <div className="flex flex-col cursor-pointer" onClick={() => setActivePage('browse')}>
                <span className="text-[#007C7A] text-2xl font-black tracking-wider leading-none">DAWA</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Online Pharmacy</span>
              </div>
            </div>

            {/* Custom rounded capsule search bar */}
            <div className="hidden md:flex flex-1 max-w-lg items-center relative">
              <input 
                type="text"
                placeholder="Search for medicines, multivitamin, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-5 pr-28 text-sm outline-hidden focus:border-[#007C7A] focus:bg-white focus:ring-1 focus:ring-[#007C7A] transition-all text-slate-800 font-medium"
              />
              <button 
                type="button"
                onClick={() => setSearchQuery(searchQuery)}
                className="absolute right-1.5 bg-[#007C7A] text-white hover:bg-[#006361] rounded-full px-5 py-1.5 text-xs font-bold transition-colors shadow-xs"
              >
                Search
              </button>
            </div>

            {/* Utilities (Cart, user profile, and bridge button) */}
            <div className="flex items-center gap-4">
              
              {/* Go to Dashboard Trigger Button */}
              <button
                type="button"
                onClick={onGoToDashboard}
                className="bg-[#5B50BC] hover:bg-[#483EA2] text-white text-xs font-black px-4 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer border border-indigo-400/20"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Go to Admin Dashboard</span>
              </button>

              {/* Interactive Cart Button */}
              <button
                type="button"
                onClick={() => setActivePage(activePage === 'checkout' ? 'browse' : 'checkout')}
                className="relative bg-slate-100 hover:bg-slate-200 p-3 rounded-full text-slate-700 transition-colors cursor-pointer"
                aria-label="View Cart"
              >
                <ShoppingCart className="w-5 h-5 text-slate-800" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#007C7A] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>

              {/* User Profile display */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-extrabold shadow-inner">
                  M
                </div>
                <div className="hidden lg:block text-left leading-none">
                  <span className="text-xs font-extrabold text-slate-700">manual3</span>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase mt-0.5">Self Account</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* CATEGORY RIBBON MENU */}
      <nav className="bg-white border-b border-slate-200/60 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 h-12 text-xs font-extrabold text-slate-600 whitespace-nowrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setActivePage('browse');
                }}
                className={`py-3 px-1 border-b-2 transition-all cursor-pointer relative ${
                  selectedCategory === cat 
                    ? 'border-[#007C7A] text-[#007C7A]' 
                    : 'border-transparent text-slate-500 hover:text-[#007C7A]'
                }`}
              >
                {cat}
                {cat === 'Diabetes Care' && (
                  <span className="absolute top-1 -right-2 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* FLASH SALE HEADLINE BANNER (Dynamic if there is an active flash sale) */}
      {flashSaleItems.some(i => i.isActive) && (
        <div className="bg-gradient-to-r from-amber-500 via-[#007C7A] to-indigo-600 text-white py-2.5 px-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse">
                ⚡ CAMPAIGN LIVE
              </span>
              <p className="text-xs font-extrabold tracking-tight">
                {flashSaleTitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-indigo-100 font-bold bg-white/10 px-2 py-0.5 rounded">
                Zone: STORE 54 (Mumbai/Pune)
              </span>
              <span className="text-[10px] text-amber-200 font-bold border border-amber-400/30 px-2 py-0.5 rounded">
                Auto-Applied At Shelf!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activePage === 'checkout' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-[#007C7A] tracking-tight">Your Checkout Simulator</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Secure payment & pharmacy validation engine</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('browse')}
                className="text-xs font-extrabold text-[#007C7A] hover:underline flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl transition-all"
              >
                ← Back to Browse Medicines
              </button>
            </div>

            <CheckoutSimulator
              coupons={coupons}
              userProfile={userProfile}
              onChangeUserProfile={onUpdateUserProfile}
              onOrderPlaced={(code, discount) => {
                onOrderPlaced(code, discount);
                alert(`Order successfully placed! Coupon Code: ${code || 'None'}, Discount Saved: Rs ${discount || 0}`);
                setCart([]);
                setActivePage('browse');
              }}
              promotions={promotions}
              setPromotions={setPromotions}
              promotionUsages={promotionUsages}
              setPromotionUsages={setPromotionUsages}
              flashSaleItems={flashSaleItems}
              flashSaleTitle={flashSaleTitle}
              cart={cart}
              setCart={setCart}
              smartFeeConfig={smartFeeConfig}
              giftRules={giftRules}
            />
          </div>
        ) : activePage === 'browse' ? (
          /* ================= PAGE 1: MEDICINES BROWSER ================= */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* FILTER SIDEBAR (Left Column) */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Filters</h3>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-[#007C7A] hover:text-[#005a58] flex items-center gap-1 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {/* FORM CHECKBOXES */}
                <div className="mb-6">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Form</h4>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {availableForms.map(form => {
                      const isChecked = selectedForms.includes(form);
                      return (
                        <label key={form} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleForm(form)}
                            className="w-4 h-4 rounded border-slate-300 text-[#007C7A] focus:ring-[#007C7A]"
                          />
                          <span>{form}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* PACKAGE CHECKBOXES */}
                <div className="mb-6 border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Package</h4>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {availablePackages.map(pkg => {
                      const isChecked = selectedPackages.includes(pkg);
                      return (
                        <label key={pkg} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePackage(pkg)}
                            className="w-4 h-4 rounded border-slate-300 text-[#007C7A] focus:ring-[#007C7A]"
                          />
                          <span>{pkg}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* MAX PRICE SLIDER */}
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Max Price</h4>
                    <span className="text-xs font-bold text-[#007C7A]">Rs. {maxPrice}</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#007C7A]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                    <span>Rs. 10</span>
                    <span>Rs. 1000</span>
                  </div>
                </div>

              </div>

              {/* Quick Sandbox Stats Card */}
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                <span className="text-[9px] font-bold text-indigo-700 tracking-wider uppercase bg-indigo-100 px-2 py-0.5 rounded-md">
                  Sandbox Active User Profile
                </span>
                <div className="mt-3 text-xs space-y-1 text-indigo-900 font-medium">
                  <p><strong>Name:</strong> {userProfile.name}</p>
                  <p><strong>Location:</strong> {userProfile.location} (Mumbai Special Eligible)</p>
                  <p><strong>Device:</strong> Web Platform</p>
                  <p><strong>Orders Completed:</strong> {userProfile.previousOrdersCount} (VIP status)</p>
                </div>
              </div>

            </div>

            {/* MEDICINES CATALOG (Right Columns) */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {selectedCategory === 'All' ? 'All Medicines' : selectedCategory}
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Showing {filteredProducts.length} premium healthcare products
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Sort:</span>
                  <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-extrabold text-slate-700 outline-hidden focus:border-[#007C7A]"
                  >
                    <option>Popularity</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Grid of Product Cards */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-extrabold text-slate-800">No products match your filters</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Try adjusting your category selection or resetting filters.</p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-4 bg-[#007C7A] hover:bg-[#006361] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => {
                    const flashSale = getActiveFlashSale(product.id);
                    const effectivePrice = getProductEffectivePrice(product);
                    const mrpPrice = getProductMRP(product);
                    
                    // Count in cart
                    const cartItem = cart.find(i => i.product.id === product.id);
                    const countInCart = cartItem ? cartItem.quantity : 0;

                    // Calculate discount percentage
                    const discountPercent = flashSale 
                      ? flashSale.flashDiscountPercent 
                      : Math.round(((mrpPrice - effectivePrice) / mrpPrice) * 100);

                    return (
                      <div 
                        key={product.id} 
                        id={`product-card-${product.id}`}
                        className="bg-white rounded-2xl border border-slate-200 hover:border-[#007C7A] p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group duration-300"
                      >
                        <div>
                          {/* Card tags */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5 shadow-2xs">
                              {discountPercent}% OFF
                            </span>
                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                              product.isRx 
                                ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {product.isRx ? 'Rx' : 'OTC'}
                            </span>
                          </div>

                          {/* Beautiful Pill Capsule Vector Graphics Container */}
                          <div className="bg-slate-50 border border-slate-100/60 rounded-xl h-36 flex items-center justify-center mb-4 overflow-hidden relative group-hover:bg-teal-50/10 transition-colors">
                            {/* SVG Medicine Illustration mimicking Image 1 */}
                            <svg className="w-16 h-16 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" viewBox="0 0 100 100">
                              <g transform="translate(50, 50) rotate(-45)">
                                <rect x="-18" y="-35" width="36" height="35" fill="#007C7A" rx="18" />
                                <rect x="-18" y="0" width="36" height="35" fill="#E2E8F0" rx="18" />
                                <line x1="-18" y1="0" x2="18" y2="0" stroke="#005a58" strokeWidth="2.5" />
                                <circle cx="0" cy="-18" r="4" fill="#FFFFFF" opacity="0.8" />
                                <circle cx="-6" cy="18" r="3" fill="#A0AEC0" opacity="0.6" />
                              </g>
                              {product.isRx && (
                                <g transform="translate(72, 72)">
                                  <circle cx="0" cy="0" r="11" fill="#F43F5E" />
                                  <text x="0" y="4" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle">Rx</text>
                                </g>
                              )}
                            </svg>
                          </div>

                          {/* Brand and name */}
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {product.brand || 'DAWA Core'}
                          </p>
                          <h4 className="text-sm font-extrabold text-slate-800 tracking-tight mt-0.5 group-hover:text-[#007C7A] transition-colors leading-tight min-h-10 line-clamp-2">
                            {product.name}
                          </h4>

                          {/* Suggested tags / subtext */}
                          <div className="flex items-center gap-1.5 mt-2 mb-3">
                            <span className="text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-md">
                              {product.form || 'Tablet'}
                            </span>
                            <span className="text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-md">
                              {product.packageType || 'Box'}
                            </span>
                          </div>

                          {/* Dropdown styling as seen in the screenshots */}
                          <div className="bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[11px] font-extrabold text-[#007C7A] mb-4">
                            <span>Best price ₹{effectivePrice.toFixed(2)}</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Prices & Actions */}
                        <div className="border-t border-slate-100 pt-3 mt-auto">
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-base font-black text-slate-800">
                              ₹{effectivePrice.toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-400 line-through font-bold">
                              ₹{mrpPrice.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {/* Add Button */}
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                countInCart > 0 
                                  ? 'bg-[#EBF7F7] text-[#007C7A] border border-[#007C7A]/25' 
                                  : 'bg-white border border-slate-200 text-[#007C7A] hover:bg-slate-50'
                              }`}
                            >
                              {countInCart > 0 ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#007C7A]" />
                                  <span>Added ({countInCart})</span>
                                </>
                              ) : (
                                <span>Add</span>
                              )}
                            </button>

                            {/* Buy Button (Direct Checkout) */}
                            <button
                              type="button"
                              onClick={() => handleBuyNow(product)}
                              className="flex-1 bg-[#007C7A] hover:bg-[#006361] text-white py-2 rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer"
                            >
                              Buy
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        ) : (
          /* ================= PAGE 2: CHECKOUT / CART PAGE ================= */
          <div className="space-y-6">
            
            {/* Title block */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Checkout</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Secure payment & pharmacy validation engine</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('browse')}
                className="text-xs font-extrabold text-[#007C7A] hover:underline flex items-center gap-1"
              >
                ← Back to Browse Medicines
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="text-lg font-extrabold text-slate-800">Your shopping cart is empty</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">Add medicines from our list to configure discount combinations.</p>
                <button
                  type="button"
                  onClick={() => setActivePage('browse')}
                  className="mt-6 bg-[#007C7A] hover:bg-[#006361] text-white text-xs font-black px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all"
                >
                  Browse Medicines
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Order Items, Addresses, Patients, and Last Minute Buys */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* CARD 1: ORDER ITEMS */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase mb-4 flex items-center gap-2">
                      <span>Order Items</span>
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
                      </span>
                    </h3>

                    <div className="divide-y divide-slate-100">
                      {cart.map(item => {
                        const effectivePrice = getProductEffectivePrice(item.product);
                        const mrpPrice = getProductMRP(item.product);
                        const hasDiscount = mrpPrice > effectivePrice;

                        return (
                          <div key={item.product.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              {/* Miniature medicine illustration */}
                              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                <svg className="w-8 h-8" viewBox="0 0 100 100">
                                  <g transform="translate(50, 50) rotate(-45)">
                                    <rect x="-12" y="-22" width="24" height="22" fill="#007C7A" rx="12" />
                                    <rect x="-12" y="0" width="24" height="22" fill="#CBD5E1" rx="12" />
                                  </g>
                                </svg>
                              </div>

                              <div>
                                <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
                                  {item.product.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                  {item.product.brand && `By ${item.product.brand}`} • {item.product.form || 'Tablet'} • {item.product.packageType || 'Box'}
                                </p>
                                <p className="text-[10px] text-indigo-500 font-extrabold mt-1">
                                  strip of 10 capsules
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                              
                              {/* Quantity Adjuster */}
                              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">
                                <button
                                  type="button"
                                  onClick={() => handleDecreaseQuantity(item.product.id)}
                                  className="w-6 h-6 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors shadow-2xs border border-slate-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black text-slate-800 w-4 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(item.product)}
                                  className="w-6 h-6 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors shadow-2xs border border-slate-200"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Price summary */}
                              <div className="text-right min-w-24">
                                {hasDiscount ? (
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 line-through font-bold">
                                      ₹{(mrpPrice * item.quantity).toFixed(2)}
                                    </span>
                                    <span className="text-xs font-extrabold text-[#007C7A]">
                                      ₹{(effectivePrice * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-extrabold text-slate-800">
                                    ₹{(effectivePrice * item.quantity).toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {/* Trash can */}
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.product.id)}
                                className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* CARD 2: DELIVERING TO */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#007C7A]" />
                        <span>Delivering to</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(!showAddAddress)}
                        className="text-xs font-extrabold text-[#007C7A] hover:text-[#005a58] flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add New
                      </button>
                    </div>

                    {/* Inline Add Address Form */}
                    {showAddAddress && (
                      <form onSubmit={handleAddNewAddress} className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                          <span className="text-xs font-bold text-slate-700">Add Delivery Location</span>
                          <button type="button" onClick={() => setShowAddAddress(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <input 
                            type="text" 
                            placeholder="e.g. home, office"
                            value={newAddrLabel}
                            onChange={(e) => setNewAddrLabel(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-[#007C7A]"
                          />
                          <input 
                            type="text" 
                            placeholder="Full address details"
                            value={newAddrDetails}
                            onChange={(e) => setNewAddrDetails(e.target.value)}
                            className="col-span-2 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-[#007C7A]"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="bg-[#007C7A] text-white hover:bg-[#006361] font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors"
                        >
                          Save Address
                        </button>
                      </form>
                    )}

                    {/* Address List options */}
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <div 
                          key={addr.id} 
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`border p-3.5 rounded-xl cursor-pointer flex items-start justify-between gap-3 transition-all ${
                            selectedAddressId === addr.id 
                              ? 'border-[#007C7A] bg-teal-50/10' 
                              : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input 
                              type="radio" 
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 text-[#007C7A] focus:ring-[#007C7A]"
                            />
                            <div>
                              <span className="bg-[#EBF7F7] text-[#007C7A] text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-[#007C7A]/15">
                                {addr.label}
                              </span>
                              <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                                {addr.details}
                              </p>
                            </div>
                          </div>
                          <button type="button" className="text-slate-300 hover:text-[#007C7A] p-1">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* CARD 3: PATIENT PROFILES */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#007C7A]" />
                        <span>Patient</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddPatient(!showAddPatient)}
                        className="text-xs font-extrabold text-[#007C7A] hover:text-[#005a58] flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add New
                      </button>
                    </div>

                    {/* Inline Add Patient Form */}
                    {showAddPatient && (
                      <form onSubmit={handleAddNewPatient} className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                          <span className="text-xs font-bold text-slate-700">Add Patient Profile</span>
                          <button type="button" onClick={() => setShowAddPatient(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <input 
                            type="text" 
                            placeholder="Full Name"
                            value={newPatName}
                            onChange={(e) => setNewPatName(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-[#007C7A] col-span-2"
                          />
                          <input 
                            type="number" 
                            placeholder="Age"
                            value={newPatAge}
                            onChange={(e) => setNewPatAge(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-[#007C7A]"
                          />
                          <select 
                            value={newPatGender} 
                            onChange={(e: any) => setNewPatGender(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-[#007C7A]"
                          >
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <button 
                          type="submit"
                          className="bg-[#007C7A] text-white hover:bg-[#006361] font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors"
                        >
                          Save Profile
                        </button>
                      </form>
                    )}

                    {/* Patients List */}
                    <div className="space-y-3">
                      {patients.map(pat => (
                        <div 
                          key={pat.id} 
                          onClick={() => setSelectedPatientId(pat.id)}
                          className={`border p-3.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
                            selectedPatientId === pat.id 
                              ? 'border-[#007C7A] bg-teal-50/10' 
                              : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="radio" 
                              checked={selectedPatientId === pat.id}
                              onChange={() => setSelectedPatientId(pat.id)}
                              className="text-[#007C7A] focus:ring-[#007C7A]"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-800">{pat.name}</span>
                                <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  {pat.relation}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">
                                Age: {pat.age} yrs • {pat.gender}
                              </p>
                            </div>
                          </div>
                          <button type="button" className="text-slate-300 hover:text-[#007C7A] p-1">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* CARD 4: LAST MINUTE BUYS (UPSELL SUGGESTIONS) */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase">
                      Last minute buys
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                      Add more items before you checkout
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {lastMinuteBuys.map(product => {
                        const effectivePrice = getProductEffectivePrice(product);
                        const mrpPrice = getProductMRP(product);

                        return (
                          <div 
                            key={product.id}
                            className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="16" fill="#007C7A" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1 leading-tight max-w-44">
                                  {product.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
                                  ₹{effectivePrice.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              className="text-xs font-extrabold text-[#007C7A] hover:bg-[#EBF7F7] border border-[#007C7A]/25 px-3.5 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer"
                            >
                              + Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: BILL SUMMARY & APPLY COUPONS */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* CARD 1: BILL SUMMARY */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase border-b border-slate-100 pb-3 mb-4">
                      Bill Summary
                    </h3>

                    {smartFeeConfig && smartFeeConfig.weather === 'rainy' && (
                      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-medium">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                          <CloudLightning className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>Smart Fee Active ⛈️</span>
                        </div>
                        <p className="text-amber-800/95 leading-relaxed">
                          Rain alert detected in your delivery area.
                        </p>
                        
                        {/* Check waivers */}
                        {(() => {
                          const hasExemptionProduct = smartFeeConfig.exemptionProductId && cart.some(item => item.product.id === smartFeeConfig.exemptionProductId);
                          const isFreeDelivery = appliedCoupon?.discountType === 'free_delivery' || cartSubtotalPrice > 500;
                          
                          if (hasExemptionProduct) {
                            return (
                              <div className="mt-2 bg-emerald-50 border border-emerald-150 text-emerald-800 p-2 rounded-lg font-bold text-[10px]">
                                🎉 100% WAIVED: Exemption product in cart! Smart surcharges waived.
                              </div>
                            );
                          } else if (isFreeDelivery) {
                            return (
                              <div className="mt-2 bg-emerald-50 border border-emerald-150 text-emerald-800 p-2 rounded-lg font-bold text-[10px] space-y-1">
                                <div>🎁 Delivery Surcharge Waived!</div>
                                {smartFeeConfig.handlingSurcharge > 0 && (
                                  <div className="text-amber-800 font-medium font-sans">Handling Surcharge of ₹{smartFeeConfig.handlingSurcharge} is active. Add exemption product to waive all.</div>
                                )}
                              </div>
                            );
                          } else {
                            return (
                              <div className="mt-2 space-y-1">
                                <div className="text-slate-600 font-semibold text-[10px] pl-1">
                                  • Delivery surge: +₹{smartFeeConfig.deliverySurcharge}
                                  <br />
                                  • Smart handling: +₹{smartFeeConfig.handlingSurcharge}
                                </div>
                                <div className="mt-1.5 text-slate-500 text-[10px] leading-normal bg-white/60 p-1.5 rounded border border-amber-100">
                                  💡 <span className="font-bold text-indigo-600">Smart Wave-off Offer:</span> Add a Child Care/Baby Care product (exemption SKU) to waive both charges instantly!
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}

                    <div className="space-y-3.5 text-xs font-bold text-slate-500 mb-4 border-b border-slate-100 pb-4">
                      
                      {/* Item Total */}
                      <div className="flex items-center justify-between">
                        <span>Item total (MRP)</span>
                        <span className="text-slate-800 font-extrabold">₹{cartSubtotalMRP.toFixed(2)}</span>
                      </div>

                      {/* Store Shelf Discount */}
                      <div className="flex items-center justify-between text-emerald-600">
                        <span>Shelf Discount</span>
                        <span>-₹{shelfSavings.toFixed(2)}</span>
                      </div>

                      {/* Coupon Discount */}
                      {couponDiscountAmount > 0 && (
                        <div className="flex items-center justify-between text-[#007C7A]">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-[#007C7A]" />
                            Coupon Discount ({appliedCoupon?.code})
                          </span>
                          <span className="font-extrabold">-₹{couponDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Handling Charges */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          Handling Charge
                          <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full cursor-help" title="Fixed pharmacy packaging cost">?</span>
                        </span>
                        <span className="text-slate-800 font-extrabold">₹{handlingFee.toFixed(2)}</span>
                      </div>

                      {/* Delivery Charges */}
                      <div className="flex items-center justify-between">
                        <span>Delivery Charge</span>
                        {deliveryCharge === 0 ? (
                          <span className="text-emerald-600 font-extrabold uppercase text-[10px]">Free</span>
                        ) : (
                          <span className="text-slate-800 font-extrabold">₹{deliveryCharge.toFixed(2)}</span>
                        )}
                      </div>

                    </div>

                    {/* COUPON INPUT SANDBOX FIELD */}
                    <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                        Apply Coupon
                      </span>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-extrabold uppercase outline-hidden focus:border-[#007C7A] text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCouponCode(couponCodeInput)}
                          className="bg-[#007C7A] hover:bg-[#006361] text-white text-xs font-black px-4 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>

                      {/* Feedback messages */}
                      {couponError && (
                        <div className="flex items-start gap-1.5 text-[10px] text-red-600 font-bold mt-2 bg-red-50 p-1.5 rounded">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{couponError}</span>
                        </div>
                      )}
                      {couponSuccessMessage && (
                        <div className="flex items-start gap-1.5 text-[10px] text-emerald-700 font-bold mt-2 bg-emerald-50 p-1.5 rounded">
                          <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{couponSuccessMessage}</span>
                        </div>
                      )}

                      {/* List of active sandbox coupons in system */}
                      <div className="mt-3.5 border-t border-slate-200/50 pt-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                          Available Sandbox Coupons (Click to paste):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {coupons.filter(c => c.isActive).map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setCouponCodeInput(c.code);
                                handleApplyCouponCode(c.code);
                              }}
                              className={`text-[9px] font-extrabold px-2 py-1 rounded-md border transition-all ${
                                appliedCoupon?.code === c.code 
                                  ? 'bg-[#007C7A] text-white border-[#007C7A]' 
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#007C7A] hover:bg-slate-50'
                              }`}
                              title={c.description}
                            >
                              {c.code}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="flex items-baseline justify-between mb-4 mt-6">
                      <span className="text-sm font-black text-slate-800">Grand Total</span>
                      <span className="text-xl font-black text-slate-900">
                        ₹{finalGrandTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Savings Notification Alert */}
                    {totalOrderSavings > 0 && (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-xs font-bold text-center">
                        ⚡ Total savings of ₹{totalOrderSavings.toFixed(2)} on this order
                      </div>
                    )}

                  </div>

                  {/* CARD 2: PAYMENT METHOD */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase mb-3.5">
                      Payment Method
                    </h3>
                    
                    <div className="border border-slate-200 p-4 rounded-xl flex items-start gap-3 bg-slate-50">
                      <input 
                        type="radio" 
                        checked={true} 
                        readOnly 
                        className="mt-0.5 text-[#007C7A] focus:ring-[#007C7A]" 
                      />
                      <div>
                        <span className="text-xs font-black text-slate-800">Cash on Delivery</span>
                        <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ml-2 border border-emerald-100">
                          DEFAULT
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">
                          Pay cash or UPI scan at your doorstep upon medicine delivery. 
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* LARGE PLACE ORDER BUTTON */}
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    className="w-full bg-[#007C7A] hover:bg-[#006361] text-white py-4 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-teal-500/10"
                  >
                    <span>Place Order →</span>
                  </button>

                  <p className="text-[10px] text-slate-400 font-bold text-center mt-3">
                    🛡️ Secure 256-bit SSL encrypted connection • Dawa Healthcare Private Ltd
                  </p>

                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
        DAWA Customer Storefront • Powered by Antigravity Rule Engine
      </footer>

      {/* ================= ORDER SUCCESS CELEBRATION MODAL ================= */}
      {placedOrderDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up overflow-y-auto max-h-[90vh]">
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Order Placed Successfully!</h3>
              <p className="text-xs text-emerald-600 font-extrabold mt-1">Simulated validation in under 180ms</p>
              <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                ID: {placedOrderDetails.orderId} • {placedOrderDetails.timestamp}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3 mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 pb-1.5">
                Dispatch Summary
              </span>
              
              <div className="text-xs font-bold space-y-2 text-slate-600">
                <p>
                  <strong className="text-slate-800">Patient Profile:</strong> {placedOrderDetails.patient?.name} (Age: {placedOrderDetails.patient?.age} yrs)
                </p>
                <p>
                  <strong className="text-slate-800">Delivery Address:</strong> {placedOrderDetails.address?.details} ({placedOrderDetails.address?.label})
                </p>
                <p>
                  <strong className="text-slate-800">Total Items:</strong> {placedOrderDetails.items.length} meds
                </p>
                {placedOrderDetails.coupon && (
                  <p className="text-[#007C7A]">
                    <strong>Coupon Applied:</strong> {placedOrderDetails.coupon}
                  </p>
                )}
                <p className="text-emerald-700 text-sm mt-3 pt-3 border-t border-slate-200/40 font-extrabold">
                  Grand Total Paid: Rs. {placedOrderDetails.grandTotal.toFixed(2)}
                </p>
                <p className="text-emerald-600 font-extrabold text-[11px]">
                  💡 Total Sandbox Savings: Rs. {placedOrderDetails.savings.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-[11px] font-bold text-indigo-900 leading-relaxed">
                🚀 <strong>Ops Oracle Sync:</strong> This order has been synchronized with the simulated PostgreSQL datastore. The referral codes have been evaluated and user coupon usage counts have been updated.
              </div>

              <button
                type="button"
                onClick={handleCloseOrderModal}
                className="w-full bg-[#007C7A] hover:bg-[#006361] text-white py-3 rounded-xl font-black text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
