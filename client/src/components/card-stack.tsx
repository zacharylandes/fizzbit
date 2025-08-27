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
  currentPrompt?: string; // Add current prompt to preserve context for chaining
}

export function CardStack({ initialIdeas = [], onSwipeUpPrompt, currentPrompt = "" }: CardStackProps) {
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
  const [dragStates, setDragStates] = useState<{ [key: string]: { x: number; y: number; opacity: number; isDragging: boolean } }>({});
  const { toast } = useToast();

  // Keyboard navigation - focus on the top card for desktop interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events if we have cards and not typing in an input
      if (cards.length === 0 || (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      const topCard = cards[0]; // Get the top card (most visible one)
      if (!topCard) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleSwipe(topCard.id, 'left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSwipe(topCard.id, 'right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleSwipe(topCard.id, 'up');
          break;
      }
    };

    // Add global keyboard listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cards]); // Re-bind when cards change so we always target the current top card

  // No auto-fetching of random ideas - users should start fresh each session

  // Removed auto-loading of random ideas - users start fresh each session

  useEffect(() => {
    if (initialIdeas.length > 0) {
      // COMPLETELY replace existing cards with new ideas from latest prompt
      setCards(initialIdeas);
      
      // RESET exploration context to ensure we start fresh with new prompt
      // This prevents mixing ideas from different prompts
      setCurrentExploreContext({
        originalPrompt: initialIdeas[0]?.sourceContent || currentPrompt || "",
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
      
      // Only prefetch if we have fewer than 15 cards initially
      if (initialIdeas.length <= 15) {
        setTimeout(() => checkAndPrefetch(initialIdeas.length), 500);
      }
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
      console.log('🔍 PREFETCH DEBUG - currentExploreContext:', currentExploreContext?.originalPrompt);
      console.log('🔍 PREFETCH DEBUG - currentPrompt:', currentPrompt);
      
      const activePrompt = currentExploreContext?.originalPrompt || currentPrompt;
      
      if (!activePrompt) {
        console.log('❌ No context for prefetch');
        return { ideas: [] };
      }

      console.log('🔄 Prefetching from prompt:', activePrompt);

      // Always use the EXACT original prompt to maintain context and relevance
      console.log('🎯 Generating more ideas using original prompt context:', activePrompt);
      
      const response = await apiRequest("POST", "/api/ideas/generate-from-text", {
        prompt: activePrompt
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.ideas && data.ideas.length > 0) {
        console.log('🔄 PREFETCH SUCCESS - Adding', data.ideas.length, 'more ideas from original prompt');
        // Add new ideas to the end of the stack with deduplication
        setCards(prev => {
          // Create a set of existing titles for deduplication
          const existingTitles = new Set(prev.map(card => card.title.toLowerCase().trim()));
          
          // Filter out duplicate ideas based on title similarity
          const uniqueNewIdeas = data.ideas.filter((newIdea: Idea) => {
            const normalizedTitle = newIdea.title.toLowerCase().trim();
            return !existingTitles.has(normalizedTitle);
          });
          
          console.log('🔍 DEDUP: Filtered', data.ideas.length - uniqueNewIdeas.length, 'duplicate ideas');
          
          const newCards = [...prev, ...uniqueNewIdeas];
          // Assign colors to new cards
          const newColors: { [key: string]: number } = {};
          uniqueNewIdeas.forEach((card: Idea, index: number) => {
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

  // Smart prefetching logic - check when cards get low and ensure continuous flow with deduplication
  const checkAndPrefetch = (cardCount?: number) => {
    const currentCardCount = cardCount ?? cards.length;
    console.log('🔄 Checking prefetch - Cards remaining:', currentCardCount, 'Has context:', !!currentExploreContext, 'Is pending:', prefetchMoreIdeasMutation.isPending);
    
    // EARLY prefetch when cards get to 15 or fewer to ensure smooth flow
    if (currentCardCount <= 15 && currentExploreContext && !prefetchMoreIdeasMutation.isPending) {
      console.log('🔄 EARLY PREFETCH TRIGGERED for current prompt:', currentExploreContext.originalPrompt);
      prefetchMoreIdeasMutation.mutate();
    }
    // BACKUP prefetch if cards get critically low (3 or fewer) - emergency measure
    else if (currentCardCount <= 3 && currentExploreContext && !prefetchMoreIdeasMutation.isPending) {
      console.log('🔄 EMERGENCY PREFETCH for current prompt:', currentExploreContext.originalPrompt);
      prefetchMoreIdeasMutation.mutate();
    }
    // ULTIMATE fallback - if we somehow have no cards and no context, use current prompt or emergency fallback
    else if (currentCardCount === 0 && !currentExploreContext && !prefetchMoreIdeasMutation.isPending) {
      console.log('🚨 ULTIMATE FALLBACK - Generating emergency ideas');
      // Use currentPrompt if available, otherwise create temporary context
      const fallbackPrompt = currentPrompt || "creative inspiration and unusual ideas";
      setCurrentExploreContext({
        originalPrompt: fallbackPrompt,
        exploredIdea: null as any
      });
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
        
        // Combine the current prompt with the swiped idea for enhanced creativity
        if (onSwipeUpPrompt && currentPrompt) {
          const combinedPrompt = `${currentPrompt} + ideas inspired by "${idea.title}"`;
          // Update context immediately to preserve it for prefetch
          setCurrentExploreContext({
            originalPrompt: combinedPrompt,
            exploredIdea: idea
          });
          onSwipeUpPrompt(combinedPrompt);
          // Clear current cards to start fresh with combined prompt
          setCards([]);
        } else if (onSwipeUpPrompt) {
          // If no current prompt, just use the idea title
          const newPrompt = `ideas inspired by "${idea.title}"`;
          setCurrentExploreContext({
            originalPrompt: newPrompt,
            exploredIdea: idea
          });
          onSwipeUpPrompt(newPrompt);
          setCards([]);
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
        
        // Trigger smart prefetching check immediately after state update with correct count
        setTimeout(() => {
          checkAndPrefetch(newCards.length);
        }, 100);
        
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
    
    // Initialize drag state
    setDragStates(prev => ({
      ...prev,
      [ideaId]: { x: 0, y: 0, opacity: 1, isDragging: true }
    }));
  };

  const handleTouchMove = (e: React.TouchEvent, ideaId: string) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Only prevent default if we detect intentional card interaction (not just scrolling)
    if (Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15) {
      e.preventDefault();
      e.stopPropagation();
      
      // Update drag state for visual feedback
      setDragStates(prev => ({
        ...prev,
        [ideaId]: { 
          x: deltaX * 0.8, // Slightly dampen movement for more realistic feel
          y: deltaY * 0.8, 
          opacity: 1, // Keep card fully opaque during drag
          isDragging: true 
        }
      }));
    }
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

    // Reset drag state
    setDragStates(prev => ({
      ...prev,
      [ideaId]: { x: 0, y: 0, opacity: 1, isDragging: false }
    }));

    // Only process quick swipes
    if (deltaTime > 500) {
      touchStartRef.current = null;
      return;
    }

    const threshold = 120; // Much higher threshold for less sensitivity - requires more deliberate swipe distance
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Debug logging
    console.log('Touch end:', { deltaX, deltaY, absX, absY, threshold, deltaTime });
    
    // Check for upward swipe first with stricter conditions
    if (deltaY < -threshold && absY > absX * 1.2) {
      // Upward swipe - only if vertical movement is clearly dominant
      console.log('UP SWIPE DETECTED');
      handleSwipe(ideaId, 'up');
    } else if (absX > threshold && absX > absY * 1.3) {
      // Horizontal swipe - only if horizontal movement is clearly dominant and intentional
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
      <div className="relative h-[480px] sm:h-[520px] w-full max-w-[600px] mx-auto">
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
                {/* Empty State */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-card-foreground text-center">
                    Ready for Creative Ideas?
                  </h3>
                  <p className="text-muted-foreground text-sm text-center leading-relaxed mb-6">
                    Add a prompt above to discover personalized creative ideas<br />
                    generated by AI based on your interests
                  </p>
                  
                  {/* Visual hint */}
                  <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                    <ArrowUp className="h-4 w-4 animate-bounce text-card-light-blue" />
                    <span>Add a prompt to get started</span>
                    <ArrowUp className="h-4 w-4 animate-bounce text-card-light-blue" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[480px] sm:h-[520px] w-full max-w-[600px] mx-auto z-30">
      {/* Touch Card Stack */}
      <div className="relative w-full h-full">
        {/* Show loading card if generating ideas and no cards available OR if we run critically low */}
        {(isGeneratingIdeas && cards.length === 0) || (cards.length <= 2 && currentExploreContext && prefetchMoreIdeasMutation.isPending) && (
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
        
        {/* Never show completely empty state - always show at least loading */}
        {cards.length === 0 && !isGeneratingIdeas && !prefetchMoreIdeasMutation.isPending && currentExploreContext && (
          <div className="absolute inset-0 cursor-default" style={{ zIndex: 10 }}>
            <div className="w-full h-full bg-card border border-card-sage/30 rounded-xl p-6 flex flex-col items-center justify-center card-shadow">
              <div className="w-16 h-16 mb-4 relative">
                <div className="absolute inset-0 border-4 border-card-sage border-t-transparent rounded-full animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-card-sage animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">Getting More Ideas...</h3>
              <p className="text-muted-foreground text-center">Endless creativity coming your way!</p>
            </div>
          </div>
        )}
        
        {cards.slice(0, 3).map((card, index) => {
          const animation = animatingCards[card.id];
          const isAnimating = animation?.isAnimating;
          const direction = animation?.direction;
          const dragState = dragStates[card.id];
          
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

          // Apply real-time drag transform
          const transform = dragState?.isDragging 
            ? `translate(${dragState.x}px, ${dragState.y}px) rotate(${dragState.x * 0.1}deg)`
            : 'none';
          
          const opacity = dragState?.isDragging ? dragState.opacity : 1;

          return (
            <div
              key={card.id}
              ref={(el) => {
                if (el) cardRefs.current[card.id] = el;
              }}
              className={`absolute inset-0 cursor-grab ${!dragState?.isDragging ? 'transition-transform duration-300 ease-out' : ''} ${animationClass}`}
              style={{
                zIndex: 3 - index, // Top card has highest z-index
                touchAction: 'none', // Disable all browser touch behaviors
                transform,
                opacity,
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
