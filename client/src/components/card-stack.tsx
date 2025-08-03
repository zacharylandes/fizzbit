import { useState, useEffect, useRef } from "react";
import { type Idea } from "@shared/schema";
import { IdeaCard } from "./idea-card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';
import type { Swiper as SwiperType } from 'swiper';

interface CardStackProps {
  initialIdeas?: Idea[];
}

export function CardStack({ initialIdeas = [] }: CardStackProps) {
  const [cards, setCards] = useState<Idea[]>(initialIdeas);
  const swiperRef = useRef<SwiperType | null>(null);
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
      // Move to next card
      if (swiperRef.current) {
        swiperRef.current.slideNext();
      }
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
        // Move to next card
        if (swiperRef.current) {
          swiperRef.current.slideNext();
        }
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

  const handleCardAction = (action: 'dismiss' | 'save' | 'explore', card: Idea) => {
    switch (action) {
      case 'dismiss':
        toast({
          title: "Idea Dismissed",
          description: "Bringing you a fresh idea!",
        });
        if (swiperRef.current) {
          swiperRef.current.slideNext();
        }
        break;
      case 'save':
        saveIdeaMutation.mutate(card.id);
        break;
      case 'explore':
        saveIdeaMutation.mutate(card.id);
        exploreIdeaMutation.mutate(card.id);
        break;
    }
  };

  const handleSlideChange = () => {
    // When we're running low on cards, fetch more
    const currentIndex = swiperRef.current?.realIndex || 0;
    if (cards.length - currentIndex <= 2) {
      const excludeIds = cards.map(c => c.id);
      getRandomIdeasMutation.mutate(excludeIds);
    }
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
    <div className="relative h-[280px] sm:h-[320px] w-full max-w-[300px] mx-auto z-20">
      {/* Swipe Instructions */}
      <div className="fixed top-4 left-0 right-0 flex justify-center px-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
          <span className="text-coral mr-1">👆</span>
          Swipe to interact
        </div>
      </div>

      {/* Swiper Card Stack */}
      <Swiper
        effect="cards"
        grabCursor={true}
        modules={[EffectCards]}
        className="w-full h-full"
        cardsEffect={{
          perSlideOffset: 8,
          perSlideRotate: 2,
          rotate: true,
          slideShadows: true,
        }}
        speed={500}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
      >
        {cards.map((card, index) => (
          <SwiperSlide key={card.id}>
            <IdeaCard
              idea={card}
              position={index === 0 ? "top" : index === 1 ? "middle" : "bottom"}
              onSwipeLeft={() => handleCardAction('dismiss', card)}
              onSwipeRight={() => handleCardAction('save', card)}
              onSwipeUp={() => handleCardAction('explore', card)}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
