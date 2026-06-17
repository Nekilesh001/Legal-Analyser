import React, { useState, useRef, useEffect } from 'react';

/**
 * ChatWindow — Full legal chat interface with message history, source citations,
 * disclaimer, and typing indicator.
 * Props:
 *   onSubmit: async (question: string) => {answer, sources, low_confidence}
 *   history: array of {question, answer, sources, low_confidence, created_at}
 *   dark: bool
 *   loading: bool
 */
export default function ChatWindow({ onSubmit, history = [], dark = false, loading = false }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const textColor = dark ? '#E8F4FD' : '#0A2440';
  const mutedColor = dark ? '#8BAFC8' : '#2A5F82';

  // Load history as initial messages
  useEffect(() => {
    if (history.length > 0 && messages.length === 0) {
      const histMsgs = [];
      [...history].reverse().forEach(h => {
        histMsgs.push({ role: 'user', content: h.question, id: `h-q-${h.id}` });
        histMsgs.push({
          role: 'assistant', content: h.answer, id: `h-a-${h.id}`,
          sources: h.sources, low_confidence: h.low_confidence
        });
      });
      setMessages(histMsgs);
    }
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: q, id: `u-${Date.now()}` };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await onSubmit(q);
      const assistantMsg = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        low_confidence: response.low_confidence,
        id: `a-${Date.now()}`
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        sources: [],
        low_confidence: true,
        id: `e-${Date.now()}`
      }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const msgBubbleStyle = (role) => ({
    maxWidth: '80%',
    padding: '14px 18px',
    borderRadius: role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
    background: role === 'user'
      ? 'linear-gradient(135deg, #0D518C, #41C0F2)'
      : dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
    color: role === 'user' ? '#fff' : textColor,
    fontSize: '14px',
    lineHeight: 1.6,
    boxShadow: role === 'user'
      ? '0 4px 16px rgba(13,81,140,0.35)'
      : dark ? '0 4px 16px rgba(0,0,0,0.25)' : '0 4px 16px rgba(65,192,242,0.10)',
    border: role === 'assistant' ? `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(65,192,242,0.15)'}` : 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  });

  const SUGGESTED = [
    'What are mandatory clauses in an employment contract in India?',
    'What is the notice period required under the Industrial Disputes Act?',
    'What is the POSH Act and what does it require from employers?',
    'How does gratuity work under the Payment of Gratuity Act?',
    'What are MSME payment timelines under Indian law?',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚖️</div>
            <p style={{ color: textColor, fontWeight: 700, fontSize: '18px', margin: '0 0 8px' }}>
              Ask a Legal Question
            </p>
            <p style={{ color: mutedColor, fontSize: '13px', margin: '0 0 24px' }}>
              Grounded in Indian law — sources cited with every answer
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '480px', margin: '0 auto' }}>
              {SUGGESTED.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  style={{
                    textAlign: 'left', padding: '10px 14px', borderRadius: '12px',
                    border: `1px solid ${dark ? 'rgba(65,192,242,0.20)' : 'rgba(65,192,242,0.25)'}`,
                    background: dark ? 'rgba(65,192,242,0.05)' : 'rgba(65,192,242,0.05)',
                    color: mutedColor, fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#41C0F2'; e.currentTarget.style.borderColor = 'rgba(65,192,242,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = mutedColor; e.currentTarget.style.borderColor = dark ? 'rgba(65,192,242,0.20)' : 'rgba(65,192,242,0.25)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={msgBubbleStyle(msg.role)}>
              {msg.content}
            </div>

            {/* Sources for assistant messages */}
            {msg.role === 'assistant' && msg.sources?.length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {msg.sources.map((src, i) => (
                  <span key={i} style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                    background: 'rgba(65,192,242,0.12)', color: '#41C0F2',
                    border: '1px solid rgba(65,192,242,0.25)', fontWeight: 600
                  }}>
                    📋 {src}
                  </span>
                ))}
              </div>
            )}

            {/* Low confidence warning */}
            {msg.role === 'assistant' && msg.low_confidence && (
              <span style={{ fontSize: '11px', color: '#FFAA2C', marginTop: '4px' }}>
                ⚠️ Low confidence — consider consulting a lawyer
              </span>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ ...msgBubbleStyle('assistant'), display: 'flex', gap: '6px', alignItems: 'center', padding: '14px 18px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#41C0F2',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: '8px 16px',
        background: dark ? 'rgba(255,170,44,0.06)' : 'rgba(255,170,44,0.05)',
        borderTop: '1px solid rgba(255,170,44,0.20)',
        fontSize: '11px', color: '#FFAA2C', textAlign: 'center',
      }}>
        ⚖️ LexClarity provides legal information, not legal advice. Always consult a qualified lawyer before taking legal action.
      </div>

      {/* Input area */}
      <div style={{
        padding: '12px 16px',
        borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        display: 'flex', gap: '10px', alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a legal question... (Enter to send, Shift+Enter for new line)"
          rows={2}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '14px',
            border: `1px solid ${dark ? 'rgba(65,192,242,0.20)' : 'rgba(65,192,242,0.25)'}`,
            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
            color: textColor, fontSize: '14px', resize: 'none', outline: 'none',
            fontFamily: 'inherit', lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          id="chat-send-btn"
          style={{
            padding: '10px 20px', borderRadius: '14px',
            background: loading || !input.trim() ? '#4A6880' : 'linear-gradient(135deg, #0D518C, #41C0F2)',
            color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            boxShadow: loading || !input.trim() ? 'none' : '0 4px 16px rgba(13,81,140,0.35)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap', alignSelf: 'flex-end',
          }}
        >
          {loading ? '...' : 'Send ➤'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
