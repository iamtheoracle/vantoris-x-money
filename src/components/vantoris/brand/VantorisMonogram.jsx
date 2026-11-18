import React, { useId } from 'react';

/**
 * VANTORIS — Custom Geometric "V" Monogram
 *
 * The V is constructed from two engineered strokes converging at a precise apex.
 * Symbolism (intentionally subtle):
 *  — Two architectural pillars converging (strength, stability, structure)
 *  — Upward sweep of the arms (growth, forward momentum, capital appreciation)
 *  — Sharp engineered apex (precision, foundation, legacy)
 *  — The negative space between the strokes reads as an upward chevron at scale
 *
 * Treatments: flat | metallic | glass | monochrome | outline | foil | embossed
 */
export const VANTORIS_COLORS = {
  navy: '#071A2D',
  executiveBlue: '#123A43',
  royalBlue: '#294C5A',
  champagneGold: '#C9A962',
  brushedGold: '#B89B62',
  white: '#F7F5EF',
  slateGray: '#68747B',
};

const V_PATH = 'M16,24 L32,24 L60,81 L88,24 L104,24 L60,96 Z';

/** @param {{ size?: number, variant?: string, theme?: string, color?: string, className?: string, strokeWidth?: number }} param0 */
export default function VantorisMonogram({
  size = 48,
  variant = 'flat',
  theme = 'light',
  color,
  className = '',
  strokeWidth = 0,
}) {
  const uid = useId().replace(/:/g, '');
  const gid = `vg-${uid}`;
  const hid = `vh-${uid}`;
  const sid = `vs-${uid}`;

  const isDark = theme === 'dark';
  const flatColor = color || (isDark ? VANTORIS_COLORS.white : VANTORIS_COLORS.navy);

  let fill = flatColor;
  let stroke = 'none';
  let sw = strokeWidth;
  const defs = [];

  if (variant === 'metallic' || variant === 'foil') {
    defs.push(
      <linearGradient key={gid} id={gid} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor="#EBCB63" />
        <stop offset="0.32" stopColor="#D4AF37" />
        <stop offset="0.5" stopColor="#F0D878" />
        <stop offset="0.68" stopColor="#C7A34A" />
        <stop offset="1" stopColor="#A9822B" />
      </linearGradient>
    );
    defs.push(
      <linearGradient key={hid} id={hid} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
        <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.05" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    );
    fill = `url(#${gid})`;
    stroke = `url(#${hid})`;
    sw = sw || 0.75;
  } else if (variant === 'glass') {
    defs.push(
      <linearGradient key={gid} id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.55" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.25" />
      </linearGradient>
    );
    fill = `url(#${gid})`;
    stroke = '#FFFFFF';
    sw = sw || 0.6;
  } else if (variant === 'embossed') {
    defs.push(
      <filter key={sid} id={sid} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="b" />
        <feOffset in="b" dx="0" dy="1.2" result="o" />
        <feComponentTransfer in="o" result="s">
          <feFuncA type="linear" slope="0.55" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="s" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    );
  } else if (variant === 'outline') {
    fill = 'none';
    stroke = flatColor;
    sw = sw || 2.5;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Vantoris monogram"
    >
      <defs>{defs}</defs>
      <g filter={variant === 'embossed' ? `url(#${sid})` : undefined}>
        <path
          d={V_PATH}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="miter"
        />
        {(variant === 'metallic' || variant === 'foil') && (
          <path
            d="M22,26 L57,90"
            stroke="#FFFFFF"
            strokeOpacity="0.35"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  );
}