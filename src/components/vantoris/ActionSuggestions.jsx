import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Loader2, FileCheck, ArrowDownToLine, UserPlus, CreditCard, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  {
    key: 'kyc',
    label: 'KYC Reviews',
    icon: FileCheck,
    color: 'gold',
    fetch: () => base44.entities.VerificationRequest.filter({ status: 'pending' }, '-created_date', 5),
    buildActions: (item) => [
      { label: 'Approve', query: `Approve the pending KYC/funding verification request for $${item.amount?.toLocaleString() || 'N/A'} via ${item.method}. Request ID: ${item.id}. Add admin note: "Approved via AI Assistant."`, variant: 'approve' },
      { label: 'Reject', query: `Reject the pending KYC/funding verification request for $${item.amount?.toLocaleString() || 'N/A'} via ${item.method}. Request ID: ${item.id}. Add admin note: "Rejected via AI Assistant."`, variant: 'reject' },
    ],
    getTitle: (item) => `$${(item.amount || 0).toLocaleString()} · ${item.method}`,
    getSub: (item) => `Funding verification pending`,
  },
  {
    key: 'applications',
    label: 'Account Applications',
    icon: UserPlus,
    color: 'navy',
    fetch: () => base44.entities.Application.filter({ application_status: 'pending' }, '-created_date', 5),
    buildActions: (item) => [
      { label: 'Approve', query: `Approve the account application for ${item.full_name} (${item.account_type} account). Application ID: ${item.id}. Set opening balance to $${item.opening_balance || 0}.`, variant: 'approve' },
      { label: 'Reject', query: `Reject the account application for ${item.full_name}. Application ID: ${item.id}.`, variant: 'reject' },
    ],
    getTitle: (item) => item.full_name || 'Unknown',
    getSub: (item) => `${item.account_type} account · $${(item.opening_balance || 0).toLocaleString()}`,
  },
  {
    key: 'withdrawals',
    label: 'Withdrawal Requests',
    icon: ArrowDownToLine,
    color: 'crimson',
    fetch: () => base44.entities.WithdrawalRequest.filter({ status: 'pending' }, '-created_date', 5),
    buildActions: (item) => [
      { label: 'Process', query: `Process the pending withdrawal of $${item.amount?.toLocaleString() || 'N/A'} via ${item.method}. Withdrawal ID: ${item.id}. Mark as paid.`, variant: 'approve' },
      { label: 'Reject', query: `Reject the pending withdrawal of $${item.amount?.toLocaleString() || 'N/A'} via ${item.method}. Withdrawal ID: ${item.id}. Mark as rejected.`, variant: 'reject' },
    ],
    getTitle: (item) => `$${(item.amount || 0).toLocaleString()} · ${item.method}`,
    getSub: (item) => `Withdrawal pending`,
  },
  {
    key: 'services',
    label: 'Service Requests',
    icon: CreditCard,
    color: 'champagne',
    fetch: () => base44.entities.ServiceRequest.filter({ status: 'pending' }, '-created_date', 5),
    buildActions: (item) => [
      { label: 'Approve', query: `Approve the service request for ${item.service_type}. Service Request ID: ${item.id}.`, variant: 'approve' },
      { label: 'Reject', query: `Reject the service request for ${item.service_type}. Service Request ID: ${item.id}.`, variant: 'reject' },
    ],
    getTitle: (item) => item.service_type,
    getSub: (item) => item.details?.slice(0, 60) || 'Service request pending',
  },
];

const VARIANT_STYLES = {
  approve: 'bg-mint/10 text-mint border-mint/20 hover:bg-mint/20',
  reject: 'bg-crimson/10 text-crimson border-crimson/20 hover:bg-crimson/20',
};

const ICON_BG = {
  gold: 'bg-gold/10 text-gold',
  navy: 'bg-navy/10 text-navy',
  crimson: 'bg-crimson/10 text-crimson',
  champagne: 'bg-champagne/10 text-champagne',
};

export default function ActionSuggestions({ onAction }) {
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const results = {};
      await Promise.all(
        CATEGORIES.map(async (cat) => {
          try {
            const data = await cat.fetch();
            results[cat.key] = data || [];
          } catch (e) {
            console.error(`Fetch ${cat.key} error:`, e);
            results[cat.key] = [];
          }
        })
      );
      setItems(results);
      setLoading(false);
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-navy" />
      </div>
    );
  }

  const totalCount = Object.values(items).reduce((sum, arr) => sum + arr.length, 0);

  if (totalCount === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center mx-auto mb-2">
          <FileCheck size={20} className="text-mint" />
        </div>
        <p className="text-sm font-medium text-foreground">All caught up!</p>
        <p className="text-xs text-gray mt-1">No pending items requiring action.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray">Pending Actions</span>
        <span className="text-[10px] font-bold bg-crimson/10 text-crimson px-2 py-0.5 rounded-full">{totalCount}</span>
      </div>
      <button
        onClick={() => onAction('Generate a new account with account and routing number. I will provide the member details.')}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy/5 border border-navy/10 text-navy text-xs font-semibold hover:bg-navy/10 transition-all"
      >
        <UserPlus size={14} /> Generate New Account
      </button>
      {CATEGORIES.map((cat) => {
        const catItems = items[cat.key] || [];
        if (catItems.length === 0) return null;
        const Icon = cat.icon;
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon size={12} className="text-gray" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray">{cat.label}</span>
              <span className="text-[10px] text-gray/60">({catItems.length})</span>
            </div>
            <div className="space-y-1.5">
              {catItems.map((item, idx) => {
                const actions = cat.buildActions(item);
                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border border-slate-200 rounded-xl p-2.5"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${ICON_BG[cat.color]}`}>
                        <Icon size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{cat.getTitle(item)}</p>
                        <p className="text-[10px] text-gray truncate">{cat.getSub(item)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {actions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => onAction(action.query)}
                          className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg border transition-all ${VARIANT_STYLES[action.variant]}`}
                        >
                          {action.label}
                        </button>
                      ))}
                      <button
                        onClick={() => onAction(`Show me details for ${cat.label.toLowerCase().replace(/s$/, '')} ID ${item.id}`)}
                        className="px-2 text-[11px] font-semibold py-1.5 rounded-lg border border-slate-200 text-gray hover:bg-slate-50 transition-all"
                        title="Review details"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}