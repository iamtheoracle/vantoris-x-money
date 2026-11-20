import React from 'react';

/** @param {{ icon?: any, title: string, right?: import('react').ReactNode }} param0 */
export default function SectionTitle({ icon: Icon, title, right = null }) {
  return (
    <div className="flex items-center justify-between mb-2.5 px-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-brass" />}
        <h3 className="text-foreground font-semibold text-xs uppercase tracking-[0.12em]">{title}</h3>
      </div>
      {right}
    </div>
  );
}
