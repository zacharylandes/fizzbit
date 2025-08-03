import { motion, AnimatePresence } from "framer-motion";
import { type Idea } from "@shared/schema";
import { useSwipe } from "@/hooks/use-swipe";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { useState, useCallback, useRef } from "react";

interface IdeaCardProps {
  idea: Idea;
  position: "top" | "middle" | "bottom";
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
}

const gradients = {
  top: "from-pink-400 to-amber-400",
  middle: "from-teal-400 to-emerald-400", 
  bottom: "from-sky-400 to-red-400"
};

const cardStyles = {
  bottom: {
    zIndex: 10,
    scale: 0.96,
    y: 0
  },
  middle: {
    zIndex: 20,
    scale: 0.98,
    y: -160
  },
  top: {
    zIndex: 30,
    scale: 1,
    y: -160
  }
};

export function IdeaCard({ idea, position, onSwipeLeft, onSwipeRight, onSwipeUp }: IdeaCardProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | "up" | null>(null);
  const isProcessing = useRef(false);
  
  const isTopCard = position === "top";
  
  const handleSwipeLeft = useCallback(() => {
    if (!isTopCard || isProcessing.current) return;
    isProcessing.current = true;
    setIsExiting(true);
    setExitDirection("left");
    onSwipeLeft();
    // Reset after longer delay to prevent rapid swipes
    setTimeout(() => {
      isProcessing.current = false;
    }, 300);
  }, [isTopCard, onSwipeLeft]);
  
  const handleSwipeRight = useCallback(() => {
    if (!isTopCard || isProcessing.current) return;
    isProcessing.current = true;
    setIsExiting(true);
    setExitDirection("right");
    onSwipeRight();
    // Reset after longer delay to prevent rapid swipes
    setTimeout(() => {
      isProcessing.current = false;
    }, 300);
  }, [isTopCard, onSwipeRight]);
  
  const handleSwipeUp = useCallback(() => {
    if (!isTopCard || isProcessing.current) return;
    isProcessing.current = true;
    setIsExiting(true);
    setExitDirection("up");
    onSwipeUp();
    // Reset after longer delay to prevent rapid swipes
    setTimeout(() => {
      isProcessing.current = false;
    }, 300);
  }, [isTopCard, onSwipeUp]);
  
  const swipeHandlers = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onSwipeUp: handleSwipeUp
  });

  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  
  // Exit animation variants
  const exitVariants = {
    left: { x: -500, opacity: 0, rotate: -20, scale: 0.8 },
    right: { x: 500, opacity: 0, rotate: 20, scale: 0.8 },
    up: { y: -500, opacity: 0, scale: 0.6, rotate: 5 }
  };

  return (
    <motion.div
      className={`absolute bg-white rounded-2xl shadow-2xl overflow-hidden touch-target ${
        isTopCard ? "cursor-pointer" : "cursor-default"
      }`}
      style={{ 
        minHeight: "48px",
        minWidth: "48px",
        height: "220px",
        width: "100%",
        left: 0,
        zIndex: cardStyles[position].zIndex
      }}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={
        isExiting && exitDirection
          ? exitVariants[exitDirection]
          : { 
              opacity: 1, 
              x: 0, 
              rotate: 0,
              scale: cardStyles[position].scale,
              y: cardStyles[position].y
            }
      }
      transition={{ 
        duration: isExiting ? 0.25 : 0.5, 
        ease: "easeOut",
        type: "spring",
        stiffness: 200,
        damping: 25
      }}
      {...(isTopCard ? swipeHandlers : {})}
    >
      {/* Card Header - Always Visible */}
      <div className={`p-6 text-white relative bg-gradient-to-br ${gradients[position]}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
            Idea #{cardNumber}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === cardNumber ? "bg-white" : "bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-3">{idea.title}</h3>
        <p className="text-white/90 leading-relaxed line-clamp-3">
          {idea.description}
        </p>
        
        {/* Swipe Indicators - Only show on top card */}
        {isTopCard && (
          <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center">
            <div className="flex items-center text-xs text-white/90 bg-white/10 px-2 py-1 rounded-full">
              <ArrowLeft className="w-3 h-3 mr-1" />
              Dismiss
            </div>
            <div className="flex items-center text-xs text-white/90 bg-white/10 px-2 py-1 rounded-full">
              <ArrowUp className="w-3 h-3 mr-1" />
              Explore
            </div>
            <div className="flex items-center text-xs text-white/90 bg-white/10 px-2 py-1 rounded-full">
              <ArrowRight className="w-3 h-3 mr-1" />
              Save
            </div>
          </div>
        )}
      </div>
      
      {/* Card Content - Below visible area */}
      <div className="p-6 bg-white">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
            <span>Creative inspiration idea</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            <span>Source: {idea.source === "text" ? "Text prompt" : "Image upload"}</span>
          </div>
          {idea.metadata && typeof idea.metadata === 'object' && 'category' in idea.metadata && typeof idea.metadata.category === 'string' && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              <span>Category: {idea.metadata.category}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
