import React from 'react';
import VantorisMark from './brand/VantorisMonogram';

/** Vantoris arch-over-river mark used across member and public surfaces. */
export default function ShieldLogo({ size = 40, className = '', variant = 'metallic', theme = 'light' }) {
  return <VantorisMark size={size} className={className} variant={variant} theme={theme} />;
}
