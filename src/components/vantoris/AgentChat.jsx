import React from 'react';

/**
 * Legacy chat surface retained as a safe compatibility component.
 * It has no Base44, private-record, account, ledger or staff-operation access.
 */
export default function AgentChat() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6" role="status">
      <h2 className="font-semibold text-navy">Vantoris Intelligence is unavailable</h2>
      <p className="mt-2 text-sm text-slate-600">
        The optional assistant is disabled until its first-party private endpoint and access controls are verified.
      </p>
    </section>
  );
}
