import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Bell, Search, ShieldAlert } from 'lucide-react';

export default function OperationsNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    base44.entities.Notification.list('-created_date', 100).then((rows) => {
      if (!Array.isArray(rows)) throw new Error('Notification source returned an invalid response.');
      if (active) setNotifications(rows);
    }).catch(() => {
      if (active) setError('Notification records are unavailable. No empty-queue conclusion can be drawn.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = notifications.filter((item) =>
    (item.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.message || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <OperationsPageLayout title="Notifications" description="Read-only notification records. Financial decisions must use the dedicated server-authorized review workflow." icon={Bell}>
      <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
        <p>Notifications cannot approve, decline, or post financial transactions. This screen does not change account balances or transaction status.</p>
      </div>
      {loading ? <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass rounded-full" /></div> : error ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</p>
      ) : (
        <>
          <div className="relative mb-6"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAB4C3]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notification records" className="w-full rounded-xl border border-[#242D38] bg-[#242D38] py-3 pl-10 pr-4 text-sm text-white focus:border-brass/50 focus:outline-none" /></div>
          <div className="vantoris-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#242D38] bg-[#1a2535]">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Title</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Message</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Type</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Status</th>
              </tr></thead>
              <tbody>{filtered.map((item) => <tr key={item.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20">
                <td className="px-5 py-4 text-xs font-medium text-white">{item.title || 'Title not supplied'}</td>
                <td className="max-w-xs truncate px-5 py-4 text-xs text-[#AAB4C3]">{item.message || 'Message not supplied'}</td>
                <td className="px-5 py-4 text-xs text-[#AAB4C3]">{item.type || 'Type not supplied'}</td>
                <td className="px-5 py-4 text-xs text-[#AAB4C3]">{item.created_date ? new Date(item.created_date).toLocaleDateString() : 'Date not supplied'}</td>
                <td className="px-5 py-4 text-xs text-[#AAB4C3]">{item.status || 'Status not supplied'}</td>
              </tr>)}
              {!filtered.length && <tr><td colSpan={5} className="py-12 text-center text-[#AAB4C3]">No notification records returned by the current query (max 100).</td></tr>}</tbody>
            </table>
          </div>
        </>
      )}
    </OperationsPageLayout>
  );
}
