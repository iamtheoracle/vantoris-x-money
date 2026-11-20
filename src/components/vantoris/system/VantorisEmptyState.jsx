import React from 'react';
import { cn } from '@/lib/utils';

/**
 * VantorisEmptyState — Unified empty state.
 * Every list, table, or data view with no data should use this.
 */
export default function VantorisEmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('vantoris-card p-8 text-center', className)}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Icon size={24} className="text-gray" />
        </div>
      )}
      <h3 className="text-foreground font-semibold text-sm mb-1">{title || 'Nothing here yet'}</h3>
      {description && <p className="text-gray text-sm max-w-xs mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}