import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

type Idea = {
  id: string;
  title: string;
  description: string;
  source: 'text' | 'image';
  createdAt: string;
};

interface IdeaCardMobileProps {
  idea: Idea;
  position: 'top' | 'middle' | 'bottom';
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
}

const gradients = {
  top: ['#FF6B9D', '#F9C23C'],
  middle: ['#4ECDC4', '#10B981'],
  bottom: ['#3B82F6', '#EF4444'],
};

export default function IdeaCardMobile({
  idea,
  position,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
}: IdeaCardMobileProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  const isTopCard = position === 'top';

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (isTopCard) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onActive: (event) => {
      if (!isTopCard) return;
      
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = event.translationX * 0.1;
      scale.value = 1 - Math.abs(event.translationX) * 0.0005;
    },
    onEnd: (event) => {
      if (!isTopCard) return;

      const { translationX, translationY, velocityX, velocityY } = event;
      
      // Determine swipe direction based on distance and velocity
      const swipeThreshold = 80;
      const velocityThreshold = 800;
      
      const isHorizontalSwipe = Math.abs(translationX) > Math.abs(translationY);
      
      if (isHorizontalSwipe) {
        if (translationX > swipeThreshold || velocityX > velocityThreshold) {
          // Swipe right - save
          translateX.value = withSpring(screenWidth + 100);
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
          runOnJS(onSwipeRight)();
          return;
        } else if (translationX < -swipeThreshold || velocityX < -velocityThreshold) {
          // Swipe left - dismiss
          translateX.value = withSpring(-screenWidth - 100);
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
          runOnJS(onSwipeLeft)();
          return;
        }
      } else {
        if (translationY < -swipeThreshold || velocityY < -velocityThreshold) {
          // Swipe up - explore
          translateY.value = withSpring(-screenWidth - 100);
          scale.value = withSpring(0.6);
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
          runOnJS(onSwipeUp)();
          return;
        }
      }
      
      // Snap back to center
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      rotate.value = withSpring(0);
      scale.value = withSpring(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const cardNumber = position === 'top' ? 1 : position === 'middle' ? 2 : 3;
  const zIndex = position === 'top' ? 3 : position === 'middle' ? 2 : 1;
  const cardScale = position === 'top' ? 1 : position === 'middle' ? 0.95 : 0.9;
  const marginTop = position === 'top' ? 0 : position === 'middle' ? -180 : -160;

  return (
    <PanGestureHandler onGestureEvent={gestureHandler} enabled={isTopCard}>
      <Animated.View
        style={[
          styles.card,
          {
            zIndex,
            transform: [{ scale: cardScale }],
            marginTop,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={gradients[position]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNumber}>Idea #{cardNumber}</Text>
            </View>
            <View style={styles.dots}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { opacity: i === cardNumber ? 1 : 0.6 },
                  ]}
                />
              ))}
            </View>
          </View>
          
          <Text style={styles.title}>{idea.title}</Text>
          <Text style={styles.description} numberOfLines={4}>
            {idea.description}
          </Text>
          
          {isTopCard && (
            <View style={styles.indicators}>
              <Text style={styles.indicator}>← Dismiss</Text>
              <Text style={styles.indicator}>↑ Explore</Text>
              <Text style={styles.indicator}>→ Save</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: screenWidth - 40,
    height: 200,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  cardNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  indicator: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
});