import React, { useState } from 'react';
import { ReferralProgram, Referral } from '../types';
import { 
  Users, 
  Copy, 
  Check, 
  Send, 
  UserPlus, 
  Gift, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Mail, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  Award
} from 'lucide-react';

interface ReferralSystemProps {
  referralProg: ReferralProgram;
  onChangeReferralProgram: (program: ReferralProgram) => void;
}

export default function ReferralSystem({ referralProg, onChangeReferralProgram }: ReferralSystemProps) {
  // Invite state inputs
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Referral URL Generation
  const referralLink = `${window.location.origin}/signup?ref=${referralProg.referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName.trim() || !friendEmail.trim()) return;

    const newInvite: Referral = {
      id: 'REF_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      referredName: friendName.trim(),
      referredEmail: friendEmail.trim(),
      status: 'invited',
      rewardEarned: 0,
      date: new Date().toISOString().replace('T', ' ').substr(0, 16)
    };

    const updatedHistory = [newInvite, ...referralProg.history];
    onChangeReferralProgram({
      ...referralProg,
      history: updatedHistory
    });

    setFriendName('');
    setFriendEmail('');
    setSuccessMsg(`Invitation successfully dispatched to ${friendName}!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Simulates friend moving through registration to first purchase
  const handleSimulateStateProgress = (id: string) => {
    const record = referralProg.history.find(r => r.id === id);
    if (!record) return;

    let nextStatus: 'registered' | 'order_completed' = 'registered';
    let reward = 0;
    let rewardIncrement = 0;

    if (record.status === 'invited') {
      nextStatus = 'registered';
    } else if (record.status === 'registered') {
      nextStatus = 'order_completed';
      reward = referralProg.referrerRewardAmount;
      rewardIncrement = referralProg.referrerRewardAmount;
    } else {
      return; // Already completed
    }

    const updatedHistory = referralProg.history.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: nextStatus,
          rewardEarned: reward
        };
      }
      return item;
    });

    onChangeReferralProgram({
      ...referralProg,
      totalRewardsEarned: referralProg.totalRewardsEarned + rewardIncrement,
      history: updatedHistory
    });
  };

  return (
    <div id="referral-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT: Sharing link, custom reward amounts & Statistics cards */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Rewards</p>
              <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">Rs {referralProg.totalRewardsEarned}</h4>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Referrals</p>
              <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">
                {referralProg.history.length} Friends
              </h4>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Conversion</p>
              <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">
                {Math.round((referralProg.history.filter(h => h.status === 'order_completed').length / (referralProg.history.length || 1)) * 100)}%
              </h4>
            </div>
          </div>
        </div>

        {/* Shareable Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Refer & Earn Program Portal</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reward loyal customers with cash vouchers for every new user account they direct to Dawa.com.
            </p>
          </div>

          {/* Reward Setting Sliders */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Referrer Reward (Completed Order)</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={referralProg.referrerRewardAmount}
                  onChange={(e) => onChangeReferralProgram({ ...referralProg, referrerRewardAmount: Number(e.target.value) })}
                  className="flex-1 accent-emerald-600 cursor-pointer"
                />
                <span className="font-bold text-slate-900 shrink-0 w-14 text-right">Rs {referralProg.referrerRewardAmount}</span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">Referee Welcome Coupon Value</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="50"
                  value={referralProg.refereeDiscountAmount}
                  onChange={(e) => onChangeReferralProgram({ ...referralProg, refereeDiscountAmount: Number(e.target.value) })}
                  className="flex-1 accent-emerald-600 cursor-pointer"
                />
                <span className="font-bold text-slate-900 shrink-0 w-14 text-right">Rs {referralProg.refereeDiscountAmount}</span>
              </div>
            </div>
          </div>

          {/* Link and Code sharing cards */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            
            <div className="sm:col-span-4 p-4 border border-slate-200 rounded-xl space-y-1 bg-slate-50/20 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Your Referral Code</span>
              <p className="text-lg font-mono font-extrabold text-slate-900 tracking-wider">
                {referralProg.referralCode}
              </p>
            </div>

            <div className="sm:col-span-8 p-4 border border-slate-200 rounded-xl space-y-1.5 bg-slate-50/20">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Invite URL Link</span>
              <div className="flex items-center gap-2 bg-white border border-slate-150 rounded-lg p-1.5 pl-3">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full text-xs text-slate-600 font-mono focus:outline-none bg-transparent select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-slate-950 text-white hover:bg-slate-800 p-1.5 rounded-md transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Friend Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <UserPlus className="w-4 h-4 text-emerald-500" />
            Send Referral Invitation Email
          </h3>

          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1.5">Friend's Full Name</label>
                <input
                  type="text"
                  placeholder="E.G. Jane Doe"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1.5">Friend's Email Address</label>
                <input
                  type="email"
                  placeholder="E.G. jane.doe@example.com"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 leading-tight pr-4">
                * Friend will receive welcome coupon worth Rs {referralProg.refereeDiscountAmount} automatically on sign up.
              </span>
              <button
                type="submit"
                className="bg-emerald-600 text-white hover:bg-emerald-700 py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs shadow-emerald-200"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Invitation
              </button>
            </div>
          </form>

          {successMsg && (
            <div className="mt-4 bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-xs text-emerald-800 flex gap-2 items-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Simulated Referral pipeline / history */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              Referral Pipeline Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Simulate friend steps to test the real-time rewards engine.</p>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {referralProg.history.map((ref) => {
              
              let statusBadge = "bg-amber-50 text-amber-700 border-amber-200";
              let simulateCta = "Register Account";
              let timelineStep = 1;

              if (ref.status === 'registered') {
                statusBadge = "bg-blue-50 text-blue-700 border-blue-200";
                simulateCta = "Complete First Order";
                timelineStep = 2;
              } else if (ref.status === 'order_completed') {
                statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                simulateCta = "Fully Credited";
                timelineStep = 3;
              }

              return (
                <div key={ref.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{ref.referredName}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-300" /> {ref.referredEmail}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusBadge}`}>
                        {ref.status.toUpperCase().replace('_', ' ')}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Invited {ref.date}</p>
                    </div>
                  </div>

                  {/* Visual Stepper timeline */}
                  <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                    <span className={timelineStep >= 1 ? "text-emerald-600 font-bold" : ""}>1. Invited</span>
                    <span className="w-6 h-0.5 bg-slate-200" />
                    <span className={timelineStep >= 2 ? "text-blue-600 font-bold" : ""}>2. Registered</span>
                    <span className="w-6 h-0.5 bg-slate-200" />
                    <span className={timelineStep >= 3 ? "text-emerald-600 font-bold text-[10px]" : ""}>3. Ordered (Rewarded!)</span>
                  </div>

                  {/* Actions to simulate checkout registration funnel */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100/60 text-xs">
                    <span className="text-[10px] text-slate-500">
                      {ref.rewardEarned > 0 ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50/50 px-1.5 py-0.5 rounded">
                          ✓ Credited Rs {ref.rewardEarned}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Pending Conversion</span>
                      )}
                    </span>

                    {ref.status !== 'order_completed' ? (
                      <button
                        type="button"
                        onClick={() => handleSimulateStateProgress(ref.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1 px-2.5 rounded-md text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Simulate {simulateCta}
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Rewards Distributed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative block */}
        <div className="p-4 bg-emerald-50/40 border border-emerald-100/50 rounded-xl mt-4 text-xs text-emerald-800 leading-relaxed flex gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span><strong>Automatic Referral Loop:</strong> When a referred friend signs up via the link, they unlock Rs {referralProg.refereeDiscountAmount} on their registration. Once their first order goes green, Rs {referralProg.referrerRewardAmount} instant wallet credit is credited automatically to the inviting party.</span>
        </div>
      </div>
    </div>
  );
}
