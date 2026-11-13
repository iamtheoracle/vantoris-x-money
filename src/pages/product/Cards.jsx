import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProductShell from './ProductShell';
import UnavailableState from '@/components/vantoris/UnavailableState';
import { PROVIDERS } from '@/lib/providers';
import PrivateInvestmentCardGallery from '@/components/vantoris/PrivateInvestmentCardGallery';

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.id) throw new Error('Your authenticated session could not be verified.');
        const rows = await base44.entities.PaymentCard.filter({ user_id: me.id }, '-created_date');
        if (!Array.isArray(rows)) throw new Error('The card record source returned an invalid response.');
        if (active) setCards(rows);
      } catch (error) {
        if (active) setLoadError(error.message || 'Card records could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <ProductShell kicker="Cards" title="Cards" subtitle="Only owner-scoped card records returned by the backend are shown. Issuer controls are not connected.">
      <div className="mb-7 rounded-2xl border border-[#D8CBAE] bg-[#F7F5EF] p-4 sm:p-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B6C35]">Card design collection</p>
        <PrivateInvestmentCardGallery />
      </div>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">
        These are application records only. Card-network status, freezing, spending controls and issuance are not confirmed by this page.
      </p>
      {loading && <p className="text-sm text-slate-500">Loading card records…</p>}
      {!loading && loadError && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {loadError} This is not confirmation that you have no card records.
        </div>
      )}
      {!loading && !loadError && !cards.length && (
        <>
          <UnavailableState title="No card record returned" detail={PROVIDERS.cards.note} />
          <Link to="/services" className="mt-3 inline-block text-sm font-semibold text-navy underline underline-offset-4">
            Request card-service review
          </Link>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            This opens a service request only. It does not issue, activate, freeze, or replace a card.
          </p>
        </>
      )}
      {cards.map((c) => (
        <div key={c.id} className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">{c.card_type || c.brand || 'Card'}</p>
          <p className="mt-1 font-mono text-lg">•••• {String(c.last_four || c.last4 || '').slice(-4) || 'on file'}</p>
          <p className="mt-1 text-xs text-slate-500">Recorded status: {c.status || 'not supplied'}</p>
        </div>
      ))}
    </ProductShell>
  );
}
