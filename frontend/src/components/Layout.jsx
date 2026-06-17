import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Shared navigation bar + page layout shell.
 * Props:
 *   dark: bool — admin (dark) vs user (light) theme
 *   children: page content
 *   title: page title
 */
export default function Layout({ dark = false, children, title }) {
  const { username, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const bg = dark ? '#060D18' : '#F0F8FF';
  const navBg = dark ? 'rgba(10,22,40,0.85)' : 'rgba(255,255,255,0.85)';
  const textColor = dark ? '#E8F4FD' : '#0A2440';
  const mutedColor = dark ? '#8BAFC8' : '#2A5F82';
  const borderColor = dark ? 'rgba(65,192,242,0.18)' : 'rgba(65,192,242,0.22)';

  const isAdmin = role === 'admin';

  const navLinks = isAdmin ? [
    { label: 'Dashboard', path: '/admin', icon: '🏠' },
    { label: 'Upload', path: '/upload', icon: '📤' },
    { label: 'History', path: '/history', icon: '🗂' },
    { label: 'Analytics', path: '/admin/analytics', icon: '📊' },
    { label: 'Legal Chat', path: '/chat', icon: '⚖️' },
  ] : [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Upload', path: '/upload', icon: '📤' },
    { label: 'History', path: '/history', icon: '🗂' },
    { label: 'Analytics', path: '/analytics', icon: '📊' },
    { label: 'Legal Chat', path: '/chat', icon: '⚖️' },
  ];

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '10px', cursor: 'pointer',
    background: isActive(path) ? 'rgba(65,192,242,0.18)' : 'transparent',
    color: isActive(path) ? '#41C0F2' : mutedColor,
    fontWeight: isActive(path) ? 700 : 400,
    fontSize: '13px',
    border: 'none', textDecoration: 'none',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(160deg, #060D18 0%, #0A1628 60%, #0F1E35 100%)'
        : 'linear-gradient(160deg, #E4F4FD 0%, #F0F8FF 60%, #FFFFFF 100%)',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Background glows */}
      <div style={{ position: 'fixed', top: '-30%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${dark ? 'rgba(65,192,242,0.06)' : 'rgba(65,192,242,0.08)'} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${dark ? 'rgba(13,81,140,0.10)' : 'rgba(65,192,242,0.06)'} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: dark ? 'rgba(6,13,24,0.90)' : 'rgba(240,248,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${borderColor}`,
        padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: '8px',
        height: '60px',
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginRight: '8px' }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #0D518C, #41C0F2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 4px 12px rgba(65,192,242,0.25)',
          }}>⚖️</div>
          <span style={{ fontWeight: 800, fontSize: '16px', color: textColor, letterSpacing: '-0.02em' }}>LexClarity</span>
          {isAdmin && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(65,192,242,0.18)', color: '#41C0F2', fontWeight: 700, letterSpacing: '0.06em' }}>
              ADMIN
            </span>
          )}
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '2px', flex: 1, overflow: 'auto' }}>
          {navLinks.map(({ label, path, icon }) => (
            <button key={path} onClick={() => navigate(path)} style={navLinkStyle(path)}>
              <span>{icon}</span>
              <span style={{ display: 'none' }}>{label}</span>
              <span style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* User info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: mutedColor }}>
            👤 {username}
          </span>
          <button
            onClick={signOut}
            id="logout-btn"
            style={{
              padding: '6px 14px', borderRadius: '10px', border: `1px solid ${borderColor}`,
              background: 'transparent', color: mutedColor, fontSize: '12px',
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,106,0.12)'; e.currentTarget.style.color = '#FF4D6A'; e.currentTarget.style.borderColor = 'rgba(255,77,106,0.30)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mutedColor; e.currentTarget.style.borderColor = borderColor; }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ position: 'relative', zIndex: 1, padding: '28px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        {title && (
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: textColor, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
        )}
        {children}
      </main>
    </div>
  );
}
