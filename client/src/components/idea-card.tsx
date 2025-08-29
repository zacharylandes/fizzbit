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
        
        {/* SVG Drawing if available */}
        {idea.svg && (
          <div className="mb-6 flex justify-center">
            <div 
              className="w-full max-w-48 h-32 flex items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 p-3 border border-white/20 shadow-sm"
              dangerouslySetInnerHTML={{ __html: idea.svg }}
            />
            {/* Temporary debug */}
            <div className="absolute top-0 left-0 text-xs bg-red-500 text-white px-1">
              SVG: {idea.svg ? 'YES' : 'NO'} ({idea.svg?.length || 0})
            </div>
          </div>
        )}
        
        {/* Debug for SVG content */}
        {idea.svg && (() => {
          console.log('Card SVG content:', idea.svg.substring(0, 100));
          return null;
        })()}
        
        {/* Title (only show if not empty) */}
        {idea.title && idea.title.trim().length > 0 ? (
          <div className="flex items-start justify-center h-full">
            <h3 className={`text-lg font-bold text-center leading-relaxed ${accentColor}`} style={{ fontFamily: 'Inter, sans-serif' }}>
              {idea.title}
            </h3>
          </div>
        ) : idea.svg ? (
          // Pure visual card with SVG - minimal text
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-xs text-white/40">
              •
            </div>
          </div>
        ) : (
          // Card with no title and no SVG
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-xs text-gray-500 opacity-60">
              Visual Inspiration
            </div>
          </div>
        )}
        
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