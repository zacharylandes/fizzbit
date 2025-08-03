import { useState, useEffect, useRef } from "react";
import { type Idea } from "@shared/schema";
import { IdeaCard } from "./idea-card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CardStackProps {
  initialIdeas?: Idea[];
}

export function CardStack({ initialIdeas = [] }: CardStackProps) {
  const [cards, setCards] = useState<Idea[]>(initialIdeas);
  const [animatingCards, setAnimatingCards] = useState<{ [key: string]: { direction: string; isAnimating: boolean } }>({});
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
      setCards(randomIdeasData.ideas.slice(0, 3));
    }
  }, [randomIdeasData, initialIdeas.length]);

  useEffect(() => {
    if (initialIdeas.length > 0) {
      setCards(initialIdeas.slice(0, 3));
    }
  }, [initialIdeas]);

  // Save idea mutation
  const saveIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      const response = await apiRequest("POST", `/api/ideas/${ideaId}/save`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Idea Saved!",
        description: "The idea has been added to your saved collection.",
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/saved"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save the idea. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  // Explore idea mutation
  const exploreIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      const response = await apiRequest("POST", `/api/ideas/${ideaId}/explore`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.ideas && data.ideas.length > 0) {
        // Add related ideas to the end of the stack
        setCards(prev => [...prev, ...data.ideas]);
        toast({
          title: "New Ideas Generated!",
          description: "Explore more creative variations based on your interest.",
          duration: 2000,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate related ideas. Please try again.",
        variant: "destructive",
        duration: 2000,
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
        setCards(prev => [...prev, ...data.ideas]);
      }
    },
  });

  const handleSwipe = (ideaId: string, direction: 'left' | 'right' | 'up') => {
    const idea = cards.find(c => c.id === ideaId);
    if (!idea) return;

    // Immediately remove card from state to trigger position updates
    setCards(prev => {
      const newCards = prev.filter(c => c.id !== ideaId);
      if (newCards.length <= 2) {
        const excludeIds = newCards.map(c => c.id);
        getRandomIdeasMutation.mutate(excludeIds);
      }
      return newCards;
    });

    // Start animation
    setAnimatingCards(prev => ({
      ...prev,
      [ideaId]: { direction, isAnimating: true }
    }));

    // Handle the action
    if (direction === 'left') {
      // Dismiss
      toast({
        title: "Idea Dismissed", 
        description: "Bringing you a fresh idea!",
        duration: 2000,
      });
    } else if (direction === 'right') {
      // Save
      saveIdeaMutation.mutate(idea.id);
    } else if (direction === 'up') {
      // Explore
      saveIdeaMutation.mutate(idea.id);
      exploreIdeaMutation.mutate(idea.id);
    }

    // Clear animation state after animation completes
    setTimeout(() => {
      setAnimatingCards(prev => {
        const newState = { ...prev };
        delete newState[ideaId];
        return newState;
      });
    }, 300); // Animation duration
  };

  const handleTouchStart = (e: React.TouchEvent, ideaId: string) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent, ideaId: string) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Only process quick swipes
    if (deltaTime > 500) return;

    const threshold = 80;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > threshold && absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        handleSwipe(ideaId, 'right');
      } else {
        handleSwipe(ideaId, 'left');
      }
    } else if (absY > threshold && deltaY < 0) {
      // Upward swipe - removed the absY > absX condition to make it more responsive
      handleSwipe(ideaId, 'up');
    }

    touchStartRef.current = null;
  };

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/80">Loading creative ideas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] sm:h-[440px] w-full max-w-[340px] mx-auto z-30">
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
              className={`absolute inset-0 cursor-grab touch-pan-x touch-pan-y transition-transform duration-300 ease-out ${animationClass}`}
              style={{
                zIndex: 3 - index, // Top card has highest z-index
              }}
              onTouchStart={(e) => handleTouchStart(e, card.id)}
              onTouchEnd={(e) => handleTouchEnd(e, card.id)}
            >
              <IdeaCard
                idea={card}
                position={index === 0 ? "top" : index === 1 ? "middle" : "bottom"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
