import React, { useState } from 'react';
import { 
  getStoredCoupons, 
  saveStoredCoupons, 
  getStoredUser, 
  saveStoredUser, 
  getStoredReferralProgram, 
  saveStoredReferralProgram,
  getStoredPromotions,
  saveStoredPromotions,
  getStoredPromotionUsages,
  saveStoredPromotionUsages,
  getStoredFlashSaleItems,
  saveStoredFlashSaleItems,
  getStoredFlashSaleTitle,
  saveStoredFlashSaleTitle,
  getStoredStoreIds,
  saveStoredStoreIds,
  getStoredSmartFeeConfig,
  saveStoredSmartFeeConfig,
  getStoredGiftRules,
  saveStoredGiftRules,
  INITIAL_PRODUCTS
} from './mockData';
import { Coupon, UserProfile, ReferralProgram, Promotion, PromotionUsage, FlashSaleItem } from './types';
import CouponCreator from './components/CouponCreator';
import CheckoutSimulator from './components/CheckoutSimulator';
import ReferralSystem from './components/ReferralSystem';
import { FlashSaleBulkEditor } from './components/FlashSaleBulkEditor';
import CustomerStorefront from './components/CustomerStorefront';
import { 
  ShoppingBag, 
  Tag, 
  Users, 
  Award, 
  HeartHandshake, 
  Sparkles, 
  RefreshCw,
  Clock,
  ExternalLink,
  Zap
} from 'lucide-react';

