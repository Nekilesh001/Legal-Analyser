import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * BiasDetectorCard — Donut chart showing buyer/vendor/neutral bias distribution.
 * Props:
 *   buyerPct: float
 *   vendorPct: float
 *   neutralPct: float
 *   dark: bool
 */
export default function BiasDetectorCard({ buyerPct = 0, vendorPct = 0, neutralPct = 100, dark = false }) {
  const data = [
    { name: 'Party A (Buyer)', value: Math.max(buyerPct, 0), color: '#FF4D6A' },
    { name: 'Party B (Vendor)', value: Math.max(vendorPct, 0), color: '#41C0F2' },
    { name: 'Neutral', value: Math.max(neutralPct, 0), color: '#2ECC71' },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    data.push({ name: 'Neutral', value: 100, color: '#2ECC71' });
  }

  const textColor = dark ? '#E8F4FD' : '#0A2440';
  const mutedColor = dark ? '#8BAFC8' : '#2A5F82';

  const getDominantLabel = () => {
    if (buyerPct > vendorPct && buyerPct > neutralPct) return { text: 'Favours Buyer', color: '#FF4D6A' };
    if (vendorPct > buyerPct && vendorPct > neutralPct) return { text: 'Favours Vendor', color: '#41C0F2' };
    return { text: 'Balanced', color: '#2ECC71' };
  };

  const dominant = getDominantLabel();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: dark ? 'rgba(10,22,40,0.95)' : 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(65,192,242,0.3)',
          borderRadius: '10px',
          padding: '10px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          <p style={{ margin: 0, color: textColor, fontWeight: 600, fontSize: '13px' }}>
            {payload[0].name}
          </p>
          <p style={{ margin: '4px 0 0', color: payload[0].payload.color, fontWeight: 700, fontSize: '16px' }}>
            {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: dominant.color }}>
          {dominant.text}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color}
                opacity={0.9}
                style={{ filter: `drop-shadow(0 0 6px ${entry.color}60)` }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          { label: 'Party A (Buyer)', pct: buyerPct, color: '#FF4D6A' },
          { label: 'Party B (Vendor)', pct: vendorPct, color: '#41C0F2' },
          { label: 'Neutral', pct: neutralPct, color: '#2ECC71' },
        ].map(({ label, pct, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
              <div style={{
                height: '100%', borderRadius: '3px',
                width: `${pct}%`, background: color,
                transition: 'width 0.6s ease',
                boxShadow: `0 0 8px ${color}60`
              }} />
            </div>
            <span style={{ fontSize: '12px', color: mutedColor, minWidth: '36px', textAlign: 'right' }}>
              {pct?.toFixed(1) ?? '0.0'}%
            </span>
            <span style={{ fontSize: '12px', color: textColor, minWidth: '100px' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
