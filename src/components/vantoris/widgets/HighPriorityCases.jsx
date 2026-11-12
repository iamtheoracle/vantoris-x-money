import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, FileText, ShieldCheck, ShieldX } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function safeDate(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleDateString();
}

export default function HighPriorityCases() {
  const [cases, setCases] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    const safeList = async (request) => {
      try {
        const rows = await request;
        return { rows: Array.isArray(rows) ? rows : [], failed: !Array.isArray(rows) };
      } catch {
        return { rows: [], failed: true };
      }
    };
    (async () => {
      const [withdrawals, applications, verifications] = await Promise.all([
        safeList(base44.entities.WithdrawalRequest.filter({ status: 'pending' })),
        safeList(base44.entities.Application.list('-created_date', 50)),
        safeList(base44.entities.VerificationRequest.filter({ status: 'pending' })),
      ]);
      if (!active) return;
      if ([withdrawals, applications, verifications].some((result) => result.failed)) {
        setStatus('unavailable');
        return;
      }

      const items = [];
      withdrawals.rows.slice(0, 5).forEach((request) => items.push({
        id: request.id,
        type: 'Withdrawal request awaiting review',
        detail: request.reference || 'Request record returned · ' + safeDate(request.created_date),
        icon: ArrowUpRight,
        path: '/operations/withdrawals',
      }));
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      applications.rows.filter((application) => {
        const created = application.created_date ? new Date(application.created_date).getTime() : NaN;
        return application.application_status === 'pending' && Number.isFinite(created) && created < cutoff;
      }).slice(0, 5).forEach((application) => items.push({
        id: application.id,
        type: 'Application review older than 24 hours',
        detail: safeDate(application.created_date),
        icon: FileText,
        path: '/operations/applications',
      }));
      verifications.rows.slice(0, 5).forEach((request) => items.push({
        id: request.id,
        type: 'Verification request awaiting review',
        detail: safeDate(request.created_date),
        icon: ShieldCheck,
        path: '/operations/verification-requests',
      }));
      setCases(items.slice(0, 8));
      setStatus('ready');
    })();
    return () => { active = false; };
  }, []);

  return (
    <section className="vantoris-glass-premium rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle size={16} className="text-crimson" />
        <h3 className="text-sm font-semibold text-foreground">Priority review candidates</h3>
        {status === 'ready' && cases.length > 0 && <span className="ml-auto rounded-full border border-crimson/20 bg-crimson/10 px-2 py-0.5 text-[10px] font-bold text-crimson">{cases.length} returned</span>}
      </div>
      {status === 'loading' ? (
        <p className="py-5 text-center text-xs text-gray">Checking review records…</p>
      ) : status === 'unavailable' ? (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <p>One or more review sources could not be retrieved. No empty-queue conclusion is drawn.</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="py-6 text-center">
          <ShieldX size={24} className="mx-auto mb-2 text-gray/30" />
          <p className="text-xs text-gray">No priority candidates were identified in the returned records.</p>
        </div>
      ) : (
        <div>
          {cases.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.id + item.type} to={item.path} className="flex items-center gap-3 rounded-lg border-b border-slate-100 px-2 py-2.5 last:border-0 hover:bg-slate-50">
                <Icon size={14} className="text-crimson" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-foreground">{item.type}</span>
                  <span className="block truncate text-[11px] text-gray">{item.detail}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[11px] text-gray/70">Candidates are based on returned request records and age only; they are not a complete risk review or evidence of a financial exception.</p>
    </section>
  );
}
