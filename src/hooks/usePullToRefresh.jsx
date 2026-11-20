import { useRef, useState, useCallback } from 'react';

/** Mobile pull-to-refresh behavior for a scrollable container. */
export function usePullToRefresh(refetch) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const threshold = 70;
  const maxPull = 100;

  const onTouchStart = useCallback((event) => {
    if (refreshing) return;
    if (event.currentTarget.scrollTop <= 0) {
      startY.current = event.touches[0].clientY;
      isPulling.current = true;
    } else {
      isPulling.current = false;
    }
  }, [refreshing]);

  const onTouchMove = useCallback((event) => {
    if (!isPulling.current || refreshing) return;
    const delta = event.touches[0].clientY - startY.current;
    if (delta > 0) setPullDistance(Math.min(delta * 0.4, maxPull));
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= threshold) {
      setRefreshing(true);
      setPullDistance(threshold);
      try {
        await refetch();
      } catch (error) {
        console.error('Pull-to-refresh failed', error);
      } finally {
        setRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, refetch]);

  const progress = Math.min(pullDistance / threshold, 1);
  const containerProps = { onTouchStart, onTouchMove, onTouchEnd };

  function PullIndicator() {
    return (
      <div style={{ height: pullDistance, opacity: refreshing ? 1 : progress }} className="flex items-center justify-center overflow-hidden transition-opacity" aria-hidden="true">
        <div className={'h-6 w-6 rounded-full border-2 border-brass/30 border-t-brass' + (refreshing ? ' animate-spin' : '')} style={{ transform: 'rotate(' + (progress * 360) + 'deg)' }} />
      </div>
    );
  }

  return { containerProps, pullDistance, refreshing, progress, PullIndicator };
}
