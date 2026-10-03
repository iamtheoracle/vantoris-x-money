import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { hasOperationsAccess } from '@/lib/operationsAccess';

export default function MemberRoute() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    base44.auth
      .me()
      .then(currentUser => {
        if (mounted) setUser(currentUser);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F8FAFC]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#D8DEE8] border-t-[#E31837]" />
      </div>
    );
  }

  if (user && hasOperationsAccess(user.role)) {
    return <Navigate to="/operations" replace />;
  }

  return <Outlet />;
}
