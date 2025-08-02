import { motion, AnimatePresence } from "framer-motion";
import { type Idea } from "@shared/schema";
import { useSwipe } from "@/hooks/use-swipe";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { useState } from "react";

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
    transform: "scale(0.96)",
    marginTop: "0px"
  },
  middle: {
    zIndex: 20,
    transform: "scale(0.98)",
    marginTop: "-160px" // Pull up to show top 1/3
  },
  top: {
    zIndex: 30,
    transform: "scale(1)",
    marginTop: "-160px" // Pull up to show top 1/3
  }
};

export function IdeaCard({ idea, position, onSwipeLeft, onSwipeRight, onSwipeUp }: IdeaCardProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | "up" | null>(null);
  
  const isTopCard = position === "top";
  
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (!isTopCard) return;
      setIsExiting(true);
      setExitDirection("left");
      onSwipeLeft();
    },
    onSwipeRight: () => {
      if (!isTopCard) return;
      setIsExiting(true);
      setExitDirection("right");
      onSwipeRight();
    },
    onSwipeUp: () => {
      if (!isTopCard) return;
      setIsExiting(true);
      setExitDirection("up");
      onSwipeUp();
    }
  });

  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  
  // Exit animation variants
  const exitVariants = {
    left: { x: -400, opacity: 0, rotate: -15 },
    right: { x: 400, opacity: 0, rotate: 15 },
    up: { y: -400, opacity: 0, scale: 0.8 }
  };

  return (
    <motion.div
      className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden touch-target ${
        isTopCard ? "cursor-pointer" : "cursor-default"
      }`}
      style={{ 
        ...cardStyles[position],
        minHeight: "48px",
        minWidth: "48px",
        height: "220px"
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={
        isExiting && exitDirection
          ? exitVariants[exitDirection]
          : { opacity: 1, y: 0, x: 0, rotate: 0 }
      }
      transition={{ duration: 0.15, ease: "easeOut" }}
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
          {idea.metadata && typeof idea.metadata === 'object' && 'category' in idea.metadata && (
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
