import React from 'react';
import { motion } from 'framer-motion';

const ACCENTS = {
  navy: { text: 'text-navy', bg: 'bg-navy/8', border: 'border-navy/15' },
  gold: { text: 'text-brass', bg: 'bg-brass/10', border: 'border-brass/20' },
  brass: { text: 'text-brass', bg: 'bg-brass/10', border: 'border-brass/20' },
  blue: { text: 'text-champagne', bg: 'bg-champagne/10', border: 'border-champagne/20' },
  champagne: { text: 'text-champagne', bg: 'bg-champagne/10', border: 'border-champagne/20' },
  mint: { text: 'text-mint', bg: 'bg-mint/10', border: 'border-mint/20' },
  crimson: { text: 'text-crimson', bg: 'bg-crimson/10', border: 'border-crimson/20' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  emerald: { text: 'text-mint', bg: 'bg-mint/10', border: 'border-mint/20' },
};

/** Reusable premium KPI card for member and operations dashboards. */
export default function PremiumStatCard({
  label,
  value,
  sublabel = null,
  icon: Icon,
  accent = 'navy',
  alert = null,
  alertIcon: AlertIcon = null,
  onClick = null,
  hero = false,
  className = '',
}) {
  const style = ACCENTS[accent] || ACCENTS.navy;
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag onClick={onClick} whileTap={onClick ? { scale: 0.98 } : undefined} className={'vantoris-glass-premium p-5 text-left transition-all duration-300 ' + (onClick ? 'cursor-pointer hover:shadow-float hover:border-navy/10 ' : '') + (hero ? 'lg:col-span-2 ' : '') + className}>
      <div className="mb-4 flex items-start justify-between">
        <div className={'flex h-11 w-11 items-center justify-center rounded-xl border ' + style.bg + ' ' + style.border}>
          {Icon && <Icon size={20} className={style.text} strokeWidth={2} />}
        </div>
        {alert !== null && alert !== undefined && alert !== '' && <span className={'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + style.bg + ' ' + style.text + ' ' + style.border}>{AlertIcon && <AlertIcon size={10} />}{alert}</span>}
      </div>
      <p className={'break-words font-bold leading-tight tracking-tight text-foreground ' + (hero ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl')}>{value}</p>
      <p className="mt-1.5 text-xs font-medium text-gray">{label}</p>
      {sublabel && <p className="mt-0.5 text-[11px] text-gray/60">{sublabel}</p>}
    </Tag>
  );
}
