import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

/** Curated desk stories with real photography (Unsplash). */
const STORIES = [
  {
    title: 'Central banks and the path of rates',
    source: 'Markets',
    img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    blurb: 'How policy rates shape deposit, mortgage, and portfolio planning for members.',
    tag: 'Rates',
  },
  {
    title: 'Cross-border payments: cost and clarity',
    source: 'Treasury',
    img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Wires and FX spreads—verify beneficiaries before you release funds.',
    tag: 'Payments',
  },
  {
    title: 'Humanitarian funding under pressure',
    source: 'Impact',
    img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    blurb: 'NGO partners face record gaps; local responders need flexible support.',
    tag: 'NGO',
  },
  {
    title: 'Military families and financial continuity',
    source: 'HeroBox',
    img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Deployment and PCS moves change cash flow—tools that travel with the member.',
    tag: 'Military',
  },
  {
    title: 'Real assets vs liquid reserves',
    source: 'Wealth',
    img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Property diligence and cash buffers before leverage—education, not advice.',
    tag: 'Property',
  },
  {
    title: 'Card spend and statement hygiene',
    source: 'Retail banking',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    blurb: 'U.S.-style statements, masks, and dispute windows members recognize.',
    tag: 'Cards',
  },
];

export default function DiscoverNews() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28">
      <div className="sticky top-0 z-10 bg-white/95 border-b border-slate-200 px-4 py-3 flex items-center gap-3 backdrop-blur-md">
        <Link to="/discover" className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-heading font-bold text-navy">Markets & news</h1>
      </div>

      <div className="p-4 space-y-5">
        {STORIES.map((s, i) => (
          <article
            key={s.title}
            className={`rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm ${
              i === 0 ? 'ring-1 ring-brass/20' : ''
            }`}
          >
            <div className={`relative ${i === 0 ? 'h-52' : 'h-40'}`}>
              <img src={s.img} alt="" className="w-full h-full object-cover" loading="lazy" />
              <span className="absolute top-3 left-3 rounded-full bg-navy/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                {s.tag}
              </span>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-mono uppercase text-brass tracking-wider">{s.source}</p>
              <h2 className="font-heading font-bold text-navy text-lg mt-1 leading-snug">{s.title}</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{s.blurb}</p>
            </div>
          </article>
        ))}
        <p className="text-[11px] text-slate-400 px-1 leading-relaxed">
          Editorial previews for members. Photography via Unsplash. Not personalized investment advice.
        </p>
      </div>
    </div>
  );
}
