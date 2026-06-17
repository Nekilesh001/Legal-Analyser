/**
 * ErrorBoundary — Catches render errors in a route subtree and shows a
 * recoverable fallback UI instead of a blank/broken app.
 */
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #EBF4FF 0%, #F0F8FF 100%)',
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        }}>
          <div style={{
            maxWidth: '500px',
            width: '90%',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            border: '1px solid rgba(65,192,242,0.20)',
            boxShadow: '0 20px 60px rgba(13,81,140,0.10)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ margin: '0 0 12px', color: '#0A2440', fontSize: '22px', fontWeight: 700 }}>
              Something went wrong
            </h2>
            <p style={{ color: '#2A5F82', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              This page encountered an error. Your data is safe — try refreshing or navigating back.
            </p>
            {this.state.error && (
              <details style={{
                marginBottom: '24px',
                padding: '12px',
                background: 'rgba(255,77,106,0.06)',
                borderRadius: '12px',
                border: '1px solid rgba(255,77,106,0.15)',
                textAlign: 'left',
              }}>
                <summary style={{ color: '#D93025', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                  Error details
                </summary>
                <pre style={{ margin: '8px 0 0', fontSize: '11px', color: '#2A5F82', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 24px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg,#0D518C,#41C0F2)',
                  color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                }}
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.history.back(); }}
                style={{
                  padding: '10px 24px', borderRadius: '12px',
                  border: '1px solid rgba(65,192,242,0.25)',
                  background: 'transparent', color: '#2A5F82',
                  fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                }}
              >
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
