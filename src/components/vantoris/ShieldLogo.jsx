import React from 'react';

/** Compact Vantoris shield mark used across the public landing page. */
export default function ShieldLogo({ size = 40, className = '', variant = 'metallic', theme = 'light' }) {
  const dark = theme === 'dark';
  const gold = variant === 'metallic' || variant === 'gold';
  return (
    <span className={'inline-flex items-center justify-center ' + className} style={{ width: size, height: size }} role="img" aria-label="Vantoris">
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <path d="M32 3 55 12v17c0 15-9.5 25.5-23 32C18.5 54.5 9 44 9 29V12L32 3Z" fill={dark ? '#071A2D' : '#0B1F33'} stroke={gold ? '#D4AF37' : '#9AA7B5'} strokeWidth="2" />
        <path d="M17 19h8l7 17 7-17h8L32 48 17 19Z" fill={gold ? '#D4AF37' : '#F8FAFC'} />
      </svg>
    </span>
  );
}
