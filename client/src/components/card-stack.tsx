import { useState, useEffect, useRef } from "react";
import { type Idea } from "@shared/schema";
import { IdeaCard } from "./idea-card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Stack, Direction } from 'swing';

interface CardStackProps {
  initialIdeas?: Idea[];
}

export function CardStack({ initialIdeas = [] }: CardStackProps) {
  const [cards, setCards] = useState<Idea[]>(initialIdeas);
  const stackRef = useRef<any>(null);
  const cardRefs = useRef<{ [key: string]: HTMLElement }>({});
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
        // Add related ideas to the end of the stack
        setCards(prev => [...prev, ...data.ideas]);
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
        // Add new cards to the end
        setCards(prev => [...prev, ...data.ideas]);
      }
    },
  });

  // Recreate Swing stack whenever cards change
  useEffect(() => {
    if (cards.length > 0) {
      // Clear existing stack
      if (stackRef.current) {
        try {
          stackRef.current.off('throwout');
        } catch (e) {
          // Ignore errors when clearing
        }
      }

      // Create new stack
      const config = {
        allowedDirections: [
          Direction.LEFT,
          Direction.RIGHT, 
          Direction.UP
        ],
        throwOutConfidence: (xOffset: number, yOffset: number, element: HTMLElement) => {
          const xConfidence = Math.min(Math.abs(xOffset) / element.offsetWidth, 1);
          const yConfidence = Math.min(Math.abs(yOffset) / element.offsetHeight, 1);
          return Math.max(xConfidence, yConfidence);
        },
        rotation: (xOffset: number, yOffset: number, element: HTMLElement) => {
          const maxRotation = 20;
          return Math.max(Math.min(xOffset / element.offsetWidth * maxRotation, maxRotation), -maxRotation);
        }
      };

      stackRef.current = Stack(config);

      // Add throwout event listener
      stackRef.current.on('throwout', (eventObject: any) => {
        const direction = eventObject.throwDirection;
        const cardElement = eventObject.target;
        const ideaId = cardElement.dataset.ideaId;
        
        // Find the idea from current cards state
        setCards(currentCards => {
          const idea = currentCards.find(c => c.id === ideaId);
          if (!idea) return currentCards;

          if (direction === Direction.LEFT) {
            // Dismiss
            toast({
              title: "Idea Dismissed",
              description: "Bringing you a fresh idea!",
            });
          } else if (direction === Direction.RIGHT) {
            // Save
            saveIdeaMutation.mutate(idea.id);
          } else if (direction === Direction.UP) {
            // Explore
            saveIdeaMutation.mutate(idea.id);
            exploreIdeaMutation.mutate(idea.id);
          }

          // Remove card from state and fetch new ones
          const newCards = currentCards.filter(c => c.id !== ideaId);
          if (newCards.length <= 2) {
            const excludeIds = newCards.map(c => c.id);
            getRandomIdeasMutation.mutate(excludeIds);
          }
          return newCards;
        });
      });

      // Add all current cards to the stack
      setTimeout(() => {
        cards.forEach(card => {
          const cardElement = cardRefs.current[card.id];
          if (cardElement && stackRef.current) {
            stackRef.current.createCard(cardElement);
          }
        });
      }, 100);
    }
  }, [cards, saveIdeaMutation, exploreIdeaMutation, toast, getRandomIdeasMutation]);

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
    <div className="relative h-[280px] sm:h-[320px] w-full max-w-[300px] mx-auto z-30">
      {/* Swipe Instructions */}
      <div className="fixed top-1 left-0 right-0 flex justify-center px-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
          <span className="text-coral mr-1">👆</span>
          Swipe to interact
        </div>
      </div>

      {/* Swing Card Stack */}
      <div className="relative w-full h-full">
        {cards.slice(0, 3).map((card, index) => (
          <div
            key={card.id}
            ref={(el) => {
              if (el) cardRefs.current[card.id] = el;
            }}
            data-idea-id={card.id}
            className="absolute inset-0 cursor-grab"
            style={{
              zIndex: 3 - index, // Top card has highest z-index
            }}
          >
            <IdeaCard
              idea={card}
              position={index === 0 ? "top" : index === 1 ? "middle" : "bottom"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
