import React, { useState } from 'react';
import ProductShell from './ProductShell';

export default function Support() {
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState('');

  return (
    <ProductShell kicker="Support" title="Help" subtitle="A ticket is recorded only after you submit. Ask does not create tickets.">
      <div className="space-y-3 text-sm text-slate-600">
        <p>US +1 (205) 568-8741</p>
        <p>UK +44 7404 767964</p>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What do you need help with?"
        className="mt-4 h-28 w-full rounded-xl border border-slate-200 p-3 text-sm"
      />
      <button
        type="button"
        disabled={!note.trim() || sent}
        onClick={() => setSent(true)}
        className="mt-3 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {sent ? 'Noted locally — not a ticket yet' : 'Prepare support note'}
      </button>
      {sent && (
        <p className="mt-3 text-xs text-slate-500">
          This note is not a support ticket. Ticket creation requires the support provider, which is not connected.
        </p>
      )}
    </ProductShell>
  );
}
