import React from 'react';

/**
 * BentoCard — Glassmorphism card wrapper for the bento grid layout.
 * Props:
 *   title: string
 *   subtitle: string (optional)
 *   icon: ReactNode (optional)
 *   className: string (optional)
 *   dark: bool — use dark (admin) theme
 *   children: ReactNode
 *   span: "1" | "2" | "full" — column span hint (CSS class)
 *   accentColor: CSS color string (optional)
 */
export default function BentoCard({
  title,
  subtitle,
  icon,
  children,
  dark = false,
  className = '',
  accentColor,
  onClick,
}) {
  const cardStyle = {
    background: dark
      ? 'rgba(10, 22, 40, 0.75)'
      : 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${dark ? 'rgba(65, 192, 242, 0.18)' : 'rgba(65, 192, 242, 0.22)'}`,
    borderRadius: '20px',
    boxShadow: dark
      ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(65, 192, 242, 0.08) inset'
      : '0 8px 32px rgba(65, 192, 242, 0.10), 0 1px 0 rgba(255,255,255,0.8) inset',
    padding: '24px',
    transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
    cursor: onClick ? 'pointer' : 'default',
    position: 'relative',
    overflow: 'hidden',
  };

  const accentBar = accentColor ? {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '3px',
    background: accentColor,
    borderRadius: '20px 20px 0 0',
  } : null;

  const titleColor = dark ? '#E8F4FD' : '#0A2440';
  const subtitleColor = dark ? '#8BAFC8' : '#2A5F82';

  return (
    <div
      style={cardStyle}
      className={`bento-card ${className}`}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = dark
            ? '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(65, 192, 242, 0.12)'
            : '0 16px 48px rgba(65, 192, 242, 0.18), 0 0 20px rgba(65, 192, 242, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(65, 192, 242, 0.40)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = cardStyle.boxShadow;
          e.currentTarget.style.borderColor = dark ? 'rgba(65, 192, 242, 0.18)' : 'rgba(65, 192, 242, 0.22)';
        }
      }}
    >
      {accentBar && <div style={accentBar} />}

      {(title || icon) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: subtitle || children ? '16px' : 0 }}>
          {icon && (
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>
          )}
          <div>
            {title && (
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: titleColor,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ margin: 0, fontSize: '12px', color: subtitleColor, marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
