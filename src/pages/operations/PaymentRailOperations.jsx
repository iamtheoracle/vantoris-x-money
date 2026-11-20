import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { ArrowDownToLine, ArrowUpRight, ClipboardCheck, ShieldCheck, Landmark, AlertTriangle } from 'lucide-react';

const rails = [
  { name: 'ACH', direction: 'Incoming and outgoing', timing: 'Typically slower; settlement and return timing depend on the bank', control: 'Standard review, available-funds check, duplicate check and bank reconciliation' },
  { name: 'Domestic Fedwire', direction: 'Incoming and outgoing', timing: 'Time-sensitive bank wire; cutoff and fees are set by the bank', control: 'Enhanced beneficiary review, dual authorization and bank-reference reconciliation' },
];

const gates = [
  'Confirm AVCU legal applicant and authorized sponsor-bank relationship',
  'Obtain written bank approval for ACH origination/receipt and Fedwire origination/receipt',
  'Confirm bank-approved instructions, limits, cutoffs, fees and return/recall procedures',
  'Approve member disclosures, fraud screening and sanctions controls',
  'Test role separation, dual approval, idempotency and immutable audit events',
  'Reconcile bank statements and bank-generated payment references before marking settled',
];

export default function PaymentRailOperations() {
  return (
    <OperationsPageLayout title="Payment rail operations" description="Manual ACH and domestic wire processing readiness" icon={Landmark}>
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6 flex gap-3">
        <AlertTriangle className="text-amber-400 shrink-0" size={20} />
        <div>
          <p className="text-white font-semibold text-sm">Live payment processing is disabled</p>
          <p className="text-[#AAB4C3] text-xs mt-1">This workspace is an operational readiness guide. It does not submit payments, debit member balances, or confirm settlement. Only an authorized banking partner can execute the actual ACH or Fedwire transaction.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {rails.map((rail, index) => {
          const Icon = index === 0 ? ArrowUpRight : ArrowDownToLine;
          return (
            <section key={rail.name} className="vantoris-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-xl bg-brass/10 text-brass flex items-center justify-center"><Icon size={20} /></span>
                <div><h2 className="text-white font-semibold">{rail.name}</h2><p className="text-[#AAB4C3] text-xs">{rail.direction}</p></div>
              </div>
              <p className="text-[#AAB4C3] text-sm">{rail.timing}</p>
              <div className="mt-4 pt-4 border-t border-[#242D38]">
                <p className="text-white text-xs font-semibold uppercase tracking-wider mb-1">Required controls</p>
                <p className="text-[#AAB4C3] text-xs">{rail.control}</p>
              </div>
            </section>
          );
        })}
      </div>

      <section className="vantoris-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4"><ClipboardCheck className="text-brass" size={19}/><h2 className="text-white font-semibold">Production approval checklist</h2></div>
        <div className="space-y-3">
          {gates.map((gate, index) => (
            <div key={gate} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#242D38] text-[#AAB4C3] text-xs flex items-center justify-center shrink-0">{index + 1}</span>
              <p className="text-[#AAB4C3] text-sm">{gate}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="vantoris-card p-5 mb-6 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-2"><AlertTriangle className="text-amber-400" size={18}/><h2 className="text-white font-semibold">Existing withdrawal queue is not a bank rail</h2></div>
        <p className="text-[#AAB4C3] text-sm leading-6">The legacy withdrawal screen is a separate workflow and its financial mutations are disabled. A queued request, internal approval, or legacy “paid” label is not proof of an ACH or Fedwire settlement. Do not enable its client-side mutation flag; requests must be processed and reconciled through an approved bank channel.</p>
      </section>

      <section className="vantoris-card p-5">
        <div className="flex items-center gap-2 mb-2"><ShieldCheck className="text-brass" size={19}/><h2 className="text-white font-semibold">Manual processing rule</h2></div>
        <p className="text-[#AAB4C3] text-sm leading-6">An operator may use only the sponsor bank's approved portal and credentials. Record the bank-generated reference and supporting evidence after the bank accepts the instruction. A member request or internal approval is not proof that money has moved. Mark a payment settled only after reliable bank evidence and reconciliation.</p>
      </section>
    </OperationsPageLayout>
  );
}
