import React, { useState } from 'react';
import { Product, FlashSaleItem } from '../types';
import { INITIAL_PRODUCTS } from '../mockData';
import { 
  Zap, 
  RefreshCw, 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Save, 
  Plus, 
  Calendar, 
  Layers, 
  Sliders, 
  Sparkles,
  Play,
  Pause,
  Upload,
  Clock,
  ArrowRight
} from 'lucide-react';

interface FlashSaleBulkEditorProps {
  flashSaleItems: FlashSaleItem[];
  flashSaleTitle: string;
  storeIds: string;
  onSaveFlashSale: (title: string, storeIds: string, items: FlashSaleItem[]) => void;
  onResetFlashSale: () => void;
}

export const FlashSaleBulkEditor: React.FC<FlashSaleBulkEditorProps> = ({
  flashSaleItems: initialItems,
  flashSaleTitle: initialTitle,
  storeIds: initialStoreIds,
  onSaveFlashSale,
  onResetFlashSale
}) => {
  // Local state
  const [items, setItems] = useState<FlashSaleItem[]>(initialItems);
  const [title, setTitle] = useState(initialTitle);
  const [storeIds, setStoreIds] = useState(initialStoreIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // CSV Import modal state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Bulk Edit date state
  const [showBulkDateModal, setShowBulkDateModal] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState('2026-06-30T20:00');
  const [bulkEndDate, setBulkEndDate] = useState('2026-06-30T23:59');

  // Trigger auto notification that fades
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Search results
  const filteredProducts = searchQuery.trim() === '' ? [] : INITIAL_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add product to flash sale
  const handleAddProduct = (product: Product) => {
    // Check if already exists
    if (items.some(item => item.productId === product.id)) {
      showToast(`Product "${product.name}" is already in the flash sale list!`, 'error');
      setSearchQuery('');
      return;
    }

    const newItem: FlashSaleItem = {
      id: `FS-${product.id}-${Date.now()}`,
      productId: product.id,
      drugId: `DRUG-${Math.floor(1000 + Math.random() * 9000)}`,
      storeGroupId: `GRP-${storeIds.split(',')[0].trim() || '54'}`,
      channel: 'ALL',
      originalPoints: product.price,
      // Default to 20% discount as requested
      flashPoints: Math.round(product.price * 0.8),
      flashDiscountPercent: 20,
      longDescription: product.description,
      flashLongDesc: `Super Saver Offer! Flat 20% discount on ${product.name}.`,
      minOrderValue: 0,
      flashMinOrder: 0,
      startDate: new Date().toISOString().substring(0, 16),
      endDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().substring(0, 16), // 12 hours from now
      priority: 'High',
      isActive: true
    };

    setItems([...items, newItem]);
    showToast(`Added "${product.name}" with default 20% off offer!`);
    setSearchQuery('');
  };

  // Remove individual item
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    showToast('Item removed from flash sale editor.');
  };

  // Toggle item selection
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Select all / deselect all
  const handleToggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  // Toggle single item active state
  const handleToggleActive = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
    showToast('Toggled flash item status.');
  };

  // Edit item inline values
  const handleUpdateItemValue = (id: string, field: keyof FlashSaleItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // If discount percent is updated, recalculate promo points (flashPoints)
        if (field === 'flashDiscountPercent') {
          const discount = Number(value) || 0;
          updated.flashPoints = Math.round(item.originalPoints * (1 - discount / 100));
          updated.flashLongDesc = `Super Saver Offer! Flat ${discount}% discount on ${INITIAL_PRODUCTS.find(p => p.id === item.productId)?.name || 'product'}.`;
        }
        // If promo points is updated, recalculate discount percent
        if (field === 'flashPoints') {
          const points = Number(value) || 0;
          updated.flashDiscountPercent = Math.round(((item.originalPoints - points) / item.originalPoints) * 100);
        }
        return updated;
      }
      return item;
    }));
  };

  // Bulk actions
  const handleBulkActivate = () => {
    if (selectedIds.length === 0) {
      showToast('No items selected for bulk activation!', 'error');
      return;
    }
    setItems(items.map(item => selectedIds.includes(item.id) ? { ...item, isActive: true } : item));
    showToast(`Bulk activated ${selectedIds.length} items!`);
  };

  const handleBulkDeactivate = () => {
    if (selectedIds.length === 0) {
      showToast('No items selected for bulk deactivation!', 'error');
      return;
    }
    setItems(items.map(item => selectedIds.includes(item.id) ? { ...item, isActive: false } : item));
    showToast(`Bulk deactivated ${selectedIds.length} items!`);
  };

  const handleBulkUpdateDatesSubmit = () => {
    setItems(items.map(item => selectedIds.includes(item.id) ? { 
      ...item, 
      startDate: bulkStartDate, 
      endDate: bulkEndDate 
    } : item));
    setShowBulkDateModal(false);
    showToast(`Bulk updated dates for ${selectedIds.length} items!`);
  };

  const handleBulkRemove = () => {
    if (selectedIds.length === 0) {
      showToast('No items selected for removal!', 'error');
      return;
    }
    setItems(items.filter(item => !selectedIds.includes(item.id)));
    setSelectedIds([]);
    showToast('Removed selected items from flash sale list.');
  };

  // CSV parser simulation
  const handleImportCsv = () => {
    if (!csvText.trim()) {
      showToast('CSV content cannot be empty!', 'error');
      return;
    }

    try {
      // Expecting columns: product_id, discount_percent, priority, channel
      // Or just line-by-line list
      const lines = csvText.split('\n');
      let importCount = 0;
      let skippedCount = 0;
      const newImportedItems: FlashSaleItem[] = [...items];

      lines.forEach((line, index) => {
        // Skip header if matches text
        if (index === 0 && (line.toLowerCase().includes('id') || line.toLowerCase().includes('product'))) {
          return;
        }

        const parts = line.split(',');
        if (parts.length === 0 || !parts[0].trim()) return;

        const rawProdId = parts[0].trim();
        // Try finding product by ID or by name
        const product = INITIAL_PRODUCTS.find(p => 
          p.id.toLowerCase() === rawProdId.toLowerCase() ||
          p.name.toLowerCase().includes(rawProdId.toLowerCase())
        );

        if (product) {
          // Check duplication
          if (newImportedItems.some(item => item.productId === product.id)) {
            skippedCount++;
            return;
          }

          const discount = parts[1] ? parseInt(parts[1].trim()) : 20; // default 20% off
          const priorityVal = parts[2] ? parts[2].trim() as 'High' | 'Medium' | 'Low' : 'High';
          const channelVal = parts[3] ? parts[3].trim() as 'ALL' | 'MOBILE_APP' | 'WEB' : 'ALL';

          const newItem: FlashSaleItem = {
            id: `FS-${product.id}-${Date.now()}-${index}`,
            productId: product.id,
            drugId: `DRUG-${Math.floor(1000 + Math.random() * 9000)}`,
            storeGroupId: `GRP-${storeIds.split(',')[0].trim() || '54'}`,
            channel: channelVal,
            originalPoints: product.price,
            flashPoints: Math.round(product.price * (1 - discount / 100)),
            flashDiscountPercent: discount,
            longDescription: product.description,
            flashLongDesc: `CSV Special Promo! Flat ${discount}% discount on ${product.name}.`,
            minOrderValue: 0,
            flashMinOrder: 0,
            startDate: new Date().toISOString().substring(0, 16),
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 16), // 24h
            priority: priorityVal,
            isActive: true
          };

          newImportedItems.push(newItem);
          importCount++;
        } else {
          skippedCount++;
        }
      });

      setItems(newImportedItems);
      setShowCsvModal(false);
      setCsvText('');
      showToast(`Successfully imported ${importCount} products to flash sale! (${skippedCount} entries skipped/unresolved)`);
    } catch (e) {
      showToast('Error parsing CSV. Please check formatting.', 'error');
    }
  };

  // Load a pre-populated template CSV for baby oil and hygiene
  const loadCsvTemplate = () => {
    setCsvText(
      `Product ID,Discount Percent,Priority,Channel\n` +
      `PROD9,20,High,ALL\n` +
      `PROD4,15,Medium,ALL\n` +
      `PROD8,25,High,MOBILE_APP\n` +
      `PROD3,10,Low,WEB`
    );
  };

  // Handle Save
  const handleSave = () => {
    if (!title.trim()) {
      showToast('Flash Sale Title is required!', 'error');
      return;
    }
    onSaveFlashSale(title, storeIds, items);
    showToast('Flash Sale Bulk Editor updates saved to application scope!', 'success');
  };

  // Handle Reset local
  const handleReset = () => {
    if (confirm('Are you sure you want to discard your unsaved edits?')) {
      setItems(initialItems);
      setTitle(initialTitle);
      setStoreIds(initialStoreIds);
      setSelectedIds([]);
      showToast('Editor discarded unsaved changes.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Concept Explanation Card */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 md:flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-slate-900 text-white p-1 rounded-lg">
              <Zap className="w-4 h-4 fill-white" />
            </span>
            <h3 className="text-sm font-bold text-slate-800">Operational Insight: Flash Sale Bulk Administration</h3>
          </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
            This module represents the enterprise **Flash Sale Bulk Editor** from the internal <span className="font-semibold text-slate-800">Ops Oracle</span> systems.
            You can dynamically schedule, adjust, and target specific pharmacy items/drugs with custom promotional offerings (like <span className="font-bold text-slate-800">Johnson's Baby Oil at 20% Off</span>). 
            Any active item here will bypass general cart-level rules and apply individual drug markdowns directly in the checkout pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shrink-0 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-slate-600 animate-pulse" />
          Interactive Admin Replica
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-slate-900 font-sans">
        
        {/* Banner Title Form */}
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Ops Oracle Campaign Header</span>
            <div className="flex items-center gap-3">
              <label htmlFor="flash-title-input" className="text-xs font-semibold shrink-0 text-slate-700">Flash Sale Title:</label>
              <input
                id="flash-title-input"
                type="text"
                placeholder="Enter global campaign title (e.g. Baby Care 20% Off Super Saver Event)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 bg-white text-slate-900 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium transition-all"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0 self-end sm:self-center"
          >
            <Check className="w-3.5 h-3.5" />
            Update Title
          </button>
        </div>

        {/* Toolbar & Buttons Controls Row */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="bg-white text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm border border-slate-200"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Bulk Edit
            </button>
            
            {/* Store input */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-600">Store IDs (comma-separated):</span>
              <input
                type="text"
                value={storeIds}
                onChange={(e) => setStoreIds(e.target.value)}
                className="w-20 bg-white text-slate-900 text-xs text-center border-b border-slate-200 focus:outline-none focus:border-emerald-400 font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCsvModal(true)}
              className="bg-slate-900/5 hover:bg-slate-900/10 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-slate-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              IMPORT CSV
            </button>

            <button
              type="button"
              onClick={() => {
                setItems(initialItems);
                setTitle(initialTitle);
                setStoreIds(initialStoreIds);
                showToast('Refetched database state.');
              }}
              className="bg-slate-900/5 hover:bg-slate-900/10 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-slate-200 cursor-pointer"
              title="Refresh Items from State"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              REFRESH
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              SAVE CHANGES
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="bg-slate-900/5 hover:bg-slate-900/10 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              CANCEL
            </button>
          </div>
        </div>

        {/* Searching Rewards to Add Area */}
        <div className="bg-white p-6 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>

          <input
            type="text"
            placeholder="Search rewards or products to add to the flash sale... (e.g. baby oil, crocin, Himalaya)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-900 pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-slate-400 transition-all font-medium"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-300 hover:text-indigo-700"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Dropdown Suggestion Results */}
        {searchQuery.trim() !== '' && (
              <div className="mt-2 bg-white rounded-xl border border-slate-200 max-h-60 overflow-y-auto divide-y divide-slate-100 shadow-2xl z-20 relative">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center">
                No products or brands match "{searchQuery}" in our pharmacy catalog.
              </div>
            ) : (
              filteredProducts.map(prod => {
                const isAlreadyIn = items.some(item => item.productId === prod.id);
                return (
                  <div
                    key={prod.id}
                      className={`p-3 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                      isAlreadyIn ? 'opacity-50' : 'cursor-pointer'
                    }`}
                    onClick={() => !isAlreadyIn && handleAddProduct(prod)}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{prod.name}</span>
                        {prod.isRx && (
                          <span className="bg-rose-500/20 text-rose-300 text-[9px] px-1.5 py-0.2 rounded font-semibold border border-rose-500/30">
                            Rx Medicine
                          </span>
                        )}
                        {prod.brand && (
                          <span className="bg-pink-500/20 text-pink-300 text-[9px] px-1.5 py-0.2 rounded font-semibold border border-pink-500/30">
                            Brand: {prod.brand}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[10px] font-medium">
                        Category: {prod.category} • Original Price: Rs {prod.price}
                      </p>
                    </div>

                    <div>
                      {isAlreadyIn ? (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          Already Added
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-800 font-extrabold bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-emerald-400/30 transition-all">
                          <Plus className="w-3 h-3" /> Add with 20% Off
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

        {/* Bulk Action Controls */}
          <div className="bg-slate-50 px-6 py-3 border-t border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Bulk Actions ({selectedIds.length} selected):</span>
            
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleBulkActivate}
              className="bg-indigo-950/50 hover:bg-indigo-950/80 text-white border border-indigo-400/30 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Play className="w-3 h-3 text-emerald-400" /> ACTIVATE
            </button>

            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleBulkDeactivate}
              className="bg-indigo-950/50 hover:bg-indigo-950/80 text-white border border-indigo-400/30 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Pause className="w-3 h-3 text-amber-400" /> DEACTIVATE
            </button>

            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => setShowBulkDateModal(true)}
              className="bg-indigo-950/50 hover:bg-indigo-950/80 text-white border border-indigo-400/30 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Calendar className="w-3 h-3 text-indigo-300" /> UPDATE DATES
            </button>

            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleBulkRemove}
              className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-rose-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Trash2 className="w-3 h-3 text-rose-400" /> REMOVE
            </button>
          </div>

          <div className="text-[11px] text-slate-600 font-medium">
            Total active flash offers: <span className="text-emerald-300 font-black">{items.filter(i => i.isActive).length}</span> / {items.length} products
          </div>
        </div>

        {/* Spreadsheet-like Data Grid Table */}
        <div className="overflow-x-auto">
          {items.length === 0 ? (
            <div className="py-20 px-6 text-center space-y-4">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-400 shadow-inner">
                <Zap className="w-8 h-8 text-indigo-200" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="font-extrabold text-base">No Flash Sale Items Added</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Search above to individually add promotional drug deals (e.g. baby oil) or upload a CSV catalog to populate the active flash sale bulk grid.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Add default baby oil offer
                      const babyOil = INITIAL_PRODUCTS.find(p => p.id === 'PROD9');
                      if (babyOil) handleAddProduct(babyOil);
                    }}
                    className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Quick Add Johnson's Baby Oil
                  </button>
                </div>
              </div>
            </div>
          ) : (
              <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold">
                  <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && selectedIds.length === items.length}
                        onChange={handleToggleSelectAll}
                        className="cursor-pointer rounded border-slate-300 accent-emerald-500 w-3.5 h-3.5"
                      />
                  </th>
                  <th className="p-3 w-12">Image</th>
                  <th className="p-3 min-w-[160px]">Title</th>
                  <th className="p-3">Reward ID</th>
                  <th className="p-3">Drug ID</th>
                  <th className="p-3">Store Group ID</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Points (Reg)</th>
                  <th className="p-3 font-semibold text-emerald-300">Flash Discount / Points</th>
                  <th className="p-3">Flash Description</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3 text-center">Active</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100">
                {items.map((item) => {
                  const productDetails = INITIAL_PRODUCTS.find(p => p.id === item.productId);
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !item.isActive ? 'opacity-65 bg-slate-50/60' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => handleToggleSelect(item.id)}
                            className="cursor-pointer rounded border-slate-300 accent-emerald-500 w-3.5 h-3.5"
                          />
                      </td>

                      {/* Image Icon */}
                      <td className="p-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px]">
                          {productDetails?.brand?.substring(0, 3).toUpperCase() || 'OTC'}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="p-3 font-bold">
                        <div className="space-y-0.5">
                          <p className="text-slate-900 text-xs">{productDetails?.name || 'Unknown Product'}</p>
                          <div className="flex flex-wrap gap-1">
                            {productDetails?.isRx && (
                              <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 rounded">Rx Restricted</span>
                            )}
                            {productDetails?.brand && (
                              <span className="text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-1 rounded">{productDetails.brand}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Reward ID */}
                      <td className="p-3 text-[10px] font-mono text-indigo-200">
                        REWARD-00{item.productId.replace('PROD', '')}
                      </td>

                      {/* Drug ID */}
                      <td className="p-3 text-[10px] font-mono">
                        <input
                          type="text"
                          value={item.drugId}
                          onChange={(e) => handleUpdateItemValue(item.id, 'drugId', e.target.value)}
                          className="bg-slate-50 text-slate-900 w-20 text-center px-1.5 py-1 border border-slate-200 rounded focus:outline-none focus:border-emerald-400 font-mono text-[10px]"
                        />
                      </td>

                      {/* Store Group ID */}
                      <td className="p-3 text-[10px] font-mono text-indigo-200">
                        <input
                          type="text"
                          value={item.storeGroupId}
                          onChange={(e) => handleUpdateItemValue(item.id, 'storeGroupId', e.target.value)}
                          className="bg-slate-50 text-slate-900 w-14 text-center px-1.5 py-1 border border-slate-200 rounded focus:outline-none focus:border-emerald-400 font-mono text-[10px]"
                        />
                      </td>

                      {/* Channel */}
                      <td className="p-3">
                        <select
                          value={item.channel}
                          onChange={(e) => handleUpdateItemValue(item.id, 'channel', e.target.value)}
                          className="bg-slate-50 text-slate-900 px-1.5 py-1 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                        >
                          <option value="ALL">ALL</option>
                          <option value="MOBILE_APP">MOBILE_APP</option>
                          <option value="WEB">WEB</option>
                        </select>
                      </td>

                      {/* Original points */}
                      <td className="p-3 font-mono text-slate-500">
                        Rs {item.originalPoints}
                      </td>

                      {/* Flash Points / Discount Input */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center bg-indigo-950/40 border border-indigo-400/20 rounded px-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.flashDiscountPercent}
                              onChange={(e) => handleUpdateItemValue(item.id, 'flashDiscountPercent', e.target.value)}
                              className="bg-transparent text-emerald-300 w-10 text-center py-1 focus:outline-none font-bold text-xs"
                            />
                            <span className="text-emerald-400 font-bold text-[10px]">% Off</span>
                          </div>
                          
                          <ArrowRight className="w-3 h-3 text-slate-300" />

                          <div className="flex items-center bg-indigo-950/40 border border-indigo-400/20 rounded px-1">
                            <span className="text-indigo-300 text-[10px]">Rs</span>
                            <input
                              type="number"
                              min="0"
                              max={item.originalPoints}
                              value={item.flashPoints}
                              onChange={(e) => handleUpdateItemValue(item.id, 'flashPoints', e.target.value)}
                              className="bg-transparent text-slate-900 w-12 text-center py-1 focus:outline-none font-bold text-xs"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Flash Long Description */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.flashLongDesc}
                          onChange={(e) => handleUpdateItemValue(item.id, 'flashLongDesc', e.target.value)}
                          className="bg-slate-50 text-slate-900 w-36 px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-emerald-400 text-[10px] truncate"
                          title={item.flashLongDesc}
                        />
                      </td>

                      {/* Start Date */}
                      <td className="p-3">
                        <input
                          type="datetime-local"
                          value={item.startDate}
                          onChange={(e) => handleUpdateItemValue(item.id, 'startDate', e.target.value)}
                          className="bg-slate-50 text-slate-900 px-1.5 py-1 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                        />
                      </td>

                      {/* End Date */}
                      <td className="p-3">
                        <input
                          type="datetime-local"
                          value={item.endDate}
                          onChange={(e) => handleUpdateItemValue(item.id, 'endDate', e.target.value)}
                          className="bg-slate-50 text-slate-900 px-1.5 py-1 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                        />
                      </td>

                      {/* Priority */}
                      <td className="p-3">
                        <select
                          value={item.priority}
                          onChange={(e) => handleUpdateItemValue(item.id, 'priority', e.target.value)}
                          className={`px-1.5 py-1 text-[10px] border border-indigo-400/20 rounded focus:outline-none cursor-pointer bg-[#3D348E] text-white font-bold ${
                            item.priority === 'High' ? 'text-red-300' : item.priority === 'Medium' ? 'text-amber-300' : 'text-blue-300'
                          }`}
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.id)}
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${
                            item.isActive ? 'bg-emerald-500' : 'bg-indigo-950'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            item.isActive ? 'transform translate-x-5' : ''
                          }`} />
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label={`Remove ${productDetails?.name || 'flash sale item'}`}
                          className="text-indigo-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Remove item from campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info counts */}
          <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 border-t border-slate-200 gap-2">
          <div>
            Showing <span className="text-white font-bold">{items.length}</span> items in the bulk grid. All updates are temporarily buffered until you hit <span className="text-emerald-400 font-extrabold">SAVE CHANGES</span>.
          </div>
          <div className="flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Targeting User Base: <span className="font-bold text-white">ALL CHANNELS</span> • Target Geofence Zone: <span className="font-bold text-white">STORE {storeIds || '54'}</span></span>
          </div>
        </div>

      </div>

      {/* CSV MODAL COMPONENT */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#483EA2] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-slate-500" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">CSV Data Catalog Importer</h3>
              </div>
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  aria-label="Close CSV import modal"
                  className="text-indigo-900/70 hover:text-indigo-900 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">Paste your CSV spreadsheet data:</p>
                <p className="text-[10px] text-slate-400">
                  Format: <span className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">Product ID or Name, Discount %, Priority, Channel</span>
                </p>
              </div>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="PROD9, 20, High, ALL&#10;PROD4, 15, Medium, MOBILE_APP&#10;PROD8, 25, High, ALL"
                className="w-full h-40 bg-slate-50 text-slate-800 p-3 font-mono text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={loadCsvTemplate}
                  className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Load Baby Oil & Hygiene Template CSV
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImportCsv}
                    className="bg-[#483EA2] hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Import Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK DATE UPDATE MODAL */}
      {showBulkDateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#483EA2] text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Bulk Update Campaign Dates</h3>
            </div>
              <button 
                type="button"
                onClick={() => setShowBulkDateModal(false)}
                aria-label="Close bulk dates modal"
                className="text-indigo-900/70 hover:text-indigo-900 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Set active start and end dates for the <span className="font-black text-slate-700">{selectedIds.length} selected</span> flash products simultaneously.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={bulkEndDate}
                    onChange={(e) => setBulkEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDateModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkUpdateDatesSubmit}
                  className="bg-[#483EA2] hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Apply Dates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
