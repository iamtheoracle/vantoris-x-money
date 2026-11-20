import { useEffect, useState, useRef, useCallback } from 'react';

const INACTIVITY_LIMIT = 2 * 60 * 1000; // 2 minutes (Vantoris banking standard)
const WARNING_AT = 105 * 1000; // Show warning at 1 min 45 sec

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export function useSessionTimeout(onTimeout) {
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
  }, []);

  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
  }, []);

  const logoutNow = useCallback(() => {
    setShowWarning(false);
    if (onTimeoutRef.current) onTimeoutRef.current();
  }, []);

  useEffect(() => {
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, resetActivity, { passive: true });
    });

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_LIMIT) {
        setShowWarning(false);
        if (onTimeoutRef.current) onTimeoutRef.current();
      } else if (elapsed >= WARNING_AT) {
        setShowWarning(true);
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetActivity]);

  return { showWarning, extendSession, logoutNow };
}