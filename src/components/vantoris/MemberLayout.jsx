import React from 'react';
import { TabHistoryProvider } from '@/lib/TabHistoryContext';
import { useAuth } from '@/lib/AuthContext';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import PageTransition from './PageTransition';
import BottomNav from './BottomNav';
import MemberSidebar from './MemberSidebar';
import FloatingCommandDock from './FloatingCommandDock';
import SessionTimeoutModal from './SessionTimeoutModal';

export default function MemberLayout() {
  const { logout } = useAuth();

  const handleTimeout = () => {
    logout(true);
  };

  const { showWarning, extendSession, logoutNow } = useSessionTimeout(handleTimeout);

  return (
    <TabHistoryProvider>
      <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-[#F4F6F9]">
        <aside className="sticky top-0 z-30 hidden h-[100dvh] shrink-0 lg:block">
          <MemberSidebar />
        </aside>

        <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
          <main className="safe-top mx-auto w-full max-w-[1600px] min-w-0 flex-1 pb-24 lg:pb-8">
            <PageTransition />
          </main>

          <div className="lg:hidden">
            <BottomNav />
          </div>

          <FloatingCommandDock />
          <SessionTimeoutModal
            show={showWarning}
            onExtend={extendSession}
            onLogout={logoutNow}
          />
        </div>
      </div>
    </TabHistoryProvider>
  );
}
