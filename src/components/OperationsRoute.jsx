import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { hasOperationsAccess, isSuperAdmin } from '@/lib/operationsAccess';
import AccessDenied from '@/pages/AccessDenied';

export default function OperationsRoute() {
  const { user, isAuthenticated, isLoadingAuth, authChecked, authError } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0E1A2B]">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  if (authError || !isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasOperationsAccess(user.role) && !isSuperAdmin(user)) {
    return <AccessDenied />;
  }

  return <Outlet />;
}
