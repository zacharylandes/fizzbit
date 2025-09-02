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
  "bg-card-mint card-shadow hover-lift border border-gray-200",
  "bg-card-peach card-shadow hover-lift border border-gray-200",
  "bg-card-blue card-shadow hover-lift border border-gray-200",
  "bg-card-coral card-shadow hover-lift border border-gray-200",
  "bg-card-soft-coral card-shadow hover-lift border border-gray-200",
  "bg-card-muted-gold card-shadow hover-lift border border-gray-200",
  "bg-card-terracotta card-shadow hover-lift border border-gray-200",
  "bg-card-plum card-shadow hover-lift border border-gray-200",
  "bg-card-green card-shadow hover-lift border border-gray-200"
];

export function IdeaCard({ idea, position, colorIndex, isSwipeAnimating, swipeDirection, showSwipeEffects }: IdeaCardProps) {
  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  const cardStyle = cardStyles[colorIndex % cardStyles.length];

  const accentColors = [
    "text-card-mint",
    "text-card-peach",
    "text-card-blue",
    "text-card-coral",
    "text-card-soft-coral",
    "text-card-muted-gold",
    "text-card-terracotta",
    "text-card-plum",
    "text-card-green"
  ];
  
  // Corresponding colors for professional illustrations
  const strokeColors = [
    "#6B7280", // Subtle gray-green for mint
    "#6B7280", // Subtle gray for peach
    "#6B7280", // Subtle gray for blue
    "#6B7280", // Subtle gray for coral
    "#6B7280", // Subtle gray for soft coral
    "#6B7280", // Subtle gray for muted gold
    "#6B7280", // Subtle gray for terracotta
    "#6B7280", // Subtle gray for plum
    "#6B7280"  // Subtle gray for green
  ];
  
  // Hue values for professional SVG generation
  const hueValues = [
    150,  // mint green
    15,   // warm orange
    196,  // blue
    13,   // coral
    4,    // soft coral
    49,   // muted gold
    20,   // terracotta
    282,  // gentle plum
    140   // green
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
          <div className="flex items-center text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded hover:bg-gray-200 transition-all duration-300">
            <ArrowRight className="w-3 h-3 mr-1" />
            Save
          </div>
        </div>
      </div>
    </div>
  );
}