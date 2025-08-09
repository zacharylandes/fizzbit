import { type Idea } from "@shared/schema";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

interface IdeaCardProps {
  idea: Idea;
  position: "top" | "middle" | "bottom";
  colorIndex: number;
}

const cardStyles = [
  "bg-card-sage border-card-sage/40 card-shadow hover-lift",
  "bg-card-blue-gray border-card-blue-gray/40 card-shadow hover-lift", 
  "bg-card-cream border-card-cream/40 card-shadow hover-lift",
  "bg-card-light-blue border-card-light-blue/40 card-shadow hover-lift",
  "bg-card-purple-gray border-card-purple-gray/40 card-shadow hover-lift"
];

export function IdeaCard({ idea, position, colorIndex }: IdeaCardProps) {
  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  const cardStyle = cardStyles[colorIndex % cardStyles.length];

  const accentColors = [
    "text-card-sage",
    "text-card-blue-gray", 
    "text-card-cream",
    "text-card-light-blue",
    "text-card-purple-gray"
  ];
  
  const accentColor = accentColors[colorIndex % accentColors.length];

  return (
    <div className={`relative rounded-xl border overflow-hidden w-full h-full cursor-pointer transition-all duration-300 ${cardStyle}`} style={{ fontFamily: 'Crimson Text, serif' }}>
      {/* Card Content */}
      <div className="p-6 relative h-full">
        <div className="flex items-start justify-end mb-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === cardNumber ? accentColor.replace('text-card-', 'bg-card-') : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        
        <h3 className={`text-xl font-bold mb-3 leading-tight ${accentColor}`}>{idea.title}</h3>
        <p className="text-foreground/80 leading-relaxed text-sm overflow-y-auto max-h-56 pr-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          {idea.description}
        </p>
        
        {/* Swipe Indicators */}
        <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center text-xs text-foreground bg-white/60 border border-border px-2 py-1 rounded-lg hover:bg-white/80 transition-all duration-300">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Dismiss
          </div>
          <div className={`flex items-center text-xs bg-white/60 border border-border px-2 py-1 rounded-lg hover:bg-white/80 transition-all duration-300 ${accentColor}`}>
            <ArrowUp className="w-3 h-3 mr-1" />
            Explore
          </div>
          <div className="flex items-center text-xs text-card-sage bg-white/60 border border-border px-2 py-1 rounded-lg hover:bg-white/80 transition-all duration-300">
            <ArrowRight className="w-3 h-3 mr-1" />
            Save
          </div>
        </div>
      </div>
    </div>
  );
}