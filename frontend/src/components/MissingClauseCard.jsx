import React from 'react';

/**
 * MissingClauseCard — Lists missing mandatory clauses with severity badges.
 * Props:
 *   missingClauses: [{missing_requirement, law_reference, severity}]
 *   dark: bool
 */
export default function MissingClauseCard({ missingClauses = [], dark = false }) {
  const textColor = dark ? '#E8F4FD' : '#0A2440';
  const mutedColor = dark ? '#8BAFC8' : '#2A5F82';
  const cardBg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  if (!missingClauses || missingClauses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
        <p style={{ color: '#2ECC71', fontWeight: 700, fontSize: '16px', margin: 0 }}>
          No Missing Clauses Detected
        </p>
        <p style={{ color: mutedColor, fontSize: '13px', marginTop: '8px' }}>
          All mandatory requirements appear to be addressed
        </p>
      </div>
    );
  }

  const critical = missingClauses.filter(m => m.severity === 'critical');
  const recommended = missingClauses.filter(m => m.severity !== 'critical');

  const SeverityBadge = ({ severity }) => (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '8px',
      fontSize: '10px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      background: severity === 'critical' ? 'rgba(255,77,106,0.18)' : 'rgba(255,170,44,0.18)',
      color: severity === 'critical' ? '#FF4D6A' : '#FFAA2C',
      border: `1px solid ${severity === 'critical' ? 'rgba(255,77,106,0.3)' : 'rgba(255,170,44,0.3)'}`,
    }}>
      {severity === 'critical' ? '⚠ Critical' : '○ Recommended'}
    </span>
  );

  const ClauseItem = ({ clause }) => (
    <div style={{
      background: cardBg,
      borderRadius: '12px',
      padding: '14px 16px',
      border: `1px solid ${clause.severity === 'critical' ? 'rgba(255,77,106,0.15)' : 'rgba(255,170,44,0.10)'}`,
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
        <p style={{ margin: 0, color: textColor, fontWeight: 600, fontSize: '13px', lineHeight: 1.4 }}>
          {clause.missing_requirement}
        </p>
        <SeverityBadge severity={clause.severity} />
      </div>
      {clause.law_reference && (
        <p style={{ margin: 0, color: mutedColor, fontSize: '11px', fontStyle: 'italic' }}>
          📋 {clause.law_reference}
        </p>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '360px', overflowY: 'auto' }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {critical.length > 0 && (
          <div style={{ background: 'rgba(255,77,106,0.12)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#FF4D6A' }}>{critical.length}</div>
            <div style={{ fontSize: '11px', color: mutedColor }}>Critical</div>
          </div>
        )}
        {recommended.length > 0 && (
          <div style={{ background: 'rgba(255,170,44,0.12)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFAA2C' }}>{recommended.length}</div>
            <div style={{ fontSize: '11px', color: mutedColor }}>Recommended</div>
          </div>
        )}
      </div>

      {/* Critical first */}
      {critical.map((c, i) => <ClauseItem key={`c-${i}`} clause={c} />)}
      {recommended.map((c, i) => <ClauseItem key={`r-${i}`} clause={c} />)}

      <p style={{ fontSize: '11px', color: mutedColor, margin: 0, fontStyle: 'italic' }}>
        ⚖️ Based on Indian law requirements — verify with a qualified lawyer
      </p>
    </div>
  );
}
