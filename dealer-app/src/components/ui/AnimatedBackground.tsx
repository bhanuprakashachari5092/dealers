import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  withRepeat,
  withDelay
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function AnimatedBackground({ children }: { children?: React.ReactNode }) {
  // Shared values for the floating orbs
  const orb1Scale = useSharedValue(0.8);
  const orb1TranslateY = useSharedValue(0);
  
  const orb2Scale = useSharedValue(0.8);
  const orb2TranslateY = useSharedValue(0);

  useEffect(() => {
    // Orb 1 Animation (Top Right)
    orb1Scale.value = withRepeat(
      withTiming(1.4, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orb1TranslateY.value = withRepeat(
      withTiming(40, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Orb 2 Animation (Bottom Left)
    orb2Scale.value = withRepeat(
      withDelay(2000, withTiming(1.5, { duration: 7000, easing: Easing.inOut(Easing.sin) })),
      -1,
      true
    );
    orb2TranslateY.value = withRepeat(
      withDelay(1000, withTiming(-50, { duration: 6000, easing: Easing.inOut(Easing.sin) })),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { scale: orb1Scale.value },
      { translateY: orb1TranslateY.value }
    ],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { scale: orb2Scale.value },
      { translateY: orb2TranslateY.value }
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Base Solid Background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.background }]} />
      
      {/* Abstract Animated Orbs */}
      <AnimatedLinearGradient
        colors={[Colors.primary, 'transparent']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={[styles.orb1, orb1Style]}
        pointerEvents="none"
      />

      <AnimatedLinearGradient
        colors={['rgba(16, 185, 129, 0.4)', 'transparent']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0, y: 0 }}
        style={[styles.orb2, orb2Style]}
        pointerEvents="none"
      />
      
      {/* Overlay gradient to smooth out the orbs */}
      <LinearGradient
        colors={['rgba(25, 28, 36, 0.4)', 'rgba(25, 28, 36, 0.95)']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    zIndex: 10, // keep content above orbs
  },
  orb1: {
    position: 'absolute',
    top: -width * 0.2,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    opacity: 0.15,
  },
  orb2: {
    position: 'absolute',
    bottom: -width * 0.1,
    left: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    opacity: 0.12,
  },
});
