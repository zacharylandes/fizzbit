import { useRef, useCallback } from 'react';

interface VerticalSwipeOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useVerticalSwipe({ onSwipeUp, onSwipeDown, threshold = 50 }: VerticalSwipeOptions) {
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartY.current || !touchStartX.current) return;

    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    
    const deltaY = touchStartY.current - touchEndY;
    const deltaX = Math.abs(touchStartX.current - touchEndX);
    
    // Only trigger vertical swipes if the horizontal movement is minimal
    // This prevents interference with Swiper.js horizontal swipes
    if (deltaX < 30 && Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && onSwipeUp) {
        e.preventDefault();
        e.stopPropagation();
        onSwipeUp();
      } else if (deltaY < 0 && onSwipeDown) {
        e.preventDefault();
        e.stopPropagation();
        onSwipeDown();
      }
    }

    touchStartY.current = 0;
    touchStartX.current = 0;
  }, [onSwipeUp, onSwipeDown, threshold]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}