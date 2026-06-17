import React, { useState } from 'react';

/**
 * NegotiationPlaybookCard — Collapsible negotiation recommendations for flagged clauses.
 * Props:
 *   playbook: [{clause_text, risk_level, category, recommended_action, counter_clause, law_reference}]
 *   dark: bool
 */
export default function NegotiationPlaybookCard({ playbook = [], dark = false }) {
  const [expanded, setExpanded] = useState(null);

  const textColor = dark ? '#E8F4FD' : '#0A2440';
  const mutedColor = dark ? '#8BAFC8' : '#2A5F82';
  const cardBg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  const categoryConfig = {
    must_fix: { label: 'Must Fix', color: '#FF4D6A', bg: 'rgba(255,77,106,0.15)', icon: '🚨' },
    should_negotiate: { label: 'Negotiate', color: '#FFAA2C', bg: 'rgba(255,170,44,0.15)', icon: '⚡' },
    accept_as_is: { label: 'Accept', color: '#2ECC71', bg: 'rgba(46,204,113,0.15)', icon: '✓' },
  };

  if (!playbook || playbook.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
        <p style={{ color: mutedColor, fontWeight: 600, fontSize: '14px', margin: 0 }}>
          No playbook generated yet
        </p>
        <p style={{ color: mutedColor, fontSize: '12px', marginTop: '8px' }}>
          Run analysis on a contract to see negotiation recommendations
        </p>
      </div>
    );
  }

  const mustFix = playbook.filter(p => p.category === 'must_fix');
  const shouldNeg = playbook.filter(p => p.category === 'should_negotiate');
  const accept = playbook.filter(p => p.category === 'accept_as_is');
  const ordered = [...mustFix, ...shouldNeg, ...accept];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
      {/* Summary pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
        {mustFix.length > 0 && (
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,77,106,0.15)', color: '#FF4D6A', fontWeight: 700 }}>
            🚨 {mustFix.length} Must Fix
          </span>
        )}
        {shouldNeg.length > 0 && (
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,170,44,0.15)', color: '#FFAA2C', fontWeight: 700 }}>
            ⚡ {shouldNeg.length} Negotiate
          </span>
        )}
        {accept.length > 0 && (
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(46,204,113,0.15)', color: '#2ECC71', fontWeight: 700 }}>
            ✓ {accept.length} Accept
          </span>
        )}
      </div>

      {ordered.map((item, i) => {
        const config = categoryConfig[item.category] || categoryConfig.should_negotiate;
        const isOpen = expanded === i;

        return (
          <div key={i} style={{
            background: cardBg,
            borderRadius: '12px',
            border: `1px solid ${isOpen ? config.color + '40' : 'transparent'}`,
            transition: 'border-color 0.2s ease',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
              }}
            >
              <span style={{ fontSize: '14px' }}>{config.icon}</span>
              <span style={{ flex: 1, color: textColor, fontSize: '12px', fontWeight: 600, lineHeight: 1.4 }}>
                {(item.clause_text || '').substring(0, 80)}{(item.clause_text || '').length > 80 ? '...' : ''}
              </span>
              <span style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                background: config.bg, color: config.color, flexShrink: 0
              }}>
                {config.label}
              </span>
              <span style={{ color: mutedColor, fontSize: '12px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {item.recommended_action && (
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Recommended Action
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: textColor, lineHeight: 1.5 }}>{item.recommended_action}</p>
                  </div>
                )}
                {item.counter_clause && (
                  <div style={{ background: dark ? 'rgba(65,192,242,0.08)' : 'rgba(65,192,242,0.06)', borderRadius: '8px', padding: '10px 12px', borderLeft: '3px solid #41C0F2' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#41C0F2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Suggested Counter-Clause
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: textColor, lineHeight: 1.6, fontStyle: 'italic' }}>{item.counter_clause}</p>
                  </div>
                )}
                {item.law_reference && (
                  <p style={{ margin: 0, fontSize: '11px', color: mutedColor, fontStyle: 'italic' }}>
                    📋 {item.law_reference}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      <p style={{ fontSize: '11px', color: mutedColor, margin: '4px 0 0', fontStyle: 'italic' }}>
        ⚖️ Not legal advice — recommendations require review by a qualified lawyer
      </p>
    </div>
  );
}
