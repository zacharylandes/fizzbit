import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import IdeaCardMobile from './IdeaCardMobile';

type Idea = {
  id: string;
  title: string;
  description: string;
  source: 'text' | 'image';
  createdAt: string;
};

interface CardStackMobileProps {
  initialIdeas?: Idea[];
}

// Mock data for testing
const mockIdeas: Idea[] = [
  {
    id: '1',
    title: 'Create a Digital Art Gallery',
    description: 'Transform your living space into a rotating digital art gallery using smart displays and curated collections.',
    source: 'text',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Build a Colorful Herb Garden',
    description: 'Design an indoor herb garden with vibrant pots and creative arrangements that add life to your kitchen.',
    source: 'text',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Start a Creative Photo Series',
    description: 'Document everyday moments with a unique artistic perspective, creating a visual diary of your world.',
    source: 'text',
    createdAt: new Date().toISOString(),
  },
];

export default function CardStackMobile({ initialIdeas = [] }: CardStackMobileProps) {
  const [cards, setCards] = useState<Idea[]>([]);

  useEffect(() => {
    if (initialIdeas.length > 0) {
      setCards(initialIdeas.slice(0, 3));
    } else {
      setCards(mockIdeas);
    }
  }, [initialIdeas]);

  const handleSwipeLeft = (index: number) => {
    if (index !== 0) return;
    
    // Remove top card and add new one
    setTimeout(() => {
      setCards(prev => {
        const newCards = prev.slice(1);
        // Add a new mock idea
        const newIdea: Idea = {
          id: Date.now().toString(),
          title: 'Fresh Creative Idea',
          description: 'This is a new idea generated to replace the dismissed one.',
          source: 'text',
          createdAt: new Date().toISOString(),
        };
        return [...newCards, newIdea];
      });
    }, 300);

    Alert.alert('Idea Dismissed', 'Bringing you a fresh idea!');
  };

  const handleSwipeRight = (index: number) => {
    if (index !== 0) return;
    
    const currentCard = cards[index];
    
    // Remove top card and add new one
    setTimeout(() => {
      setCards(prev => {
        const newCards = prev.slice(1);
        const newIdea: Idea = {
          id: Date.now().toString(),
          title: 'Another Great Idea',
          description: 'Here is another creative idea for you to explore.',
          source: 'text',
          createdAt: new Date().toISOString(),
        };
        return [...newCards, newIdea];
      });
    }, 300);

    Alert.alert('Idea Saved!', `"${currentCard?.title}" has been saved to your collection.`);
  };

  const handleSwipeUp = (index: number) => {
    if (index !== 0) return;
    
    const currentCard = cards[index];
    
    // Remove top card and add related idea
    setTimeout(() => {
      setCards(prev => {
        const newCards = prev.slice(1);
        const relatedIdea: Idea = {
          id: Date.now().toString(),
          title: `Related: ${currentCard?.title}`,
          description: 'This is a related idea based on your interest in the previous concept.',
          source: 'text',
          createdAt: new Date().toISOString(),
        };
        return [...newCards, relatedIdea];
      });
    }, 300);

    Alert.alert('Exploring Similar Ideas', 'Generating variations based on this concept...');
  };

  if (cards.length === 0) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading creative ideas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.instruction}>
        <Text style={styles.instructionText}>👆 Swipe to interact</Text>
      </View>
      
      <View style={styles.cardStack}>
        {cards.slice(0, 3).reverse().map((card, reverseIndex) => {
          const originalIndex = 2 - reverseIndex;
          const position = originalIndex === 0 ? 'top' : originalIndex === 1 ? 'middle' : 'bottom';
          
          return (
            <IdeaCardMobile
              key={`${originalIndex}-${card.id}`}
              idea={card}
              position={position}
              onSwipeLeft={() => handleSwipeLeft(originalIndex)}
              onSwipeRight={() => handleSwipeRight(originalIndex)}
              onSwipeUp={() => handleSwipeUp(originalIndex)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStack: {
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  instructionText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
});