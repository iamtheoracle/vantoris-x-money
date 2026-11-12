import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Users2, AlertTriangle } from 'lucide-react';

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      base44.entities.Referral.list('-created_date', 200),
      base44.entities.User.list('-created_date', 200),
    ]).then(([refs, members]) => {
      if (!Array.isArray(refs) || !Array.isArray(members)) throw new Error('Referral source returned an invalid response.');
      if (active) { setReferrals(refs); setUsers(members); }
    }).catch(() => {
      if (active) setError('Referral records are unavailable. No empty-program conclusion can be drawn.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const getUser = (id) => users.find((user) => user.id === id);
  const referrerStats = {};
  referrals.forEach((referral) => {
    if (!referral.referrer_id) return;
    if (!referrerStats[referral.referrer_id]) referrerStats[referral.referrer_id] = { count: 0 };
    referrerStats[referral.referrer_id].count += 1;
  });
  const topReferrer = Object.entries(referrerStats).sort((a, b) => b[1].count - a[1].count)[0];

  return (
    <OperationsPageLayout title="Referrals" description="Read-only referral records. Referred members' account balances and private financial details are never exposed here." icon={Users2}>
      <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">
        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
        <p>Counts reflect the 200 newest referral records and member records returned by the source. Referral activity does not disclose a referred person's assets, account balances or investment holdings.</p>
      </div>
      {loading ? <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" /></div> : error ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="vantoris-card p-4"><p className="text-xs uppercase tracking-wider text-[#AAB4C3]">Referral records returned · max 200</p><p className="mt-1 text-2xl font-bold text-white">{referrals.length}</p></div>
            <div className="vantoris-card p-4"><p className="text-xs uppercase tracking-wider text-[#AAB4C3]">Referrer records in returned set</p><p className="mt-1 text-2xl font-bold text-white">{Object.keys(referrerStats).length}</p></div>
            <div className="vantoris-card p-4"><p className="text-xs uppercase tracking-wider text-[#AAB4C3]">Top referrer in returned set</p><p className="mt-1 text-lg font-bold text-brass">{topReferrer ? getUser(topReferrer[0])?.full_name || 'Member record not returned' : 'Not available'}</p></div>
          </div>
          <div className="vantoris-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#242D38] bg-[#1a2535]">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Referred by</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">New member</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Status</th>
              </tr></thead>
              <tbody>{referrals.map((referral) => {
                const referrer = getUser(referral.referrer_id);
                const referred = getUser(referral.referred_id);
                return <tr key={referral.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20">
                  <td className="px-5 py-4"><p className="text-sm font-medium text-white">{referrer?.full_name || 'Member record not returned'}</p><p className="text-xs text-[#AAB4C3]">{referrer?.email || 'Email not supplied'}</p></td>
                  <td className="px-5 py-4"><p className="text-sm font-medium text-white">{referred?.full_name || referral.referred_name || 'Member name not supplied'}</p><p className="text-xs text-[#AAB4C3]">{referred?.email || referral.referred_email || 'Email not supplied'}</p></td>
                  <td className="px-5 py-4 text-xs text-[#AAB4C3]">{dateLabel(referral.created_date)}</td>
                  <td className="px-5 py-4 text-xs text-[#AAB4C3]">{referral.status || 'Status not supplied'}</td>
                </tr>;
              })}
              {!referrals.length && <tr><td colSpan={4} className="py-12 text-center text-[#AAB4C3]">No referral records returned by the current query.</td></tr>}</tbody>
            </table>
          </div>
        </>
      )}
    </OperationsPageLayout>
  );
}
