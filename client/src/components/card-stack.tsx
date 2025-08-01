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
  const { toast } = useToast();

  // Fetch random ideas if no initial ideas provided
  const { data: randomIdeasData } = useQuery({
    queryKey: ["/api/ideas/random"],
    enabled: initialIdeas.length === 0,
  });

  useEffect(() => {
    if (randomIdeasData && 'ideas' in randomIdeasData && Array.isArray(randomIdeasData.ideas) && initialIdeas.length === 0) {
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
        // Add new ideas to the stack
        setCards(prev => [
          ...data.ideas.slice(0, 3),
          ...prev.slice(3)
        ]);
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
        setCards(prev => [
          data.ideas[0],
          ...prev.slice(0, 2)
        ]);
      }
    },
  });

  const handleSwipeLeft = (index: number) => {
    // Dismiss - replace with new random idea
    const currentCard = cards[index];
    if (currentCard) {
      const excludeIds = cards.map(c => c.id);
      getRandomIdeasMutation.mutate(excludeIds);
    }
    
    toast({
      title: "Idea Dismissed",
      description: "Bringing you a fresh idea!",
    });
  };

  const handleSwipeRight = (index: number) => {
    // Save idea
    const currentCard = cards[index];
    if (currentCard) {
      saveIdeaMutation.mutate(currentCard.id);
      // Also replace with new idea
      const excludeIds = cards.map(c => c.id);
      getRandomIdeasMutation.mutate(excludeIds);
    }
  };

  const handleSwipeUp = (index: number) => {
    // Explore similar ideas
    const currentCard = cards[index];
    if (currentCard) {
      exploreIdeaMutation.mutate(currentCard.id);
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
    <div className="relative h-[480px] card-stack">
      {/* Swipe Instructions */}
      <div className="absolute -top-16 left-0 right-0 flex justify-center">
        <motion.div 
          className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-gray-700"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-coral mr-2">👆</span>
          Swipe to interact with ideas
        </motion.div>
      </div>

      <AnimatePresence mode="popLayout">
        {cards.slice(0, 3).map((card, index) => (
          <IdeaCard
            key={`${card.id}-${index}`}
            idea={card}
            position={index === 0 ? "top" : index === 1 ? "middle" : "bottom"}
            onSwipeLeft={() => handleSwipeLeft(index)}
            onSwipeRight={() => handleSwipeRight(index)}
            onSwipeUp={() => handleSwipeUp(index)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
