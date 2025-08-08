import { type Idea } from "@shared/schema";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

interface IdeaCardProps {
  idea: Idea;
  position: "top" | "middle" | "bottom";
  colorIndex: number;
}

const cardStyles = [
  "bg-card border-accent-blue/30 card-shadow hover-lift",
  "bg-card border-accent-purple/30 card-shadow hover-lift", 
  "bg-card border-accent-teal/30 card-shadow hover-lift",
  "bg-card border-accent-green/30 card-shadow hover-lift",
  "bg-card border-accent-orange/30 card-shadow hover-lift",
  "bg-card border-accent-pink/30 card-shadow hover-lift"
];

export function IdeaCard({ idea, position, colorIndex }: IdeaCardProps) {
  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  const cardStyle = cardStyles[colorIndex % cardStyles.length];

  const accentColors = [
    "text-primary-blue",
    "text-primary-purple", 
    "text-primary-teal",
    "text-primary-green",
    "text-primary-orange",
    "text-primary-pink"
  ];
  
  const accentColor = accentColors[colorIndex % accentColors.length];

  return (
    <div className={`relative rounded-xl border overflow-hidden w-full h-full cursor-pointer transition-all duration-300 ${cardStyle}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Card Content */}
      <div className="p-6 text-card-foreground relative h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-secondary border border-border rounded-lg px-3 py-1 text-sm font-medium text-secondary-foreground">
            Idea #{cardNumber}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === cardNumber ? `bg-primary ${accentColor}` : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        
        <h3 className={`text-xl font-bold mb-3 leading-tight ${accentColor}`}>{idea.title}</h3>
        <p className="text-muted-foreground leading-relaxed text-sm overflow-y-auto max-h-56 pr-2">
          {idea.description}
        </p>
        
        {/* Swipe Indicators */}
        <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center text-xs text-muted-foreground bg-muted border border-border px-2 py-1 rounded-lg hover:bg-accent transition-all duration-300">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Dismiss
          </div>
          <div className={`flex items-center text-xs bg-accent-teal/10 border border-primary-teal/20 px-2 py-1 rounded-lg hover:bg-accent-teal/20 transition-all duration-300 ${accentColor}`}>
            <ArrowUp className="w-3 h-3 mr-1" />
            Explore
          </div>
          <div className="flex items-center text-xs text-primary-green bg-accent-green/10 border border-primary-green/20 px-2 py-1 rounded-lg hover:bg-accent-green/20 transition-all duration-300">
            <ArrowRight className="w-3 h-3 mr-1" />
            Save
          </div>
        </div>
      </div>
    </div>
  );
}