export default function App() {
  // Synchronized States
  const [coupons, setCoupons] = useState<Coupon[]>(() => getStoredCoupons());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getStoredUser());
  const [referralProg, setReferralProg] = useState<ReferralProgram>(() => getStoredReferralProgram());
  const [promotions, setPromotions] = useState<Promotion[]>(() => getStoredPromotions());
  const [promotionUsages, setPromotionUsages] = useState<PromotionUsage[]>(() => getStoredPromotionUsages());
  
  const [flashSaleItems, setFlashSaleItems] = useState<FlashSaleItem[]>(() => getStoredFlashSaleItems());
  const [flashSaleTitle, setFlashSaleTitle] = useState<string>(() => getStoredFlashSaleTitle());
  const [storeIds, setStoreIds] = useState<string>(() => getStoredStoreIds());

  const [smartFeeConfig, setSmartFeeConfig] = useState(() => getStoredSmartFeeConfig());
  const [giftRules, setGiftRules] = useState(() => getStoredGiftRules());

  // Navigation
  const [activeTab, setActiveTab] = useState<'creator' | 'referral' | 'flash'>('creator');
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>('customer');

  const handleUpdateSmartFeeConfig = (config: any) => {
    setSmartFeeConfig(config);
    saveStoredSmartFeeConfig(config);
  };

  const handleUpdateGiftRules = (rules: any) => {
    setGiftRules(rules);
    saveStoredGiftRules(rules);
  };

  // Helpers to update state and synchronize with LocalStorage
  const handleAddCoupon = (newCoupon: Coupon) => {
    const updated = [newCoupon, ...coupons];
    setCoupons(updated);
    saveStoredCoupons(updated);

    // Sync with PostgreSQL public.promotions table
    const newPromo: Promotion = {
      promotion_id: newCoupon.id,
      code: newCoupon.code,
      name: newCoupon.name,
      description: newCoupon.description,
      promo_type: newCoupon.promo_type || 'COUPON',
      discount_type: newCoupon.discountType === 'percentage' 
        ? 'PERCENT' 
        : newCoupon.discountType === 'flat' 
          ? 'FLAT' 
          : 'FREE_SHIPPING',
      discount_value: newCoupon.discountValue,
      max_discount_amount: newCoupon.maxDiscountCap,
      initial_credit: newCoupon.initial_credit,
      remaining_credit: newCoupon.remaining_credit,
      rule_conditions: [
        ...(newCoupon.rule_conditions || []),
        ...(newCoupon.brandRestriction ? [{
          target: 'product.brand' as const,
          operator: 'EQUALS' as const,
          value: newCoupon.brandRestriction
        }] : []),
        ...(newCoupon.productRestriction ? [{
          target: 'product.id' as const,
          operator: 'EQUALS' as const,
          value: newCoupon.productRestriction
        }] : [])
      ],
      usage_limit_global: 500,
      usage_limit_per_user: newCoupon.perUserLimit,
      used_count: 0,
      valid_from: newCoupon.startDate.includes('T') ? newCoupon.startDate : `${newCoupon.startDate}T00:00:00`,
      valid_to: newCoupon.endDate.includes('T') ? newCoupon.endDate : `${newCoupon.endDate}T23:59:59`,
      status_id: newCoupon.isActive ? 'ACT' : 'INA',
      is_active: newCoupon.isActive ? 1 : 0,
      is_delete: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_role: newCoupon.creatorRole,
      brandRestriction: newCoupon.brandRestriction,
      productRestriction: newCoupon.productRestriction
    };
    const updatedPromos = [newPromo, ...promotions];
    setPromotions(updatedPromos);
    saveStoredPromotions(updatedPromos);
  };

  const handleDeleteCoupon = (id: string) => {
    const updated = coupons.filter(c => c.id !== id);
    setCoupons(updated);
    saveStoredCoupons(updated);

    const updatedPromos = promotions.filter(p => p.promotion_id !== id);
    setPromotions(updatedPromos);
    saveStoredPromotions(updatedPromos);
  };

  const handleToggleActive = (id: string) => {
    const updated = coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    setCoupons(updated);
    saveStoredCoupons(updated);

    const updatedPromos = promotions.map(p => 
      p.promotion_id === id 
        ? { ...p, status_id: p.status_id === 'ACT' ? 'INA' : 'ACT', is_active: p.is_active === 1 ? 0 : 1 as 0 | 1 } 
        : p
    );
    setPromotions(updatedPromos);
    saveStoredPromotions(updatedPromos);
  };

  const handleUpdateUserProfile = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    saveStoredUser(updatedProfile);
  };

  const handleUpdateReferralProgram = (updatedProg: ReferralProgram) => {
    setReferralProg(updatedProg);
    saveStoredReferralProgram(updatedProg);
  };

  // Triggers when customer finishes the checkout form
  const handleOrderPlaced = (couponCode?: string, discountAmount?: number) => {
    let updatedCoupons = [...coupons];
    let updatedProfile = { ...userProfile };

    // 1. Increment previous orders count
    updatedProfile.previousOrdersCount += 1;

    // 2. Increment coupon usage limits
    if (couponCode) {
      updatedCoupons = coupons.map(c => {
        if (c.code === couponCode) {
          return { ...c, usageCount: c.usageCount + 1 };
        }
        return c;
      });

      const currentUsages = updatedProfile.usedCoupons[couponCode] || 0;
      updatedProfile.usedCoupons = {
        ...updatedProfile.usedCoupons,
        [couponCode]: currentUsages + 1
      };
    }

    // 3. Save states
    setCoupons(updatedCoupons);
    saveStoredCoupons(updatedCoupons);
    handleUpdateUserProfile(updatedProfile);
  };

  const handleSaveFlashSale = (title: string, stores: string, items: FlashSaleItem[]) => {
    setFlashSaleTitle(title);
    setStoreIds(stores);
    setFlashSaleItems(items);
    saveStoredFlashSaleTitle(title);
    saveStoredStoreIds(stores);
    saveStoredFlashSaleItems(items);
  };

  const handleResetFlashSale = () => {
    localStorage.removeItem('dawa_coupon_hub_flash_items');
    localStorage.removeItem('dawa_coupon_hub_flash_title');
    localStorage.removeItem('dawa_coupon_hub_flash_stores');
    window.location.reload();
  };

  // Reset demo state back to default values
  const handleResetDemoData = () => {
    if (confirm('Are you sure you want to reset all coupon rules, user profiles, and referrals back to defaults?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (viewMode === 'customer') {
    return (
      <CustomerStorefront
        products={INITIAL_PRODUCTS}
        coupons={coupons}
        flashSaleItems={flashSaleItems}
        flashSaleTitle={flashSaleTitle}
        onGoToDashboard={() => setViewMode('admin')}
        userProfile={userProfile}
        onUpdateUserProfile={handleUpdateUserProfile}
        promotions={promotions}
        setPromotions={setPromotions}
        promotionUsages={promotionUsages}
        setPromotionUsages={setPromotionUsages}
        onOrderPlaced={handleOrderPlaced}
        smartFeeConfig={smartFeeConfig}
        giftRules={giftRules}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-950 font-sans flex flex-col antialiased">
      
      {/* 1. BRAND HEADER & NAVIGATION RAIL */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
            
            {/* Pharmacy Logo & Branding */}
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-200">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Ops Oracle</h1>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                    Admin Panel
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Coupon rules, validation sandbox & referral rewards panel</p>
              </div>
            </div>

            {/* Dashboard Tabs & Action list */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Go to Customer Website Button */}
              <button
                type="button"
                onClick={() => setViewMode('customer')}
                className="bg-[#007C7A] hover:bg-[#006361] text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-teal-500/10 animate-pulse"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Go to Customer Website</span>
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => setActiveTab('creator')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'creator'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                Coupon Creator
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('referral')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'referral'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Referral Portal
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('flash')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'flash'
                    ? 'bg-[#5B50BC] text-white shadow-sm'
                    : 'bg-white text-[#483EA2] border border-indigo-200 hover:bg-indigo-50/40'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Flash Sale Editor
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={handleResetDemoData}
                className="bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                title="Reset All Simulated Data to Defaults"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic Context Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 mb-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Live Sandboxed Environment
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === 'creator' && 'Coupon & Promo Campaign Manager'}
              {activeTab === 'referral' && 'Refer-a-Friend Rewards System'}
              {activeTab === 'flash' && 'Ops Oracle: Flash Sale Bulk Editor'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {activeTab === 'creator' && 'Configure custom coupons, wallets, smart weather-based fee rules, and auto-add gift policies.'}
              {activeTab === 'referral' && 'Simulate inviting friends, view reward pipeline stages, adjust referral prize amounts using live slider variables.'}
              {activeTab === 'flash' && 'Manage drug/product flash campaigns, change store group targets, upload CSV catalog files, and update live promotion percentages.'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-xs text-xs">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="leading-tight text-[11px]">
              <p className="font-semibold text-slate-700">Simulated Location: <span className="text-emerald-700 font-bold">{userProfile.location}</span></p>
              <p className="text-slate-500 mt-0.5">Platform: <span className="font-semibold text-slate-700 uppercase">{userProfile.device}</span> • Completed Orders: <span className="font-bold text-slate-800">{userProfile.previousOrdersCount}</span></p>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Workspace View */}
        <div className="animate-fade-in">
          {activeTab === 'creator' && (
            <CouponCreator
              coupons={coupons}
              onAddCoupon={handleAddCoupon}
              onDeleteCoupon={handleDeleteCoupon}
              onToggleActive={handleToggleActive}
              smartFeeConfig={smartFeeConfig}
              onUpdateSmartFeeConfig={handleUpdateSmartFeeConfig}
              giftRules={giftRules}
              onUpdateGiftRules={handleUpdateGiftRules}
            />
          )}

          {activeTab === 'referral' && (
            <ReferralSystem
              referralProg={referralProg}
              onChangeReferralProgram={handleUpdateReferralProgram}
            />
          )}

          {activeTab === 'flash' && (
            <FlashSaleBulkEditor
              flashSaleItems={flashSaleItems}
              flashSaleTitle={flashSaleTitle}
              storeIds={storeIds}
              onSaveFlashSale={handleSaveFlashSale}
              onResetFlashSale={handleResetFlashSale}
            />
          )}
        </div>
      </main>

      {/* 3. COMPLIANT ACCENT FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-slate-300" />
            <span>© 2026 Dawa Medical E-Commerce. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Compliance Validator Connected
            </span>
            <span className="h-4 w-px bg-slate-200" />
            <span>FDA & Schedule H Regulatory Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
