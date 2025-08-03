import { type Idea } from "@shared/schema";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

interface IdeaCardProps {
  idea: Idea;
  position: "top" | "middle" | "bottom";
  colorIndex: number;
}

const cardStyles = [
  "bg-gradient-electric border-electric-blue/30 glow-electric-blue",
  "bg-gradient-neon border-electric-pink/30 glow-electric-pink", 
  "bg-gradient-cyber border-electric-cyan/30 glow-electric-purple"
];

export function IdeaCard({ idea, position, colorIndex }: IdeaCardProps) {
  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  const cardStyle = cardStyles[colorIndex % cardStyles.length];

  return (
    <div className={`relative rounded-2xl border shadow-lg overflow-hidden w-full h-full cursor-pointer ${cardStyle}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Card Content */}
      <div className="p-6 text-white relative h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="glass border border-white/20 rounded-lg px-3 py-1 text-sm font-medium text-white">
            Idea #{cardNumber}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === cardNumber ? "bg-white glow-electric-blue" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-3 leading-tight text-white">{idea.title}</h3>
        <p className="text-white/80 leading-relaxed text-sm overflow-y-auto max-h-56 pr-2">
          {idea.description}
        </p>
        
        {/* Swipe Indicators */}
        <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center text-xs text-white glass border border-white/20 px-2 py-1 rounded-lg hover:bg-white/10 transition-all duration-300">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Dismiss
          </div>
          <div className="flex items-center text-xs text-white glass border border-white/20 px-2 py-1 rounded-lg hover:bg-white/10 transition-all duration-300">
            <ArrowUp className="w-3 h-3 mr-1" />
            Explore
          </div>
          <div className="flex items-center text-xs text-white glass border border-white/20 px-2 py-1 rounded-lg hover:bg-white/10 transition-all duration-300">
            <ArrowRight className="w-3 h-3 mr-1" />
            Save
          </div>
        </div>
      </div>
    </div>
  );
}