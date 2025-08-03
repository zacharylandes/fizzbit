import { type Idea } from "@shared/schema";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

interface IdeaCardProps {
  idea: Idea;
  position: "top" | "middle" | "bottom";
  colorIndex: number;
}

const gradients = [
  "from-pink-400 to-amber-400",
  "from-teal-400 to-emerald-400", 
  "from-sky-400 to-red-400"
];

export function IdeaCard({ idea, position, colorIndex }: IdeaCardProps) {
  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  const gradient = gradients[colorIndex % gradients.length];

  return (
    <div className={`relative rounded-2xl shadow-2xl overflow-hidden w-full h-full cursor-pointer bg-gradient-to-br ${gradient}`}>
      {/* Card Content - Full Height Gradient */}
      <div className="p-6 text-white relative h-full">
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
        
        <h3 className="text-xl font-bold mb-3 leading-tight">{idea.title}</h3>
        <p className="text-white/90 leading-relaxed text-sm overflow-y-auto max-h-48 pr-2">
          {idea.description}
        </p>
        
        {/* Swipe Indicators */}
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
      </div>
    </div>
  );
}