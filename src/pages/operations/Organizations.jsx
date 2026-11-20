import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { Building2 } from 'lucide-react';

export default function Organizations() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const accts = await base44.entities.Account.list('-created_date', 100);
        setAccounts(accts.filter(a => a.account_type === 'Business' || a.account_type === 'Organization'));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  return (
    <OperationsPageLayout title="Organizations" description="Manage institutional and business member accounts" icon={Building2}>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="vantoris-card p-12 text-center">
          <Building2 size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
          <p className="text-white font-medium mb-1">No organizations registered</p>
          <p className="text-[#AAB4C3] text-sm">Business and organization accounts will appear here.</p>
        </div>
      ) : (
        <div className="vantoris-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#242D38] bg-[#1a2535]">
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Organization</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Account #</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Balance</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acct => (
                <tr key={acct.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                  <td className="px-5 py-4 text-white font-medium">{acct.account_name}</td>
                  <td className="px-5 py-4 text-[#AAB4C3] font-mono text-xs">{acct.account_number}</td>
                  <td className="px-5 py-4 text-white">{acct.account_type}</td>
                  <td className="px-5 py-4 text-white font-semibold">{formatCurrency(acct.balance)}</td>
                  <td className="px-5 py-4"><StatusBadge status={acct.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OperationsPageLayout>
  );
}