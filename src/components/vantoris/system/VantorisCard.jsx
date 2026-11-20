import React from 'react';
import { cn } from '@/lib/utils';

/**
 * VantorisCard — Unified institutional card surface.
 *
 * Variants:
 * - default: White card with subtle shadow and border
 * - premium: Premium glass card with elevated shadow
 * - flat: Flat surface for lists and subtle containers
 * - hero: Dark navy gradient surface for featured content
 */
export default function VantorisCard({ variant = 'default', className, children, onClick, ...props }) {
  const variants = {
    default: 'vantoris-card',
    premium: 'vantoris-glass-premium',
    flat: 'vantoris-glass-flat',
    hero: 'vantoris-balance-hero text-white',
  };
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={cn(
        variants[variant] || variants.default,
        onClick && 'text-left w-full cursor-pointer hover:shadow-float transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}