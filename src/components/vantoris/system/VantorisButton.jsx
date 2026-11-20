import React from 'react';
import { cn } from '@/lib/utils';

/**
 * VantorisButton — Unified institutional button.
 * Every button in the app should use this or the shadcn Button (which shares the same variants).
 *
 * Variants:
 * - primary: Deep Navy (#071C38) — default action
 * - gold: Rich Gold (#C9A227) — premium/featured action
 * - outline: White with border — secondary action
 * - ghost: Transparent — tertiary action
 * - destructive: Crimson — dangerous action
 *
 * Sizes: sm (h-9), default (h-10), lg (h-12)
 */
import { Button, buttonVariants } from '@/components/ui/button';

/** @param {{ variant?: 'primary'|'gold'|'outline'|'ghost'|'destructive'|'secondary'|'link', size?: 'default'|'sm'|'lg'|'icon', className?: string, children?: import('react').ReactNode, [key: string]: any }} param0 */
export default function VantorisButton({ variant = 'primary', size = 'default', className, children, ...props }) {
  /** @type {Record<string, 'default'|'gold'|'outline'|'ghost'|'destructive'|'secondary'|'link'>} */
  const variantMap = {
    primary: 'default',
    gold: 'gold',
    outline: 'outline',
    ghost: 'ghost',
    destructive: 'destructive',
    secondary: 'secondary',
    link: 'link',
  };
  return (
    <Button
      variant={variantMap[variant] || 'default'}
      size={size}
      className={cn(className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export { buttonVariants };