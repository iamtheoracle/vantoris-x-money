import React, { useId } from 'react';

/**
 * VANTORIS — Architectural arch over a flowing river.
 * The arch represents enduring structure; the river represents continuity,
 * movement and stewardship. The mark is original vector artwork.
 *
 * Treatments: flat | metallic | glass | monochrome | outline | foil | embossed
 */
export const VANTAGE_COLORS = {
  navy: '#071C38',
  executiveBlue: '#0A2342',
  royalBlue: '#1F5EFF',
  champagneGold: '#C9A227',
  brushedGold: '#C9A227',
  white: '#F8FAFC',
  slateGray: '#64748B',
};

export const VANTORIS_COLORS = VANTAGE_COLORS; // Internal compatibility alias for existing component imports.

const ARCH_PATH = 'M18 88V56A42 42 0 0 1 102 56V88';
const RIVER_PATH = 'M10 96C22 86 34 106 46 96S70 86 82 96S106 106 114 96';
const RIVER_PATH_LOWER = 'M14 106C26 96 38 116 50 106S74 96 86 106S108 116 116 106';

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
  const flatColor = color || (isDark ? VANTAGE_COLORS.white : VANTAGE_COLORS.navy);

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
      aria-label="Vantoris arch over river mark"
    >
      <defs>{defs}</defs>
      <g filter={variant === 'embossed' ? `url(#${sid})` : undefined}>
        <path d={ARCH_PATH} fill="none" stroke={variant === 'outline' ? stroke : fill} strokeWidth={variant === 'outline' ? (sw || 2.5) : 5.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 86H102" fill="none" stroke={variant === 'outline' ? stroke : fill} strokeWidth="3" strokeLinecap="round" />
        <path d={RIVER_PATH} fill="none" stroke={variant === 'outline' ? stroke : fill} strokeWidth="4.5" strokeLinecap="round" />
        <path d={RIVER_PATH_LOWER} fill="none" stroke={variant === 'outline' ? stroke : fill} strokeWidth="3.5" strokeLinecap="round" opacity=".75" />
        {(variant === 'metallic' || variant === 'foil') && (
          <path d="M25 56A35 35 0 0 1 95 56" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}