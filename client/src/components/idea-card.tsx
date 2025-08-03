import { type Idea } from "@shared/schema";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

interface IdeaCardProps {
  idea: Idea;
  position: "top" | "middle" | "bottom";
  colorIndex: number;
}

const cardStyles = [
  "bg-card border-border",
  "bg-secondary/50 border-border", 
  "bg-muted/50 border-border"
];

export function IdeaCard({ idea, position, colorIndex }: IdeaCardProps) {
  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  const cardStyle = cardStyles[colorIndex % cardStyles.length];

  return (
    <div className={`relative rounded-2xl border shadow-lg overflow-hidden w-full h-full cursor-pointer ${cardStyle}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Card Content */}
      <div className="p-6 text-foreground relative h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-secondary/50 rounded-lg px-3 py-1 text-sm font-medium text-foreground">
            Idea #{cardNumber}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === cardNumber ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-3 leading-tight text-foreground">{idea.title}</h3>
        <p className="text-muted-foreground leading-relaxed text-sm overflow-y-auto max-h-56 pr-2">
          {idea.description}
        </p>
        
        {/* Swipe Indicators */}
        <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Dismiss
          </div>
          <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
            <ArrowUp className="w-3 h-3 mr-1" />
            Explore
          </div>
          <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
            <ArrowRight className="w-3 h-3 mr-1" />
            Save
          </div>
        </div>
      </div>
    </div>
  );
}