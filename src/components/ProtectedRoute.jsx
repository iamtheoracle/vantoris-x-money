import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

function readToken() {
  if (typeof window === 'undefined') return '';
  return (
    window.localStorage.getItem('base44_access_token') ||
    window.localStorage.getItem('token') ||
    window.localStorage.getItem('base44_token') ||
    ''
  );
}

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
  const retried = useRef(false);

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
      return;
    }
    if (authChecked && !isAuthenticated && !isLoadingAuth && readToken() && !retried.current) {
      retried.current = true;
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, checkUserAuth]);

  if (isLoadingAuth || !authChecked) return fallback;

  if (authError?.type === 'user_not_registered') return <UserNotRegisteredError />;

  if (!isAuthenticated) {
    if (readToken() && !retried.current) return fallback;
    return unauthenticatedElement;
  }

  return <Outlet />;
}
