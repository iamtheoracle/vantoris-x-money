import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Megaphone } from 'lucide-react';

const ASSETS = [
  {
    title: 'Brand system',
    img: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1000&q=80',
    caption: 'Navy · brass · institutional type',
  },
  {
    title: 'Campaign photography',
    img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=80',
    caption: 'Team and product storytelling',
  },
  {
    title: 'Member lifestyle',
    img: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1000&q=80',
    caption: 'Everyday banking moments',
  },
  {
    title: 'Impact & HeroBox',
    img: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1000&q=80',
    caption: 'Care packages and community',
  },
];

export default function DiscoverMarketing() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28">
      <div className="sticky top-0 z-10 bg-white/95 border-b border-slate-200 px-4 py-3 flex items-center gap-3 backdrop-blur-md">
        <Link to="/discover" className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-heading font-bold text-navy">Member marketing</h1>
      </div>

      <div className="relative h-44 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy to-navy/40" />
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <p className="font-mono text-[10px] text-brass uppercase tracking-wider flex items-center gap-1">
            <Megaphone size={12} /> Brand kit
          </p>
          <p className="font-heading text-2xl font-bold mt-1">Templates & imagery</p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {ASSETS.map((a) => (
          <figure key={a.title} className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
            <div className="aspect-[4/3] relative bg-slate-100">
              <img src={a.img} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <figcaption className="p-3">
              <p className="font-heading font-bold text-navy text-sm">{a.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{a.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="px-4 pb-6">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 flex gap-3">
          <ImageIcon className="text-brass shrink-0" size={20} />
          <p>
            Import campaign images after module activation. Ops can refresh assets on a schedule from approved
            libraries—never unauthorized scrapes.
          </p>
        </div>
      </div>
    </div>
  );
}
