import { type Idea } from "@shared/schema";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { useVerticalSwipe } from "@/hooks/use-vertical-swipe";
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

export function IdeaCard({ idea, position, onSwipeLeft, onSwipeRight, onSwipeUp }: IdeaCardProps) {
  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  const [isSwipingUp, setIsSwipingUp] = useState(false);

  const { swipeOffset, isActive, ...verticalSwipeHandlers } = useVerticalSwipe({
    onSwipeUp: () => {
      setIsSwipingUp(true);
      onSwipeUp();
      setTimeout(() => setIsSwipingUp(false), 300);
    },
    threshold: 60
  });

  return (
    <div 
      className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full h-full cursor-pointer transition-transform duration-200 ${
        isSwipingUp ? 'scale-105' : ''
      } ${isActive || isSwipingUp ? 'z-50' : 'z-10'}`}
      style={{
        transform: isActive 
          ? `translateY(-${swipeOffset}px) scale(${1 + swipeOffset * 0.002})` 
          : isSwipingUp 
            ? 'scale(1.05)' 
            : 'none',
        transition: isActive ? 'none' : 'transform 0.2s ease-out'
      }}
      {...verticalSwipeHandlers}
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
        
        {/* Swipe Indicators */}
        <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center text-xs text-white/90 bg-white/10 px-2 py-1 rounded-full">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Dismiss
          </div>
          <div className={`flex items-center text-xs text-white/90 bg-white/10 px-2 py-1 rounded-full transition-all duration-200 ${
            isSwipingUp || isActive ? 'bg-white/30 scale-110' : ''
          }`}>
            <ArrowUp className="w-3 h-3 mr-1" />
            Explore
          </div>
          <div className="flex items-center text-xs text-white/90 bg-white/10 px-2 py-1 rounded-full">
            <ArrowRight className="w-3 h-3 mr-1" />
            Save
          </div>
        </div>
      </div>
    </div>
  );
}
