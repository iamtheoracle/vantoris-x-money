import React from 'react';

/** Consistent page header and content shell for the Operations Center. */
/** @param {{ title: string, description?: string, icon?: any, actions?: any, children?: import('react').ReactNode, breadcrumb?: string | null }} param0 */
export default function OperationsPageLayout({
  title,
  description,
  icon: Icon,
  actions = null,
  children,
  breadcrumb = null,
}) {
  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon && (
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-navy/10 bg-navy/8">
              <Icon size={20} className="text-navy" strokeWidth={2} />
            </div>
          )}
          <div className="min-w-0">
            {breadcrumb && <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray/60">{breadcrumb}</p>}
            <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-gray">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
