import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import PageTransition from './PageTransition';
import FloatingAIDock from './FloatingAIDock';
import { base44 } from '@/api/base44Client';
import { getDefaultWorkspace } from '@/lib/operationsAccess';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    base44.auth.me()
      .then((authenticatedUser) => {
        if (cancelled) return;
        setUser(authenticatedUser);
        const saved = localStorage.getItem('vantoris_workspace');
        setActiveWorkspace(saved || getDefaultWorkspace(authenticatedUser.role) || 'management');
      })
      .catch(() => {
        if (!cancelled) setActiveWorkspace('management');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function handleWorkspaceChange(workspace) {
    setActiveWorkspace(workspace);
    localStorage.setItem('vantoris_workspace', workspace);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] w-full vantoris-mesh-bg">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full vantoris-mesh-bg flex overflow-x-hidden">
      <aside className="hidden lg:block sticky top-0 h-[100dvh] flex-shrink-0 z-20">
        <AdminSidebar
          user={user}
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={handleWorkspaceChange}
        />
      </aside>

      <div className="flex-1 min-w-0 min-h-[100dvh] flex flex-col">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="vantoris-glass-sidebar p-0 w-72 max-w-[85vw] lg:hidden"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <AdminSidebar
              user={user}
              activeWorkspace={activeWorkspace}
              onWorkspaceChange={handleWorkspaceChange}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <AdminTopBar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 w-full max-w-[1600px] mx-auto p-3 sm:p-5 lg:p-8 pb-8 vantoris-scroll overflow-x-hidden">
          <PageTransition />
        </main>
      </div>

      <FloatingAIDock />
    </div>
  );
}
