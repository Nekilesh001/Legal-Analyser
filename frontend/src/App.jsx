import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Auth context (single source of truth for user/role/token)
import { AuthProvider, useAuth } from './context/AuthContext';

// Error boundary
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import RoleSelect from './pages/RoleSelect';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ContractUpload from './pages/ContractUpload';
import AnalysisView from './pages/AnalysisView';
import History from './pages/History';
import LegalChat from './pages/LegalChat';
import Analytics from './pages/Analytics';

// ─── React Query client ───────────────────────────────────────────────────────
// staleTime: data is considered fresh for 60s — navigating back shows cached
// data instantly without a re-fetch flash.
// retry: don't retry on 401/403/404; those are logical errors not transient ones.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,           // 60 seconds fresh
      gcTime: 5 * 60_000,          // 5 minutes cache
      refetchOnWindowFocus: false, // Don't refetch just on tab focus
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
    },
  },
});

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/select-role" state={{ from: location }} replace />;
  }

  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ─── Root Redirect ────────────────────────────────────────────────────────────
function RootRedirect() {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/select-role" replace />;
  return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public */}
            <Route path="/select-role" element={
              <ErrorBoundary>
                <RoleSelect />
              </ErrorBoundary>
            } />
            <Route path="/" element={<RootRedirect />} />

            {/* User routes */}
            <Route path="/dashboard" element={
              <ErrorBoundary>
                <ProtectedRoute><UserDashboard /></ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/upload" element={
              <ErrorBoundary>
                <ProtectedRoute><ContractUpload /></ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/analysis/:contractId" element={
              <ErrorBoundary>
                <ProtectedRoute><AnalysisView /></ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/history" element={
              <ErrorBoundary>
                <ProtectedRoute><History /></ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/chat" element={
              <ErrorBoundary>
                <ProtectedRoute><LegalChat /></ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/analytics" element={
              <ErrorBoundary>
                <ProtectedRoute><Analytics /></ProtectedRoute>
              </ErrorBoundary>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ErrorBoundary>
                <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/admin/analytics" element={
              <ErrorBoundary>
                <ProtectedRoute requireAdmin><Analytics admin /></ProtectedRoute>
              </ErrorBoundary>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
