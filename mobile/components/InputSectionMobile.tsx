import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Idea = {
  id: string;
  title: string;
  description: string;
  source: 'text' | 'image';
  createdAt: string;
};

interface InputSectionMobileProps {
  onIdeasGenerated: (ideas: Idea[]) => void;
}

export default function InputSectionMobile({ onIdeasGenerated }: InputSectionMobileProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateMockIdeas = (prompt: string): Idea[] => {
    return [
      {
        id: Date.now().toString(),
        title: `Creative ${prompt} Project`,
        description: `An inspiring project based on your prompt: "${prompt}". This could involve various creative approaches and innovative solutions.`,
        source: 'text',
        createdAt: new Date().toISOString(),
      },
      {
        id: (Date.now() + 1).toString(),
        title: `${prompt} Art Installation`,
        description: `Transform your ideas about ${prompt} into an interactive art piece that engages viewers and sparks conversations.`,
        source: 'text',
        createdAt: new Date().toISOString(),
      },
      {
        id: (Date.now() + 2).toString(),
        title: `Digital ${prompt} Experience`,
        description: `Create a digital experience that brings ${prompt} to life through technology, user interaction, and creative storytelling.`,
        source: 'text',
        createdAt: new Date().toISOString(),
      },
    ];
  };

  const handleGenerateFromText = async () => {
    if (!textPrompt.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const ideas = generateMockIdeas(textPrompt.trim());
      onIdeasGenerated(ideas);
      setTextPrompt('');
      setIsLoading(false);
      Alert.alert('Ideas Generated!', 'Fresh creative ideas based on your prompt.');
    }, 1500);
  };

  const handleImageUpload = () => {
    Alert.alert('Coming Soon', 'Image upload functionality will be available soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputCard}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.buttonContainer} onPress={handleImageUpload}>
            <LinearGradient
              colors={['#FF6B9D', '#F9C23C']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>📷 Upload Image</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.buttonContainer} 
            onPress={() => setShowTextInput(!showTextInput)}
          >
            <LinearGradient
              colors={['#4ECDC4', '#3B82F6']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>✏️ Text Prompt</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {showTextInput && (
          <View style={styles.textInputSection}>
            <TextInput
              style={styles.textInput}
              value={textPrompt}
              onChangeText={setTextPrompt}
              placeholder=\"Describe your inspiration or what you're looking for...\"
              placeholderTextColor=\"#999\"
              multiline
              numberOfLines={4}
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={[styles.generateButton, { opacity: (!textPrompt.trim() || isLoading) ? 0.5 : 1 }]}
              onPress={handleGenerateFromText}
              disabled={!textPrompt.trim() || isLoading}
            >
              <LinearGradient
                colors={['#F59E0B', '#FF6B6B']}
                style={styles.generateButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.generateButtonText}>
                  {isLoading ? '✨ Generating...' : '✨ Generate Ideas'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  textInputSection: {
    marginTop: 16,
    gap: 12,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});