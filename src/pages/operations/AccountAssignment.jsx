import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { UserCheck, Search } from 'lucide-react';

export default function AccountAssignment() {
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [accts, usrs] = await Promise.all([
          base44.entities.Account.list('-created_date', 100),
          base44.entities.User.list('-created_date', 100),
        ]);
        if (!Array.isArray(accts) || !Array.isArray(usrs)) throw new Error('Account assignment source returned an invalid response.');
        setAccounts(accts);
        setUsers(usrs);
      } catch (e) { console.error(e); setLoadError('Account or member records are unavailable. No unassigned-member conclusion can be drawn.'); }
      setLoading(false);
    })();
  }, []);

  const getUserName = (userId) => {
    const u = users.find(u => u.id === userId);
    return u ? (u.full_name || 'Member name not supplied') : userId ? 'Member record not returned' : 'Member not linked';
  };

  const filtered = accounts.filter(a =>
    (a.account_name || '').toLowerCase().includes(search.toLowerCase()) ||
    getUserName(a.user_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <OperationsPageLayout title="Account Assignment" description="View account-to-member mappings and assignments" icon={UserCheck}>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{loadError}</p>
      ) : (
        <>
          <p className="mb-4 text-xs text-[#AAB4C3]">Showing up to 100 account records and 100 member records. Account identifiers are masked in this view.</p>
          <div className="relative mb-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by account or member name..."
              className="w-full bg-[#242D38] border border-[#242D38] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
            />
          </div>
          <div className="vantoris-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#242D38] bg-[#1a2535]">
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Account</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Assigned Member</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Balance</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(acct => (
                  <tr key={acct.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium text-sm">{acct.account_name}</p>
                      <p className="text-[#AAB4C3] text-xs font-mono">{acct.account_number ? '•••• ' + String(acct.account_number).slice(-4) : 'Account number not supplied'}</p>
                    </td>
                    <td className="px-5 py-4 text-white text-sm">{getUserName(acct.user_id)}</td>
                    <td className="px-5 py-4 text-white text-sm">{acct.account_type || 'Account type not supplied'}</td>
                    <td className="px-5 py-4 text-white font-semibold text-sm">{formatCurrency(acct.balance, acct.currency || acct.currency_code || null)}</td>
                    <td className="px-5 py-4"><StatusBadge status={acct.status || 'status_not_supplied'} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-[#AAB4C3]">No accounts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </OperationsPageLayout>
  );
}