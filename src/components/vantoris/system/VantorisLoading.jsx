import React from 'react';

export default function VantorisLoading({ variant = 'spinner', className = '', size = 'default' }) {
  const sizes = { sm: 'h-5 w-5', default: 'h-8 w-8', lg: 'h-12 w-12' };
  if (variant === 'skeleton') return <div className={'vantoris-shimmer rounded-xl ' + className} role="status" aria-label="Loading" />;
  if (variant === 'dots') return <div className={'flex items-center gap-1 ' + className} role="status" aria-label="Loading"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray" /></div>;
  return <div className={'flex items-center justify-center ' + (variant === 'fullscreen' ? 'min-h-screen bg-background ' : '') + className} role="status" aria-label="Loading"><div className={'animate-spin rounded-full border-2 border-slate-200 border-t-navy ' + (sizes[size] || sizes.default)} /></div>;
}