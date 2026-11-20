import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Activity, FileText, ArrowDownToLine, Users, Wallet } from 'lucide-react';

export default function ActivityTimeline() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [apps, withdrawals, accounts, transactions] = await Promise.all([
          base44.entities.Application.list('-created_date', 20),
          base44.entities.WithdrawalRequest.list('-created_date', 20),
          base44.entities.Account.list('-created_date', 20),
          base44.entities.Transaction.list('-created_date', 20),
        ]);

        const timeline = [
          ...apps.map(a => ({ id: `app-${a.id}`, type: 'Application', label: a.full_name, detail: a.account_type, date: a.created_date, icon: FileText })),
          ...withdrawals.map(w => ({ id: `wd-${w.id}`, type: 'Withdrawal', label: w.method, detail: `$${w.amount}`, date: w.created_date, icon: ArrowDownToLine })),
          ...accounts.map(a => ({ id: `acct-${a.id}`, type: 'Account', label: a.account_name, detail: a.account_type, date: a.created_date, icon: Wallet })),
          ...transactions.map(t => ({ id: `txn-${t.id}`, type: 'Transaction', label: t.description || t.type, detail: t.type, date: t.created_date, icon: Activity })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);

        setItems(timeline);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  return (
    <OperationsPageLayout title="Activity Timeline" description="Real-time platform activity across all modules" icon={Activity}>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="vantoris-card p-12 text-center">
          <Activity size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
          <p className="text-[#AAB4C3] text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="vantoris-card p-5">
          <div className="space-y-0">
            {items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-start gap-4 py-3 border-b border-[#242D38]/40 last:border-0">
                  <div className="relative flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#242D38] flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-brass" />
                    </div>
                    {idx < items.length - 1 && <div className="w-px h-8 bg-[#242D38] mt-1" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <span className="text-[#AAB4C3] text-xs">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[#AAB4C3] text-xs">
                      <span className="text-brass">{item.type}</span> · {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </OperationsPageLayout>
  );
}