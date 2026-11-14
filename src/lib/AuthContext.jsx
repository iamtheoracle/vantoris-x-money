import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const AUTH_ENDPOINT = '/api/member-auth';

function readCsrfCookie() {
  if (typeof document === 'undefined') return '';
  const item = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('__Host-vantoris_csrf='));
  return item ? decodeURIComponent(item.slice('__Host-vantoris_csrf='.length)) : '';
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const response = await fetch(`${AUTH_ENDPOINT}?action=me`, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) {
        setUser(null);
        setAccounts([]);
        setIsAuthenticated(false);
        setAuthError(response.status === 401 ? { type: 'auth_required', message: 'Sign in to continue.' } : {
          type: 'service_unavailable',
          message: 'Vantoris account services are temporarily unavailable.',
        });
        return false;
      }
      const data = await response.json();
      if (!data?.member?.id || !Array.isArray(data.accounts)) {
        throw new Error('Invalid Vantoris member session response.');
      }
      setUser(data.member);
      setAccounts(data.accounts);
      setIsAuthenticated(true);
      setAuthError(null);
      return true;
    } catch (error) {
      setUser(null);
      setAccounts([]);
      setIsAuthenticated(false);
      setAuthError({ type: 'service_unavailable', message: error?.message || 'Unable to verify your Vantoris session.' });
      return false;
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const logout = useCallback(async (shouldRedirect = true) => {
    try {
      await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': readCsrfCookie(),
        },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // Local state is cleared even if the server is unreachable; the server session expires independently.
    } finally {
      setUser(null);
      setAccounts([]);
      setIsAuthenticated(false);
      setAuthChecked(true);
      if (shouldRedirect && typeof window !== 'undefined') window.location.assign('/login');
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    if (typeof window !== 'undefined') window.location.assign('/login');
  }, []);

  const value = {
    user,
    accounts,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authError,
    appPublicSettings: null,
    authChecked,
    logout,
    navigateToLogin,
    checkUserAuth,
    checkAppState: checkUserAuth,
    refreshMemberData: checkUserAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
