import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import BentoCard from '../components/BentoCard';
import HealthScoreCard from '../components/HealthScoreCard';
import BiasDetectorCard from '../components/BiasDetectorCard';
import MissingClauseCard from '../components/MissingClauseCard';
import NegotiationPlaybookCard from '../components/NegotiationPlaybookCard';
import ClauseAnalysisTable from '../components/ClauseAnalysisTable';
import { useAuth } from '../context/AuthContext';
import { 
  getAnalysis, 
  runAnalysis, 
  exportAnalysisJson, 
  exportAnalysisCsv, 
  exportAnalysisPdf,
  getContractChatHistory,
  askContractQuestion
} from '../api/client';

export default function AnalysisView() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rerunning, setRerunning] = useState(false);
  const [rerunError, setRerunError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { role } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const chatContainerRef = useRef(null);

  const { data: chatHistory = [] } = useQuery({
    queryKey: ['contract-chat-history', contractId],
    queryFn: () => getContractChatHistory(parseInt(contractId)).then(res => res.data),
    enabled: chatOpen,
  });

  const mutation = useMutation({
    mutationFn: (text) => askContractQuestion(parseInt(contractId), text).then(res => res.data),
    onSuccess: (newMsg) => {
      queryClient.setQueryData(['contract-chat-history', contractId], (old = []) => [...old, newMsg]);
      setQuestionText('');
    }
  });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, mutation.isPending]);

  // useQuery caches by contractId — back-navigation shows data instantly
  const {
    data: analysis,
    isLoading: loading,
    error: fetchError,
  } = useQuery({
    queryKey: ['analysis', contractId],
    queryFn: () => getAnalysis(parseInt(contractId)).then(r => r.data),
    retry: (count, err) => err?.response?.status !== 404 && count < 2,
  });

  const error = rerunError || (fetchError
    ? (fetchError.response?.status === 404
        ? 'No analysis found. Please run the analysis first.'
        : 'Failed to load analysis.')
    : '');

  const handleRerun = async () => {
    setRerunning(true);
    setRerunError('');
    try {
      const res = await runAnalysis(parseInt(contractId));
      // Invalidate so the useQuery refetches fresh data
      queryClient.setQueryData(['analysis', contractId], res.data);
    } catch (err) {
      setRerunError(err.response?.data?.detail || 'Analysis failed.');
    } finally {
      setRerunning(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = async () => {
    const res = await exportAnalysisJson(parseInt(contractId));
    downloadBlob(res.data, `analysis_${contractId}.json`);
  };

  const handleExportCsv = async () => {
    const res = await exportAnalysisCsv(parseInt(contractId));
    downloadBlob(res.data, `analysis_${contractId}.csv`);
  };

  const handleExportPdf = async () => {
    const res = await exportAnalysisPdf(parseInt(contractId));
    downloadBlob(res.data, `analysis_${contractId}.pdf`);
  };

  const tabStyle = (active) => ({
    padding: '8px 18px', borderRadius: '10px', border: 'none',
    background: active ? 'rgba(65,192,242,0.18)' : 'transparent',
    color: active ? '#41C0F2' : '#2A5F82',
    fontWeight: active ? 700 : 400,
    fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease',
  });

  if (loading) {
    return (
      <Layout dark={role === 'admin'} title="Loading Analysis...">
        <div style={{ textAlign: 'center', padding: '80px', color: '#2A5F82' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'spin 1.5s linear infinite' }}>⟳</div>
          <p>Loading analysis results...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  if (error && !analysis) {
    return (
      <Layout dark={role === 'admin'} title="Analysis">
        <BentoCard>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: '#D93025', fontSize: '16px', marginBottom: '20px' }}>⚠️ {error}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={handleRerun} disabled={rerunning} style={{
                padding: '12px 24px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg,#0D518C,#41C0F2)',
                color: '#fff', fontWeight: 700, cursor: rerunning ? 'not-allowed' : 'pointer',
              }}>
                {rerunning ? 'Running...' : '🔍 Run Analysis'}
              </button>
              <button onClick={() => navigate('/upload')} style={{
                padding: '12px 24px', borderRadius: '12px',
                border: '1px solid rgba(65,192,242,0.25)', background: 'transparent',
                color: '#2A5F82', fontWeight: 600, cursor: 'pointer',
              }}>
                ← Back to Upload
              </button>
            </div>
          </div>
        </BentoCard>
      </Layout>
    );
  }

  const a = analysis;
  const isDarkMode = role === 'admin';

  return (
    <Layout dark={isDarkMode} title="Contract Analysis">
      {/* Header actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(65,192,242,0.06)', borderRadius: '12px', padding: '4px' }}>
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'clauses', label: `📋 Clauses (${a?.clause_results?.length || 0})` },
            { key: 'missing', label: `⚠️ Missing (${a?.missing_clauses?.length || 0})` },
            { key: 'playbook', label: '💡 Playbook' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={tabStyle(activeTab === key)}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={handleExportPdf} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(65,192,242,0.25)', background: 'transparent', color: '#2A5F82', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            ⬇ PDF
          </button>
          <button onClick={handleExportCsv} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(65,192,242,0.25)', background: 'transparent', color: '#2A5F82', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            ⬇ CSV
          </button>
          <button onClick={handleExportJson} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(65,192,242,0.25)', background: 'transparent', color: '#2A5F82', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            ⬇ JSON
          </button>
          <button onClick={handleRerun} disabled={rerunning} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#0D518C,#41C0F2)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: rerunning ? 'not-allowed' : 'pointer' }}>
            {rerunning ? '⟳ Running...' : '🔄 Re-run'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,77,106,0.10)', border: '1px solid rgba(255,77,106,0.25)', color: '#D93025', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Anomaly banner */}
      {a?.anomaly_detected && (
        <div style={{ marginBottom: '16px', padding: '12px 18px', borderRadius: '12px', background: 'rgba(255,77,106,0.12)', border: '1px solid rgba(255,77,106,0.30)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🚨</span>
          <div>
            <strong style={{ color: '#D93025', fontSize: '14px' }}>Anomaly Detected</strong>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#2A5F82' }}>
              This contract's health score is statistically unusual compared to your previous contracts of this type.
            </p>
          </div>
        </div>
      )}

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <BentoCard title="Health Score" icon="💚" subtitle="AI-computed contract risk score">
            <HealthScoreCard
              score={a?.health_score}
              highCount={a?.risk_counts?.high || 0}
              mediumCount={a?.risk_counts?.medium || 0}
              lowCount={a?.risk_counts?.low || 0}
              failedCount={a?.risk_counts?.failed || 0}
            />
          </BentoCard>

          <BentoCard title="Bias Analysis" icon="⚖️" subtitle="Contract balance between parties">
            <BiasDetectorCard
              buyerPct={a?.bias?.buyer_pct || 0}
              vendorPct={a?.bias?.vendor_pct || 0}
              neutralPct={a?.bias?.neutral_pct || 100}
            />
          </BentoCard>
        </div>
      )}

      {/* Clauses tab */}
      {activeTab === 'clauses' && (
        <BentoCard title="Clause Analysis" icon="📋" subtitle={`${a?.clause_count} clauses analyzed`}>
          <ClauseAnalysisTable clauses={a?.clause_results || []} />
        </BentoCard>
      )}

      {/* Missing clauses tab */}
      {activeTab === 'missing' && (
        <BentoCard title="Missing Mandatory Clauses" icon="⚠️" subtitle="Requirements under Indian law not found in this contract">
          <MissingClauseCard missingClauses={a?.missing_clauses || []} />
        </BentoCard>
      )}

      {/* Playbook tab */}
      {activeTab === 'playbook' && (
        <BentoCard title="Negotiation Playbook" icon="💡" subtitle="Recommended actions for high and medium risk clauses">
          <NegotiationPlaybookCard playbook={a?.negotiation_playbook || []} />
        </BentoCard>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: '20px', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,170,44,0.07)', border: '1px solid rgba(255,170,44,0.20)', fontSize: '12px', color: '#6A9AB8', textAlign: 'center' }}>
        ⚖️ <strong>Disclaimer:</strong> This analysis is generated by AI and is for informational purposes only. It does not constitute legal advice. Please consult a qualified lawyer before making any legal decisions.
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen(prev => !prev)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          border: 'none',
          background: isDarkMode 
            ? 'linear-gradient(135deg, #0D518C, #F59E0B)' 
            : 'linear-gradient(135deg, #0D518C, #41C0F2)',
          color: '#fff',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: isDarkMode 
            ? '0 8px 32px rgba(245,158,11,0.35)' 
            : '0 8px 32px rgba(65,192,242,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {chatOpen ? '✕' : '💬'}
      </button>

      {/* Contract Chat Panel Drawer */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: chatOpen ? '30px' : '-450px',
          bottom: '24px',
          width: '380px',
          background: isDarkMode ? 'rgba(10, 22, 40, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(65, 192, 242, 0.25)' : 'rgba(65, 192, 242, 0.25)'}`,
          borderRadius: '24px',
          boxShadow: isDarkMode 
            ? '0 24px 64px rgba(0, 0, 0, 0.7)' 
            : '0 24px 64px rgba(65, 192, 242, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          overflow: 'hidden',
          transition: 'right 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(65,192,242,0.18)' : 'rgba(65,192,242,0.18)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: isDarkMode ? '#E8F4FD' : '#0A2440' }}>
              Contract Assistant
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: isDarkMode ? '#8BAFC8' : '#2A5F82' }}>
              Ask follow-ups about this contract
            </p>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: isDarkMode ? '#8BAFC8' : '#2A5F82',
              fontSize: '18px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        <div
          ref={chatContainerRef}
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {chatHistory.length === 0 && !mutation.isPending && (
            <div style={{ textAlign: 'center', color: isDarkMode ? '#8BAFC8' : '#2A5F82', padding: '40px 20px', fontSize: '13px' }}>
              🤖 <strong>Ask anything about this contract!</strong>
              <p style={{ margin: '8px 0 0', fontSize: '11px', lineHeight: 1.5 }}>
                "Why is the termination clause high risk?"<br/>
                "What does the limitation of liability require?"
              </p>
            </div>
          )}
          
          {chatHistory.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* User Message */}
              <div style={{
                alignSelf: 'flex-end',
                maxWidth: '85%',
                background: isDarkMode ? '#0D518C' : '#E0F2FE',
                color: isDarkMode ? '#E8F4FD' : '#0A2440',
                padding: '10px 14px',
                borderRadius: '16px 16px 2px 16px',
                fontSize: '13px',
                lineHeight: 1.5,
              }}>
                {msg.question}
              </div>
              
              {/* Bot Response */}
              <div style={{
                alignSelf: 'flex-start',
                maxWidth: '85%',
                background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F3F4F6',
                color: isDarkMode ? '#E8F4FD' : '#1F2937',
                padding: '12px 14px',
                borderRadius: '16px 16px 16px 2px',
                fontSize: '13px',
                lineHeight: 1.5,
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : '#E5E7EB'}`,
              }}>
                {msg.answer}
                
                {/* Cited Law Sources */}
                {msg.law_sources && msg.law_sources.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {msg.law_sources.map((src, j) => (
                      <span key={j} style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '2px 8px', borderRadius: '8px',
                        background: 'rgba(65,192,242,0.12)', color: '#41C0F2',
                        fontSize: '10px', fontWeight: 600,
                      }}>
                        📚 {src}
                      </span>
                    ))}
                  </div>
                )}

                {/* Referenced Clauses */}
                {msg.referenced_clauses && msg.referenced_clauses.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {msg.referenced_clauses.map((cId, j) => (
                      <span key={j} style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '2px 8px', borderRadius: '8px',
                        background: 'rgba(46,204,113,0.12)', color: '#2ECC71',
                        fontSize: '10px', fontWeight: 600,
                      }}>
                        🔗 Clause {cId}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {mutation.isPending && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{
                alignSelf: 'flex-end',
                maxWidth: '85%',
                background: isDarkMode ? '#0D518C' : '#E0F2FE',
                color: isDarkMode ? '#E8F4FD' : '#0A2440',
                padding: '10px 14px',
                borderRadius: '16px 16px 2px 16px',
                fontSize: '13px',
                lineHeight: 1.5,
              }}>
                {mutation.variables}
              </div>
              <div style={{
                alignSelf: 'flex-start',
                background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F3F4F6',
                padding: '12px 16px',
                borderRadius: '16px 16px 16px 2px',
                fontSize: '13px',
                color: isDarkMode ? '#8BAFC8' : '#2A5F82',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : '#E5E7EB'}`,
              }}>
                <span className="pulsing-dots" style={{ fontSize: '18px', display: 'inline-block', animation: 'pulse 1.2s infinite' }}>⟳</span>
                Analyzing contract context...
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!questionText.trim() || mutation.isPending) return;
            mutation.mutate(questionText.trim());
          }}
          style={{
            padding: '16px 20px',
            borderTop: `1px solid ${isDarkMode ? 'rgba(65,192,242,0.18)' : 'rgba(65,192,242,0.18)'}`,
            display: 'flex',
            gap: '8px',
            background: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
          }}
        >
          <input
            type="text"
            placeholder="Type your question..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            disabled={mutation.isPending}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              border: `1px solid ${isDarkMode ? 'rgba(65,192,242,0.25)' : 'rgba(65,192,242,0.25)'}`,
              background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              color: isDarkMode ? '#E8F4FD' : '#0A2440',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={mutation.isPending || !questionText.trim()}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: isDarkMode ? '#F59E0B' : '#41C0F2',
              color: '#060D18',
              fontWeight: 700,
              fontSize: '13px',
              cursor: (mutation.isPending || !questionText.trim()) ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            Send
          </button>
        </form>

        {/* Chat Disclaimer */}
        <div style={{
          padding: '8px 16px',
          background: isDarkMode ? 'rgba(255,170,44,0.05)' : 'rgba(255,170,44,0.07)',
          borderTop: `1px solid ${isDarkMode ? 'rgba(255,170,44,0.15)' : 'rgba(255,170,44,0.15)'}`,
          fontSize: '10px',
          color: isDarkMode ? '#8BAFC8' : '#8A6A00',
          textAlign: 'center',
          lineHeight: 1.4,
        }}>
          ⚠️ Disclaimer: This chat is generated by AI and does not constitute legal advice.
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </Layout>
  );
}
