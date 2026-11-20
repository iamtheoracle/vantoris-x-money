import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * VantorisKPICard — Institutional KPI card for executive dashboards.
 *
 * Props:
 * - label: Metric label (e.g., "Assets Under Management")
 * - value: Formatted value (e.g., "$12.4M")
 * - sublabel: Optional context (e.g., "Total across all accounts")
 * - icon: Lucide icon component
 * - accent: 'navy' | 'gold' | 'blue' | 'mint' | 'crimson' | 'warning'
 * - trend: Optional { value: number, label: string } — shows up/down trend
 * - alert: Optional badge text
 * - alertIcon: Optional Lucide icon for the alert badge
 * - onClick: Makes the card clickable
 * - hero: Spans 2 columns on large screens
 */
const ACCENTS = {
  navy:     { iconBg: 'bg-navy/8',         iconText: 'text-navy',         badge: 'bg-navy/10 text-navy border-navy/15',         hex: '#071C38' },
  gold:     { iconBg: 'bg-brass/10',       iconText: 'text-brass',         badge: 'bg-brass/10 text-brass border-brass/20',     hex: '#C9A227' },
  blue:     { iconBg: 'bg-champagne/10',   iconText: 'text-champagne',     badge: 'bg-champagne/10 text-champagne border-champagne/20', hex: '#1F5EFF' },
  mint:     { iconBg: 'bg-mint/10',        iconText: 'text-mint',          badge: 'bg-mint/10 text-mint border-mint/20',         hex: '#16A34A' },
  crimson:  { iconBg: 'bg-crimson/10',     iconText: 'text-crimson',       badge: 'bg-crimson/10 text-crimson border-crimson/20', hex: '#DC2626' },
  warning:  { iconBg: 'bg-warning/10',     iconText: 'text-warning',       badge: 'bg-warning/10 text-warning border-warning/20', hex: '#F59E0B' },
};

export default function VantorisKPICard({
  label,
  value,
  sublabel = null,
  icon: Icon = null,
  accent = 'navy',
  trend = null,
  alert = null,
  alertIcon: AlertIcon = null,
  onClick = null,
  hero = false,
  className = '',
}) {
  const a = ACCENTS[accent] || ACCENTS.navy;
  const Tag = onClick ? motion.button : motion.div;

  return (
    <Tag
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        'vantoris-glass-premium p-5 text-left transition-all duration-300',
        onClick && 'cursor-pointer hover:shadow-float hover:border-navy/10',
        hero && 'lg:col-span-2',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', a.iconBg)}>
          {Icon && <Icon size={20} className={a.iconText} strokeWidth={2} />}
        </div>
        {alert != null && alert !== '' && (
          <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', a.badge)}>
            {AlertIcon && <AlertIcon size={10} />}
            {alert}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-foreground tracking-tight leading-tight break-words">
        {value}
      </p>
      <p className="text-gray text-xs mt-1.5 font-medium">{label}</p>
      {sublabel && <p className="text-gray/60 text-[11px] mt-0.5">{sublabel}</p>}
      {trend && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
          {trend.value >= 0 ? (
            <TrendingUp size={13} className="text-mint" />
          ) : (
            <TrendingDown size={13} className="text-crimson" />
          )}
          <span className={cn('text-xs font-semibold', trend.value >= 0 ? 'text-mint' : 'text-crimson')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-gray text-xs">{trend.label}</span>
        </div>
      )}
    </Tag>
  );
}