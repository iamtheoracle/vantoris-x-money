import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import PageTransition from './PageTransition';
import FloatingAIDock from './FloatingAIDock';
import { base44 } from '@/api/base44Client';
import { getDefaultWorkspace, getDomainsForRole } from '@/lib/operationsAccess';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    base44.auth.me()
      .then((authenticatedUser) => {
        if (cancelled) return;
        if (!authenticatedUser?.id) {
          setAuthError(true);
          return;
        }
        const allowedWorkspaces = getDomainsForRole(authenticatedUser.role);
        if (!allowedWorkspaces.length) {
          setAuthError(true);
          return;
        }
        let saved = null;
        try {
          saved = localStorage.getItem('vantoris_workspace');
        } catch {
          // Workspace preference is optional and never grants access.
        }
        const defaultWorkspace = getDefaultWorkspace(authenticatedUser.role);
        const initialWorkspace = allowedWorkspaces.includes(saved)
          ? saved
          : (allowedWorkspaces.includes(defaultWorkspace) ? defaultWorkspace : allowedWorkspaces[0]);
        if (!initialWorkspace || !allowedWorkspaces.includes(initialWorkspace)) {
          setAuthError(true);
          return;
        }
        setUser(authenticatedUser);
        setActiveWorkspace(initialWorkspace);
        try {
          if (saved !== initialWorkspace) localStorage.setItem('vantoris_workspace', initialWorkspace);
        } catch {
          // A storage failure must not change the server-derived access decision.
        }
      })
      .catch(() => {
        if (!cancelled) setAuthError(true);
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function handleWorkspaceChange(workspace) {
    const allowedWorkspaces = getDomainsForRole(user?.role);
    if (!allowedWorkspaces.includes(workspace)) return;
    setActiveWorkspace(workspace);
    localStorage.setItem('vantoris_workspace', workspace);
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] w-full vantoris-mesh-bg">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  if (authError || !user || !activeWorkspace) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#F4F6F9] p-6">
        <section role="alert" className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-7 shadow-sm">
          <h1 className="text-lg font-semibold text-navy">Staff access could not be verified</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            We could not verify an active staff session and an authorized operations workspace. No staff workspace was opened.
          </p>
          <a href="/login" className="mt-5 inline-flex rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white">
            Return to sign in
          </a>
        </section>
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
