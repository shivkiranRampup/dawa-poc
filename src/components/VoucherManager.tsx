import React, { useState, useMemo } from 'react';
import { VoucherTemplate, Voucher, VoucherTransaction, Customer, VoucherStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Ticket,
  LayoutTemplate,
  Send,
  ScrollText,
  Plus,
  X,
  Check,
  Search,
  Users,
  Layers,
  Ban,
  Wallet,
  Calendar,
  ArrowRightLeft,
  Repeat,
  Copy,
  Info,
  ChevronDown,
  ChevronRight,
  Trash2
} from 'lucide-react';

interface VoucherManagerProps {
  templates: VoucherTemplate[];
  vouchers: Voucher[];
  transactions: VoucherTransaction[];
  customers: Customer[];
  onUpdateTemplates: (t: VoucherTemplate[]) => void;
  onUpdateVouchers: (v: Voucher[]) => void;
  onUpdateTransactions: (t: VoucherTransaction[]) => void;
}

type SubTab = 'templates' | 'issue' | 'ledger' | 'usage';

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

const randCode = () => {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DAWA-${seg()}-${seg()}`;
};

const rupee = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const STATUS_STYLES: Record<VoucherStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  USED: 'bg-slate-100 text-slate-600 border-slate-200',
  EXPIRED: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200'
};

export default function VoucherManager({
  templates,
  vouchers,
  transactions,
  customers,
  onUpdateTemplates,
  onUpdateVouchers,
  onUpdateTransactions
}: VoucherManagerProps) {
  const [subTab, setSubTab] = useState<SubTab>('templates');

  // ---- Template creation form ----
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tName, setTName] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tAmount, setTAmount] = useState<number | ''>('');
  const [tExpiry, setTExpiry] = useState<number | ''>(180);
  const [tTransferable, setTTransferable] = useState(false);
  const [tPartial, setTPartial] = useState(true);

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim() || tAmount === '' || Number(tAmount) < 0) {
      alert('Please provide a template name and a valid amount (≥ 0).');
      return;
    }
    const tpl: VoucherTemplate = {
      template_id: uid('VT'),
      template_name: tName.trim(),
      description: tDesc.trim(),
      amount: Number(tAmount),
      expiry_days: tExpiry === '' ? 365 : Number(tExpiry),
      transferable: tTransferable,
      partial_redemption: tPartial,
      created_by: 'Admin',
      created_at: new Date().toISOString()
    };
    onUpdateTemplates([tpl, ...templates]);
    setTName(''); setTDesc(''); setTAmount(''); setTExpiry(180);
    setTTransferable(false); setTPartial(true);
    setShowTemplateForm(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (vouchers.some(v => v.template_id === id)) {
      alert('Cannot delete: vouchers have already been issued from this template.');
      return;
    }
    if (confirm('Delete this voucher template?')) {
      onUpdateTemplates(templates.filter(t => t.template_id !== id));
    }
  };

  // ---- Issue vouchers form ----
  const [issueTemplateId, setIssueTemplateId] = useState<string>('');
  const [issueMode, setIssueMode] = useState<'assign' | 'bulk'>('assign');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [bulkQty, setBulkQty] = useState<number | ''>(10);
  const [overrideAmount, setOverrideAmount] = useState<number | ''>('');
  const [issueResult, setIssueResult] = useState<string>('');

  const activeTemplate = templates.find(t => t.template_id === issueTemplateId);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      c => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const toggleCustomer = (id: string) =>
    setSelectedCustomers(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const tpl = templates.find(t => t.template_id === issueTemplateId);
    if (!tpl) { alert('Select a voucher template first.'); return; }

    const amount = overrideAmount === '' ? tpl.amount : Number(overrideAmount);
    if (amount <= 0) { alert('Voucher amount must be greater than 0.'); return; }

    const now = new Date();
    const expiry = new Date(now.getTime() + tpl.expiry_days * 24 * 60 * 60 * 1000);

    const newVouchers: Voucher[] = [];
    const newTxns: VoucherTransaction[] = [];

    const makeVoucher = (customerId: string | null): Voucher => {
      const v: Voucher = {
        voucher_id: uid('VCH'),
        template_id: tpl.template_id,
        voucher_code: randCode(),
        customer_id: customerId,
        employee_id: null,
        initial_amount: amount,
        remaining_amount: amount,
        expiry_date: expiry.toISOString(),
        status: 'ACTIVE',
        issued_by: 'Admin',
        issued_at: now.toISOString(),
        activated_at: customerId ? now.toISOString() : null,
        created_at: now.toISOString()
      };
      newVouchers.push(v);
      newTxns.push({
        transaction_id: uid('VTX'),
        voucher_id: v.voucher_id,
        order_id: null,
        transaction_type: 'ISSUE',
        amount,
        balance_after: amount,
        remarks: `Voucher issued from template "${tpl.template_name}"${customerId ? ` to ${customerId}` : ' (unassigned)'}`,
        created_by: 'Admin',
        created_at: now.toISOString()
      });
      return v;
    };

    if (issueMode === 'assign') {
      if (selectedCustomers.length === 0) { alert('Select at least one customer.'); return; }
      selectedCustomers.forEach(cid => makeVoucher(cid));
    } else {
      const qty = bulkQty === '' ? 0 : Number(bulkQty);
      if (qty < 1) { alert('Enter a bulk quantity of at least 1.'); return; }
      for (let i = 0; i < qty; i++) makeVoucher(null);
    }

    onUpdateVouchers([...newVouchers, ...vouchers]);
    onUpdateTransactions([...newTxns, ...transactions]);

    setIssueResult(
      issueMode === 'assign'
        ? `Issued ${newVouchers.length} voucher(s) worth ${rupee(amount)} to ${selectedCustomers.length} customer(s).`
        : `Bulk-generated ${newVouchers.length} unassigned voucher(s) worth ${rupee(amount)} each.`
    );
    setSelectedCustomers([]);
    setOverrideAmount('');
    setTimeout(() => setIssueResult(''), 6000);
    setSubTab('ledger');
  };

  // ---- Ledger (issued vouchers) ----
  const [statusFilter, setStatusFilter] = useState<'ALL' | VoucherStatus>('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');

  const customerName = (id: string | null) =>
    id ? customers.find(c => c.customer_id === id)?.full_name ?? id : '— Unassigned —';
  const templateName = (id: string) =>
    templates.find(t => t.template_id === id)?.template_name ?? id;

  const filteredVouchers = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    return vouchers.filter(v => {
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
      if (!q) return true;
      return (
        v.voucher_code.toLowerCase().includes(q) ||
        customerName(v.customer_id).toLowerCase().includes(q) ||
        templateName(v.template_id).toLowerCase().includes(q)
      );
    });
  }, [vouchers, statusFilter, ledgerSearch, customers, templates]);

  const handleCancelVoucher = (v: Voucher) => {
    if (v.status !== 'ACTIVE') return;
    if (!confirm(`Cancel voucher ${v.voucher_code}? Remaining ${rupee(v.remaining_amount)} will be voided.`)) return;
    const now = new Date().toISOString();
    onUpdateVouchers(
      vouchers.map(x => (x.voucher_id === v.voucher_id ? { ...x, status: 'CANCELLED', remaining_amount: 0 } : x))
    );
    onUpdateTransactions([
      {
        transaction_id: uid('VTX'),
        voucher_id: v.voucher_id,
        order_id: null,
        transaction_type: 'ADJUSTMENT',
        amount: v.remaining_amount,
        balance_after: 0,
        remarks: 'Voucher cancelled by admin — remaining balance voided',
        created_by: 'Admin',
        created_at: now
      },
      ...transactions
    ]);
  };

  // ---- Usage / transactions (grouped by voucher) ----
  const [expandedVoucher, setExpandedVoucher] = useState<string | null>(null);
  const txnsByVoucher = useMemo(() => {
    const map: Record<string, VoucherTransaction[]> = {};
    transactions.forEach(t => {
      (map[t.voucher_id] = map[t.voucher_id] || []).push(t);
    });
    Object.values(map).forEach(list => list.sort((a, b) => a.created_at.localeCompare(b.created_at)));
    return map;
  }, [transactions]);

  // ---- Summary stats ----
  const stats = useMemo(() => {
    const issued = vouchers.reduce((s, v) => s + v.initial_amount, 0);
    const remaining = vouchers.reduce((s, v) => s + v.remaining_amount, 0);
    return {
      count: vouchers.length,
      active: vouchers.filter(v => v.status === 'ACTIVE').length,
      issuedValue: issued,
      redeemedValue: issued - remaining,
      remainingValue: remaining
    };
  }, [vouchers]);

  const TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
    { id: 'issue', label: 'Issue / Assign', icon: <Send className="w-3.5 h-3.5" /> },
    { id: 'ledger', label: 'Issued Vouchers', icon: <Ticket className="w-3.5 h-3.5" /> },
    { id: 'usage', label: 'Usage Tracking', icon: <ScrollText className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1 text-center md:text-left">
          <span className="bg-indigo-500/10 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            Admin Workspace
          </span>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2 justify-center md:justify-start">
            <Wallet className="w-5 h-5 text-indigo-300" />
            Voucher Management Engine
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Design reusable voucher templates, issue or bulk-generate vouchers, assign them to one or many
            customers, and track every balance movement in a full transaction ledger.
          </p>
        </div>
      </div>

      {/* Summary stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Vouchers Issued', value: stats.count, sub: `${stats.active} active`, tone: 'text-slate-900' },
          { label: 'Face Value Issued', value: rupee(stats.issuedValue), sub: 'total', tone: 'text-indigo-700' },
          { label: 'Redeemed', value: rupee(stats.redeemedValue), sub: 'spent by customers', tone: 'text-emerald-700' },
          { label: 'Outstanding Balance', value: rupee(stats.remainingValue), sub: 'liability', tone: 'text-amber-700' }
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={`text-xl font-black mt-1 ${s.tone}`}>{s.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Sub-tab switcher */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none bg-white/60 p-1.5 rounded-xl border border-slate-200">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              subTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {issueResult && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-xl px-4 py-3 flex items-center gap-2">
          <Check className="w-4 h-4" /> {issueResult}
        </div>
      )}

      {/* ============ TEMPLATES ============ */}
      {subTab === 'templates' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-indigo-600" /> Voucher Templates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Reusable blueprints — amount, expiry window, transfer & partial-redemption rules.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTemplateForm(v => !v)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                showTemplateForm ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {showTemplateForm ? <><X className="w-4 h-4" /> Close</> : <><Plus className="w-4 h-4" /> New Template</>}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showTemplateForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateTemplate}
                className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm"
              >
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Template Name</label>
                      <input value={tName} onChange={e => setTName(e.target.value)} placeholder="e.g. Festive Gift Card ₹1000"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Face Value (₹)</label>
                      <input type="number" value={tAmount} onChange={e => setTAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 1000"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea value={tDesc} onChange={e => setTDesc(e.target.value)} rows={2} placeholder="Where and how this voucher is used…"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Expiry (days from issue)</label>
                      <input type="number" value={tExpiry} onChange={e => setTExpiry(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <label className="flex items-center justify-between gap-2 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50/60 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" /> Transferable</span>
                      <input type="checkbox" checked={tTransferable} onChange={e => setTTransferable(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
                    </label>
                    <label className="flex items-center justify-between gap-2 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50/60 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Repeat className="w-3.5 h-3.5 text-slate-400" /> Partial redemption</span>
                      <input type="checkbox" checked={tPartial} onChange={e => setTPartial(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
                    </label>
                  </div>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer">
                    <Plus className="w-4 h-4" /> Save Template
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => {
              const issuedCount = vouchers.filter(v => v.template_id === t.template_id).length;
              return (
                <div key={t.template_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="bg-indigo-50 text-indigo-700 rounded-xl p-2.5"><Wallet className="w-5 h-5" /></div>
                    <button onClick={() => handleDeleteTemplate(t.template_id)} className="text-slate-300 hover:text-rose-500 transition-colors" title="Delete template">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mt-3">{t.template_name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex-1">{t.description || 'No description'}</p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-indigo-700">{rupee(t.amount)}</span>
                    <span className="text-[11px] text-slate-400">face value</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Calendar className="w-3 h-3" /> {t.expiry_days}d expiry</span>
                    <span className={`px-2 py-0.5 rounded-full ${t.transferable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{t.transferable ? 'Transferable' : 'Non-transfer'}</span>
                    <span className={`px-2 py-0.5 rounded-full ${t.partial_redemption ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{t.partial_redemption ? 'Partial OK' : 'Single-use'}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{issuedCount} issued</span>
                    <button
                      onClick={() => { setIssueTemplateId(t.template_id); setSubTab('issue'); }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer">
                      Issue <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {templates.length === 0 && (
              <div className="col-span-full text-center text-sm text-slate-400 py-10 border border-dashed border-slate-200 rounded-2xl">
                No templates yet. Create one to start issuing vouchers.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ ISSUE / ASSIGN ============ */}
      {subTab === 'issue' && (
        <form onSubmit={handleIssue} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2"><Send className="w-4 h-4 text-indigo-600" /> Issue Vouchers</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pick a template, then assign to selected customers or bulk-generate unassigned voucher codes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Template</label>
              <select value={issueTemplateId} onChange={e => setIssueTemplateId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer">
                <option value="">— Select a template —</option>
                {templates.map(t => <option key={t.template_id} value={t.template_id}>{t.template_name} ({rupee(t.amount)})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount override (₹) <span className="text-slate-400 normal-case font-normal">— optional</span>
              </label>
              <input type="number" value={overrideAmount} onChange={e => setOverrideAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={activeTemplate ? `Default ${rupee(activeTemplate.amount)}` : 'Select template first'}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>

          {/* Mode toggle */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
            <button type="button" onClick={() => setIssueMode('assign')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${issueMode === 'assign' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'}`}>
              <Users className="w-3.5 h-3.5" /> Assign to customers
            </button>
            <button type="button" onClick={() => setIssueMode('bulk')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${issueMode === 'bulk' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'}`}>
              <Layers className="w-3.5 h-3.5" /> Bulk generate
            </button>
          </div>

          {issueMode === 'assign' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customers…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-indigo-700">{selectedCustomers.length} selected</span>
                  <button type="button" onClick={() => setSelectedCustomers(filteredCustomers.map(c => c.customer_id))} className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer">Select all</button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={() => setSelectedCustomers([])} className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer">Clear</button>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {filteredCustomers.map(c => {
                  const on = selectedCustomers.includes(c.customer_id);
                  return (
                    <label key={c.customer_id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${on ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleCustomer(c.customer_id)} className="accent-indigo-600 w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{c.email} • {c.location} • {c.orders_count} orders</p>
                      </div>
                      {on && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </label>
                  );
                })}
                {filteredCustomers.length === 0 && <p className="text-center text-xs text-slate-400 py-6">No customers match your search.</p>}
              </div>
            </div>
          ) : (
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Number of vouchers to generate</label>
              <input type="number" value={bulkQty} min={1} onChange={e => setBulkQty(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-start gap-1"><Info className="w-3.5 h-3.5 shrink-0 mt-px" /> Generates unassigned voucher codes you can distribute (email/print). They activate when a customer claims them.</p>
            </div>
          )}

          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm">
            <Send className="w-4 h-4" />
            {issueMode === 'assign' ? `Issue to ${selectedCustomers.length || 0} customer(s)` : `Generate ${bulkQty || 0} voucher(s)`}
          </button>
        </form>
      )}

      {/* ============ LEDGER (ISSUED VOUCHERS) ============ */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} placeholder="Search code / customer / template…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['ALL', 'ACTIVE', 'USED', 'EXPIRED', 'CANCELLED'] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${statusFilter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left font-bold px-4 py-3">Voucher</th>
                    <th className="text-left font-bold px-4 py-3">Holder</th>
                    <th className="text-left font-bold px-4 py-3">Template</th>
                    <th className="text-right font-bold px-4 py-3">Balance</th>
                    <th className="text-left font-bold px-4 py-3">Expiry</th>
                    <th className="text-left font-bold px-4 py-3">Status</th>
                    <th className="text-right font-bold px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVouchers.map(v => (
                    <tr key={v.voucher_id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                          {v.voucher_code}
                          <button onClick={() => navigator.clipboard?.writeText(v.voucher_code)} className="text-slate-300 hover:text-indigo-600" title="Copy code"><Copy className="w-3.5 h-3.5" /></button>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{customerName(v.customer_id)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{templateName(v.template_id)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-slate-900">{rupee(v.remaining_amount)}</span>
                        <span className="text-[11px] text-slate-400"> / {rupee(v.initial_amount)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(v.expiry_date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[v.status]}`}>{v.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {v.status === 'ACTIVE' ? (
                          <button onClick={() => handleCancelVoucher(v)} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 ml-auto cursor-pointer"><Ban className="w-3.5 h-3.5" /> Cancel</button>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                  {filteredVouchers.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-sm text-slate-400 py-10">No vouchers match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ USAGE TRACKING ============ */}
      {subTab === 'usage' && (
        <div className="space-y-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2"><ScrollText className="w-4 h-4 text-indigo-600" /> Usage Tracking</h3>
          <p className="text-xs text-slate-500">Expand a voucher to see its full transaction ledger — issue, redemptions, refunds and adjustments.</p>
          <div className="space-y-2">
            {vouchers.map(v => {
              const list = txnsByVoucher[v.voucher_id] || [];
              const open = expandedVoucher === v.voucher_id;
              const redeemed = v.initial_amount - v.remaining_amount;
              const pct = v.initial_amount > 0 ? Math.round((redeemed / v.initial_amount) * 100) : 0;
              return (
                <div key={v.voucher_id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedVoucher(open ? null : v.voucher_id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer text-left">
                    {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <span className="font-mono font-bold text-slate-800 text-sm">{v.voucher_code}</span>
                    <span className="text-xs text-slate-500 hidden sm:inline">{customerName(v.customer_id)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[v.status]}`}>{v.status}</span>
                    <div className="flex-1" />
                    <div className="w-28 hidden md:block">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} /></div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-32 text-right">{rupee(v.remaining_amount)} left</span>
                    <span className="text-[11px] text-slate-400 w-12 text-right">{list.length} txn</span>
                  </button>
                  {open && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                      <table className="w-full text-xs">
                        <thead className="text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="text-left font-bold py-1.5">Type</th>
                            <th className="text-right font-bold py-1.5">Amount</th>
                            <th className="text-right font-bold py-1.5">Balance</th>
                            <th className="text-left font-bold py-1.5 pl-4">When</th>
                            <th className="text-left font-bold py-1.5 pl-4">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {list.map(t => (
                            <tr key={t.transaction_id}>
                              <td className="py-1.5">
                                <span className={`font-bold px-1.5 py-0.5 rounded ${
                                  t.transaction_type === 'ISSUE' ? 'bg-indigo-50 text-indigo-700' :
                                  t.transaction_type === 'REDEEM' ? 'bg-emerald-50 text-emerald-700' :
                                  t.transaction_type === 'REFUND' ? 'bg-sky-50 text-sky-700' :
                                  t.transaction_type === 'EXPIRE' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                }`}>{t.transaction_type}</span>
                              </td>
                              <td className="py-1.5 text-right font-semibold text-slate-700">{rupee(t.amount)}</td>
                              <td className="py-1.5 text-right text-slate-500">{rupee(t.balance_after)}</td>
                              <td className="py-1.5 pl-4 text-slate-400">{new Date(t.created_at).toLocaleString('en-IN')}</td>
                              <td className="py-1.5 pl-4 text-slate-500">{t.remarks}</td>
                            </tr>
                          ))}
                          {list.length === 0 && <tr><td colSpan={5} className="py-3 text-center text-slate-400">No transactions.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            {vouchers.length === 0 && <div className="text-center text-sm text-slate-400 py-10 border border-dashed border-slate-200 rounded-2xl">No vouchers issued yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
