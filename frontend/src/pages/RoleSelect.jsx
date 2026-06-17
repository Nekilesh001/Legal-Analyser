import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { devSession } from '../api/client';

export default function RoleSelect() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectRole = async (role) => {
    setLoading(true);
    setError(null);
    try {
      const response = await devSession(role);
      const { access_token, role: responseRole } = response.data;
      const username = role === 'admin' ? 'dev_admin' : 'dev_user';
      signIn(access_token, responseRole, username);
      navigate(responseRole === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      console.error('Role selection failed:', err);
      setError(err.response?.data?.detail || 'Failed to authenticate dev session. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #040814 0%, #081120 50%, #062847 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow blobs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(65,192,242,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,81,140,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Warning Notice Banner */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '12px',
        padding: '12px 24px',
        marginBottom: '32px',
        maxWidth: '600px',
        width: '100%',
        color: '#FCA5A5',
        fontSize: '14px',
        textAlign: 'center',
        zIndex: 2,
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
      }}>
        ⚠️ <strong>Development mode</strong> — no authentication enforced. Do not deploy this build publicly.
      </div>

      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '72px', height: '72px', borderRadius: '22px',
          background: 'linear-gradient(135deg, #0D518C, #41C0F2)',
          fontSize: '32px', marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(65,192,242,0.25)',
        }}>
          ⚖️
        </div>
        <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: '#E8F4FD', letterSpacing: '-0.02em' }}>
          LexClarity
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '16px', color: '#8BAFC8', fontWeight: 400 }}>
          Indian Legal Contract Intelligence Platform
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '12px',
          padding: '12px 24px',
          marginBottom: '24px',
          color: '#FCA5A5',
          fontSize: '14px',
          zIndex: 2,
          maxWidth: '800px',
        }}>
          ❌ {error}
        </div>
      )}

      {/* Role Selection Container */}
      <div style={{
        display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center',
        width: '100%', maxWidth: '800px', position: 'relative', zIndex: 1
      }}>
        {/* User Card - Styled with light/cool accents */}
        <div
          id="user-role-card"
          onClick={() => !loading && handleSelectRole('user')}
          onMouseEnter={() => setHoveredCard('user')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            flex: '1 1 340px',
            maxWidth: '380px',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: hoveredCard === 'user' ? '1px solid rgba(65,192,242,0.6)' : '1px solid rgba(65,192,242,0.18)',
            borderRadius: '24px',
            padding: '36px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: hoveredCard === 'user' 
              ? '0 24px 48px rgba(65,192,242,0.15), 0 1px 0 rgba(65,192,242,0.2) inset' 
              : '0 16px 36px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset',
            transform: hoveredCard === 'user' ? 'translateY(-6px)' : 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(65,192,242,0.1)',
            border: '1px solid rgba(65,192,242,0.2)',
            fontSize: '24px', marginBottom: '24px',
          }}>
            💼
          </div>
          <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 700, color: '#E8F4FD' }}>
            User Workspace
          </h2>
          <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#8BAFC8', lineHeight: 1.6, flexGrow: 1 }}>
            Access the legal workspace to upload contracts, review clause assessments, scan risk scores, detect missing clauses, and chat with the Indian Legal RAG.
          </p>
          <button style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: hoveredCard === 'user' ? '#41C0F2' : 'rgba(65,192,242,0.15)',
            color: hoveredCard === 'user' ? '#060D18' : '#41C0F2',
            fontWeight: 700, fontSize: '15px',
            transition: 'all 0.2s ease', cursor: loading ? 'not-allowed' : 'pointer',
            textAlign: 'center',
          }} disabled={loading}>
            {loading && hoveredCard === 'user' ? 'Connecting...' : 'Enter as User'}
          </button>
        </div>

        {/* Admin Card - Styled with dark/warm accents */}
        <div
          id="admin-role-card"
          onClick={() => !loading && handleSelectRole('admin')}
          onMouseEnter={() => setHoveredCard('admin')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            flex: '1 1 340px',
            maxWidth: '380px',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: hoveredCard === 'admin' ? '1px solid rgba(245,158,11,0.6)' : '1px solid rgba(245,158,11,0.18)',
            borderRadius: '24px',
            padding: '36px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: hoveredCard === 'admin' 
              ? '0 24px 48px rgba(245,158,11,0.15), 0 1px 0 rgba(245,158,11,0.2) inset' 
              : '0 16px 36px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset',
            transform: hoveredCard === 'admin' ? 'translateY(-6px)' : 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            fontSize: '24px', marginBottom: '24px',
          }}>
            🛡️
          </div>
          <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 700, color: '#E8F4FD' }}>
            Admin Portal
          </h2>
          <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#8BAFC8', lineHeight: 1.6, flexGrow: 1 }}>
            Access the admin dashboard to monitor system-wide statistics, inspect contract anomalies, manage user permissions, and track processing loads.
          </p>
          <button style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: hoveredCard === 'admin' ? '#F59E0B' : 'rgba(245,158,11,0.15)',
            color: hoveredCard === 'admin' ? '#060D18' : '#F59E0B',
            fontWeight: 700, fontSize: '15px',
            transition: 'all 0.2s ease', cursor: loading ? 'not-allowed' : 'pointer',
            textAlign: 'center',
          }} disabled={loading}>
            {loading && hoveredCard === 'admin' ? 'Connecting...' : 'Enter as Admin'}
          </button>
        </div>
      </div>

      <p style={{ fontSize: '11px', color: '#4A6880', textAlign: 'center', marginTop: '64px', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
        ⚖️ LexClarity provides legal information only and does not constitute legal advice.
      </p>
    </div>
  );
}
