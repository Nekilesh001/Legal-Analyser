import React, { useEffect, useRef } from 'react';

/**
 * HealthScoreCard — Animated circular gauge showing the contract health score.
 * Props:
 *   score: number (0–100) or null
 *   dark: bool
 *   highCount: int
 *   mediumCount: int
 *   lowCount: int
 *   failedCount: int
 */
export default function HealthScoreCard({ score, dark = false, highCount = 0, mediumCount = 0, lowCount = 0, failedCount = 0 }) {
  const canvasRef = useRef(null);

  const getColor = (s) => {
    if (s === null || s === undefined) return '#8BAFC8';
    if (s >= 75) return '#2ECC71';
    if (s >= 50) return '#FFAA2C';
    return '#FF4D6A';
  };

  const getLabel = (s) => {
    if (s === null || s === undefined) return 'N/A';
    if (s >= 75) return 'Healthy';
    if (s >= 50) return 'Moderate';
    return 'At Risk';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || score === null || score === undefined) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.38;
    const lineWidth = size * 0.09;

    ctx.clearRect(0, 0, size, size);

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score arc — animate
    const targetAngle = (score / 100) * Math.PI * 1.5;
    let currentAngle = 0;
    const animate = () => {
      if (currentAngle >= targetAngle) return;
      currentAngle = Math.min(currentAngle + (targetAngle / 40), targetAngle);
      ctx.clearRect(0, 0, size, size);

      // Background
      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI * 0.75, Math.PI * 2.25);
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Score arc
      const scoreColor = getColor(score);
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#41C0F2');
      gradient.addColorStop(1, scoreColor);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI * 0.75, Math.PI * 0.75 + currentAngle);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (currentAngle < targetAngle) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }, [score, dark]);

  const textColor = dark ? '#E8F4FD' : '#0A2440';
  const mutedColor = dark ? '#8BAFC8' : '#2A5F82';
  const scoreColor = getColor(score);

  const statStyle = {
    textAlign: 'center',
    padding: '10px 14px',
    borderRadius: '12px',
    flex: 1,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      {/* Gauge */}
      <div style={{ position: 'relative', width: '180px', height: '180px' }}>
        <canvas ref={canvasRef} width={180} height={180} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          paddingTop: '20px'
        }}>
          <span style={{ fontSize: '42px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
            {score !== null && score !== undefined ? Math.round(score) : '—'}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: scoreColor, marginTop: '4px' }}>
            {getLabel(score)}
          </span>
        </div>
      </div>

      {/* Risk breakdown */}
      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        {[
          { label: 'High', count: highCount, color: '#FF4D6A', bg: 'rgba(255,77,106,0.12)' },
          { label: 'Medium', count: mediumCount, color: '#FFAA2C', bg: 'rgba(255,170,44,0.12)' },
          { label: 'Low', count: lowCount, color: '#2ECC71', bg: 'rgba(46,204,113,0.12)' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} style={{ ...statStyle, background: bg }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color }}>{count}</div>
            <div style={{ fontSize: '11px', color: mutedColor, fontWeight: 600, marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {failedCount > 0 && (
        <p style={{ fontSize: '12px', color: mutedColor, margin: 0, textAlign: 'center' }}>
          ⚠️ {failedCount} clause{failedCount !== 1 ? 's' : ''} could not be analyzed
        </p>
      )}

      <p style={{ fontSize: '11px', color: mutedColor, margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
        ⚖️ Not legal advice — consult a qualified lawyer
      </p>
    </div>
  );
}
