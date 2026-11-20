import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Compass, Heart, Newspaper, ShieldCheck, RefreshCw } from 'lucide-react';

/** Read-only discovery feed. Only backend-approved/verified records are displayed. */
export default function DiscoverFeed({ onShop, onDonate, standalone = false }) {
  const [data, setData] = useState({ organizations: [], cases: [], news: [] });
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [organizations, cases, news] = await Promise.all([
        base44.entities.OrganizationProfile.filter({ status: { $in: ['approved', 'active'] } }, '-date_discovered', 50).catch(() => []),
        base44.entities.HumanitarianCase.filter({ case_status: { $in: ['approved', 'active'] } }, '-date_discovered', 30).catch(() => []),
        base44.entities.NewsRecord.filter({ verification_status: { $in: ['verified', 'partially_verified'] }, status: 'active' }, '-discovered_date', 20).catch(() => []),
      ]);
      setData({ organizations: Array.isArray(organizations) ? organizations : [], cases: Array.isArray(cases) ? cases : [], news: Array.isArray(news) ? news : [] });
    } catch {
      setError('Discovery records could not be loaded. No unverified content is shown.');
    } finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const items = useMemo(() => {
    const all = [
      ...data.organizations.map(item => ({ ...item, kind: 'organization', title: item.name || 'Organization', description: item.description || item.mission || 'No description supplied.', meta: item.location || item.organization_type || 'Organization', verified: true })),
      ...data.cases.map(item => ({ ...item, kind: 'case', title: item.case_title || 'Humanitarian need', description: item.stated_need || item.description || 'No need description supplied.', meta: item.location || item.category || 'Humanitarian case', verified: true })),
      ...data.news.map(item => ({ ...item, kind: 'news', title: item.headline || 'Humanitarian news', description: item.summary || 'No summary supplied.', meta: item.source_name || 'Source not supplied', verified: true })),
    ];
    return all.filter(item => (category === 'all' || item.kind === category) && (!query.trim() || [item.title, item.description, item.meta].some(value => String(value || '').toLowerCase().includes(query.toLowerCase()))));
  }, [data, category, query]);

  const Icon = standalone ? Compass : Heart;
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brass"><Icon size={15} /> {standalone ? 'Discovery' : 'HeroBox'}</p><h1 className="text-2xl font-bold text-navy sm:text-3xl">{standalone ? 'Verified discovery' : 'Discover trusted opportunities'}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Only approved organization and case records and verified news returned by the backend are displayed. Discovery does not authorize donations or payments.</p></div><button type="button" onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button></header>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row"><label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search size={16} className="text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search approved discovery records" aria-label="Search discovery records" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filter discovery category" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="all">All records</option><option value="organization">Organizations</option><option value="case">Humanitarian needs</option><option value="news">Verified news</option></select></div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500" role="status">Loading approved records…</div> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><ShieldCheck size={28} className="mx-auto mb-3 text-slate-400" /><h2 className="font-semibold text-navy">No matching approved records</h2><p className="mt-1 text-sm text-slate-500">Try another search or return later. Unverified records are intentionally hidden.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <article key={item.id || item.title + index} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center justify-between gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{item.kind === 'case' ? 'Humanitarian need' : item.kind}</span><span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><ShieldCheck size={12} /> Backend approved</span></div><h2 className="text-lg font-semibold text-navy">{item.title}</h2><p className="mt-2 line-clamp-4 flex-1 text-sm leading-relaxed text-slate-600">{item.description}</p><p className="mt-4 text-xs text-slate-400">{item.meta}</p>{item.kind === 'case' && onDonate && <button type="button" onClick={() => onDonate(item)} className="mt-4 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white">Review support options</button>}{item.kind === 'organization' && onShop && <button type="button" onClick={() => onShop(item)} className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-navy">Explore organization</button>}</article>)}</div>}
      <p className="mt-5 text-[11px] text-slate-400">Results are limited to the records returned by the connected backend; the list is not guaranteed to be exhaustive.</p>
    </section>
  );
}
