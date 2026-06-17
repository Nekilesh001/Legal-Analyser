import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import BentoCard from '../components/BentoCard';
import { getAnalyticsSummary, getRiskDistribution, getScoreTrend, getBiasDistribution, getMissingClausesFrequency, adminGetSummary } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const COLORS = { High: '#FF4D6A', Medium: '#FFAA2C', Low: '#2ECC71' };

export default function Analytics({ admin = false }) {
  const { role } = useAuth();
  const isAdmin = admin && role === 'admin';

  const { data: summaryRes, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => getAnalyticsSummary().then(res => res.data),
  });
  const { data: riskDist = [], isLoading: loadingRisk } = useQuery({
    queryKey: ['risk-distribution'],
    queryFn: () => getRiskDistribution().then(res => res.data),
  });
  const { data: trend = [], isLoading: loadingTrend } = useQuery({
    queryKey: ['score-trend', 30],
    queryFn: () => getScoreTrend(30).then(res => res.data),
  });
  const { data: bias, isLoading: loadingBias } = useQuery({
    queryKey: ['bias-distribution'],
    queryFn: () => getBiasDistribution().then(res => res.data),
  });
  const { data: missingFreq = [], isLoading: loadingMissing } = useQuery({
    queryKey: ['missing-clauses-frequency'],
    queryFn: () => getMissingClausesFrequency().then(res => res.data),
  });

  const loading = loadingSummary || loadingRisk || loadingTrend || loadingBias || loadingMissing;
  const summary = summaryRes;

  const textColor = '#0A2440';
  const mutedColor = '#2A5F82';

  const CustomTooltipStyle = {
    background: 'rgba(255,255,255,0.97)',
    border: '1px solid rgba(65,192,242,0.25)',
    borderRadius: '10px',
    padding: '10px 14px',
  };

  if (loading) {
    return <Layout title="Analytics"><div style={{ textAlign: 'center', padding: '80px', color: mutedColor }}>Loading analytics...</div></Layout>;
  }

  const biasData = bias ? [
    { name: 'Buyer', value: bias.buyer_pct, color: '#FF4D6A' },
    { name: 'Vendor', value: bias.vendor_pct, color: '#41C0F2' },
    { name: 'Neutral', value: bias.neutral_pct, color: '#2ECC71' },
  ].filter(d => d.value > 0) : [];

  return (
    <Layout title={`${isAdmin ? 'Platform ' : ''}Analytics`}>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Total Contracts', value: summary?.total_contracts || 0, icon: '📄' },
          { label: 'Avg Health Score', value: summary?.avg_health_score ? `${summary.avg_health_score}` : '—', icon: '💚' },
          { label: 'Total High Risk', value: summary?.total_high_risk || 0, icon: '🚨', color: '#D93025' },
          { label: 'Total Medium Risk', value: summary?.total_medium_risk || 0, icon: '⚠️', color: '#F4A60A' },
        ].map(({ label, value, icon, color }) => (
          <BentoCard key={label} title={label} icon={icon}>
            <div style={{ fontSize: '40px', fontWeight: 900, color: color || textColor, lineHeight: 1 }}>{value}</div>
          </BentoCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Score trend */}
        <BentoCard title="Health Score Trend" icon="📈" subtitle="Last 30 analyses">
          {trend.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,192,242,0.10)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: mutedColor }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: mutedColor }} />
                <Tooltip contentStyle={CustomTooltipStyle} labelStyle={{ color: textColor, fontWeight: 700 }} />
                <Line type="monotone" dataKey="health_score" stroke="#41C0F2" strokeWidth={2.5} dot={{ fill: '#41C0F2', r: 4 }} name="Health Score" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: mutedColor, textAlign: 'center', padding: '40px' }}>Insufficient data for trend</p>
          )}
        </BentoCard>

        {/* Bias distribution donut */}
        <BentoCard title="Overall Bias Distribution" icon="⚖️" subtitle="Across all contracts">
          {biasData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={biasData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {biasData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 6px ${entry.color}50)` }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CustomTooltipStyle} formatter={(v) => `${v.toFixed(1)}%`} />
                <Legend formatter={(v) => <span style={{ color: textColor, fontSize: '12px' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: mutedColor, textAlign: 'center', padding: '40px' }}>No bias data yet</p>
          )}
        </BentoCard>

        {/* Risk by contract type */}
        <BentoCard title="Risk Distribution by Contract Type" icon="📊" subtitle="High, Medium, Low risk clause counts">
          {riskDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,192,242,0.10)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: mutedColor }} />
                <YAxis type="category" dataKey="contract_type" tick={{ fontSize: 11, fill: mutedColor }} width={80} />
                <Tooltip contentStyle={CustomTooltipStyle} labelStyle={{ color: textColor, fontWeight: 700 }} />
                <Bar dataKey="high" fill="#FF4D6A" name="High Risk" radius={[0, 4, 4, 0]} />
                <Bar dataKey="medium" fill="#FFAA2C" name="Medium Risk" radius={[0, 4, 4, 0]} />
                <Bar dataKey="low" fill="#2ECC71" name="Low Risk" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: mutedColor, textAlign: 'center', padding: '40px' }}>No data yet</p>
          )}
        </BentoCard>

        {/* Missing clauses frequency */}
        <BentoCard title="Most Frequently Missing Clauses" icon="⚠️" subtitle="Top 10 gaps across all contracts">
          {missingFreq.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {missingFreq.slice(0, 10).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: mutedColor, minWidth: '20px', textAlign: 'right' }}>#{i + 1}</span>
                  <div style={{ flex: 1, fontSize: '12px', color: textColor, lineHeight: 1.4 }}>{item.clause}</div>
                  <span style={{ padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,77,106,0.12)', color: '#D93025', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    {item.count}×
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: mutedColor, textAlign: 'center', padding: '40px' }}>No data yet</p>
          )}
        </BentoCard>
      </div>
    </Layout>
  );
}
