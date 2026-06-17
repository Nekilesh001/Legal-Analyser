import React, { useState, useMemo } from 'react';

/**
 * ClauseAnalysisTable — Sortable, filterable, color-coded risk table.
 * Props:
 *   clauses: array of clause result objects from the analysis
 *   dark: bool
 */
export default function ClauseAnalysisTable({ clauses = [], dark = false }) {
  const [sortBy, setSortBy] = useState('risk_level');
  const [filterRisk, setFilterRisk] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const textColor = dark ? '#E8F4FD' : '#0A2440';
  const mutedColor = dark ? '#8BAFC8' : '#2A5F82';
  const headerBg = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const rowBg = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const borderColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  const riskConfig = {
    High: { color: '#FF4D6A', bg: 'rgba(255,77,106,0.15)', icon: '🔴' },
    Medium: { color: '#FFAA2C', bg: 'rgba(255,170,44,0.15)', icon: '🟡' },
    Low: { color: '#2ECC71', bg: 'rgba(46,204,113,0.15)', icon: '🟢' },
    null: { color: '#8BAFC8', bg: 'rgba(139,175,200,0.15)', icon: '⚪' },
  };

  const riskOrder = { High: 0, Medium: 1, Low: 2, null: 3 };

  const filtered = useMemo(() => {
    let result = clauses.filter(c => !c.analysis_failed || filterRisk === 'failed');

    if (filterRisk !== 'all' && filterRisk !== 'failed') {
      result = result.filter(c => c.risk_level === filterRisk);
    }
    if (filterRisk === 'failed') {
      result = clauses.filter(c => c.analysis_failed);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.text || '').toLowerCase().includes(q) ||
        (c.section_type || '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'risk_level') {
        return (riskOrder[a.risk_level] ?? 3) - (riskOrder[b.risk_level] ?? 3);
      }
      if (sortBy === 'confidence') {
        return (b.confidence || 0) - (a.confidence || 0);
      }
      return 0;
    });
  }, [clauses, filterRisk, searchQuery, sortBy]);

  const filterBtnStyle = (active) => ({
    padding: '5px 12px',
    borderRadius: '20px',
    border: `1px solid ${active ? 'rgba(65,192,242,0.5)' : borderColor}`,
    background: active ? 'rgba(65,192,242,0.15)' : 'transparent',
    color: active ? '#41C0F2' : mutedColor,
    fontSize: '12px',
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const thStyle = {
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: 700,
    color: mutedColor,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textAlign: 'left',
    borderBottom: `1px solid ${borderColor}`,
    background: headerBg,
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search clauses..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: '1 1 200px', padding: '6px 12px', borderRadius: '10px',
            border: `1px solid ${borderColor}`, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            color: textColor, fontSize: '13px', outline: 'none',
          }}
        />
        {['all', 'High', 'Medium', 'Low'].map(f => (
          <button key={f} onClick={() => setFilterRisk(f)} style={filterBtnStyle(filterRisk === f)}>
            {f === 'all' ? 'All' : `${riskConfig[f]?.icon} ${f}`}
          </button>
        ))}
        <span style={{ fontSize: '12px', color: mutedColor, marginLeft: 'auto' }}>
          {filtered.length} of {clauses.length} clauses
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle} onClick={() => setSortBy('risk_level')}>
                Risk {sortBy === 'risk_level' ? '↑' : ''}
              </th>
              <th style={{ ...thStyle, width: '45%' }}>Clause</th>
              <th style={thStyle}>Section</th>
              <th style={thStyle} onClick={() => setSortBy('confidence')}>
                Confidence {sortBy === 'confidence' ? '↓' : ''}
              </th>
              <th style={thStyle}>Bias</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: mutedColor }}>
                  No clauses match the current filter
                </td>
              </tr>
            ) : (
              filtered.map((clause, i) => {
                const risk = riskConfig[clause.risk_level] || riskConfig.null;
                const isExpanded = expandedRow === i;

                return (
                  <React.Fragment key={i}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : i)}
                      style={{
                        background: isExpanded ? (dark ? 'rgba(65,192,242,0.06)' : 'rgba(65,192,242,0.04)') : rowBg,
                        cursor: 'pointer',
                        borderBottom: `1px solid ${borderColor}`,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(65,192,242,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = isExpanded ? (dark ? 'rgba(65,192,242,0.06)' : 'rgba(65,192,242,0.04)') : rowBg}
                    >
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '3px 10px', borderRadius: '20px',
                          background: risk.bg, color: risk.color,
                          fontSize: '11px', fontWeight: 700,
                        }}>
                          {risk.icon} {clause.risk_level || 'Failed'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: textColor, maxWidth: '400px' }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                          {clause.text || ''}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: mutedColor, fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {(clause.section_type || 'other').replace('_', ' ')}
                      </td>
                      <td style={{ padding: '10px 14px', color: textColor, whiteSpace: 'nowrap' }}>
                        {clause.confidence !== undefined && clause.confidence !== null
                          ? `${(clause.confidence * 100).toFixed(0)}%`
                          : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '11px', color: mutedColor, whiteSpace: 'nowrap' }}>
                        {(clause.bias_label || '').replace('_', ' ') || '—'}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: dark ? 'rgba(65,192,242,0.04)' : 'rgba(65,192,242,0.03)', borderBottom: `1px solid ${borderColor}` }}>
                        <td colSpan={5} style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Reasoning</p>
                              <p style={{ margin: 0, fontSize: '13px', color: textColor, lineHeight: 1.5 }}>
                                {clause.risk_reasoning || 'No reasoning available'}
                              </p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#41C0F2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alternative Clause</p>
                              <p style={{ margin: 0, fontSize: '12px', color: textColor, lineHeight: 1.6, fontStyle: 'italic' }}>
                                {clause.alternative_clause || 'No alternative provided'}
                              </p>
                            </div>
                          </div>
                          {clause.entities && (clause.entities.parties?.length > 0 || clause.entities.dates?.length > 0 || clause.entities.money?.length > 0) && (
                            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              {clause.entities.parties?.map((p, j) => (
                                <span key={j} style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', background: 'rgba(65,192,242,0.12)', color: '#41C0F2' }}>👤 {p}</span>
                              ))}
                              {clause.entities.dates?.map((d, j) => (
                                <span key={j} style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', background: 'rgba(255,170,44,0.12)', color: '#FFAA2C' }}>📅 {d}</span>
                              ))}
                              {clause.entities.money?.map((m, j) => (
                                <span key={j} style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', background: 'rgba(46,204,113,0.12)', color: '#2ECC71' }}>💰 {m}</span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
