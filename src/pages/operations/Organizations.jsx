import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Building2, AlertTriangle } from 'lucide-react';

function amountLabel(value, currency) {
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Currency not supplied';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Amount not supplied';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); }
  catch { return 'Amount not verified'; }
}

function maskAccount(value) {
  if (!value) return 'Account number not supplied';
  const digits = String(value).replace(/\s/g, '');
  return digits.length > 4 ? '•••• ' + digits.slice(-4) : '••••';
}

export default function Organizations() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    base44.entities.Account.list('-created_date', 100)
      .then((rows) => {
        if (!Array.isArray(rows)) throw new Error('Organization account query returned an invalid shape.');
        if (active) setAccounts(rows.filter((account) => ['Business', 'Organization'].includes(account.account_type)));
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <OperationsPageLayout title="Organization account records" description="Read-only business and organization account records. Account servicing and balance changes are not performed here." icon={Building2} breadcrumb="Operations">
      <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <p className="text-xs leading-5 text-amber-950">This list is a bounded source-record query (limit 100). Account numbers are masked and balances are shown only when a currency is supplied. No organization balance total or account action is inferred.</p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" /></div>
      ) : loadError ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Organization account records are unavailable. This is not confirmation that no organization accounts exist.</p>
      ) : accounts.length === 0 ? (
        <div className="vantoris-card p-12 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-[#AAB4C3] opacity-50" />
          <p className="mb-1 font-medium text-white">No organization account records returned</p>
          <p className="text-sm text-[#AAB4C3]">No business or organization account records were returned by the current query.</p>
        </div>
      ) : (
        <div className="vantoris-card overflow-hidden">
          <div className="border-b border-[#242D38] px-5 py-3 text-xs text-[#AAB4C3]">{accounts.length} organization account records returned</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#242D38] bg-[#1a2535]">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Organization account</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Account number</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Recorded balance</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-[#242D38]/40">
                    <td className="px-5 py-4 font-medium text-white">{account.account_name || 'Name not supplied'}</td>
                    <td className="px-5 py-4 font-mono text-xs text-[#AAB4C3]">{maskAccount(account.account_number)}</td>
                    <td className="px-5 py-4 text-white">{account.account_type || 'Type not supplied'}</td>
                    <td className="px-5 py-4 font-semibold text-white">{amountLabel(account.balance, account.currency || account.currency_code)}</td>
                    <td className="px-5 py-4 text-xs capitalize text-[#AAB4C3]">{account.status ? String(account.status).replace(/_/g, ' ') : 'Status not supplied'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </OperationsPageLayout>
  );
}
