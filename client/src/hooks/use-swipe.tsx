import { useRef, useState } from "react";

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipe(handlers: SwipeHandlers) {
  const [isPressed, setIsPressed] = useState(false);
  const startCoords = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPressed(true);
    const touch = e.touches[0];
    startCoords.current = { x: touch.clientX, y: touch.clientY };
    startTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isPressed) return;
    
    setIsPressed(false);
    const touch = e.changedTouches[0];
    const endCoords = { x: touch.clientX, y: touch.clientY };
    const deltaX = endCoords.x - startCoords.current.x;
    const deltaY = endCoords.y - startCoords.current.y;
    const deltaTime = Date.now() - startTime.current;
    
    // Only trigger if the swipe was fast enough and long enough
    if (deltaTime > 300 || (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50)) {
      return;
    }

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        handlers.onSwipeRight?.();
      } else {
        handlers.onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY < 0) {
        handlers.onSwipeUp?.();
      } else {
        handlers.onSwipeDown?.();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPressed(true);
    startCoords.current = { x: e.clientX, y: e.clientY };
    startTime.current = Date.now();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isPressed) return;
    
    setIsPressed(false);
    const endCoords = { x: e.clientX, y: e.clientY };
    const deltaX = endCoords.x - startCoords.current.x;
    const deltaY = endCoords.y - startCoords.current.y;
    const deltaTime = Date.now() - startTime.current;
    
    if (deltaTime > 300 || (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50)) {
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        handlers.onSwipeRight?.();
      } else {
        handlers.onSwipeLeft?.();
      }
    } else {
      if (deltaY < 0) {
        handlers.onSwipeUp?.();
      } else {
        handlers.onSwipeDown?.();
      }
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
  };
}
