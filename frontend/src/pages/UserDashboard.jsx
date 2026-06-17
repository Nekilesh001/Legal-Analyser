import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import BentoCard from '../components/BentoCard';
import { listContracts, getAnalyticsSummary, getScoreTrend } from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function UserDashboard() {
  const { username } = useAuth();
  const navigate = useNavigate();

  const { data: contracts = [], isLoading: cLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => listContracts().then(r => r.data),
  });
  const { data: summary, isLoading: sLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => getAnalyticsSummary().then(r => r.data),
  });
  const { data: trend = [], isLoading: tLoading } = useQuery({
    queryKey: ['score-trend', 10],
    queryFn: () => getScoreTrend(10).then(r => r.data),
  });

  const loading = cLoading || sLoading || tLoading;


  const bentoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  };

  const statValue = (v) => v !== null && v !== undefined ? v : '—';

  return (
    <Layout title={`Welcome back, ${username} 👋`}>
      {/* Stats row */}
      <div style={bentoGridStyle}>
        <BentoCard title="Total Contracts" icon="📄" accentColor="linear-gradient(90deg,#41C0F2,#0D518C)">
          <div style={{ fontSize: '48px', fontWeight: 900, color: '#0A2440', lineHeight: 1 }}>
            {loading ? '—' : statValue(contracts.length)}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#2A5F82' }}>contracts uploaded</p>
        </BentoCard>

        <BentoCard title="Avg Health Score" icon="💚" accentColor="linear-gradient(90deg,#2ECC71,#1A9ED4)">
          <div style={{ fontSize: '48px', fontWeight: 900, color: summary?.avg_health_score >= 75 ? '#1E8E3E' : summary?.avg_health_score >= 50 ? '#F4A60A' : '#D93025', lineHeight: 1 }}>
            {loading ? '—' : statValue(summary?.avg_health_score)}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#2A5F82' }}>average across all contracts</p>
        </BentoCard>

        <BentoCard title="High Risk Clauses" icon="🚨" accentColor="#D93025">
          <div style={{ fontSize: '48px', fontWeight: 900, color: '#D93025', lineHeight: 1 }}>
            {loading ? '—' : statValue(summary?.total_high_risk)}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#2A5F82' }}>across all contracts</p>
        </BentoCard>

        <BentoCard title="Quick Actions" icon="⚡">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {[
              { label: '📤 Upload New Contract', path: '/upload', primary: true },
              { label: '🗂 View History', path: '/history', primary: false },
              { label: '⚖️ Legal Chat', path: '/chat', primary: false },
            ].map(({ label, path, primary }) => (
              <button key={path} onClick={() => navigate(path)} style={{
                padding: '10px 14px', borderRadius: '12px', border: primary ? 'none' : '1px solid rgba(65,192,242,0.25)',
                background: primary ? 'linear-gradient(135deg,#0D518C,#41C0F2)' : 'rgba(65,192,242,0.06)',
                color: primary ? '#fff' : '#0A2440', fontWeight: 600, fontSize: '13px',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                boxShadow: primary ? '0 4px 16px rgba(13,81,140,0.25)' : 'none',
              }}>
                {label}
              </button>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* Score trend chart */}
      {trend.length > 1 && (
        <BentoCard title="Health Score Trend" icon="📈" subtitle="Your contract health over time" className="" style={{ marginTop: '20px' }}>
          <div style={{ marginTop: '20px', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,192,242,0.10)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#2A5F82' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#2A5F82' }} />
                <Tooltip
                  contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(65,192,242,0.25)', borderRadius: '10px' }}
                  labelStyle={{ color: '#0A2440', fontWeight: 700 }}
                />
                <Line type="monotone" dataKey="health_score" stroke="#41C0F2" strokeWidth={2.5} dot={{ fill: '#41C0F2', r: 4 }} name="Health Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>
      )}

      {/* Recent contracts */}
      <div style={{ marginTop: '20px' }}>
        <BentoCard title="Recent Contracts" icon="🗂" subtitle={`${contracts.length} total`}>
          {loading ? (
            <p style={{ color: '#2A5F82', fontSize: '14px' }}>Loading...</p>
          ) : contracts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ color: '#2A5F82', fontSize: '14px', marginBottom: '16px' }}>No contracts yet</p>
              <button onClick={() => navigate('/upload')} style={{
                padding: '10px 20px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg,#0D518C,#41C0F2)',
                color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}>
                Upload Your First Contract →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', marginTop: '8px' }}>
              {contracts.slice(0, 8).map(c => (
                <div key={c.id} onClick={() => navigate(`/analysis/${c.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(65,192,242,0.05)', border: '1px solid rgba(65,192,242,0.12)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,192,242,0.10)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(65,192,242,0.05)'}
                >
                  <span style={{ fontSize: '20px' }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0A2440', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.filename}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#2A5F82' }}>
                      {c.contract_type || 'unknown'} · {c.extraction_method} · {new Date(c.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{ fontSize: '18px', color: '#41C0F2' }}>→</span>
                </div>
              ))}
            </div>
          )}
        </BentoCard>
      </div>
    </Layout>
  );
}
