import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const ORGS = [
  { name: 'UNHCR', url: 'https://www.unhcr.org/', focus: 'Refugees', img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80' },
  { name: 'Caritas', url: 'https://www.caritas.org/', focus: 'Local aid', img: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&q=80' },
  { name: 'Operation Homefront', url: 'https://operationhomefront.org/', focus: 'Military families', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80' },
];

export default function DiscoverNGO() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-24">
      <div className="sticky top-0 z-10 bg-white/95 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Link to="/discover" className="p-1.5 rounded-lg hover:bg-slate-100"><ArrowLeft size={20} /></Link>
        <h1 className="font-heading font-bold text-navy">NGO & impact</h1>
      </div>
      <div className="p-4 space-y-4">
        {ORGS.map((o) => (
          <a key={o.name} href={o.url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <img src={o.img} alt="" className="h-32 w-full object-cover" loading="lazy" />
            <div className="p-4 flex justify-between items-center">
              <div>
                <p className="font-heading font-bold text-navy">{o.name}</p>
                <p className="text-xs text-slate-500">{o.focus}</p>
              </div>
              <ExternalLink size={16} className="text-brass" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
