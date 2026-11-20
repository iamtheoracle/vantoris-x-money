import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

/** @param {{ title?: string, icon?: any, children?: import('react').ReactNode, delay?: number }} param0 */
export default function ProfileSection({ title, icon: Icon, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="mb-4"
    >
      {title && (
        <div className="flex items-center gap-2 mb-2.5 px-1">
          {Icon && <Icon size={14} className="text-brass" />}
          <h3 className="text-foreground font-semibold text-xs uppercase tracking-[0.12em]">{title}</h3>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {children}
      </div>
    </motion.div>
  );
}

/** @param {{ icon?: any, iconColor?: string, iconBg?: string, label: string, value?: any, onClick?: (() => void) | null, rightElement?: any, danger?: boolean }} param0 */
export function ProfileRow({
  icon: Icon,
  iconColor = 'text-brass',
  iconBg = 'bg-brass/10',
  label,
  value = null,
  onClick,
  rightElement = null,
  danger = false,
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 text-left transition-all ${onClick ? 'hover:bg-slate-50' : ''} ${danger ? 'hover:bg-crimson/5' : ''}`}
    >
      {Icon && (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-crimson/10' : iconBg}`}>
          <Icon size={16} className={danger ? 'text-crimson' : iconColor} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-gray text-[10px] uppercase tracking-wider font-medium">{label}</p>
        {value && <p className={`text-sm font-medium ${danger ? 'text-crimson' : 'text-foreground'} truncate`}>{value}</p>}
      </div>
      {rightElement}
      {onClick && <ChevronRight size={16} className={danger ? 'text-crimson/50' : 'text-gray/40'} />}
    </Tag>
  );
}

export function ProfileDivider() {
  return <div className="mx-3.5 h-px bg-slate-200" />;
}
