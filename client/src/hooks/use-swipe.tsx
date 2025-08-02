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
    if (deltaTime > 500 || (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 20)) {
      return;
    }

    console.log('Swipe detected:', { deltaX, deltaY, deltaTime });

    // Check for up swipe FIRST with highest priority - any upward movement over 20px
    if (deltaY < -20) {
      console.log('Swipe up triggered');
      handlers.onSwipeUp?.();
      return;
    }
    
    // Then check for down swipe
    if (deltaY > 30 && Math.abs(deltaY) > Math.abs(deltaX)) {
      console.log('Swipe down triggered');
      handlers.onSwipeDown?.();
      return;
    }
    
    // Finally check horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        console.log('Swipe right triggered');
        handlers.onSwipeRight?.();
      } else {
        console.log('Swipe left triggered');
        handlers.onSwipeLeft?.();
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
    
    if (deltaTime > 500 || (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 20)) {
      return;
    }

    console.log('Mouse swipe detected:', { deltaX, deltaY, deltaTime });

    // Check for up swipe FIRST with highest priority - any upward movement over 20px
    if (deltaY < -20) {
      console.log('Mouse swipe up triggered');
      handlers.onSwipeUp?.();
      return;
    }
    
    // Then check for down swipe
    if (deltaY > 30 && Math.abs(deltaY) > Math.abs(deltaX)) {
      console.log('Mouse swipe down triggered');
      handlers.onSwipeDown?.();
      return;
    }
    
    // Finally check horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        console.log('Mouse swipe right triggered');
        handlers.onSwipeRight?.();
      } else {
        console.log('Mouse swipe left triggered');
        handlers.onSwipeLeft?.();
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
