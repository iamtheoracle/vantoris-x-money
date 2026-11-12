import React from 'react';
import VantageMark from './brand/VantorisMonogram';

/** Vantage arch-over-river mark used across member and public surfaces. */
export default function ShieldLogo({ size = 40, className = '', variant = 'metallic', theme = 'light' }) {
  return <VantageMark size={size} className={className} variant={variant} theme={theme} />;
}
