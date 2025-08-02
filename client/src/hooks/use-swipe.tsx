import { useRef, useCallback } from "react";

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipe(handlers: SwipeHandlers) {
  const startCoords = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const touch = e.touches[0];
    startCoords.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = false;
    
    const touch = e.changedTouches[0];
    const endCoords = { x: touch.clientX, y: touch.clientY };
    const deltaX = endCoords.x - startCoords.current.x;
    const deltaY = endCoords.y - startCoords.current.y;
    
    console.log('Touch swipe detected:', { deltaX, deltaY });

    // Determine primary direction based on which movement is larger
    const isHorizontalPrimary = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (isHorizontalPrimary) {
      // Horizontal swipes - need at least 15px movement
      if (Math.abs(deltaX) > 15) {
        if (deltaX > 0) {
          console.log('Touch swipe right triggered');
          handlers.onSwipeRight?.();
        } else {
          console.log('Touch swipe left triggered');
          handlers.onSwipeLeft?.();
        }
        return;
      }
    } else {
      // Vertical swipes - need at least 15px movement
      if (Math.abs(deltaY) > 15) {
        if (deltaY < 0) {
          console.log('Touch swipe up triggered');
          handlers.onSwipeUp?.();
        } else {
          console.log('Touch swipe down triggered');
          handlers.onSwipeDown?.();
        }
        return;
      }
    }
  }, [handlers]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startCoords.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = false;
    
    const endCoords = { x: e.clientX, y: e.clientY };
    const deltaX = endCoords.x - startCoords.current.x;
    const deltaY = endCoords.y - startCoords.current.y;
    
    console.log('Mouse swipe detected:', { deltaX, deltaY });

    // Determine primary direction based on which movement is larger
    const isHorizontalPrimary = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (isHorizontalPrimary) {
      // Horizontal swipes - need at least 15px movement
      if (Math.abs(deltaX) > 15) {
        if (deltaX > 0) {
          console.log('Mouse swipe right triggered');
          handlers.onSwipeRight?.();
        } else {
          console.log('Mouse swipe left triggered');
          handlers.onSwipeLeft?.();
        }
        return;
      }
    } else {
      // Vertical swipes - need at least 15px movement
      if (Math.abs(deltaY) > 15) {
        if (deltaY < 0) {
          console.log('Mouse swipe up triggered');
          handlers.onSwipeUp?.();
        } else {
          console.log('Mouse swipe down triggered');
          handlers.onSwipeDown?.();
        }
        return;
      }
    }
  }, [handlers]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
  };
}
