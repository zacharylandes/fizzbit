import { motion } from "framer-motion";
import { type Idea } from "@shared/schema";
import { useSwipe } from "@/hooks/use-swipe";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

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

const zIndexes = {
  top: 30,
  middle: 20,
  bottom: 10
};

// Cards should stack with the top 1/3 of each visible
const transforms = {
  top: "translateY(0px)",
  middle: "translateY(80px)", // Show top 1/3 of middle card
  bottom: "translateY(160px)" // Show top 1/3 of bottom card
};

export function IdeaCard({ idea, position, onSwipeLeft, onSwipeRight, onSwipeUp }: IdeaCardProps) {
  const swipeHandlers = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp
  });

  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;

  return (
    <motion.div
      className={`absolute left-0 right-0 bg-white rounded-2xl shadow-2xl overflow-hidden cursor-pointer touch-target`}
      style={{ 
        zIndex: zIndexes[position],
        transform: transforms[position],
        minHeight: "44px",
        minWidth: "44px",
        height: "240px"
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...swipeHandlers}
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
          <div className="flex items-center text-xs text-white/70">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Dismiss
          </div>
          <div className="flex items-center text-xs text-white/70">
            <ArrowUp className="w-3 h-3 mr-1" />
            Explore
          </div>
          <div className="flex items-center text-xs text-white/70">
            <ArrowRight className="w-3 h-3 mr-1" />
            Save
          </div>
        </div>
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
