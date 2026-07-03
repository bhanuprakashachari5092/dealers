import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface LuxuryLoaderProps {
  text?: string;
}

export function LuxuryLoader({ text = 'Authenticating...' }: LuxuryLoaderProps) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const animatedPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
      opacity: 1.5 - pulse.value,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.loaderWrapper}>
        <Animated.View style={[styles.glowRing, animatedPulseStyle]}>
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.4)', 'rgba(212, 175, 55, 0)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        <Animated.View style={[styles.spinningRing, animatedRingStyle]}>
           <LinearGradient
            colors={['#D4AF37', '#F3E5AB', 'transparent', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <View style={styles.innerCircle}>
          <Text style={styles.logoV}>V</Text>
        </View>
      </View>
      
      {text ? <Text style={styles.loadingText}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  spinningRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  innerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0B0E14',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  logoV: {
    color: '#D4AF37',
    fontSize: 40,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 24,
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
