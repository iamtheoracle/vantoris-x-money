import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp } from 'lucide-react';

/** Live reference rates via Frankfurter (ECB-based, no API key). */
const QUOTES = ['EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'MXN', 'ZAR'];

export default function DiscoverFX() {
  const [rates, setRates] = useState([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const url = `https://api.frankfurter.app/latest?from=USD&to=${QUOTES.join(',')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Rate feed unavailable');
      const data = await res.json();
      setDate(data.date || '');
      const list = Object.entries(data.rates || {}).map(([code, rate]) => ({
        pair: `USD/${code}`,
        rate: Number(rate),
        // invert for EUR/USD style where useful
        inv: code === 'EUR' || code === 'GBP' ? (1 / Number(rate)) : null,
        invPair: code === 'EUR' || code === 'GBP' ? `${code}/USD` : null,
      }));
      setRates(list);
    } catch (e) {
      setError(e.message || 'Could not load rates');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28">
      <div className="sticky top-0 z-10 bg-white/95 border-b border-slate-200 px-4 py-3 flex items-center gap-3 backdrop-blur-md">
        <Link to="/discover" className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-navy">Currency desk</h1>
          <p className="text-[11px] text-slate-500 font-mono">
            {date ? `ECB ref · ${date}` : 'Live reference'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="p-2 rounded-full hover:bg-slate-100 text-navy"
          aria-label="Refresh rates"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="relative h-36 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1624996752380-8ec242e0f85d?w=1200&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <p className="font-mono text-[10px] text-brass uppercase tracking-wider">USD base</p>
          <p className="font-heading font-bold text-xl">Real reference rates</p>
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Sourced from Frankfurter / European Central Bank daily references. Not a tradable quote—use for
          planning only.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-crimson/20 bg-crimson/5 px-4 py-3 text-sm text-crimson">
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          {loading && !rates.length ? (
            <div className="py-16 flex justify-center">
              <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
            </div>
          ) : (
            rates.map((r) => (
              <div
                key={r.pair}
                className="flex items-center justify-between px-4 py-3.5 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-navy/5 flex items-center justify-center">
                    <TrendingUp size={16} className="text-brass" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold text-navy">{r.pair}</p>
                    {r.invPair && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        {r.invPair} {r.inv?.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
                <p className="font-mono text-base font-bold tabular-nums text-navy">
                  {r.rate >= 100 ? r.rate.toFixed(2) : r.rate.toFixed(4)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
