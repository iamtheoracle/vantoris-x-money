import React from 'react';
import { cn } from '@/lib/utils';

/**
 * VantorisPageHeader — Unified page header for all screens.
 *
 * Props:
 * - title: Page title
 * - description: Optional subtitle
 * - breadcrumb: Optional breadcrumb text (e.g., "Operations Workspace")
 * - icon: Optional Lucide icon
 * - actions: Optional React node for action buttons
 * - variant: 'default' (light) | 'hero' (navy gradient)
 */
export default function VantorisPageHeader({
  title,
  description,
  breadcrumb,
  icon: Icon,
  actions,
  variant = 'default',
  className,
}) {
  const isHero = variant === 'hero';

  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4 mb-6', className)}>
      <div className="flex items-start gap-3.5 min-w-0">
        {Icon && (
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
            isHero ? 'bg-white/10' : 'bg-navy/8'
          )}>
            <Icon size={20} className={isHero ? 'text-white' : 'text-navy'} strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          {breadcrumb && (
            <p className={cn(
              'text-[10px] uppercase tracking-[0.15em] font-semibold mb-0.5',
              isHero ? 'text-white/50' : 'text-gray/60'
            )}>
              {breadcrumb}
            </p>
          )}
          <h1 className={cn(
            'text-xl lg:text-2xl font-bold tracking-tight',
            isHero ? 'text-white' : 'text-foreground'
          )}>
            {title}
          </h1>
          {description && (
            <p className={cn('text-sm mt-0.5', isHero ? 'text-white/70' : 'text-gray')}>
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}