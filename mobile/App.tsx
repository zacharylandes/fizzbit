import { StyleSheet, View, Text, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState } from 'react';
import CardStackMobile from './components/CardStackMobile';
import InputSectionMobile from './components/InputSectionMobile';

type Idea = {
  id: string;
  title: string;
  description: string;
  source: 'text' | 'image';
  createdAt: string;
};

export default function App() {
  const [currentIdeas, setCurrentIdeas] = useState<Idea[]>([]);

  const handleIdeasGenerated = (ideas: Idea[]) => {
    setCurrentIdeas(ideas);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff6b6b" />
      <View style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Inspire Me</Text>
          <Text style={styles.subtitle}>Get creative ideas from your prompts</Text>
        </View>

        {/* Input Section */}
        <InputSectionMobile onIdeasGenerated={handleIdeasGenerated} />

        {/* Cards Section */}
        <View style={styles.cardsContainer}>
          <CardStackMobile initialIdeas={currentIdeas} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            👈 Swipe left to dismiss  •  👉 Swipe right to save  •  👆 Swipe up to explore
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff6b6b',
  },
  gradient: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
});
