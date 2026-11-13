import React, { useState } from 'react';
import ProductShell from './ProductShell';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import { SUPPORT_EMAIL } from '@/lib/businessConfig';

export default function Support() {
  const [prepared, setPrepared] = useState(false);
  const [note, setNote] = useState('');
  const whatsappNumber = useWhatsAppConfig();
  const whatsappUrl = whatsappLinkFromConfig(
    whatsappNumber,
    note.trim() || 'Hello Vantoris Support. I need assistance.'
  );
  const supportEmail = String(SUPPORT_EMAIL || '').trim();

  return (
    <ProductShell
      kicker="Support"
      title="Help"
      subtitle="Prepare a note or use a configured contact channel. This form does not create or send a support ticket."
    >
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline underline-offset-4">
            Open configured WhatsApp support
          </a>
        ) : (
          <p role="status" className="text-slate-600">
            No configured WhatsApp support number is available. No message has been sent.
          </p>
        )}
        {supportEmail ? (
          <a href={`mailto:${supportEmail}`} className="block font-semibold text-navy underline underline-offset-4">
            Email configured support
          </a>
        ) : (
          <p className="text-xs text-slate-500">No support email is configured in this application.</p>
        )}
      </div>

      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); setPrepared(false); }}
        placeholder="What do you need help with?"
        className="mt-4 h-28 w-full rounded-xl border border-slate-200 p-3 text-sm"
      />
      <button
        type="button"
        disabled={!note.trim() || prepared}
        onClick={() => setPrepared(true)}
        className="mt-3 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {prepared ? 'Note prepared locally' : 'Prepare support note'}
      </button>
      {prepared && (
        <p role="status" className="mt-3 text-xs leading-relaxed text-slate-500">
          This note remains in this page only. It has not been sent or saved and is not a support ticket. Use a configured contact channel above to send it.
        </p>
      )}
      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        Card freezes and external payment disputes are not handled by this form. If you already hold a card, contact its issuer through the verified details printed on the card or statement.
      </p>
    </ProductShell>
  );
}
