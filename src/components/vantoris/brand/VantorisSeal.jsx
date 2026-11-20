import React, { useId } from 'react';
import VantorisMonogram from './VantorisMonogram';
import { VANTORIS_COLORS } from './VantorisMonogram';

/**
 * VANTORIS Executive Seal — circular institutional seal for official documents,
 * statements, certificates, member cards, and executive correspondence.
 */
export default function VantorisSeal({ size = 160, theme = 'light', className = '' }) {
  const uid = useId().replace(/:/g, '');
  const gid = `seal-${uid}`;
  const isDark = theme === 'dark';
  const ringColor = isDark ? VANTORIS_COLORS.champagneGold : VANTORIS_COLORS.executiveBlue;
  const textColor = isDark ? 'rgba(248,250,252,0.7)' : 'rgba(18,58,110,0.8)';

  // circular text via textPath
  const topText = 'VANTORIS PIP · PRIVATE INVESTMENT & PAYMENTS · ';
  const bottomText = 'TRUST · STRUCTURE · PURPOSE · EST. MMXXV · ';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Vantoris Executive Seal"
    >
      <defs>
        <path id={`${gid}-top`} d="M100,100 m-78,0 a78,78 0 1,1 156,0" fill="none" />
        <path id={`${gid}-bottom`} d="M100,100 m78,0 a78,78 0 1,1 -156,0" fill="none" />
      </defs>

      {/* outer rings */}
      <circle cx="100" cy="100" r="96" stroke={ringColor} strokeWidth="1" opacity="0.5" />
      <circle cx="100" cy="100" r="90" stroke={ringColor} strokeWidth="2.5" />
      <circle cx="100" cy="100" r="82" stroke={ringColor} strokeWidth="0.6" opacity="0.6" />

      {/* circular text */}
      <text fill={textColor} style={{ fontSize: '8.5px', fontWeight: 600, letterSpacing: '0.32em', fontFamily: 'Inter, sans-serif' }}>
        <textPath href={`#${gid}-top`} startOffset="50%" textAnchor="middle">
          {topText}
        </textPath>
      </text>
      <text fill={textColor} style={{ fontSize: '7px', fontWeight: 500, letterSpacing: '0.28em', fontFamily: 'Inter, sans-serif' }}>
        <textPath href={`#${gid}-bottom`} startOffset="50%" textAnchor="middle">
          {bottomText}
        </textPath>
      </text>

      {/* decorative ticks at cardinal points */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 100 + Math.cos(rad) * 70;
        const y1 = 100 + Math.sin(rad) * 70;
        const x2 = 100 + Math.cos(rad) * 74;
        const y2 = 100 + Math.sin(rad) * 74;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ringColor} strokeWidth="1.5" opacity="0.7" />;
      })}

      {/* center monogram */}
      <g transform="translate(58,58) scale(0.7)">
        <VantorisMonogram size={120} variant="metallic" theme={theme} />
      </g>
    </svg>
  );
}