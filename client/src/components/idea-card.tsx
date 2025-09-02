import { type Idea } from "@shared/schema";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { generateAbstractSVG } from "@/utils/svg-generator";

interface IdeaCardProps {
  idea: Idea;
  position: "top" | "middle" | "bottom";
  colorIndex: number;
  isSwipeAnimating?: boolean;
  swipeDirection?: 'left' | 'right' | 'up';
  showSwipeEffects?: boolean;
}

const cardStyles = [
  "bg-card-white card-shadow hover-lift", 
  "bg-card-mint card-shadow hover-lift",
  "bg-card-peach card-shadow hover-lift",
  "bg-card-maroon card-shadow hover-lift",
  "bg-card-blue card-shadow hover-lift",
  "bg-card-coral card-shadow hover-lift",
  "bg-card-soft-coral card-shadow hover-lift",
  "bg-card-muted-gold card-shadow hover-lift",
  "bg-card-terracotta card-shadow hover-lift",
  "bg-card-plum card-shadow hover-lift"
];

export function IdeaCard({ idea, position, colorIndex, isSwipeAnimating, swipeDirection, showSwipeEffects }: IdeaCardProps) {
  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  const cardStyle = cardStyles[colorIndex % cardStyles.length];

  const accentColors = [
    "text-card-white", 
    "text-card-mint",
    "text-card-peach",
    "text-card-maroon",
    "text-card-blue",
    "text-card-coral",
    "text-card-soft-coral",
    "text-card-muted-gold",
    "text-card-terracotta",
    "text-card-plum"
  ];
  
  // Corresponding colors for soft illustrations
  const strokeColors = [
    "#374151", // Dark gray for white cards
    "#059669", // Subtle green for mint
    "#DC2626", // Subtle red for peach
    "#72313E", // Dark maroon
    "#3587A4", // Blue
    "#CE5B3B", // Coral red
    "#FF8A80", // Soft coral
    "#E6C068", // Muted gold
    "#E07A5F", // Light terracotta
    "#C39BD3"  // Gentle plum
  ];
  
  // Hue values for soft SVG generation
  const hueValues = [
    0,    // neutral for white
    150,  // mint green
    15,   // warm orange
    334,  // maroon
    196,  // blue
    13,   // coral
    4,    // soft coral
    49,   // muted gold
    13,   // terracotta
    282   // gentle plum
  ];
  
  const accentColor = accentColors[colorIndex % accentColors.length];
  const strokeColor = strokeColors[colorIndex % strokeColors.length];
  const hue = hueValues[colorIndex % hueValues.length];

  return (
    <div className={`relative rounded-xl border overflow-hidden w-full h-full cursor-pointer transition-all duration-300 ${cardStyle} ${
      isSwipeAnimating ? `swipe-${swipeDirection}` : ''
    }`} style={{ fontFamily: 'Crimson Text, serif' }}>
      {/* Swipe Animation Effects */}
      {showSwipeEffects && (
        <>
          {/* Speed Lines */}
          <div className="speed-lines"></div>
          
          {/* Star Burst */}
          <div className="star-burst">
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
          </div>
          
          {/* Swipe Trail */}
          <div className="swipe-trail"></div>
        </>
      )}
      
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
        
        {/* Title (only show if not empty) */}
        {idea.title && idea.title.trim().length > 0 ? (
          <div className="flex flex-col items-center justify-start h-full pt-8">
            <h3 className={`text-2xl font-black text-center leading-tight mb-6 ${accentColor}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: '900' }}>
              {idea.title}
            </h3>
            
            {/* SVG Drawing below text */}
            {idea.svg && (
              <div className="flex justify-center w-full">
                <div 
                  className="w-full h-32"
                  dangerouslySetInnerHTML={{ 
                    __html: idea.svg === "PROCEDURAL" 
                      ? generateAbstractSVG((idea.sourceContent || idea.title) + idea.id, 400, 128, hue)
                      : idea.svg
                          .replace(/stroke="black"/gi, `stroke="${strokeColor}"`)
                          .replace(/stroke='black'/gi, `stroke='${strokeColor}'`)
                          .replace(/stroke:black/gi, `stroke:${strokeColor}`)
                          .replace(/stroke="#000000"/gi, `stroke="${strokeColor}"`)
                          .replace(/stroke='#000000'/gi, `stroke='${strokeColor}'`)
                          .replace(/stroke="#000"/gi, `stroke="${strokeColor}"`)
                          .replace(/stroke='#000'/gi, `stroke='${strokeColor}'`)
                          .replace(/stroke:\s*black/gi, `stroke:${strokeColor}`)
                          .replace(/stroke:\s*#000000/gi, `stroke:${strokeColor}`)
                          .replace(/stroke:\s*#000/gi, `stroke:${strokeColor}`)
                  }}
                />
              </div>
            )}
          </div>
        ) : idea.svg ? (
          // Pure visual card with SVG only
          <div className="flex items-center justify-center h-full">
            <div 
              className="w-full h-48"
              dangerouslySetInnerHTML={{ 
                __html: idea.svg === "PROCEDURAL" 
                  ? generateAbstractSVG((idea.sourceContent || "abstract visual") + idea.id, 400, 192, hue)
                  : idea.svg
                      .replace(/stroke="black"/g, `stroke="${strokeColor}"`)
                      .replace(/stroke='black'/g, `stroke='${strokeColor}'`)
                      .replace(/stroke:black/g, `stroke:${strokeColor}`)
              }}
            />
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
          <div className="flex items-center text-xs text-foreground bg-black/5 px-2 py-1 rounded-lg transition-all duration-300">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Dismiss
          </div>
          <div className={`flex items-center text-xs bg-black/5 px-2 py-1 rounded-lg transition-all duration-300 ${accentColor}`}>
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