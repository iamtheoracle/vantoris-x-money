import React from 'react';
import VantorisMonogram from './VantorisMonogram';

/**
 * Full VANTORIS logo lockups.
 * layout: 'horizontal' | 'vertical' | 'standalone' | 'watermark' | 'stacked-mono'
 */
/** @param {{ layout?: string, size?: number, variant?: string, theme?: string, color?: string, className?: string, showTagline?: boolean }} param0 */
export default function VantorisLogo({
  layout = 'horizontal',
  size = 40,
  variant = 'flat',
  theme = 'light',
  color,
  className = '',
  showTagline = false,
}) {
  const isDark = theme === 'dark';
  const wordColor = color || (isDark ? '#F8FAFC' : '#071A2D');
  const taglineColor = isDark ? 'rgba(248,250,252,0.55)' : 'rgba(107,114,128,0.9)';

  const Wordmark = ({ scale = 1 }) => (
    <span
      className="font-heading select-none"
      style={{
        fontSize: `${size * 0.46 * scale}px`,
        fontWeight: 800,
        letterSpacing: '0.24em',
        color: wordColor,
        lineHeight: 1,
      }}
    >
      VANTORIS
    </span>
  );

  const Tagline = () => (
    <span
      className="font-body select-none"
      style={{
        fontSize: `${size * 0.135}px`,
        fontWeight: 500,
        letterSpacing: '0.42em',
        color: taglineColor,
        textTransform: 'uppercase',
        lineHeight: 1,
      }}
    >
      Private&nbsp;Wealth&nbsp;·&nbsp;Capital&nbsp;·&nbsp;Trust
    </span>
  );

  if (layout === 'standalone' || layout === 'stacked-mono') {
    return <VantorisMonogram size={size} variant={variant} theme={theme} color={color} className={className} />;
  }

  if (layout === 'watermark') {
    return (
      <div className={className} style={{ opacity: isDark ? 0.08 : 0.06 }}>
        <VantorisMonogram size={size} variant={variant} theme={theme} color={color} />
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <VantorisMonogram size={size} variant={variant} theme={theme} color={color} />
        <div className="flex flex-col items-center gap-1.5">
          <Wordmark />
          {showTagline && <Tagline />}
        </div>
      </div>
    );
  }

  // horizontal (default)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <VantorisMonogram size={size} variant={variant} theme={theme} color={color} />
      <div className="flex flex-col gap-1">
        <Wordmark />
        {showTagline && <Tagline />}
      </div>
    </div>
  );
}