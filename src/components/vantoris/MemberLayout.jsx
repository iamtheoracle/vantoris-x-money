import React from 'react';
import { TabHistoryProvider } from '@/lib/TabHistoryContext';
import { useAuth } from '@/lib/AuthContext';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import PageTransition from './PageTransition';
import BottomNav from './BottomNav';
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
      <div className="min-h-screen bg-white vantoris-scroll" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}>
        <div className="safe-top w-full max-w-[430px] mx-auto">
          <PageTransition />
        </div>
        <BottomNav />
        <FloatingCommandDock />
        <SessionTimeoutModal
          show={showWarning}
          onExtend={extendSession}
          onLogout={logoutNow}
        />
      </div>
    </TabHistoryProvider>
  );
}
