import { useState, useEffect, useRef } from "react";
import { type Idea } from "@shared/schema";
import { IdeaCard } from "./idea-card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Image, Type, ArrowUp } from "lucide-react";

interface CardStackProps {
  initialIdeas?: Idea[];
  onSwipeUpPrompt?: (ideaContent: string) => void;
}

export function CardStack({ initialIdeas = [], onSwipeUpPrompt }: CardStackProps) {
  const [cards, setCards] = useState<Idea[]>(initialIdeas);
  const [animatingCards, setAnimatingCards] = useState<{ [key: string]: { direction: string; isAnimating: boolean } }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [cardColors, setCardColors] = useState<{ [key: string]: number }>({});
  const [currentExploreContext, setCurrentExploreContext] = useState<{ originalPrompt: string; exploredIdea: Idea } | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isSwipeUpLoading, setIsSwipeUpLoading] = useState(false);
  const [swipeUpPrompt, setSwipeUpPrompt] = useState<string>("");
  const cardRefs = useRef<{ [key: string]: HTMLElement }>({});
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const { toast } = useToast();

  // No auto-fetching of random ideas - users should start fresh each session

  // Removed auto-loading of random ideas - users start fresh each session

  useEffect(() => {
    if (initialIdeas.length > 0) {
      // COMPLETELY replace existing cards with new ideas from latest prompt
      setCards(initialIdeas);
      
      // RESET exploration context to ensure we start fresh with new prompt
      // This prevents mixing ideas from different prompts
      setCurrentExploreContext({
        originalPrompt: initialIdeas[0]?.sourceContent || "",
        exploredIdea: initialIdeas[0]
      });
      
      // Assign fresh colors to new cards, clearing old ones
      const newColors: { [key: string]: number } = {};
      initialIdeas.forEach((card, index) => {
        newColors[card.id] = index % 3; // Cycle through 3 color options
      });
      setCardColors(newColors); // Replace, don't merge
      
      // Reset loading states
      setIsSwipeUpLoading(false);
      setSwipeUpPrompt("");
      setIsGeneratingIdeas(false);
    }
  }, [initialIdeas]);

  // Save idea mutation
  const saveIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      const response = await apiRequest("POST", `/api/ideas/${ideaId}/save`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/saved"] });
    },
    onError: () => {
      toast({
        title: "Oops!",
        description: "Couldn't save that idea. Try again?",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  // Explore idea mutation
  const exploreIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      setIsGeneratingIdeas(true);
      const response = await apiRequest("POST", `/api/ideas/${ideaId}/explore`);
      return response.json();
    },
    onSuccess: (data, ideaId) => {
      setIsGeneratingIdeas(false);
      console.log('🎯 EXPLORE SUCCESS - Received ideas:', data.ideas?.length || 0);
      if (data.ideas && data.ideas.length > 0) {
        // Set/maintain the exploration context for future prefetching
        const exploredIdea = cards.find(c => c.id === ideaId);
        if (exploredIdea && exploredIdea.sourceContent && !currentExploreContext) {
          // Only set new context if we don't already have one
          console.log('🎯 SETTING NEW EXPLORE CONTEXT:', exploredIdea.sourceContent);
          setCurrentExploreContext({
            originalPrompt: exploredIdea.sourceContent,
            exploredIdea: exploredIdea
          });
        } else if (currentExploreContext) {
          console.log('🎯 MAINTAINING EXPLORE CONTEXT:', currentExploreContext.originalPrompt);
        }
        
        // Add related ideas to the front of the stack so they show up immediately
        setCards(prev => {
          console.log('🎯 BEFORE - Total cards:', prev.length);
          // Insert explore results at the beginning (they'll show up after the swiped card is removed)
          const newCards = [...data.ideas, ...prev];
          console.log('🎯 AFTER - Total cards:', newCards.length, 'New explore ideas:', data.ideas.length);
          
          // Assign colors to new explore cards
          const newColors: { [key: string]: number } = {};
          data.ideas.forEach((card: Idea, index: number) => {
            newColors[card.id] = index % 3;
          });
          setCardColors(prevColors => ({ ...prevColors, ...newColors }));
          
          return newCards;
        });
      }
    },
    onError: () => {
      setIsGeneratingIdeas(false);
      toast({
        title: "Hmm...",
        description: "Couldn't explore that idea. Give it another try!",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  // Smart prefetch more ideas from the same prompt/context
  const prefetchMoreIdeasMutation = useMutation({
    mutationFn: async () => {
      if (!currentExploreContext?.originalPrompt) {
        return { ideas: [] };
      }

      // Check if the original prompt was from an image or text
      const isImagePrompt = currentExploreContext.originalPrompt.startsWith('Image:');
      
      if (isImagePrompt) {
        // For image prompts, we can't regenerate from the same image, 
        // so we generate related visual ideas using the description
        const imageDescription = currentExploreContext.originalPrompt.replace('Image: ', '');
        const response = await apiRequest("POST", "/api/ideas/generate-from-text", {
          prompt: `Visual creative projects inspired by: ${imageDescription}`
        });
        return response.json();
      } else {
        // For text prompts, generate more ideas from the same prompt
        const response = await apiRequest("POST", "/api/ideas/generate-from-text", {
          prompt: currentExploreContext.originalPrompt
        });
        return response.json();
      }
    },
    onSuccess: (data) => {
      if (data.ideas && data.ideas.length > 0) {
        console.log('🔄 PREFETCH SUCCESS - Adding', data.ideas.length, 'more ideas from original prompt');
        // Add new ideas to the end of the stack
        setCards(prev => {
          const newCards = [...prev, ...data.ideas];
          // Assign colors to new cards
          const newColors: { [key: string]: number } = {};
          data.ideas.forEach((card: Idea, index: number) => {
            newColors[card.id] = (prev.length + index) % 3;
          });
          setCardColors(prevColors => ({ ...prevColors, ...newColors }));
          return newCards;
        });
      }
    },
    onError: (error) => {
      console.error('Prefetch failed:', error);
      // Silent failure - don't bother user with prefetch errors
    }
  });

  // Get random ideas mutation (fallback only)
  const getRandomIdeasMutation = useMutation({
    mutationFn: async (excludeIds: string[]) => {
      const excludeQuery = excludeIds.length > 0 ? `?exclude=${excludeIds.join(',')}` : '';
      const response = await apiRequest("GET", `/api/ideas/random${excludeQuery}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.ideas && data.ideas.length > 0) {
        // Add new cards to the end
        setCards(prev => {
          const newCards = [...prev, ...data.ideas];
          // Assign colors to new cards
          const newColors: { [key: string]: number } = {};
          data.ideas.forEach((card: Idea, index: number) => {
            newColors[card.id] = (prev.length + index) % 3;
          });
          setCardColors(prevColors => ({ ...prevColors, ...newColors }));
          return newCards;
        });
      }
    },
  });

  // Smart prefetching logic - check when cards get low
  const checkAndPrefetch = () => {
    console.log('🔄 Checking prefetch - Cards remaining:', cards.length, 'Has context:', !!currentExploreContext);
    
    if (cards.length <= 3 && currentExploreContext && !prefetchMoreIdeasMutation.isPending) {
      console.log('🔄 TRIGGERING PREFETCH for prompt:', currentExploreContext.originalPrompt);
      prefetchMoreIdeasMutation.mutate();
    }
  };

  const handleSwipe = (ideaId: string, direction: 'left' | 'right' | 'up') => {
    const idea = cards.find(c => c.id === ideaId);
    if (!idea) return;

    console.log('HANDLE SWIPE:', direction, ideaId);

    // Start animation
    setAnimatingCards(prev => ({
      ...prev,
      [ideaId]: { direction, isAnimating: true }
    }));

    // Show immediate toast feedback
    if (direction === 'left') {
      toast({
        title: "Idea Dismissed", 
        description: "Bringing you a fresh idea!",
        duration: 1000,
        variant: "info",
      });
    } else if (direction === 'right') {
      toast({
        title: "Idea Saved!",
        description: "Added to your collection ❤️",
        duration: 1000,
        variant: "save",
      });
    } else if (direction === 'up') {
      toast({
        title: "Exploring Idea!",
        description: "Generating creative variations ✨",
        duration: 1000,
        variant: "explore",
      });
    }

    // After animation completes, handle the action
    setTimeout(() => {
      if (direction === 'right') {
        // Right swipe: Save idea and continue
        saveIdeaMutation.mutate(idea.id);
      } else if (direction === 'up') {
        // Up swipe: Save idea AND use this idea as the new prompt
        saveIdeaMutation.mutate(idea.id);
        
        // Show loading state immediately
        setIsSwipeUpLoading(true);
        setSwipeUpPrompt(idea.title);
        
        // Use the idea's title as the new prompt and clear current cards
        if (onSwipeUpPrompt) {
          onSwipeUpPrompt(idea.title);
          // Clear current cards to start fresh with new prompt
          setCards([]);
          setCurrentExploreContext(null);
        } else {
          // If no onSwipeUpPrompt, explore the idea directly
          exploreIdeaMutation.mutate(idea.id);
        }
      }
      // Left swipe: Just dismiss (no action needed)

      // Remove card from state and trigger smart prefetching
      setCards(prev => {
        const newCards = prev.filter(c => c.id !== ideaId);
        console.log('🎯 CARDS AFTER SWIPE - Remaining:', newCards.length);
        
        // Trigger smart prefetching check after state update
        setTimeout(() => checkAndPrefetch(), 100);
        
        return newCards;
      });
      
      // Force re-render of remaining cards
      setRefreshKey(prev => prev + 1);

      // Clear animation state
      setAnimatingCards(prev => {
        const newState = { ...prev };
        delete newState[ideaId];
        return newState;
      });
    }, 300); // Animation duration
  };

  const handleTouchStart = (e: React.TouchEvent, ideaId: string) => {
    // Prevent default behavior to avoid conflicts
    e.preventDefault();
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchMove = (e: React.TouchEvent, ideaId: string) => {
    // Prevent page scrolling during swipe
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchEnd = (e: React.TouchEvent, ideaId: string) => {
    if (!touchStartRef.current) return;

    // Prevent default behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Only process quick swipes
    if (deltaTime > 500) {
      touchStartRef.current = null;
      return;
    }

    const threshold = 50; // Lower threshold for better sensitivity
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Debug logging
    console.log('Touch end:', { deltaX, deltaY, absX, absY, threshold, deltaTime });
    
    // Check for upward swipe first with more lenient conditions
    if (deltaY < -threshold) {
      // Upward swipe - prioritize this first
      console.log('UP SWIPE DETECTED');
      handleSwipe(ideaId, 'up');
    } else if (absX > threshold && absX > absY) {
      // Horizontal swipe - only if horizontal movement is dominant
      if (deltaX > 0) {
        console.log('RIGHT SWIPE DETECTED');
        handleSwipe(ideaId, 'right');
      } else {
        console.log('LEFT SWIPE DETECTED');
        handleSwipe(ideaId, 'left');
      }
    } else {
      console.log('NO SWIPE DETECTED');
    }

    touchStartRef.current = null;
  };

  if (cards.length === 0) {
    return (
      <div className="relative h-[400px] sm:h-[440px] w-full max-w-[600px] mx-auto">
        <div className="bg-card border border-border rounded-xl h-full flex flex-col items-center justify-center p-8 text-center card-shadow relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            {isSwipeUpLoading ? (
              <>
                {/* Loading State for Swipe Up */}
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Fetching new ideas!
                </h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Generating creative ideas based on: "<span className="font-medium text-foreground">{swipeUpPrompt}</span>"
                </p>
              </>
            ) : (
              <>
                {/* Default Empty State */}
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="p-3 bg-card-sage border border-card-sage/30 rounded-lg hover:scale-110 transition-all duration-300">
                    <Sparkles className="h-6 w-6 text-card-sage" />
                  </div>
                  <div className="p-3 bg-card-blue-gray border border-card-blue-gray/30 rounded-lg hover:scale-110 transition-all duration-300">
                    <Image className="h-6 w-6 text-card-blue-gray" />
                  </div>
                  <div className="p-3 bg-card-light-blue border border-card-light-blue/30 rounded-lg hover:scale-110 transition-all duration-300">
                    <Type className="h-6 w-6 text-card-light-blue" />
                  </div>
                </div>
                
                {/* Message */}
                <div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    No ideas yet!
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Use the input above to get inspired<br />
                    Share a photo or describe your interests
                  </p>
                </div>
                
                {/* Visual hint */}
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <ArrowUp className="h-4 w-4 animate-bounce text-card-light-blue" />
                  <span>Start creating</span>
                  <ArrowUp className="h-4 w-4 animate-bounce text-card-light-blue" style={{ animationDelay: '0.2s' }} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] sm:h-[440px] w-full max-w-[600px] mx-auto z-30">
      {/* Touch Card Stack */}
      <div className="relative w-full h-full">
        {/* Show loading card if generating ideas and no cards available */}
        {isGeneratingIdeas && cards.length === 0 && (
          <div className="absolute inset-0 cursor-default" style={{ zIndex: 10 }}>
            <div className="w-full h-full bg-card border border-card-sage/30 rounded-xl p-6 flex flex-col items-center justify-center card-shadow">
              <div className="w-16 h-16 mb-4 relative">
                <div className="absolute inset-0 border-4 border-card-sage border-t-transparent rounded-full animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-card-sage animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">Generating Ideas...</h3>
              <p className="text-muted-foreground text-center">Creating creative variations based on your interest</p>
            </div>
          </div>
        )}
        
        {/* Show subtle loading indicator when generating and cards are available */}
        {isGeneratingIdeas && cards.length > 0 && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-full p-2 flex items-center space-x-2 card-shadow">
              <div className="w-4 h-4 border-2 border-card-sage border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-card-foreground">Generating...</span>
            </div>
          </div>
        )}
        
        {cards.slice(0, 3).map((card, index) => {
          const animation = animatingCards[card.id];
          const isAnimating = animation?.isAnimating;
          const direction = animation?.direction;
          
          let animationClass = "";
          if (isAnimating) {
            if (direction === 'left') {
              animationClass = "animate-slide-out-left";
            } else if (direction === 'right') {
              animationClass = "animate-slide-out-right";
            } else if (direction === 'up') {
              animationClass = "animate-slide-out-up";
            }
          }

          return (
            <div
              key={card.id}
              ref={(el) => {
                if (el) cardRefs.current[card.id] = el;
              }}
              className={`absolute inset-0 cursor-grab transition-transform duration-300 ease-out ${animationClass}`}
              style={{
                zIndex: 3 - index, // Top card has highest z-index
                touchAction: 'none', // Disable all browser touch behaviors
              }}
              onTouchStart={(e) => handleTouchStart(e, card.id)}
              onTouchMove={(e) => handleTouchMove(e, card.id)}
              onTouchEnd={(e) => handleTouchEnd(e, card.id)}
            >
              <IdeaCard
                key={`${card.id}-${index}-${refreshKey}`}
                idea={card}
                position={index === 0 ? "top" : index === 1 ? "middle" : "bottom"}
                colorIndex={cardColors[card.id] ?? 0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
