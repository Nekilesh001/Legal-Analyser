import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AnalysisProvider } from './contexts/AnalysisContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages (lazy loaded)
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const ContractAnalyzer = React.lazy(() => import('./components/ContractAnalyzer'));
const AnalysisResults = React.lazy(() => import('./components/AnalysisResults'));
const ContractTemplates = React.lazy(() => import('./components/ContractTemplates'));
const AnalysisHistory = React.lazy(() => import('./components/AnalysisHistory'));
const Reports = React.lazy(() => import('./components/Reports'));
const Settings = React.lazy(() => import('./components/Settings'));
const Help = React.lazy(() => import('./components/Help'));
const KnowledgeBase = React.lazy(() => import('./components/KnowledgeBase'));

function App() {
  return (
    <SettingsProvider>
      <AnalysisProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Navigation */}
              <Navbar />
              
              {/* Page Content */}
              <main className="flex-1 overflow-auto">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analyzer" element={<ContractAnalyzer />} />
                    <Route path="/results/:id" element={<AnalysisResults />} />
                    <Route path="/templates" element={<ContractTemplates />} />
                    <Route path="/history" element={<AnalysisHistory />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/knowledge" element={<KnowledgeBase />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </div>
        </Router>
      </AnalysisProvider>
    </SettingsProvider>
  );
}

export default App;