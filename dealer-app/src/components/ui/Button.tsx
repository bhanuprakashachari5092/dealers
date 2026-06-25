import React from 'react';
import { Text, StyleSheet, ActivityIndicator, PressableProps, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface ButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ title, loading, variant = 'primary', style, disabled, onPress, ...props }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isOutline = variant === 'outline';

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const content = (
    <View style={[
      styles.buttonContent,
      isOutline && styles.outlineContent,
      isDanger && styles.dangerContent,
    ]}>
      {loading ? (
        <ActivityIndicator color={isOutline ? Colors.primary : Colors.white} />
      ) : (
        <Text style={[
          styles.text,
          isOutline && styles.textOutline,
        ]}>
          {title}
        </Text>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.container,
        disabled && styles.disabled,
        animatedStyle,
        style as any,
      ]}
      {...props}
    >
      {isPrimary ? (
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  gradient: {
    width: '100%',
  },
  buttonContent: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineContent: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 16,
  },
  dangerContent: {
    backgroundColor: Colors.error,
    borderRadius: 16,
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textOutline: {
    color: Colors.primary,
  },
});
