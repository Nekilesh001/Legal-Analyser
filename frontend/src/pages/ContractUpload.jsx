import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BentoCard from '../components/BentoCard';
import { uploadContract, runAnalysis, getContractStatus } from '../api/client';

const ACCEPTED_TYPES = ['.pdf', '.docx', '.txt'];

export default function ContractUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | analyzing | done | error
  const [uploadResult, setUploadResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [alreadyAnalyzed, setAlreadyAnalyzed] = useState(false);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const validateAndSetFile = (f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      setError(`Unsupported file type. Please upload a PDF, DOCX, or TXT file.`);
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File too large (max 50MB)');
      return;
    }
    setFile(f);
    setError('');
    setUploadState('idle');
    setUploadResult(null);
    setAnalysisResult(null);
    setAlreadyAnalyzed(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadState('uploading');
    setError('');
    setAlreadyAnalyzed(false);

    try {
      const uploadRes = await uploadContract(file);
      const contract = uploadRes.data;
      setUploadResult(contract);

      // Check if this contract was already uploaded and analyzed (duplicate recovery)
      try {
        const statusRes = await getContractStatus(contract.id);
        if (statusRes.data.status === 'complete') {
          // Already fully analyzed — skip to done state and link to existing analysis
          setAlreadyAnalyzed(true);
          setUploadState('done');
          return;
        }
      } catch {
        // Status check failed — ignore, proceed to normal flow
      }

      setUploadState('done_upload');
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      setUploadState('error');
    }
  };

  const handleRunAnalysis = async () => {
    if (!uploadResult) return;
    setUploadState('analyzing');
    setError('');

    try {
      const analysisRes = await runAnalysis(uploadResult.id);
      setAnalysisResult(analysisRes.data);
      setUploadState('done');
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
      setUploadState('error');
    }
  };

  const dropZoneStyle = {
    border: `2px dashed ${isDragging ? '#41C0F2' : 'rgba(65,192,242,0.30)'}`,
    borderRadius: '20px',
    padding: '48px 32px',
    textAlign: 'center',
    cursor: 'pointer',
    background: isDragging ? 'rgba(65,192,242,0.08)' : 'rgba(65,192,242,0.03)',
    transition: 'all 0.2s ease',
    boxShadow: isDragging ? '0 0 30px rgba(65,192,242,0.20)' : 'none',
  };

  const stepConfig = {
    idle: { color: '#2A5F82', icon: '○', label: 'Waiting' },
    uploading: { color: '#41C0F2', icon: '⟳', label: 'Uploading...' },
    done_upload: { color: '#2ECC71', icon: '✓', label: 'Uploaded' },
    analyzing: { color: '#41C0F2', icon: '⟳', label: 'Analyzing...' },
    done: { color: '#2ECC71', icon: '✓', label: 'Complete' },
    error: { color: '#FF4D6A', icon: '✗', label: 'Error' },
  };

  return (
    <Layout title="Upload Contract">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
        {/* Upload area */}
        <BentoCard title="Select Contract File" icon="📤" subtitle="PDF, DOCX, or TXT — up to 50MB">
          {/* Drop zone */}
          <div
            style={dropZoneStyle}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input id="file-input" type="file" accept=".pdf,.docx,.txt" onChange={handleFileDrop} style={{ display: 'none' }} />
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {file ? '📄' : '☁️'}
            </div>
            {file ? (
              <>
                <p style={{ fontWeight: 700, fontSize: '16px', color: '#0A2440', margin: '0 0 6px' }}>{file.name}</p>
                <p style={{ color: '#2A5F82', fontSize: '13px', margin: 0 }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB · {file.name.split('.').pop().toUpperCase()}
                </p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 600, fontSize: '16px', color: '#0A2440', margin: '0 0 8px' }}>
                  Drop your contract here
                </p>
                <p style={{ color: '#2A5F82', fontSize: '13px', margin: 0 }}>or click to browse files</p>
                <p style={{ color: '#6A9AB8', fontSize: '12px', marginTop: '8px' }}>
                  Supports PDF (digital & scanned), DOCX, TXT
                </p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,77,106,0.12)', border: '1px solid rgba(255,77,106,0.25)', color: '#D93025', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            {uploadState === 'idle' && file && (
              <button id="upload-btn" onClick={handleUpload} style={{
                flex: 1, padding: '14px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg,#0D518C,#41C0F2)',
                color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(13,81,140,0.30)',
              }}>
                Upload Contract →
              </button>
            )}

            {uploadState === 'uploading' && (
              <div style={{ flex: 1, textAlign: 'center', padding: '14px', color: '#41C0F2', fontWeight: 700 }}>
                ⟳ Uploading and extracting text...
              </div>
            )}

            {uploadState === 'done_upload' && (
              <button id="analyze-btn" onClick={handleRunAnalysis} style={{
                flex: 1, padding: '14px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg,#1E8E3E,#2ECC71)',
                color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(30,142,62,0.30)',
              }}>
                🔍 Run Full Analysis →
              </button>
            )}

            {uploadState === 'analyzing' && (
              <div style={{ flex: 1, textAlign: 'center', padding: '14px', color: '#41C0F2', fontWeight: 700 }}>
                ⟳ Analyzing clauses with AI... (this may take 30–60 seconds)
              </div>
            )}

            {uploadState === 'done' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {alreadyAnalyzed && (
                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(65,192,242,0.10)', border: '1px solid rgba(65,192,242,0.25)', color: '#2A5F82', fontSize: '12px', textAlign: 'center' }}>
                    ℹ️ This contract was already uploaded and analyzed (Contract #{uploadResult?.id}). Showing existing results.
                  </div>
                )}
                <button onClick={() => navigate(`/analysis/${uploadResult?.id}`)} style={{
                  flex: 1, padding: '14px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg,#0D518C,#41C0F2)',
                  color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                }}>
                  {alreadyAnalyzed ? '📊 View Existing Analysis →' : 'View Analysis Results →'}
                </button>
              </div>
            )}


            {file && (
              <button onClick={() => { setFile(null); setUploadState('idle'); setError(''); setUploadResult(null); }} style={{
                padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(65,192,242,0.25)',
                background: 'transparent', color: '#2A5F82', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}>
                Clear
              </button>
            )}
          </div>
        </BentoCard>

        {/* Status panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pipeline steps */}
          <BentoCard title="Processing Pipeline" icon="⚙️">
            {[
              { step: 'File Upload', status: ['uploading', 'done_upload', 'analyzing', 'done'].includes(uploadState) ? (uploadState === 'uploading' ? 'active' : 'done') : 'pending' },
              { step: 'Text Extraction', status: ['done_upload', 'analyzing', 'done'].includes(uploadState) ? 'done' : uploadState === 'uploading' ? 'active' : 'pending' },
              { step: 'NLP Pipeline', status: uploadState === 'analyzing' ? 'active' : uploadState === 'done' ? 'done' : 'pending' },
              { step: 'AI Clause Analysis', status: uploadState === 'analyzing' ? 'active' : uploadState === 'done' ? 'done' : 'pending' },
              { step: 'RAG Missing Clauses', status: uploadState === 'done' ? 'done' : 'pending' },
              { step: 'Scoring & Report', status: uploadState === 'done' ? 'done' : 'pending' },
            ].map(({ step, status }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  background: status === 'done' ? '#2ECC71' : status === 'active' ? '#41C0F2' : 'rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: '#fff', fontWeight: 700,
                  boxShadow: status === 'active' ? '0 0 10px rgba(65,192,242,0.50)' : 'none',
                  animation: status === 'active' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}>
                  {status === 'done' ? '✓' : status === 'active' ? '◉' : '○'}
                </div>
                <span style={{ fontSize: '13px', color: status === 'pending' ? '#6A9AB8' : '#0A2440', fontWeight: status === 'active' ? 700 : 400 }}>
                  {step}
                </span>
              </div>
            ))}
          </BentoCard>

          {/* Upload result info */}
          {uploadResult && (
            <BentoCard title="Upload Result" icon="✅" accentColor="#2ECC71">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#0A2440' }}>
                <div><strong>Contract ID:</strong> #{uploadResult.id}</div>
                <div><strong>Filename:</strong> {uploadResult.filename}</div>
                <div><strong>Type:</strong> {uploadResult.contract_type || 'to be detected'}</div>
                <div><strong>Extraction:</strong> {uploadResult.extraction_method}</div>
                <div><strong>Text length:</strong> {uploadResult.raw_text_length?.toLocaleString()} chars</div>
              </div>
            </BentoCard>
          )}

          {/* Info card */}
          <BentoCard title="What Happens Next?" icon="ℹ️">
            <div style={{ fontSize: '12px', color: '#2A5F82', lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 8px' }}>1. 📄 Text is extracted (or OCR'd if scanned)</p>
              <p style={{ margin: '0 0 8px' }}>2. 🔤 Language detection (English/Tamil)</p>
              <p style={{ margin: '0 0 8px' }}>3. 🔍 NLP clause segmentation</p>
              <p style={{ margin: '0 0 8px' }}>4. 🤖 AI risk analysis per clause (Groq/Gemini)</p>
              <p style={{ margin: '0 0 8px' }}>5. ⚖️ Missing clause detection vs. Indian law</p>
              <p style={{ margin: 0 }}>6. 📊 Health score + bias distribution</p>
            </div>
          </BentoCard>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </Layout>
  );
}
