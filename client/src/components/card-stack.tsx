import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isAnimating, setIsAnimating] = useState(false);
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
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/saved"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save the idea. Please try again.",
        variant: "destructive",
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
        // Add one related idea to the bottom of the stack
        setCards(prev => {
          const newCards = [...prev, data.ideas[0]];
          return newCards.slice(0, 3); // Keep only 3 cards max
        });
        toast({
          title: "New Ideas Generated!",
          description: "Explore more creative variations based on your interest.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate related ideas. Please try again.",
        variant: "destructive",
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
        // Add new card to fill the stack back to 3 cards
        setCards(prev => {
          const newCards = [...prev, data.ideas[0]];
          return newCards.slice(0, 3); // Keep only 3 cards max
        });
      }
    },
  });

  const handleSwipeLeft = (index: number) => {
    // Only allow swiping the top card for smooth animations
    if (index !== 0 || isAnimating) return;
    
    setIsAnimating(true);
    
    // Immediate card update to trigger position animations
    setCards(prev => {
      const newCards = prev.slice(1); // Remove top card
      return newCards;
    });
    
    // Get new idea after animation completes
    setTimeout(() => {
      const excludeIds = cards.slice(1).map(c => c.id);
      getRandomIdeasMutation.mutate(excludeIds);
      setIsAnimating(false);
    }, 400);
    
    toast({
      title: "Idea Dismissed",
      description: "Bringing you a fresh idea!",
    });
  };

  const handleSwipeRight = (index: number) => {
    // Only allow swiping the top card for smooth animations
    if (index !== 0 || isAnimating) return;
    
    const currentCard = cards[index];
    if (currentCard) {
      setIsAnimating(true);
      saveIdeaMutation.mutate(currentCard.id);
      
      // Immediate card update to trigger position animations
      setCards(prev => {
        const newCards = prev.slice(1); // Remove top card
        return newCards;
      });
      
      // Get new idea after animation completes
      setTimeout(() => {
        const excludeIds = cards.slice(1).map(c => c.id);
        getRandomIdeasMutation.mutate(excludeIds);
        setIsAnimating(false);
      }, 400);
    }
  };

  const handleSwipeUp = (index: number) => {
    console.log('handleSwipeUp called with index:', index);
    // Only allow swiping the top card for smooth animations
    if (index !== 0 || isAnimating) return;
    
    const currentCard = cards[index];
    console.log('Current card for swipe up:', currentCard);
    if (currentCard) {
      setIsAnimating(true);
      saveIdeaMutation.mutate(currentCard.id);
      
      // Immediate card update to trigger position animations
      setCards(prev => {
        const newCards = prev.slice(1); // Remove top card
        return newCards;
      });
      
      // Generate related idea after animation completes
      setTimeout(() => {
        exploreIdeaMutation.mutate(currentCard.id);
        setIsAnimating(false);
      }, 400);
    }
    
    toast({
      title: "Exploring Similar Ideas",
      description: "Generating variations based on this concept...",
    });
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
    <div className="relative h-[280px] sm:h-[320px] card-stack">
      {/* Swipe Instructions */}
      <div className="absolute -top-12 sm:-top-16 left-0 right-0 flex justify-center px-4">
        <motion.div 
          className="bg-white/90 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-coral mr-2">👆</span>
          Swipe to interact
        </motion.div>
      </div>

      {/* Render cards in reverse order - bottom card first so it appears behind */}
      <div className="space-y-0">
        {cards.slice(0, 3).reverse().map((card, reverseIndex) => {
          const totalCards = Math.min(cards.length, 3);
          const originalIndex = (totalCards - 1) - reverseIndex;
          const position = originalIndex === 0 ? "top" : originalIndex === 1 ? "middle" : "bottom";
          return (
            <IdeaCard
              key={card.id}
              idea={card}
              position={position}
              onSwipeLeft={() => handleSwipeLeft(originalIndex)}
              onSwipeRight={() => handleSwipeRight(originalIndex)}
              onSwipeUp={() => handleSwipeUp(originalIndex)}
            />
          );
        })}
      </div>
    </div>
  );
}
