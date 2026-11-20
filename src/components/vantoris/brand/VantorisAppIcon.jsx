import React, { useId } from 'react';
import VantorisMonogram from './VantorisMonogram';

/**
 * VANTORIS App Icon — V monogram centered on deep navy with premium blue
 * gradients, soft glass depth, and brushed gold metallic detailing.
 */
export default function VantorisAppIcon({ size = 120, rounded = true, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const bg = `ic-bg-${uid}`;
  const glow = `ic-glow-${uid}`;
  const glass = `ic-glass-${uid}`;
  const radius = rounded ? 22 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Vantoris app icon"
    >
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0C2647" />
          <stop offset="0.5" stopColor="#071A2D" />
          <stop offset="1" stopColor="#123A6E" />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="0.32" r="0.7">
          <stop offset="0" stopColor="#2E5BFF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#2E5BFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.02" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <rect x="0" y="0" width="120" height="120" rx={radius} />
        </clipPath>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        <rect width="120" height="120" fill={`url(#${bg})`} />
        <rect width="120" height="120" fill={`url(#${glow})`} />
        {/* glass depth overlay */}
        <rect width="120" height="60" fill={`url(#${glass})`} />

        {/* subtle inner border */}
        <rect x="3" y="3" width="114" height="114" rx={radius - 2} stroke="#D4AF37" strokeOpacity="0.18" strokeWidth="0.75" />

        {/* monogram */}
        <g transform="translate(0,0)">
          <VantorisMonogram size={120} variant="metallic" />
        </g>
      </g>

      <rect x="0.5" y="0.5" width="119" height="119" rx={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
    </svg>
  );
}