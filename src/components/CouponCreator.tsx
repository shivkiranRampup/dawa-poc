import React, { useState } from 'react';
import { Coupon, Product, SmartFeeConfig, GiftRule, GiftCatalogItem } from '../types';
import { INITIAL_PRODUCTS } from '../mockData';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Tag, 
  Shield, 
  Info, 
  Check, 
  X, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  ShoppingBag, 
  Smartphone, 
  Users, 
  Layers,
  Sparkles,
  Lock,
  ChevronDown,
  Edit,
  ExternalLink,
  Eye,
  Settings,
  PlusCircle,
  FolderOpen,
  Power,
  Image,
  Link,
  CloudLightning,
  Gift,
  Search
} from 'lucide-react';

const IMAGE_PRESETS = [
  { name: 'Blood Pressure Monitor', url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400' },
  { name: 'Crepe Bandage', url: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=400' },
  { name: 'Pill Bottle / Supplements', url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400' },
  { name: 'Glucose Meter', url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=400' },
  { name: 'Baby Lotion & Care', url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=400' },
  { name: 'Vitamins & Health', url: 'https://images.unsplash.com/photo-1616671276441-2f2c277b8bf4?auto=format&fit=crop&q=80&w=400' }
];

interface CouponCreatorProps {
  coupons: Coupon[];
  onAddCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (id: string) => void;
  onToggleActive: (id: string) => void;
  smartFeeConfig: SmartFeeConfig;
  onUpdateSmartFeeConfig: (config: SmartFeeConfig) => void;
  giftRules: GiftRule[];
  onUpdateGiftRules: (rules: GiftRule[]) => void;
  giftCatalog: GiftCatalogItem[];
  onUpdateGiftCatalog: (rows: GiftCatalogItem[]) => void;
}

export default function CouponCreator({
  coupons,
  onAddCoupon,
  onDeleteCoupon,
  onToggleActive,
  smartFeeConfig,
  onUpdateSmartFeeConfig,
  giftRules,
  onUpdateGiftRules,
  giftCatalog,
  onUpdateGiftCatalog
}: CouponCreatorProps) {
  // Navigation & Toggle states for Smart Admin Workspace
  const [activeSubSection, setActiveSubSection] = useState<'coupons' | 'smart_fees' | 'gift_rules' | 'gift_catalog'>('coupons');

  // Available gift products = only those mapped & active in the catalog
  const availableGiftCatalog = giftCatalog.filter(g => g.is_available === 1);
  const giftCatalogProducts = availableGiftCatalog
    .map(g => ({ catalog: g, product: INITIAL_PRODUCTS.find(p => p.id === g.product_id) }))
    .filter((x): x is { catalog: GiftCatalogItem; product: Product } => !!x.product);

  // Gift catalog form
  const [catalogProductId, setCatalogProductId] = useState('');
  const [catalogDisplayName, setCatalogDisplayName] = useState('');

  // Coupon registry filters (dashboard display)
  const [registryStatus, setRegistryStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [registrySearch, setRegistrySearch] = useState('');

  const registryCounts = {
    total: coupons.length,
    active: coupons.filter(c => c.isActive && new Date() <= new Date(c.endDate)).length,
    disabled: coupons.filter(c => !c.isActive).length,
    expired: coupons.filter(c => new Date() > new Date(c.endDate)).length
  };

  const filteredCoupons = coupons.filter((c) => {
    const expired = new Date() > new Date(c.endDate);
    if (registryStatus === 'active' && (!c.isActive || expired)) return false;
    if (registryStatus === 'inactive' && c.isActive) return false;
    if (registryStatus === 'expired' && !expired) return false;
    const q = registrySearch.trim().toLowerCase();
    if (q && !(c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))) return false;
    return true;
  });

  // Creator Role state
  const [creatorRole, setCreatorRole] = useState<'Admin' | 'Marketing Manager' | 'Partner'>('Admin');
  
  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat' | 'free_delivery'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [maxDiscountCap, setMaxDiscountCap] = useState<number | ''>('');
  const [minCartValue, setMinCartValue] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('2026-06-30T00:00');
  const [endDate, setEndDate] = useState('2026-12-31T23:59');
  const [isStackable, setIsStackable] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [minPreviousOrders, setMinPreviousOrders] = useState<number | ''>('');
  const [perUserLimit, setPerUserLimit] = useState<number | ''>(1);
  const [brandRestriction, setBrandRestriction] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [productRestriction, setProductRestriction] = useState('');

  // Professional coupon fields
  const [points, setPoints] = useState<number | ''>(1290);
  const [linkWeatherToSimulation, setLinkWeatherToSimulation] = useState<boolean>(false);
  const [storeGroupId, setStoreGroupId] = useState<number | ''>(1);
  const [drugId, setDrugId] = useState<string>('');
  const [priority, setPriority] = useState<number | ''>(3);
  const [campaignUrl, setCampaignUrl] = useState<string>('https://dawa-website--scratchapp-fee1f.asia-southeast1.hosted.app/');
  const [weatherRestriction, setWeatherRestriction] = useState<'sunny' | 'rainy' | ''>('');
  const [selectedPresetImage, setSelectedPresetImage] = useState<string>(IMAGE_PRESETS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [imageType, setImageType] = useState<'preset' | 'custom' | 'upload'>('preset');

  // Smart Fee Form States (initialized from current config)
  const [smartFeeWeather, setSmartFeeWeather] = useState<'sunny' | 'rainy'>(smartFeeConfig.weather);
  const [smartFeeDelivery, setSmartFeeDelivery] = useState<number>(smartFeeConfig.deliverySurcharge);
  const [smartFeeHandling, setSmartFeeHandling] = useState<number>(smartFeeConfig.handlingSurcharge);
  const [smartFeeExemptionId, setSmartFeeExemptionId] = useState<string>(smartFeeConfig.exemptionProductId);

  // Gift Rule Form States
  const [newGiftRuleName, setNewGiftRuleName] = useState('');
  const [newGiftRuleMinCart, setNewGiftRuleMinCart] = useState<number | ''>('');
  const [newGiftRuleMinOrders, setNewGiftRuleMinOrders] = useState<number | ''>('');
  const [newGiftRuleCategory, setNewGiftRuleCategory] = useState('Child Care');
  const [newGiftRuleProductId, setNewGiftRuleProductId] = useState('PROD_TOY_GIFT');
  const [newGiftRuleMinCategoryValue, setNewGiftRuleMinCategoryValue] = useState<number | ''>('');
  const [newGiftRuleRequiredProductId, setNewGiftRuleRequiredProductId] = useState<string>('');
  const [newGiftRuleRequiredProductQty, setNewGiftRuleRequiredProductQty] = useState<number | ''>('');
  const [newGiftRuleOncePerUser, setNewGiftRuleOncePerUser] = useState<boolean>(false);
  const [selectedTriggerTypes, setSelectedTriggerTypes] = useState<string[]>(['min_cart']); // default with min cart

  // Collapsible view state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Validation feedback
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMsg, setSuccessMsg] = useState('');


  // Category & location lists
  const ALL_CATEGORIES = ['Vitamins & Supplements', 'Diabetes Care', 'Personal Care & Hygiene'];
  const ALL_LOCATIONS = ['Mumbai', 'Pune', 'Delhi', 'Bangalore'];

  // Role limits check
  const checkRoleConstraints = (field: string, val: any): string => {
    if (creatorRole === 'Marketing Manager') {
      if (field === 'discountValue' && discountType === 'percentage' && val > 50) {
        return 'Marketing Managers are restricted to a max of 50% discount.';
      }
      if (field === 'discountValue' && discountType === 'flat' && val > 500) {
        return 'Marketing Managers are restricted to a max flat discount of Rs 500.';
      }
    }
    if (creatorRole === 'Partner') {
      if (field === 'discountValue' && discountType === 'percentage' && val > 25) {
        return 'Partner Pharmacies are restricted to a max of 25% discount.';
      }
      if (field === 'discountValue' && discountType === 'flat' && val > 300) {
        return 'Partner Pharmacies are restricted to a max flat discount of Rs 300.';
      }
      if (field === 'categories' && val.length === 0) {
        return 'Partner Pharmacies must select at least one specific Category (no global codes).';
      }
    }
    return '';
  };

  const handleCategoryToggle = (category: string) => {
    let updated: string[];
    if (selectedCategories.includes(category)) {
      updated = selectedCategories.filter(c => c !== category);
    } else {
      updated = [...selectedCategories, category];
    }
    setSelectedCategories(updated);
    
    // Clear errors if resolved
    const catErr = checkRoleConstraints('categories', updated);
    if (!catErr) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.categories;
        return copy;
      });
    }
  };

  const handleLocationToggle = (loc: string) => {
    if (selectedLocations.includes(loc)) {
      setSelectedLocations(selectedLocations.filter(l => l !== loc));
    } else {
      setSelectedLocations([...selectedLocations, loc]);
    }
  };

  const handleDeviceToggle = (device: string) => {
    if (selectedDevices.includes(device)) {
      setSelectedDevices(selectedDevices.filter(d => d !== device));
    } else {
      setSelectedDevices([...selectedDevices, device]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!code.trim()) {
      newErrors.code = 'Coupon code is required.';
    } else if (!/^[A-Z0-9_-]+$/i.test(code)) {
      newErrors.code = 'Code must be alphanumeric (A-Z, 0-9, dashes).';
    } else if (coupons.some(c => c.code.toUpperCase() === code.trim().toUpperCase())) {
      newErrors.code = 'This coupon code already exists.';
    }

    if (!name.trim()) {
      newErrors.name = 'Campaign name is required.';
    }

    if (discountType !== 'free_delivery') {
      if (discountValue === '' || Number(discountValue) <= 0) {
        newErrors.discountValue = 'Please enter a positive discount value.';
      } else {
        const constraint = checkRoleConstraints('discountValue', Number(discountValue));
        if (constraint) {
          newErrors.discountValue = constraint;
        }
      }
    }

    if (discountType === 'percentage' && maxDiscountCap !== '' && Number(maxDiscountCap) <= 0) {
      newErrors.maxDiscountCap = 'Cap must be a positive number.';
    }

    if (minCartValue !== '' && Number(minCartValue) < 0) {
      newErrors.minCartValue = 'Minimum cart value cannot be negative.';
    }

    if (new Date(startDate) >= new Date(endDate)) {
      newErrors.dates = 'End date must be after start date.';
    }

    if (perUserLimit !== '' && Number(perUserLimit) < 1) {
      newErrors.perUserLimit = 'Usage limit per user must be at least 1.';
    }

    if (minPreviousOrders !== '' && Number(minPreviousOrders) < 0) {
      newErrors.minPreviousOrders = 'Previous order count cannot be negative.';
    }

    const catErr = checkRoleConstraints('categories', selectedCategories);
    if (catErr) {
      newErrors.categories = catErr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  React.useEffect(() => {
    if (linkWeatherToSimulation) {
      setWeatherRestriction(smartFeeWeather);
    }
  }, [linkWeatherToSimulation, smartFeeWeather]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const defaultDesc = discountType === 'free_delivery' 
      ? 'FREE Delivery on order.' 
      : `${discountType === 'flat' ? 'Rs' : ''}${discountValue}${discountType === 'percentage' ? '%' : ''} off campaign.`;

    const finalBrand = brandRestriction === 'CUSTOM' ? customBrand.trim() : brandRestriction.trim();

    const newCoupon: Coupon = {
      id: Math.random().toString(36).substr(2, 9),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || defaultDesc,
      discountType,
      discountValue: discountType === 'free_delivery' ? 0 : Number(discountValue),
      maxDiscountCap: discountType === 'percentage' && maxDiscountCap !== '' ? Number(maxDiscountCap) : undefined,
      minCartValue: minCartValue !== '' ? Number(minCartValue) : 0,
      startDate,
      endDate,
      isStackable,
      categoryRestrictions: selectedCategories,
      locationRestrictions: selectedLocations,
      deviceRestrictions: selectedDevices as ('web' | 'app')[],
      minPreviousOrders: minPreviousOrders !== '' ? Number(minPreviousOrders) : 0,
      perUserLimit: perUserLimit !== '' ? Number(perUserLimit) : 1,
      creatorRole,
      usageCount: 0,
      isActive: true,
      brandRestriction: finalBrand || undefined,
      productRestriction: productRestriction || undefined,
      points: points !== '' ? Number(points) : undefined,
      storeGroupId: storeGroupId !== '' ? Number(storeGroupId) : undefined,
      drugId: drugId.trim() || undefined,
      priority: priority !== '' ? Number(priority) : undefined,
      campaignUrl:
        campaignUrl.trim() ||
        'https://dawa-website--scratchapp-fee1f.asia-southeast1.hosted.app/',
      imageUrl: imageType === 'custom' ? customImageUrl.trim() : (imageType === 'upload' ? uploadedImageUrl : selectedPresetImage),
      promo_type: 'COUPON',
      weatherRestriction: weatherRestriction || undefined
    };

    onAddCoupon(newCoupon);
    
    // Reset form
    setCode('');
    setName('');
    setDescription('');
    setDiscountValue('');
    setMaxDiscountCap('');
    setMinCartValue('');
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedDevices([]);
    setMinPreviousOrders('');
    setPerUserLimit(1);
    setIsStackable(false);
    setBrandRestriction('');
    setCustomBrand('');
    setProductRestriction('');
    setPoints(1290);
    setStoreGroupId(1);
    setDrugId('');
    setPriority(3);
    setCampaignUrl('https://dawa-website--scratchapp-fee1f.asia-southeast1.hosted.app/');
    setSelectedPresetImage(IMAGE_PRESETS[0].url);
    setCustomImageUrl('');
    setUploadedImageUrl('');
    setImageType('preset');
    setIsFormOpen(false);
    setErrors({});
    
    setSuccessMsg(`Successfully created coupon ${newCoupon.code}!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div id="coupon-creator-workspace" className="space-y-8 animate-fade-in">
      {/* Top Controller Toggle Bar with switcher */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Admin Workspace
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              v1.4.0-Production
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Coupon Management Engine</h2>
          <p className="text-xs text-slate-400">
            Create, restrict, and publish professional campaign vouchers with live rule validation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
            isFormOpen 
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
          }`}
        >
          {isFormOpen ? (
            <>
              <X className="w-4 h-4 shrink-0" />
              Close Creator Console
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4 shrink-0" />
              Launch Coupon Creator
            </>
          )}
        </button>
      </div>

      {/* Subsection Tab Switcher (Coupons, Gift Rules) */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto scrollbar-none pb-px bg-white/50 p-1.5 rounded-xl border border-slate-150">
        <button
          type="button"
          onClick={() => setActiveSubSection('coupons')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeSubSection === 'coupons'
              ? 'bg-[#007C7A] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Promo Registry & Creator
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('gift_rules')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeSubSection === 'gift_rules'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-indigo-50/50'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          Buy X Get Y (BXGY) Rules
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('gift_catalog')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeSubSection === 'gift_catalog'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-amber-50/50'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Gift Product Catalog
        </button>
      </div>

      {/* COLLAPSIBLE FORM CONSOLE */}
      <AnimatePresence initial={false}>
        {activeSubSection === 'coupons' && isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/85 overflow-hidden">
              {/* Creator Role Tabs */}
              <div className="bg-slate-50 border-b border-slate-100 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      Coupon Creation Authority Access Level
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Different roles have distinct authorization rules and discount caps.</p>
                  </div>
                  <span className="inline-flex rounded-lg p-1 bg-slate-200/60 self-start sm:self-auto">
                    {(['Admin', 'Marketing Manager', 'Partner'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setCreatorRole(role);
                          setErrors({});
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          creatorRole === role 
                            ? 'bg-white text-emerald-600 shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {role === 'Partner' ? 'Partner Pharmacy' : role}
                      </button>
                    ))}
                  </span>
                </div>

                {/* Role Constraints Notice */}
                <div className="mt-3 bg-emerald-50/50 border border-emerald-100/60 rounded-lg p-3 text-xs text-emerald-800 flex gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    {creatorRole === 'Admin' && (
                      <span><strong>Admin access:</strong> Full coupon creation capabilities. No capping on discount rates or required targets. Supports global and stackable coupons.</span>
                    )}
                    {creatorRole === 'Marketing Manager' && (
                      <span><strong>Marketing Manager restrictions:</strong> Discounts capped at max 50% or Rs 500 flat. Perfect for standard promotional campaigns.</span>
                    )}
                    {creatorRole === 'Partner' && (
                      <span><strong>Partner Pharmacy restrictions:</strong> Discounts capped at max 25% or Rs 300 flat. MUST specify at least one niche category restriction (Vitamins or Diabetes or Personal Care).</span>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Coupon Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Coupon Code</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="E.G. METRO100"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-[#007C7A] focus:outline-none transition-colors ${
                          errors.code ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {errors.code && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.code}</p>}
                  </div>

                  {/* Campaign Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Campaign Name</label>
                    <input
                      type="text"
                      placeholder="E.G. Monsoon Health Booster"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-[#007C7A] focus:outline-none transition-colors ${
                        errors.name ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Campaign Description</label>
                  <textarea
                    placeholder="Provide a description explaining the terms of the coupon (will be visible to customers at checkout)."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007C7A] focus:outline-none transition-colors"
                  />
                </div>

                {/* Discount Settings */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Discount Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5">Value Type</label>
                      <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType('percentage');
                            setDiscountValue('');
                          }}
                          className={`flex-1 py-2 text-xs font-medium transition-colors ${
                            discountType === 'percentage' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Percentage (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType('flat');
                            setDiscountValue('');
                          }}
                          className={`flex-1 py-2 text-xs font-medium transition-colors ${
                            discountType === 'flat' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Flat (Rs)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType('free_delivery');
                            setDiscountValue('');
                          }}
                          className={`flex-1 py-2 text-xs font-medium transition-colors ${
                            discountType === 'free_delivery' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Free Delivery
                        </button>
                      </div>
                    </div>

                    <div>
                      {discountType === 'free_delivery' ? (
                        <div className="opacity-75 select-none">
                          <label className="block text-xs text-slate-600 mb-1.5">Discount Value (Rs)</label>
                          <div className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-lg font-medium">
                            Waives Delivery Fee (Rs 49)
                          </div>
                        </div>
                      ) : (
                        <>
                          <label className="block text-xs text-slate-600 mb-1.5">
                            {`Discount Value ${discountType === 'percentage' ? '(%)' : '(Rs)'}`}
                          </label>
                          <input
                            type="number"
                            placeholder={discountType === 'percentage' ? 'E.G. 20' : 'E.G. 150'}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-[#007C7A] focus:outline-none transition-colors bg-white ${
                              errors.discountValue ? 'border-red-400 bg-red-50/10' : 'border-slate-200'
                            }`}
                          />
                          {errors.discountValue && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 leading-tight"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.discountValue}</p>}
                        </>
                      )}
                    </div>

                    {discountType === 'percentage' ? (
                      <div>
                        <label className="block text-xs text-slate-600 mb-1.5">Max Cap (Rs)</label>
                        <input
                          type="number"
                          placeholder="E.G. 250 (Optional)"
                          value={maxDiscountCap}
                          onChange={(e) => setMaxDiscountCap(e.target.value === '' ? '' : Number(e.target.value))}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-[#007C7A] focus:outline-none bg-white transition-colors ${
                            errors.maxDiscountCap ? 'border-red-400' : 'border-slate-200'
                          }`}
                        />
                        {errors.maxDiscountCap && <p className="text-red-500 text-xs mt-1.5"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.maxDiscountCap}</p>}
                      </div>
                    ) : (
                      <div className="opacity-50 select-none cursor-not-allowed">
                        <label className="block text-xs text-slate-600 mb-1.5">Max Cap (Rs)</label>
                        <div className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 text-slate-400 rounded-lg">
                          Not applicable
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation & Exclusions (Anti-Fraud & Limits) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Advanced Anti-Abuse & Checkout Rules
                  </h4>

                  {/* Threshold & Order limits */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        Min Cart Value (Rs)
                      </label>
                      <input
                        type="number"
                        placeholder="E.G. 799"
                        value={minCartValue}
                        onChange={(e) => setMinCartValue(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007C7A] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Loyal User Access
                      </label>
                      <input
                        type="number"
                        placeholder="Min previous orders"
                        value={minPreviousOrders}
                        onChange={(e) => setMinPreviousOrders(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007C7A] bg-white"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Requires user to have at least X completed orders.</p>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Per-User Usage Limit
                      </label>
                      <input
                        type="number"
                        placeholder="Max times per user"
                        value={perUserLimit}
                        onChange={(e) => setPerUserLimit(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007C7A] bg-white"
                      />
                    </div>
                  </div>

                  {/* Date validation windows */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Active From (Date + Time)
                      </label>
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007C7A] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Expires At (Date + Time)
                      </label>
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-[#007C7A] bg-white ${
                          errors.dates ? 'border-red-400' : 'border-slate-200'
                        }`}
                      />
                      {errors.dates && <p className="text-red-500 text-xs mt-1">{errors.dates}</p>}
                    </div>
                  </div>

                  {/* Location & Device restrictions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Geographic Location Restrictions
                      </label>
                      <div className="flex flex-wrap gap-2 p-2.5 border border-slate-200 rounded-lg bg-white">
                        {ALL_LOCATIONS.map(loc => {
                          const active = selectedLocations.includes(loc);
                          return (
                            <button
                              type="button"
                              key={loc}
                              onClick={() => handleLocationToggle(loc)}
                              className={`px-2 py-1 text-xs font-medium rounded-md border transition-all flex items-center gap-1 ${
                                active 
                                  ? 'bg-[#007C7A]/10 text-[#007C7A] border-[#007C7A]/30' 
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {active ? <Check className="w-3 h-3 text-[#007C7A]" /> : null}
                              {loc}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">If none selected, coupon is valid nationwide.</p>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        Platform/Device Restrictions
                      </label>
                      <div className="flex gap-3 p-2 border border-slate-200 rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => handleDeviceToggle('web')}
                          className={`flex-1 py-1 px-2.5 text-xs font-medium rounded-md border transition-all flex items-center justify-center gap-1 ${
                            selectedDevices.includes('web')
                              ? 'bg-[#007C7A]/10 text-[#007C7A] border-[#007C7A]/30'
                              : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          {selectedDevices.includes('web') && <Check className="w-3 h-3 text-[#007C7A]" />}
                          Website
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeviceToggle('app')}
                          className={`flex-1 py-1 px-2.5 text-xs font-medium rounded-md border transition-all flex items-center justify-center gap-1 ${
                            selectedDevices.includes('app')
                              ? 'bg-[#007C7A]/10 text-[#007C7A] border-[#007C7A]/30'
                              : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          {selectedDevices.includes('app') && <Check className="w-3 h-3 text-[#007C7A]" />}
                          Mobile App
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Select platforms to restrict use.</p>
                    </div>
                  </div>

                  {/* Category, Brand, Product Restrictions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Category Specific Restrictions Dropdown
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white flex items-center justify-between hover:border-slate-300 text-left cursor-pointer transition-colors"
                      >
                        <span className="truncate text-slate-700 font-semibold">
                          {selectedCategories.length === 0 
                            ? 'No Restrictions (All OTC Categories)' 
                            : selectedCategories.join(', ')}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>

                      {showCategoryDropdown && (
                        <div className="absolute left-0 right-0 mt-1.5 p-2.5 border border-slate-200 rounded-lg bg-white shadow-lg z-10 space-y-1 max-h-60 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategories([]);
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-50 font-bold text-emerald-600 flex items-center justify-between"
                          >
                            <span>No Restriction (Global Discount)</span>
                            {selectedCategories.length === 0 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                          <div className="border-t border-slate-100 my-1"></div>
                          {ALL_CATEGORIES.map(cat => {
                            const active = selectedCategories.includes(cat);
                            return (
                              <button
                                type="button"
                                key={cat}
                                onClick={() => {
                                  handleCategoryToggle(cat);
                                }}
                                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-50 text-slate-700 flex items-center justify-between transition-colors font-medium"
                              >
                                <span>{cat}</span>
                                {active && <Check className="w-3.5 h-3.5 text-[#007C7A]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {errors.categories && <p className="text-red-500 text-xs mt-1.5"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.categories}</p>}
                      
                      <div className="mt-2 pt-1.5 text-[10px] text-red-500 flex gap-1 items-start leading-normal">
                        <Lock className="w-3 h-3 shrink-0 mt-0.5" />
                        <span><strong>Compliance block:</strong> Prescription Medicines (Rx) and Schedule H items are hard-coded as non-discountable. They will be ignored during calculations.</span>
                      </div>

                      {/* Brand restriction */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          Brand Restriction (Optional)
                        </label>
                        <select
                          value={brandRestriction}
                          onChange={(e) => {
                            setBrandRestriction(e.target.value);
                            if (e.target.value !== 'CUSTOM') {
                              setCustomBrand('');
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-[#007C7A] text-slate-700 focus:outline-none transition-colors cursor-pointer font-medium"
                        >
                          <option value="">No Brand Restriction (All Brands)</option>
                          <option value="GSK">GSK (GlaxoSmithKline)</option>
                          <option value="USV">USV</option>
                          <option value="Himalaya">Himalaya Wellness</option>
                          <option value="Reckitt">Reckitt Benckiser (Dettol)</option>
                          <option value="Roche">Roche (Accu-Chek)</option>
                          <option value="TrueBasics">TrueBasics</option>
                          <option value="3M">3M Healthcare</option>
                          <option value="CUSTOM">-- Custom Brand Name --</option>
                        </select>

                        {(brandRestriction === 'CUSTOM' || (!['', 'GSK', 'USV', 'Himalaya', 'Reckitt', 'Roche', 'TrueBasics', '3M'].includes(brandRestriction) && brandRestriction !== '')) && (
                          <div className="mt-2.5 animate-fade-in">
                            <input
                              type="text"
                              placeholder="Enter custom brand name (e.g. Himalaya)"
                              value={customBrand}
                              onChange={(e) => setCustomBrand(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007C7A] text-slate-700 focus:outline-none bg-white font-medium"
                            />
                          </div>
                        )}
                      </div>

                      {/* Product Specific Restriction */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          Product / Drug Restriction (Optional)
                        </label>
                        <select
                          value={productRestriction}
                          onChange={(e) => setProductRestriction(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-[#007C7A] text-slate-700 focus:outline-none transition-colors cursor-pointer font-semibold"
                        >
                          <option value="">No Product Restriction (All Eligible Products)</option>
                          {INITIAL_PRODUCTS.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} ({prod.brand || 'No Brand'}) - Rs {prod.price} {prod.isRx ? ' [Rx Medicine]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      {/* Combining strategy */}
                      <div>
                        <label className="block text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          Coupon Combining Strategy
                        </label>
                        <div className="p-3 border border-slate-200 rounded-lg bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-700">Allow Stacking</span>
                              <p className="text-[10px] text-slate-400">Can combine with other stackable coupons</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isStackable}
                                onChange={(e) => setIsStackable(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#007C7A]"></div>
                            </label>
                          </div>
                        </div>
                      </div>


                      {/* Campaign Presentation & Custom Media Settings inside Form */}
                      <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#007C7A]" />
                          Campaign Presentation (UI Matcher)
                        </h4>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                            <Link className="w-3.5 h-3.5 text-slate-400" />
                            Campaign Launch URL
                          </label>
                          <input
                            type="url"
                            placeholder="e.g. https://rewards.zeno.health/s/custom-code"
                            value={campaignUrl}
                            onChange={(e) => setCampaignUrl(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>

                        {/* Image Selection with Upload Option */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                              <Image className="w-3.5 h-3.5 text-slate-400" />
                              Product Image Preview
                            </span>
                            <select
                              value={imageType}
                              onChange={(e) => setImageType(e.target.value as 'preset' | 'custom' | 'upload')}
                              className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1 cursor-pointer shadow-sm hover:border-slate-400 transition-colors"
                            >
                              <option value="preset">Use Presets</option>
                              <option value="custom">Custom URL</option>
                              <option value="upload">Upload Photo</option>
                            </select>
                          </div>

                          {imageType === 'preset' && (
                            <select
                              value={selectedPresetImage}
                              onChange={(e) => setSelectedPresetImage(e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 cursor-pointer font-medium shadow-sm hover:border-slate-300 transition-colors"
                            >
                              {IMAGE_PRESETS.map(p => (
                                <option key={p.name} value={p.url}>{p.name}</option>
                              ))}
                            </select>
                          )}

                          {imageType === 'custom' && (
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/..."
                              value={customImageUrl}
                              onChange={(e) => setCustomImageUrl(e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono font-medium shadow-sm"
                            />
                          )}

                          {imageType === 'upload' && (
                            <div className="space-y-2">
                              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#007C7A] bg-white rounded-xl p-4 transition-colors cursor-pointer group">
                                <Plus className="w-6 h-6 text-slate-400 group-hover:text-[#007C7A] transition-colors mb-1" />
                                <span className="text-xs font-bold text-slate-700 group-hover:text-[#007C7A] transition-colors">Click to Upload Photo</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                              </label>
                              {uploadedImageUrl && (
                                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-center">
                                  <Check className="w-3.5 h-3.5" /> File loaded successfully!
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex justify-center bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                            <img
                              src={
                                imageType === 'custom'
                                  ? (customImageUrl || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400')
                                  : imageType === 'upload'
                                  ? (uploadedImageUrl || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400')
                                  : selectedPresetImage
                              }
                              alt="Voucher product preview"
                              className="h-16 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      </div>



                      <button
                        type="submit"
                        className="w-full mt-4 bg-[#007C7A] text-white py-2.5 px-4 rounded-xl font-bold text-sm hover:bg-[#005e5d] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Publish Campaign Coupon
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {activeSubSection === 'gift_rules' && (
        <div className="space-y-6 animate-fade-in">
          {/* Create new Gift Rule console */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 space-y-5">
            <div className="border-b border-slate-100 pb-4 text-left">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <Gift className="w-5 h-5 text-emerald-600" />
                Buy X Get Y (BXGY) Promotion Rule Creator
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure conditional logic to automatically bundle free gift products (Y products) in user shopping carts.
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (giftCatalogProducts.length === 0) {
                alert('No gift products available. Add a product to the Gift Product Catalog tab first.');
                return;
              }
              // Ensure the chosen gift product is actually a mapped & active catalog item
              const chosenGiftId = giftCatalogProducts.some(g => g.product.id === newGiftRuleProductId)
                ? newGiftRuleProductId
                : giftCatalogProducts[0].product.id;
              if (!newGiftRuleName) {
                alert('Please enter a rule name.');
                return;
              }
              const newRule: GiftRule = {
                id: 'rule_' + Math.random().toString(36).substr(2, 9),
                name: newGiftRuleName,
                minCartValue: selectedTriggerTypes.includes('min_cart') && newGiftRuleMinCart !== '' ? Number(newGiftRuleMinCart) : undefined,
                minUserOrders: selectedTriggerTypes.includes('min_orders') && newGiftRuleMinOrders !== '' ? Number(newGiftRuleMinOrders) : undefined,
                requiredCategory: selectedTriggerTypes.includes('category') ? newGiftRuleCategory : undefined,
                minCategoryValue: (selectedTriggerTypes.includes('category') && newGiftRuleCategory && newGiftRuleMinCategoryValue !== '') ? Number(newGiftRuleMinCategoryValue) : undefined,
                requiredProductId: selectedTriggerTypes.includes('product') ? newGiftRuleRequiredProductId : undefined,
                requiredProductQty: (selectedTriggerTypes.includes('product') && newGiftRuleRequiredProductId && newGiftRuleRequiredProductQty !== '') ? Number(newGiftRuleRequiredProductQty) : undefined,
                oncePerUser: newGiftRuleOncePerUser ? true : undefined,
                giftProductId: chosenGiftId,
                isActive: true
              };
              onUpdateGiftRules([newRule, ...giftRules]);
              setNewGiftRuleName('');
              setNewGiftRuleMinCart('');
              setNewGiftRuleMinOrders('');
              setNewGiftRuleCategory('Child Care');
              setNewGiftRuleMinCategoryValue('');
              setNewGiftRuleRequiredProductId('');
              setNewGiftRuleRequiredProductQty('');
              setNewGiftRuleOncePerUser(false);
              setSelectedTriggerTypes(['min_cart']);
              alert('Successfully created smart gift rule: ' + newRule.name);
            }} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1.5 font-bold">Rule Name / Promotion Label</label>
                  <input
                    type="text"
                    value={newGiftRuleName}
                    onChange={(e) => setNewGiftRuleName(e.target.value)}
                    placeholder="e.g. Free Toy on Baby Products purchase"
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1.5 font-bold">Gift Product to Auto-Add (Y Product)</label>
                  {giftCatalogProducts.length === 0 ? (
                    <div className="w-full px-3 py-2.5 text-xs border border-amber-200 rounded-xl bg-amber-50 text-amber-800 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      No gift products available. Add one in the <strong>Gift Product Catalog</strong> tab first.
                    </div>
                  ) : (
                    <select
                      value={newGiftRuleProductId}
                      onChange={(e) => setNewGiftRuleProductId(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-medium cursor-pointer"
                    >
                      {giftCatalogProducts.map(({ catalog, product }) => (
                        <option key={catalog.gift_catalog_id} value={product.id}>
                          {catalog.display_name} (Rs {product.price})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[9px] text-slate-400 mt-1">Only products mapped &amp; active in the Gift Product Catalog appear here.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4 text-left">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">Trigger Conditions (Trigger X to get Y)</span>
                
                {/* SELECTABLE TRIGGER CONDITION TABS/CHECKBOXES */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'min_cart', label: '🛒 Min Cart Value', desc: 'Trigger by total order subtotal' },
                    { id: 'min_orders', label: '📦 Completed Orders', desc: 'Trigger by previous order count' },
                    { id: 'category', label: '🏷️ Category Subtotal', desc: 'Trigger by total spend in a category' },
                    { id: 'product', label: '🧸 Product BOGO (BXGY)', desc: 'Trigger by specific item qty' }
                  ].map((type) => {
                    const isSelected = selectedTriggerTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTriggerTypes(selectedTriggerTypes.filter(t => t !== type.id));
                          } else {
                            setSelectedTriggerTypes([...selectedTriggerTypes, type.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-1 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 pointer-events-none w-3.5 h-3.5"
                          />
                          <span className="font-black text-[10px] uppercase tracking-wide leading-none">{type.label}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 font-medium leading-tight">{type.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* SEPARATE INPUTS FOR ONLY SELECTED CONDITIONS */}
                <div className="space-y-4 pt-2">
                  {selectedTriggerTypes.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium text-center">
                      ⚠️ No condition selected. If created, this gift rule will auto-apply to all orders unconditionally!
                    </div>
                  )}

                  {/* 1. Minimum Cart Order Value */}
                  {selectedTriggerTypes.includes('min_cart') && (
                    <div className="p-3 bg-white rounded-lg border border-slate-150 space-y-3 animate-fade-in">
                      <span className="font-black text-slate-600 text-[10px] uppercase tracking-wide block">🛒 Minimum Order Value Milestone</span>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1.5">Minimum Cart Order Value (Rs)</label>
                        <input
                          type="number"
                          value={newGiftRuleMinCart}
                          onChange={(e) => setNewGiftRuleMinCart(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 2000"
                          className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. Minimum User Completed Orders */}
                  {selectedTriggerTypes.includes('min_orders') && (
                    <div className="p-3 bg-white rounded-lg border border-slate-150 space-y-3 animate-fade-in">
                      <span className="font-black text-slate-600 text-[10px] uppercase tracking-wide block">📦 Customer Completed Orders Count</span>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1.5">Minimum User Completed Orders</label>
                        <input
                          type="number"
                          value={newGiftRuleMinOrders}
                          onChange={(e) => setNewGiftRuleMinOrders(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 5"
                          className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. Category Milestone */}
                  {selectedTriggerTypes.includes('category') && (
                    <div className="p-3 bg-white rounded-lg border border-slate-150 space-y-3 animate-fade-in">
                      <span className="font-black text-slate-600 text-[10px] uppercase tracking-wide block">🏷️ Section / Category Value Milestones</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1.5">Required Category purchased</label>
                          <select
                            value={newGiftRuleCategory}
                            onChange={(e) => setNewGiftRuleCategory(e.target.value)}
                            className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-medium cursor-pointer focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Child Care">Child Care (brings child toys)</option>
                            <option value="Women Care">Women Care (brings women hoodie)</option>
                            <option value="Medicine">Medicine</option>
                            <option value="Personal Care">Personal Care</option>
                            <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1.5">Minimum Category Subtotal Value (Rs)</label>
                          <input
                            type="number"
                            value={newGiftRuleMinCategoryValue}
                            onChange={(e) => setNewGiftRuleMinCategoryValue(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 1000"
                            className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:ring-1 focus:ring-emerald-500"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">Rule triggers only if total spending in this category crosses this amount.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Specific Product Trigger (BXGY) */}
                  {selectedTriggerTypes.includes('product') && (
                    <div className="p-3 bg-white rounded-lg border border-slate-150 space-y-3 animate-fade-in">
                      <span className="font-black text-slate-600 text-[10px] uppercase tracking-wide block">🧸 Specific Product & Quantity Triggers (BOGO / Buy X Get Y)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1.5">Required Trigger Product (Product X)</label>
                          <select
                            value={newGiftRuleRequiredProductId}
                            onChange={(e) => setNewGiftRuleRequiredProductId(e.target.value)}
                            className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-medium cursor-pointer focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="">-- Select Product X --</option>
                            {INITIAL_PRODUCTS.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} ({prod.category}) - Rs {prod.price}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1.5">Minimum Required Quantity</label>
                          <input
                            type="number"
                            value={newGiftRuleRequiredProductQty}
                            onChange={(e) => setNewGiftRuleRequiredProductQty(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 2"
                            disabled={!newGiftRuleRequiredProductId}
                            className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-medium disabled:bg-slate-100 disabled:text-slate-400 focus:ring-1 focus:ring-emerald-500"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">Number of Product X items needed in basket to unlock the free gift.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. Once per User Restriction (Applicable to any config!) */}
                  <div className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="oncePerUserCheckbox"
                        checked={newGiftRuleOncePerUser}
                        onChange={(e) => setNewGiftRuleOncePerUser(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                      />
                      <label htmlFor="oncePerUserCheckbox" className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wide cursor-pointer">
                        🔒 Apply only one-time per user (First Order Only)
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 pl-6">
                      If checked, this free gift campaign will only apply if the customer's completed order count is exactly 0. Once they complete a purchase, they cannot claim this gift again.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#007C7A] hover:bg-[#006361] text-white text-xs font-black px-5 py-3 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create & Deploy Gift Rule</span>
              </button>
            </form>
          </div>

          {/* Active Gift Rules list */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-left">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Live Gift Campaign Rules</h4>
            {giftRules.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No active gift rules.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {giftRules.map((rule) => {
                  const giftProd = INITIAL_PRODUCTS.find(p => p.id === rule.giftProductId);
                  return (
                    <div key={rule.id} className="border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between bg-slate-50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black tracking-wider px-2.5 py-0.5 rounded-full border ${
                            rule.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {rule.isActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = giftRules.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r);
                                onUpdateGiftRules(updated);
                              }}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
                              title="Toggle Active"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = giftRules.filter(r => r.id !== rule.id);
                                onUpdateGiftRules(updated);
                              }}
                              className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 cursor-pointer"
                              title="Delete Rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h5 className="font-extrabold text-slate-800 text-xs">{rule.name}</h5>
                        
                        <div className="text-[11px] text-slate-600 space-y-1">
                          <p><span className="text-slate-400 font-medium">Gift Item:</span> <span className="font-extrabold text-[#007C7A]">{giftProd ? giftProd.name : rule.giftProductId} (FREE)</span></p>
                          <p className="text-slate-500">
                            <span className="text-slate-400 font-medium">Trigger Condition(s):</span>{' '}
                            {[
                              rule.minCartValue ? `Order Subtotal ≥ Rs ${rule.minCartValue}` : '',
                              rule.minUserOrders ? `User Orders ≥ ${rule.minUserOrders}` : '',
                              rule.requiredCategory ? `Purchases in category "${rule.requiredCategory}"${rule.minCategoryValue ? ` (Subtotal ≥ Rs ${rule.minCategoryValue})` : ''}` : '',
                              rule.requiredProductId ? `Contains product "${INITIAL_PRODUCTS.find(p => p.id === rule.requiredProductId)?.name || rule.requiredProductId}"${rule.requiredProductQty ? ` (Quantity ≥ ${rule.requiredProductQty})` : ''}` : ''
                            ].filter(Boolean).join(' AND ') || 'Auto applies to all orders!'}
                          </p>
                          {rule.oncePerUser && (
                            <p className="text-indigo-600 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider mt-1.5">
                              <span>🔒 One-Time Limit (First purchase only)</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= GIFT PRODUCT CATALOG (mapping) ================= */}
      {activeSubSection === 'gift_catalog' && (
        <div className="space-y-6 animate-fade-in">
          {/* Add-to-catalog console */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 space-y-5 text-left">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                Gift Product Catalog
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Map which products can be given away as gifts. Only products added &amp; marked <strong>Available</strong> here
                can be selected as a gift (Y) product in the Buy X Get Y rules.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!catalogProductId) { alert('Select a product to add to the gift catalog.'); return; }
                if (giftCatalog.some(g => g.product_id === catalogProductId)) {
                  alert('This product is already in the gift catalog.');
                  return;
                }
                const prod = INITIAL_PRODUCTS.find(p => p.id === catalogProductId);
                const newItem: GiftCatalogItem = {
                  gift_catalog_id: 'GC_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                  product_id: catalogProductId,
                  display_name: catalogDisplayName.trim() || (prod ? `${prod.name} (Gift)` : 'Gift Product'),
                  is_available: 1,
                  created_at: new Date().toISOString()
                };
                onUpdateGiftCatalog([newItem, ...giftCatalog]);
                setCatalogProductId('');
                setCatalogDisplayName('');
              }}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Product</label>
                <select
                  value={catalogProductId}
                  onChange={(e) => setCatalogProductId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-medium cursor-pointer focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">-- Select a product to make giftable --</option>
                  {INITIAL_PRODUCTS.filter(p => !giftCatalog.some(g => g.product_id === p.id)).map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.category}) - Rs {prod.price}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Display Name <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={catalogDisplayName}
                  onChange={(e) => setCatalogDisplayName(e.target.value)}
                  placeholder="e.g. Free Teddy Bear"
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap h-fit"
              >
                <Plus className="w-4 h-4" /> Add to Catalog
              </button>
            </form>
          </div>

          {/* Catalog grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Mapped Gift Products</h4>
              <span className="text-[11px] font-bold text-slate-400">
                {availableGiftCatalog.length} available / {giftCatalog.length} total
              </span>
            </div>
            {giftCatalog.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">No gift products mapped yet.</p>
                <p className="text-xs text-slate-400 mt-1">Add a product above to make it available as a BXGY gift.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {giftCatalog.map((item) => {
                  const prod = INITIAL_PRODUCTS.find(p => p.id === item.product_id);
                  const usedByCount = giftRules.filter(r => r.giftProductId === item.product_id).length;
                  return (
                    <div
                      key={item.gift_catalog_id}
                      className={`border rounded-xl p-4 flex flex-col bg-slate-50 transition-all ${
                        item.is_available ? 'border-amber-200' : 'border-slate-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[9px] font-black tracking-wider px-2.5 py-0.5 rounded-full border ${
                          item.is_available
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {item.is_available ? 'AVAILABLE' : 'INACTIVE'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateGiftCatalog(giftCatalog.map(g => g.gift_catalog_id === item.gift_catalog_id ? { ...g, is_available: g.is_available === 1 ? 0 : 1 } : g))}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
                            title={item.is_available ? 'Mark Inactive' : 'Mark Available'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (usedByCount > 0 && !confirm(`This gift product is used by ${usedByCount} BXGY rule(s). Remove it from the catalog anyway? Existing rules keep working but you won't be able to pick it for new rules.`)) return;
                              onUpdateGiftCatalog(giftCatalog.filter(g => g.gift_catalog_id !== item.gift_catalog_id));
                            }}
                            className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 cursor-pointer"
                            title="Remove from Catalog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-slate-800 text-xs truncate">{item.display_name}</h5>
                          <p className="text-[10px] text-slate-500 truncate">{prod ? prod.name : item.product_id}</p>
                          <p className="text-[10px] font-bold text-amber-600 mt-0.5">{prod ? `Rs ${prod.price}` : ''} • {prod?.category || '—'}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-[10px] text-slate-400 font-semibold">
                        Used by {usedByCount} gift rule{usedByCount === 1 ? '' : 's'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE COUPON MANIFEST (3-COLUMN PROFESSIONAL GRID MATCHING THE CHOSEN VIBE) */}
      {activeSubSection === 'coupons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <Layers className="w-5 h-5 text-[#007C7A]" />
                Coupon Registry
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Promotional coupon cards synchronizing with the checkout simulator and live cart calculations.
                <span className="text-slate-400"> Wallet vouchers are managed in the Voucher Manager.</span>
              </p>
            </div>
          </div>

          {/* Summary stat chips */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Coupons', value: registryCounts.total, tone: 'text-slate-900' },
              { label: 'Currently Active', value: registryCounts.active, tone: 'text-emerald-700' },
              { label: 'Disabled', value: registryCounts.disabled, tone: 'text-slate-500' },
              { label: 'Expired', value: registryCounts.expired, tone: 'text-rose-600' }
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className={`text-2xl font-black mt-0.5 ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filter toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status segment */}
              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                {([['all', 'All'], ['active', 'Active'], ['inactive', 'Disabled'], ['expired', 'Expired']] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setRegistryStatus(val)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${registryStatus === val ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input value={registrySearch} onChange={e => setRegistrySearch(e.target.value)} placeholder="Search code or name…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007C7A] focus:outline-none" />
            </div>
          </div>

        {coupons.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No coupons or vouchers in registry.</p>
            <p className="text-xs text-slate-400 mt-1">Click the button above to launch the creation workspace.</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No rules match these filters.</p>
            <button type="button" onClick={() => { setRegistryStatus('all'); setRegistrySearch(''); }}
              className="text-xs font-bold text-[#007C7A] hover:underline mt-2 cursor-pointer">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => {
              const isExpired = new Date() > new Date(coupon.endDate);
              const isNotStarted = new Date() < new Date(coupon.startDate);
              
              let badgeColor = "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]";
              let statusText = "ACTIVE";

              if (!coupon.isActive) {
                badgeColor = "bg-slate-100 text-slate-500 border-slate-200";
                statusText = "DISABLED";
              } else if (isExpired) {
                badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                statusText = "EXPIRED";
              } else if (isNotStarted) {
                badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                statusText = "UPCOMING";
              }

              // Pre-calculated default presentation values from our Coupon structure
              const pointsVal = coupon.points ?? 1290;
              const storeGroupVal = coupon.storeGroupId ?? 1;
              const drugIdVal = coupon.drugId ?? (coupon.productRestriction || '502956');
              const priorityVal = coupon.priority ?? 3;
              const launchUrl = coupon.campaignUrl || `https://rewards.zeno.health/s/${coupon.code.toLowerCase()}`;
              const displayImg = coupon.imageUrl || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400';
              const accentColor = '#007C7A';

              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden border border-slate-200"
                  style={{ borderTop: `4px solid ${accentColor}` }}
                >
                  {/* Card Header Status Row */}
                  <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                    <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full border ${badgeColor}`}>
                      {statusText}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Active Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => onToggleActive(coupon.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          coupon.isActive 
                            ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={coupon.isActive ? "Deactivate Rule" : "Activate Rule"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Switch */}
                      <button
                        type="button"
                        onClick={() => onDeleteCoupon(coupon.id)}
                        className="p-1.5 bg-rose-50 border border-rose-150 text-rose-600 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Clean Visual Presentation Image Area */}
                  <div className="h-44 bg-white border-b border-slate-100 flex items-center justify-center p-4 relative group select-none">
                    <img 
                      src={displayImg} 
                      alt={coupon.name}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Unique Code Bubble matching professional style overlay */}
                    <div className="absolute bottom-3 right-3 bg-slate-950 text-white font-mono font-black text-[10px] tracking-wider px-2.5 py-1 rounded-md border border-slate-800 shadow-md">
                      {coupon.code}
                    </div>
                  </div>

                  {/* Card Main Body & Table Metadata */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Primary Display Title */}
                      <h4 className="text-sm font-black text-slate-800 leading-snug tracking-tight line-clamp-2" title={coupon.name}>
                        {coupon.name}
                      </h4>
                      
                      {/* Sub-text promo styled beautifully */}
                      <p className="text-xs font-bold text-indigo-600 mt-1 line-clamp-2 leading-relaxed">
                        {coupon.description}
                      </p>
                      
                      {/* Sub-text bill value */}
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold uppercase tracking-wider bg-slate-50 py-0.5 px-1.5 rounded inline-block border border-slate-150/60">
                        Bills &gt; ₹{coupon.minCartValue}
                      </p>
                    </div>

                    {/* Table Style Presentation Matrix */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-1.5 text-xs text-[#475569] font-semibold">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-400 font-medium">Reward Value:</span>
                        <span className="font-extrabold text-slate-900">
                          {coupon.discountType === 'flat' ? `₹${coupon.discountValue}` : coupon.discountType === 'free_delivery' ? 'FREE Delivery' : `${coupon.discountValue}%`}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-0.5 border-t border-slate-100/60">
                        <span className="text-slate-400 font-medium">Min Order Value:</span>
                        <span className="font-bold text-slate-800">₹{coupon.minCartValue}</span>
                      </div>

                      <div className="flex justify-between items-center py-0.5 border-t border-slate-100/60">
                        <span className="text-slate-400 font-medium">Rank/Priority:</span>
                        <span className="font-semibold text-slate-800">{priorityVal}</span>
                      </div>

                      <div className="flex justify-between items-center py-0.5 border-t border-slate-100/60">
                        <span className="text-slate-400 font-medium">Times Used:</span>
                        <span className="font-semibold text-slate-800">
                          {coupon.usageCount}{' '}
                          <span className="text-slate-400 font-medium">/ {coupon.perUserLimit} per user</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-0.5 border-t border-slate-100/60">
                        <span className="text-slate-400 font-medium">Stacking:</span>
                        <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded border ${
                          coupon.isStackable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {coupon.isStackable ? 'Stackable' : 'Exclusive'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-0.5 border-t border-slate-100/60">
                        <span className="text-slate-400 font-medium">Validity Window:</span>
                        <span className="text-[10px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-150/40">
                          {new Date(coupon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(coupon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex justify-between items-start py-1 border-t border-slate-100/60 gap-4">
                        <span className="text-slate-400 font-medium shrink-0">Campaign Link:</span>
                        <a 
                          href={launchUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-bold truncate flex items-center gap-0.5 transition-colors"
                          title="Open Campaign Link"
                        >
                          <span className="truncate">{launchUrl.replace('https://', '')}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
