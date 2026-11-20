import React from 'react';
import { motion } from 'framer-motion';

export default function MissionKpiCard({ label = 'Metric', value = '—', icon: Icon = null, accent = 'brass', sublabel = null, onClick = null }) {
  const accents = {
    brass: 'bg-brass/10 border-brass/20 text-brass',
    mint: 'bg-mint/10 border-mint/20 text-mint',
    navy: 'bg-navy/8 border-navy/15 text-navy',
    crimson: 'bg-crimson/10 border-crimson/20 text-crimson',
    champagne: 'bg-champagne/10 border-champagne/20 text-champagne',
  };
  const style = accents[accent] || accents.brass;
  return (
    <motion.div whileHover={onClick ? { y: -2 } : undefined} className={'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ' + (onClick ? 'cursor-pointer hover:shadow-md ' : '')} onClick={onClick}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={'flex h-9 w-9 items-center justify-center rounded-xl border ' + style}>{Icon && <Icon size={17} />}</span>
      </div>
      <p className="break-words text-2xl font-bold text-navy">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
      {sublabel && <p className="mt-1 text-[10px] text-slate-400">{sublabel}</p>}
    </motion.div>
  );
}
