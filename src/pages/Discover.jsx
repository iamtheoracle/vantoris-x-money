import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Heart, Newspaper, Globe2, Megaphone, Package,
  ChevronRight, Plane, Building2, BriefcaseBusiness,
} from 'lucide-react';

const MODULES = [
  {
    id: 'investment',
    title: 'Investment',
    desc: 'Portfolio records and provider availability',
    icon: TrendingUp,
    route: '/investment',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80',
    color: 'from-navy to-[#0E2A4A]',
  },
  {
    id: 'herobox',
    title: 'HeroBox',
    desc: 'Care packages and fulfilment availability',
    icon: Package,
    route: '/herobox',
    image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80',
    color: 'from-[#0B3D2E] to-navy',
  },
  {
    id: 'ngo',
    title: 'NGO & impact',
    desc: 'Public cause discovery; no partnership implied',
    icon: Heart,
    route: '/discover/ngo',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80',
    color: 'from-[#3B1F4A] to-navy',
  },
  {
    id: 'news',
    title: 'Markets & news',
    desc: 'Approved news feed when a verified source is connected',
    icon: Newspaper,
    route: '/discover/news',
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=900&q=80',
    color: 'from-[#1a2332] to-[#0A1628]',
  },
  {
    id: 'fx',
    title: 'Currency desk',
    desc: 'Indicative reference rates; not executable FX',
    icon: Globe2,
    route: '/discover/fx',
    image: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=900&q=80',
    color: 'from-[#1F3A5F] to-navy',
  },
  {
    id: 'marketing',
    title: 'Member marketing',
    desc: 'Visual references and approved brand assets',
    icon: Megaphone,
    route: '/discover/marketing',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80',
    color: 'from-[#4A3728] to-navy',
  },
  {
    id: 'flights',
    title: 'Flight information',
    desc: 'Licensed flight-data provider required',
    icon: Plane,
    route: '/discover/flights',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80',
    color: 'from-[#0A3A5C] to-navy',
  },
  {
    id: 'housing',
    title: 'Property',
    desc: 'Verified property listings required',
    icon: Building2,
    route: '/discover/housing',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
    color: 'from-[#2A4A3A] to-navy',
  },
  {
    id: 'services',
    title: 'Client services',
    desc: 'Service requests and assistance',
    icon: BriefcaseBusiness,
    route: '/services',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    color: 'from-[#26364A] to-navy',
  },
];

export default function Discover() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28">
      <div className="relative overflow-hidden bg-navy px-5 pb-10 pt-6 text-white">
        <div className="absolute inset-0 opacity-40">
          <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/80 to-navy" />
        </div>
        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">Vantoris Private Institution</p>
          <h1 className="mt-1 font-heading text-2xl font-bold">Products & services</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
            Explore the connected client spaces. Each destination shows its current data, provider availability, and access requirements. Browsing this page does not activate a service or grant permissions.
          </p>
          <Link to="/services" className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15">
            Contact client services <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-5 py-6 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <article key={mod.id} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <Link to={mod.route} className="block text-left">
                <div className="relative h-36 bg-slate-200">
                  <img src={mod.image} alt="" className="h-full w-full object-cover" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                  <div className={'absolute inset-0 bg-gradient-to-t ' + mod.color + ' opacity-70'} />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="flex items-center gap-2 font-heading text-lg font-bold text-white"><Icon size={18} /> {mod.title}</p>
                      <p className="mt-0.5 text-xs text-white/80">{mod.desc}</p>
                    </div>
                    <ChevronRight size={20} className="text-white/80" />
                  </div>
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Availability shown in workspace</span>
                <Link to={mod.route} className="inline-flex items-center gap-1 text-xs font-bold text-navy">
                  Open <ChevronRight size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
