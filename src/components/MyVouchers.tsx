import React, { useState, useMemo } from 'react';
import { Voucher, VoucherTransaction, VoucherTemplate, VoucherStatus } from '../types';
import {
  Wallet,
  Ticket,
  Copy,
  Check,
  Calendar,
  ArrowRightLeft,
  Repeat,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Gift
} from 'lucide-react';

interface MyVouchersProps {
  customerId: string;
  customerName: string;
  vouchers: Voucher[];
  transactions: VoucherTransaction[];
  templates: VoucherTemplate[];
  onGoShopping: () => void;
}

const rupee = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const STATUS_STYLES: Record<VoucherStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  USED: 'bg-slate-100 text-slate-500 border-slate-200',
  EXPIRED: 'bg-slate-200 text-slate-500 border-slate-300',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200'
};

// A voucher may still be stored as ACTIVE while its expiry_date has already
// passed. Treat those as EXPIRED for display so they render dimmed/greyed out
// and are excluded from the spendable wallet balance.
const effectiveStatus = (v: Voucher): VoucherStatus =>
  v.status === 'ACTIVE' && new Date(v.expiry_date).getTime() < Date.now()
    ? 'EXPIRED'
    : v.status;

export default function MyVouchers({
  customerId,
  customerName,
  vouchers,
  transactions,
  templates,
  onGoShopping
}: MyVouchersProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const myVouchers = useMemo(
    () =>
      vouchers
        .filter(v => v.customer_id === customerId)
        .sort((a, b) => {
          // active first, then by newest issued
          const order = { ACTIVE: 0, EXPIRED: 1, USED: 2, CANCELLED: 3 } as Record<VoucherStatus, number>;
          if (order[effectiveStatus(a)] !== order[effectiveStatus(b)]) return order[effectiveStatus(a)] - order[effectiveStatus(b)];
          return b.issued_at.localeCompare(a.issued_at);
        }),
    [vouchers, customerId]
  );

  const templateName = (id: string) =>
    templates.find(t => t.template_id === id)?.template_name ?? 'Voucher';
  const templateMeta = (id: string) => templates.find(t => t.template_id === id);

  const txnsFor = (voucherId: string) =>
    transactions
      .filter(t => t.voucher_id === voucherId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const walletBalance = myVouchers
    .filter(v => effectiveStatus(v) === 'ACTIVE')
    .reduce((s, v) => s + v.remaining_amount, 0);

  const activeCount = myVouchers.filter(v => effectiveStatus(v) === 'ACTIVE').length;

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="space-y-6">
      {/* Header / wallet summary */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-indigo-600" /> My Vouchers
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Wallet credits &amp; gift vouchers assigned to {customerName}
          </p>
        </div>
        <button
          type="button"
          onClick={onGoShopping}
          className="text-xs font-extrabold text-[#007C7A] hover:underline flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl transition-all"
        >
          ← Back to Browse
        </button>
      </div>

      {/* Wallet balance banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/15 rounded-2xl p-3.5 backdrop-blur-sm">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-100">Total Wallet Balance</p>
            <p className="text-4xl font-black tracking-tight mt-0.5">{rupee(walletBalance)}</p>
            <p className="text-xs text-indigo-100 mt-1 font-semibold">
              {activeCount} active voucher{activeCount === 1 ? '' : 's'} • redeemable at checkout
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <Gift className="w-16 h-16 text-white/15 ml-auto" />
        </div>
      </div>

      {/* Voucher list */}
      {myVouchers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-lg font-extrabold text-slate-800">No vouchers yet</h4>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Vouchers assigned to your account by our team will appear here automatically.
          </p>
          <button
            type="button"
            onClick={onGoShopping}
            className="mt-6 bg-[#007C7A] hover:bg-[#006361] text-white text-xs font-black px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> Browse Medicines
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {myVouchers.map(v => {
            const meta = templateMeta(v.template_id);
            const redeemed = v.initial_amount - v.remaining_amount;
            const pct = v.initial_amount > 0 ? Math.round((redeemed / v.initial_amount) * 100) : 0;
            const isOpen = expanded === v.voucher_id;
            const txns = txnsFor(v.voucher_id);
            const status = effectiveStatus(v);
            const dim = status !== 'ACTIVE';
            const expired = status === 'EXPIRED';
            return (
              <div
                key={v.voucher_id}
                className={`bg-white border rounded-2xl shadow-xs overflow-hidden transition-all ${
                  expired ? 'border-slate-300 opacity-60 grayscale' : dim ? 'border-slate-200 opacity-80' : 'border-indigo-100'
                }`}
              >
                {/* ticket top */}
                <div className={`p-5 ${dim ? '' : 'bg-gradient-to-br from-indigo-50/60 to-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{templateName(v.template_id)}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(v.voucher_code)}
                        className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        {v.voucher_code}
                        {copied === v.voucher_code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[status]}`}>
                      {status}
                    </span>
                  </div>

                  {/* balance */}
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{rupee(v.remaining_amount)}</span>
                    <span className="text-xs text-slate-400 font-semibold">of {rupee(v.initial_amount)} left</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>

                  {/* meta chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Expires {new Date(v.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {meta?.transferable && (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowRightLeft className="w-3 h-3" /> Transferable</span>
                    )}
                    {meta?.partial_redemption && (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Repeat className="w-3 h-3" /> Partial OK</span>
                    )}
                  </div>
                </div>

                {/* history toggle */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : v.voucher_id)}
                  className="w-full flex items-center justify-between px-5 py-2.5 border-t border-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Transaction history
                  </span>
                  <span className="text-slate-400">{txns.length} entr{txns.length === 1 ? 'y' : 'ies'}</span>
                </button>

                {isOpen && (
                  <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 space-y-2">
                    {txns.map(t => (
                      <div key={t.transaction_id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            t.transaction_type === 'ISSUE' ? 'bg-indigo-50 text-indigo-700' :
                            t.transaction_type === 'REDEEM' ? 'bg-emerald-50 text-emerald-700' :
                            t.transaction_type === 'REFUND' ? 'bg-sky-50 text-sky-700' :
                            t.transaction_type === 'EXPIRE' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}>{t.transaction_type}</span>
                          <span className="text-slate-400 truncate">{new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-700">
                            {t.transaction_type === 'REDEEM' || t.transaction_type === 'EXPIRE' ? '−' : '+'}{rupee(t.amount)}
                          </span>
                          <span className="text-slate-400"> → {rupee(t.balance_after)}</span>
                        </div>
                      </div>
                    ))}
                    {txns.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No transactions yet.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
