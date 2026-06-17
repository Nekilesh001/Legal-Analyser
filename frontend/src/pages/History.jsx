import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import BentoCard from '../components/BentoCard';
import { listContracts, compareContracts } from '../api/client';
import { useAuth } from '../context/AuthContext';

const RISK_COLORS = {
  75: { color: '#1E8E3E', bg: 'rgba(30,142,62,0.12)', label: 'Healthy' },
  50: { color: '#F4A60A', bg: 'rgba(244,166,10,0.12)', label: 'Moderate' },
  0: { color: '#D93025', bg: 'rgba(217,48,37,0.12)', label: 'At Risk' },
};

const getScoreBadge = (score) => {
  if (score === null || score === undefined) return { color: '#6A9AB8', bg: 'rgba(106,154,184,0.10)', label: 'Pending' };
  if (score >= 75) return RISK_COLORS[75];
  if (score >= 50) return RISK_COLORS[50];
  return RISK_COLORS[0];
};

export default function History() {
  const { role } = useAuth();
  const dark = role === 'admin';

  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [selectedContracts, setSelectedContracts] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const handleToggleSelect = (e, contract) => {
    e.stopPropagation();
    setSelectedContracts(prev => {
      const exists = prev.some(c => c.id === contract.id);
      if (exists) {
        return prev.filter(c => c.id !== contract.id);
      }
      if (prev.length >= 2) {
        return [prev[1], contract];
      }
      return [...prev, contract];
    });
  };

  const { data: contracts = [], isLoading: loading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => listContracts().then(r => r.data),
  });


  const contractTypes = ['all', ...new Set(contracts.map(c => c.contract_type || 'other').filter(Boolean))];

  const filtered = contracts.filter(c => {
    const matchSearch = !search.trim() || c.filename.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || (c.contract_type || 'other') === filterType;
    return matchSearch && matchType;
  });

  const textColor = '#0A2440';
  const mutedColor = '#2A5F82';

  const borderColor = dark ? 'rgba(65,192,242,0.18)' : 'rgba(65,192,242,0.22)';

  return (
    <Layout title="Contract History" dark={dark}>
      {/* Compare Banner */}
      {selectedContracts.length === 2 && (
        <div style={{
          background: dark ? 'rgba(10,22,40,0.92)' : 'rgba(240,248,255,0.92)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${borderColor}`,
          padding: '12px 24px', borderRadius: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '16px', boxShadow: '0 8px 32px rgba(65,192,242,0.15)',
          transition: 'all 0.3s ease',
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
        }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: dark ? '#E8F4FD' : '#0A2440' }}>
              Compare Selected Contracts
            </span>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: mutedColor }}>
              {selectedContracts[0].filename} <b>vs</b> {selectedContracts[1].filename}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowCompare(true)}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #0D518C, #41C0F2)',
                color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Compare Now 🔍
            </button>
            <button
              onClick={() => setSelectedContracts([])}
              style={{
                padding: '8px 12px', borderRadius: '10px', border: `1px solid ${borderColor}`,
                background: 'transparent', color: mutedColor, fontSize: '12px', cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <BentoCard title="All Contracts" icon="🗂" dark={dark} subtitle={`${contracts.length} total`}>
        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: '1 1 220px', padding: '8px 14px', borderRadius: '10px',
              border: '1px solid rgba(65,192,242,0.22)',
              background: 'rgba(65,192,242,0.03)',
              color: textColor, fontSize: '13px', outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {contractTypes.map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(65,192,242,0.20)',
                background: filterType === t ? 'rgba(65,192,242,0.18)' : 'transparent',
                color: filterType === t ? '#41C0F2' : mutedColor,
                fontWeight: filterType === t ? 700 : 400,
                fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                textTransform: 'capitalize',
              }}>
                {t === 'all' ? '📋 All' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: mutedColor, textAlign: 'center', padding: '32px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: mutedColor, marginBottom: '16px' }}>
              {contracts.length === 0 ? 'No contracts uploaded yet' : 'No contracts match your search'}
            </p>
            {contracts.length === 0 && (
              <button onClick={() => navigate('/upload')} style={{
                padding: '10px 20px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg,#0D518C,#41C0F2)',
                color: '#fff', fontWeight: 700, cursor: 'pointer',
              }}>
                Upload First Contract →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(contract => {
              const badge = getScoreBadge(contract.health_score);
              return (
                <div
                  key={contract.id}
                  id={`contract-row-${contract.id}`}
                  onClick={() => navigate(`/analysis/${contract.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 2fr 100px 120px 100px 120px auto',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: 'rgba(65,192,242,0.04)',
                    border: '1px solid rgba(65,192,242,0.12)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(65,192,242,0.09)'; e.currentTarget.style.borderColor = 'rgba(65,192,242,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(65,192,242,0.04)'; e.currentTarget.style.borderColor = 'rgba(65,192,242,0.12)'; }}
                >
                  {/* Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedContracts.some(c => c.id === contract.id)}
                      onChange={(e) => handleToggleSelect(e, contract)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={contract.health_score === null || contract.health_score === undefined}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </div>
                  {/* Filename */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📄 {contract.filename}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: mutedColor }}>
                      ID #{contract.id} · {contract.extraction_method}
                    </p>
                  </div>

                  {/* Type */}
                  <span style={{ fontSize: '12px', color: mutedColor, fontWeight: 500, textTransform: 'capitalize' }}>
                    {contract.contract_type || '—'}
                  </span>

                  {/* Language */}
                  <span style={{ fontSize: '12px', color: mutedColor }}>
                    {contract.detected_language === 'ta' ? '🇮🇳 Tamil' : contract.detected_language === 'en' ? '🇬🇧 English' : (contract.detected_language || '—')}
                  </span>

                  {/* Health score badge */}
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px',
                    background: badge.bg, color: badge.color,
                    fontSize: '12px', fontWeight: 700, textAlign: 'center',
                  }}>
                    {contract.health_score !== null && contract.health_score !== undefined
                      ? `${Math.round(contract.health_score)} — ${badge.label}`
                      : badge.label}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: '11px', color: mutedColor }}>
                    {new Date(contract.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>

                  {/* Arrow */}
                  <span style={{ color: '#41C0F2', fontSize: '16px' }}>→</span>
                </div>
              );
            })}
          </div>
        )}
      </BentoCard>

      {/* Compare Modal Overlay */}
      {showCompare && selectedContracts.length === 2 && (
        <CompareModal
          contract1={selectedContracts[0]}
          contract2={selectedContracts[1]}
          dark={dark}
          onClose={() => setShowCompare(false)}
        />
      )}
    </Layout>
  );
}

// ─── Compare Modal Component ──────────────────────────────────────────────────
function CompareModal({ contract1, contract2, onClose, dark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('reworded'); // reworded | added | removed | unchanged

  useEffect(() => {
    compareContracts(contract1.id, contract2.id)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contract1.id, contract2.id]);

  const textColor = dark ? '#E8F4FD' : '#0A2440';
  const mutedColor = dark ? '#8BAFC8' : '#2A5F82';
  const borderColor = dark ? 'rgba(65,192,242,0.18)' : 'rgba(65,192,242,0.22)';
  const modalBg = dark ? 'rgba(10,22,40,0.95)' : 'rgba(255,255,255,0.95)';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
      padding: '24px',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
    }}>
      <div style={{
        width: '100%', maxWidth: '850px', maxHeight: '90vh',
        background: modalBg, border: `1px solid ${borderColor}`,
        borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: textColor }}>
              Contract Comparison
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: mutedColor }}>
              Comparing {contract1.filename} vs {contract2.filename}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: mutedColor,
            fontSize: '24px', cursor: 'pointer', outline: 'none'
          }}>
            &times;
          </button>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px', color: mutedColor }}>
            <div style={{ fontSize: '28px', animation: 'spin 1.5s linear infinite', marginRight: '10px' }}>⟳</div>
            <span>Analyzing contract differences...</span>
          </div>
        ) : !data ? (
          <p style={{ color: '#FF4D6A', textAlign: 'center', padding: '32px' }}>Failed to run comparison.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Health score diff */}
            <div style={{
              display: 'flex', gap: '16px', background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              padding: '16px', borderRadius: '16px', marginBottom: '20px', alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: mutedColor }}>
                  Health Score Delta
                </div>
                <div style={{
                  fontSize: '28px', fontWeight: 800,
                  color: data.health_score_delta > 0 ? '#2ECC71' : data.health_score_delta < 0 ? '#FF4D6A' : textColor
                }}>
                  {data.health_score_delta > 0 ? `+${data.health_score_delta}` : data.health_score_delta}%
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: mutedColor }}>
                  {contract1.filename}: <b>{Math.round(contract1.health_score)}%</b>
                </div>
                <div style={{ fontSize: '11px', color: mutedColor, marginTop: '4px' }}>
                  {contract2.filename}: <b>{Math.round(contract2.health_score)}%</b>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '4px', marginBottom: '16px' }}>
              {[
                { key: 'reworded', label: `Reworded (${data.reworded.length})` },
                { key: 'added', label: `Added (${data.added.length})` },
                { key: 'removed', label: `Removed (${data.removed.length})` },
                { key: 'unchanged', label: `Unchanged (${data.unchanged.length})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSubTab(tab.key)}
                  style={{
                    flex: 1, padding: '6px 12px', borderRadius: '8px', border: 'none',
                    background: activeSubTab === tab.key ? 'rgba(65,192,242,0.18)' : 'transparent',
                    color: activeSubTab === tab.key ? '#41C0F2' : mutedColor,
                    fontWeight: activeSubTab === tab.key ? 700 : 400,
                    fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeSubTab === 'reworded' && (
                data.reworded.length === 0 ? (
                  <p style={{ color: mutedColor, textAlign: 'center', padding: '24px' }}>No reworded clauses found.</p>
                ) : (
                  data.reworded.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '16px', borderRadius: '12px', border: `1px solid ${borderColor}`,
                      background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      display: 'flex', flexDirection: 'column', gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(65,192,242,0.15)', color: '#41C0F2', fontWeight: 700, textTransform: 'uppercase' }}>
                          {item.section_type}
                        </span>
                        <span style={{ fontSize: '11px', color: mutedColor }}>
                          Match Similarity: {(item.similarity * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#FF4D6A', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Original</div>
                          <div style={{ fontSize: '12px', color: textColor, background: dark ? 'rgba(255,77,106,0.05)' : 'rgba(255,77,106,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,77,106,0.15)' }}>
                            {item.original_text}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#2ECC71', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Amended</div>
                          <div style={{ fontSize: '12px', color: textColor, background: dark ? 'rgba(46,204,113,0.05)' : 'rgba(46,204,113,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(46,204,113,0.15)' }}>
                            {item.new_text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeSubTab === 'added' && (
                data.added.length === 0 ? (
                  <p style={{ color: mutedColor, textAlign: 'center', padding: '24px' }}>No added clauses found.</p>
                ) : (
                  data.added.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(46,204,113,0.25)',
                      background: 'rgba(46,204,113,0.04)', display: 'flex', flexDirection: 'column', gap: '6px'
                    }}>
                      <span style={{ alignSelf: 'start', fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(46,204,113,0.15)', color: '#2ECC71', fontWeight: 700, textTransform: 'uppercase' }}>
                        {item.section_type}
                      </span>
                      <div style={{ fontSize: '12px', color: textColor }}>{item.text}</div>
                    </div>
                  ))
                )
              )}

              {activeSubTab === 'removed' && (
                data.removed.length === 0 ? (
                  <p style={{ color: mutedColor, textAlign: 'center', padding: '24px' }}>No removed clauses found.</p>
                ) : (
                  data.removed.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,77,106,0.25)',
                      background: 'rgba(255,77,106,0.04)', display: 'flex', flexDirection: 'column', gap: '6px'
                    }}>
                      <span style={{ alignSelf: 'start', fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,77,106,0.15)', color: '#FF4D6A', fontWeight: 700, textTransform: 'uppercase' }}>
                        {item.section_type}
                      </span>
                      <div style={{ fontSize: '12px', color: textColor, textDecoration: 'line-through' }}>{item.text}</div>
                    </div>
                  ))
                )
              )}

              {activeSubTab === 'unchanged' && (
                data.unchanged.length === 0 ? (
                  <p style={{ color: mutedColor, textAlign: 'center', padding: '24px' }}>No unchanged clauses found.</p>
                ) : (
                  data.unchanged.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '12px 16px', borderRadius: '12px', border: `1px solid ${borderColor}`,
                      background: dark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                      display: 'flex', flexDirection: 'column', gap: '6px'
                    }}>
                      <span style={{ alignSelf: 'start', fontSize: '9px', padding: '2px 6px', borderRadius: '5px', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: mutedColor, fontWeight: 700, textTransform: 'uppercase' }}>
                        {item.section_type}
                      </span>
                      <div style={{ fontSize: '12px', color: textColor }}>{item.text}</div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
