/**
 * AuthContext — Single source of truth for authentication state.
 *
 * Decodes the JWT once on load and exposes user, role, username, and token
 * to every page. All pages import from this context — never read localStorage
 * or decode the JWT independently.
 */
import React, { createContext, useContext, useState } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('role') || null);
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null);

  const signIn = (accessToken, userRole, userName) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('username', userName);
    setToken(accessToken);
    setRole(userRole);
    setUsername(userName);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setToken(null);
    setRole(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      role,
      username,
      signIn,
      signOut,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
