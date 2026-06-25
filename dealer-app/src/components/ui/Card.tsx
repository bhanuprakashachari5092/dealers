import React from 'react';
import { StyleSheet, ViewProps, Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({ children, style, variant = 'default', onPress, ...props }: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const CardContent = (
    <BlurView intensity={60} tint="light" style={[styles.card, variant === 'elevated' && styles.elevated, style as any]}>
      {children}
    </BlurView>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
        {...(props as any)}
      >
        {CardContent}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={animatedStyle} {...props}>
      {CardContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24, // Softer, more modern corners
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  elevated: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
});
