import { type Idea } from "@shared/schema";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { generateAbstractSVG } from "@/utils/svg-generator";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Import Lottie animation files as URLs
import skateLottieUrl from '@assets/Orange skating_1756786094430.lottie?url';
import ufoLottieUrl from '@assets/Ridiculous UFO_1756786094438.lottie?url';  
import dividerLottieUrl from '@assets/Squiggly Divider Line_1756786094439.lottie?url';
import wavesLottieUrl from '@assets/wavess_1756786094441.lottie?url';
import rocketLottieUrl from '@assets/Rocket in space_1756786094442.lottie?url';
import devildoneLottieUrl from '@assets/devildone.json?url';
import nightCityLottieUrl from '@assets/Night city_1756862324144.lottie?url';
import karltioLottieUrl from '@assets/Karltio Cooking_1756862324148.lottie?url';
import slipperLottieUrl from '@assets/Slipper_1756862324148.lottie?url';
import windowLottieUrl from '@assets/Window_1756862324149.lottie?url';
import diceLottieUrl from '@assets/dice 6_1756862324149.lottie?url';

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
  "bg-card-lavender card-shadow hover-lift border border-gray-200",
  "bg-card-peach card-shadow hover-lift border border-gray-200",
  "bg-card-rose card-shadow hover-lift border border-gray-200",
  "bg-card-sage card-shadow hover-lift border border-gray-200",
  "bg-card-sand card-shadow hover-lift border border-gray-200",
  "bg-card-blue card-shadow hover-lift border border-gray-200",
  "bg-card-taupe card-shadow hover-lift border border-gray-200"
];

// Component to display DotLottie animations with improved state handling
function LottieAnimation({ url, className, isSwipeAnimating }: { url: string; className?: string; isSwipeAnimating?: boolean }) {
  return (
    <DotLottieReact
      src={url}
      loop
      autoplay
      className={`${className} ${isSwipeAnimating ? 'animate-pause' : ''}`}
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        transform: 'translateZ(0)'
      }}
    />
  );
}

// Function to determine which Lottie animation to use
function getLottieAnimationForIdea(idea: Idea): string {
  const content = (idea.sourceContent || idea.title || '').toLowerCase();
  
  // Create a hash-based rotation for variety - this ensures each card gets a different animation
  const hash = idea.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseAnimation = hash % 11; // 0-10 range for 11 animations
  
  // Strong keyword matching can override the hash (but only for very specific matches)
  if (content.includes('skateboard') || content.includes('skate')) {
    return skateLottieUrl;
  }
  if (content.includes('rocket') || content.includes('space') || content.includes('astronaut')) {
    return rocketLottieUrl;
  }
  if (content.includes('ufo') || content.includes('alien')) {
    return ufoLottieUrl;
  }
  if (content.includes('water') || content.includes('wave') || content.includes('ocean')) {
    return wavesLottieUrl;
  }
  if (content.includes('devil') || content.includes('demon') || content.includes('evil')) {
    return devildoneLottieUrl;
  }
  if (content.includes('city') || content.includes('night') || content.includes('building')) {
    return nightCityLottieUrl;
  }
  if (content.includes('cook') || content.includes('food') || content.includes('recipe') || content.includes('kitchen')) {
    return karltioLottieUrl;
  }
  if (content.includes('shoe') || content.includes('slipper') || content.includes('foot')) {
    return slipperLottieUrl;
  }
  if (content.includes('window') || content.includes('view') || content.includes('house')) {
    return windowLottieUrl;
  }
  if (content.includes('dice') || content.includes('game') || content.includes('random') || content.includes('chance')) {
    return diceLottieUrl;
  }
  
  // For all other cards, use hash-based rotation to ensure variety
  switch (baseAnimation) {
    case 0:
      return skateLottieUrl;
    case 1:
      return rocketLottieUrl;
    case 2:
      return ufoLottieUrl;
    case 3:
      return wavesLottieUrl;
    case 4:
      return dividerLottieUrl;
    case 5:
      return devildoneLottieUrl;
    case 6:
      return nightCityLottieUrl;
    case 7:
      return karltioLottieUrl;
    case 8:
      return slipperLottieUrl;
    case 9:
      return windowLottieUrl;
    case 10:
    default:
      return diceLottieUrl;
  }
}

export function IdeaCard({ idea, position, colorIndex, isSwipeAnimating, swipeDirection, showSwipeEffects }: IdeaCardProps) {
  const cardNumber = position === "top" ? 1 : position === "middle" ? 2 : 3;
  const cardStyle = cardStyles[colorIndex % cardStyles.length];

  const accentColors = [
    "text-card-mint",
    "text-card-lavender",
    "text-card-peach",
    "text-card-rose",
    "text-card-sage",
    "text-card-sand",
    "text-card-blue",
    "text-card-taupe"
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
  
  // Hue values for beautiful SVG generation
  const hueValues = [
    170,  // light mint
    270,  // soft lavender
    25,   // pale peach
    345,  // dusty rose
    140,  // light sage
    45,   // warm sand
    210,  // misty blue
    30    // soft taupe
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
        
        {/* Only render cards with valid titles */}
        {idea.title && idea.title.trim().length > 0 && (
          <div className="flex flex-col items-center justify-start h-full pt-8">
            <h3 className="text-lg font-poppins-bold text-center leading-tight mb-6 text-black">
              {idea.title}
            </h3>
            
            {/* Lottie Animation below text */}
            <div className="flex justify-center w-full">
              <LottieAnimation 
                url={getLottieAnimationForIdea(idea)}
                className="w-full h-32"
                isSwipeAnimating={isSwipeAnimating}
              />
            </div>
          </div>
        )}
        
        {/* Swipe Indicators */}
        <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center text-xs text-black bg-black/5 px-2 py-1 rounded-lg transition-all duration-300">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Dismiss
          </div>
          <div className="flex items-center text-xs bg-black/5 px-2 py-1 rounded-lg transition-all duration-300 text-black">
            <ArrowUp className="w-3 h-3 mr-1" />
            Explore
          </div>
          <div className="flex items-center text-xs text-black bg-gray-100 border border-gray-200 px-2 py-1 rounded hover:bg-gray-200 transition-all duration-300">
            <ArrowRight className="w-3 h-3 mr-1" />
            Save
          </div>
        </div>
      </div>
    </div>
  );
}