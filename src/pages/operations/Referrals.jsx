import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { formatCurrency } from '@/lib/formatCurrency';
import { Users2 } from 'lucide-react';

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [refs, usrs, accts] = await Promise.all([
        base44.entities.Referral.list('-created_date', 200),
        base44.entities.User.list('-created_date', 200),
        base44.entities.Account.list('-created_date', 200),
      ]);
      setReferrals(refs);
      setUsers(usrs);
      setAccounts(accts);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function getUser(id) { return users.find(u => u.id === id); }

  // Build a summary per referrer
  const referrerStats = {};
  referrals.forEach(r => {
    if (!referrerStats[r.referrer_id]) {
      referrerStats[r.referrer_id] = { count: 0, names: [] };
    }
    referrerStats[r.referrer_id].count++;
    referrerStats[r.referrer_id].names.push(r.referred_name || r.referred_email || '—');
  });

  if (loading) {
    return (
      <OperationsPageLayout title="Referrals" description="Track member referral activity" icon={Users2}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout title="Referrals" description="Track member referral activity and signup sources" icon={Users2}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="vantoris-card p-4">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider">Total Referrals</p>
          <p className="text-2xl font-bold text-white mt-1">{referrals.length}</p>
        </div>
        <div className="vantoris-card p-4">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider">Active Referrers</p>
          <p className="text-2xl font-bold text-white mt-1">{Object.keys(referrerStats).length}</p>
        </div>
        <div className="vantoris-card p-4">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider">Top Referrer</p>
          <p className="text-lg font-bold text-brass mt-1">
            {Object.entries(referrerStats).sort((a, b) => b[1].count - a[1].count)[0]
              ? getUser(Object.entries(referrerStats).sort((a, b) => b[1].count - a[1].count)[0][0])?.full_name || '—'
              : '—'}
          </p>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Referred By</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">New Member</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map(ref => {
              const referrer = getUser(ref.referrer_id);
              const referred = getUser(ref.referred_id);
              const referredAccts = accounts.filter(a => a.user_id === ref.referred_id);
              const referredBalance = referredAccts.reduce((s, a) => s + (a.balance || 0), 0);
              return (
                <tr key={ref.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                  <td className="px-5 py-4">
                    <p className="text-white font-medium text-sm">{referrer?.full_name || '—'}</p>
                    <p className="text-[#AAB4C3] text-xs">{referrer?.email || ''}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white text-sm font-medium">{referred?.full_name || ref.referred_name || ref.referred_email || '—'}</p>
                    <p className="text-[#AAB4C3] text-xs">{referred?.email || ref.referred_email || ''}</p>
                    {referredBalance > 0 && (
                      <p className="text-emerald-400 text-xs mt-0.5">{formatCurrency(referredBalance)}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[#AAB4C3] text-xs">
                    {new Date(ref.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      ref.status === 'completed'
                        ? 'bg-olive/20 text-emerald-400 border-olive/30'
                        : 'bg-brass/15 text-brass border-brass/30'
                    }`}>
                      {ref.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {referrals.length === 0 && (
              <tr><td colSpan={4} className="py-12 text-center text-[#AAB4C3]">No referrals yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </OperationsPageLayout>
  );
}