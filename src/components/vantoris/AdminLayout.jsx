import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import PageTransition from './PageTransition';
import FloatingAIDock from './FloatingAIDock';
import { base44 } from '@/api/base44Client';
import { getDefaultWorkspace } from '@/lib/operationsAccess';

const PHONE_SHELL = 'w-full max-w-[430px] mx-auto min-h-[100dvh] flex flex-col overflow-hidden bg-white lg:rounded-[28px] lg:shadow-2xl lg:ring-1 lg:ring-slate-200/80';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        const saved = localStorage.getItem('vantoris_workspace');
        if (saved) {
          setActiveWorkspace(saved);
        } else {
          setActiveWorkspace(getDefaultWorkspace(u.role) || 'operations');
        }
      })
      .catch(() => setActiveWorkspace('operations'));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function handleWorkspaceChange(ws) {
    setActiveWorkspace(ws);
    localStorage.setItem('vantoris_workspace', ws);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] w-full vantoris-mesh-bg">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full vantoris-mesh-bg flex justify-center overflow-x-hidden">
      <div className={PHONE_SHELL}>
        {/* Navigation stays available as a phone-style drawer at every viewport size. */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="vantoris-glass-sidebar p-0 w-72 max-w-[85vw]"
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

        <div className="flex-1 flex flex-col min-h-[100dvh] min-w-0">
          <AdminTopBar user={user} onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 min-w-0 p-3 sm:p-4 pb-6 vantoris-scroll overflow-x-hidden">
            <PageTransition />
          </main>
        </div>

        <FloatingAIDock />
      </div>
    </div>
  );
}
