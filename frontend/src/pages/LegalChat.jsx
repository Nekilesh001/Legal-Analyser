import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import BentoCard from '../components/BentoCard';
import ChatWindow from '../components/ChatWindow';
import { askLegalQuestion, getChatHistory } from '../api/client';

export default function LegalChat() {
  const [chatLoading, setChatLoading] = useState(false);

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => getChatHistory(50, 0).then(res => res.data),
  });

  const handleSubmit = async (question) => {
    setChatLoading(true);
    try {
      const res = await askLegalQuestion(question);
      return res.data;
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Layout title="Legal Chat Assistant">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
        {/* Chat panel */}
        <BentoCard title="Ask a Legal Question" icon="⚖️" subtitle="Grounded in Indian law — sources cited with every answer">
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#2A5F82' }}>Loading history...</div>
          ) : (
            <ChatWindow
              onSubmit={handleSubmit}
              history={history}
              loading={chatLoading}
            />
          )}
        </BentoCard>

        {/* Info sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <BentoCard title="Knowledge Base" icon="📚">
            <div style={{ fontSize: '12px', color: '#2A5F82', lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#0A2440' }}>Covered Laws:</p>
              {[
                'Indian Contract Act 1872',
                'Industrial Disputes Act 1947',
                'Payment of Wages Act 1936',
                'Minimum Wages Act 1948',
                'Payment of Gratuity Act 1972',
                'Payment of Bonus Act 1965',
                'EPF & MP Act 1952',
                'ESIC Act 1948',
                'Maternity Benefit Act 1961',
                'POSH Act 2013',
                'IT Act 2000',
                'MSMED Act 2006',
                'CGST Act 2017',
                'Registration Act 1908',
                'Transfer of Property Act 1882',
                'Factories Act 1948',
                'Arbitration Act 1996',
                'Specific Relief Act 1963',
              ].map(law => (
                <div key={law} style={{ padding: '4px 0', borderBottom: '1px solid rgba(65,192,242,0.08)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#41C0F2', fontSize: '10px' }}>▸</span>
                  {law}
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard title="How It Works" icon="🔍">
            <div style={{ fontSize: '12px', color: '#2A5F82', lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 8px' }}>1. 🔍 Searches legal documents using semantic similarity</p>
              <p style={{ margin: '0 0 8px' }}>2. 📋 Retrieves relevant passages with citations</p>
              <p style={{ margin: '0 0 8px' }}>3. 🤖 AI answers based only on retrieved documents</p>
              <p style={{ margin: 0 }}>4. ⚠️ Refuses to answer if context is insufficient</p>
            </div>
          </BentoCard>

          <div style={{
            padding: '14px', borderRadius: '14px',
            background: 'rgba(255,170,44,0.08)',
            border: '1px solid rgba(255,170,44,0.22)',
            fontSize: '12px', color: '#8A6A00',
            lineHeight: 1.6,
          }}>
            ⚖️ <strong>Important:</strong> LexClarity provides legal information only. Answers are sourced from Indian law databases and do not constitute legal advice. Always consult a qualified lawyer before taking legal action.
          </div>
        </div>
      </div>
    </Layout>
  );
}
