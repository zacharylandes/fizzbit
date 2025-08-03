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
}

export function CardStack({ initialIdeas = [] }: CardStackProps) {
  const [cards, setCards] = useState<Idea[]>(initialIdeas);
  const [animatingCards, setAnimatingCards] = useState<{ [key: string]: { direction: string; isAnimating: boolean } }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [cardColors, setCardColors] = useState<{ [key: string]: number }>({});
  const [currentExploreContext, setCurrentExploreContext] = useState<{ originalPrompt: string; exploredIdea: Idea } | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLElement }>({});
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const { toast } = useToast();

  // Fetch random ideas if no initial ideas provided
  const { data: randomIdeasData } = useQuery({
    queryKey: ["/api/ideas/random"],
    enabled: initialIdeas.length === 0,
  });

  useEffect(() => {
    if (randomIdeasData && typeof randomIdeasData === 'object' && randomIdeasData !== null && 'ideas' in randomIdeasData && Array.isArray(randomIdeasData.ideas) && initialIdeas.length === 0) {
      const newCards = randomIdeasData.ideas; // Use all random ideas, not just first 3
      setCards(newCards);
      // Assign stable colors to new cards
      const newColors: { [key: string]: number } = {};
      newCards.forEach((card, index) => {
        newColors[card.id] = index % 3; // Cycle through 3 color options
      });
      setCardColors(prev => ({ ...prev, ...newColors }));
    }
  }, [randomIdeasData, initialIdeas.length]);

  useEffect(() => {
    if (initialIdeas.length > 0) {
      setCards(initialIdeas); // Use all initial ideas
      // Set exploration context from new ideas (photo/text prompt)
      if (initialIdeas[0]?.sourceContent) {
        setCurrentExploreContext({
          originalPrompt: initialIdeas[0].sourceContent,
          exploredIdea: initialIdeas[0]
        });
      }
      // Assign stable colors to initial cards
      const newColors: { [key: string]: number } = {};
      initialIdeas.forEach((card, index) => {
        newColors[card.id] = index % 3; // Cycle through 3 color options
      });
      setCardColors(prev => ({ ...prev, ...newColors }));
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
      const response = await apiRequest("POST", `/api/ideas/${ideaId}/explore`);
      return response.json();
    },
    onSuccess: (data, ideaId) => {
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
      toast({
        title: "Hmm...",
        description: "Couldn't explore that idea. Give it another try!",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  // Get random ideas mutation
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
        // Up swipe: Save idea AND generate new ideas combining this idea with original prompt
        saveIdeaMutation.mutate(idea.id);
        exploreIdeaMutation.mutate(idea.id);
      }
      // Left swipe: Just dismiss (no action needed)

      // Remove card from state and check if we need more cards
      setCards(prev => {
        const newCards = prev.filter(c => c.id !== ideaId);
        console.log('🎯 CARDS AFTER SWIPE - Remaining:', newCards.length);
        
        // Smart prefetching: when we have 5 or fewer cards left (more aggressive)
        if (newCards.length <= 5) {
          console.log('🎯 PREFETCH CHECK - Cards left:', newCards.length, 'Explore context:', !!currentExploreContext);
          
          // If we're in an exploration context, always continue exploring
          if (currentExploreContext) {
            // Find the most recent idea that shares the same original prompt as our exploration context
            const contextualIdeas = newCards.filter(card => 
              card.sourceContent === currentExploreContext.originalPrompt
            );
            
            if (contextualIdeas.length > 0) {
              // Use the most recent contextual idea to continue exploration
              const mostRecentContextualIdea = contextualIdeas[0]; // First card is most recent
              console.log('🎯 CONTINUING EXPLORATION - Based on most recent:', mostRecentContextualIdea.title);
              exploreIdeaMutation.mutate(mostRecentContextualIdea.id);
            } else {
              // Always fallback to the original explored idea to keep the context alive
              console.log('🎯 CONTINUING EXPLORATION - Fallback to original:', currentExploreContext.exploredIdea.title);
              exploreIdeaMutation.mutate(currentExploreContext.exploredIdea.id);
            }
          } else {
            // Only fetch random ideas if we truly have no exploration context
            const excludeIds = newCards.map(c => c.id);
            console.log('🎯 FETCHING RANDOM - Excluding IDs:', excludeIds.length);
            getRandomIdeasMutation.mutate(excludeIds);
          }
        }
        
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
        <div className="bg-card border border-border rounded-2xl h-full flex flex-col items-center justify-center p-8 text-center">
          <div className="space-y-6">
            {/* Icons */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="p-3 bg-secondary rounded-xl">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="p-3 bg-secondary rounded-xl">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <div className="p-3 bg-secondary rounded-xl">
                <Type className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            {/* Message */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No ideas yet!
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Use the input above to get inspired<br />
                Share a photo or describe your interests
              </p>
            </div>
            
            {/* Visual hint */}
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
              <ArrowUp className="h-4 w-4 animate-bounce" />
              <span>Start creating</span>
              <ArrowUp className="h-4 w-4 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] sm:h-[440px] w-full max-w-[600px] mx-auto z-30">
      {/* Touch Card Stack */}
      <div className="relative w-full h-full">
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
