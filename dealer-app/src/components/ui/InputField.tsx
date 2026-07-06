import React, { memo, useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

export const InputField = memo(({ label, error, isPassword, style, value, onChangeText, placeholder, ...props }: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animations
  const focusBorderColor = useSharedValue(Colors.border);
  const glowOpacity = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (error) {
      // Shake animation (150ms, 2 cycles = 4 movements)
      translateX.value = withSequence(
        withTiming(-5, { duration: 37 }),
        withTiming(5, { duration: 75 }),
        withTiming(-5, { duration: 75 }),
        withTiming(5, { duration: 75 }),
        withTiming(0, { duration: 37 })
      );
      focusBorderColor.value = withTiming(Colors.error);
      glowOpacity.value = withTiming(0);
    } else {
      focusBorderColor.value = withTiming(isFocused ? Colors.primary : Colors.border);
      glowOpacity.value = withTiming(isFocused ? 1 : 0);
    }
  }, [error, isFocused]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: focusBorderColor.value,
    transform: [{ translateX: translateX.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      
      <Animated.View style={[styles.inputContainer, animatedContainerStyle]}>
        {/* Glow behind border */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.glowEffect, animatedGlowStyle]} pointerEvents="none" />
        
        <TextInput
          style={[styles.input, style]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
          underlineColorAndroid="transparent"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff size={20} color={Colors.textSecondary} />
            ) : (
              <Eye size={20} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    overflow: 'visible',
  },
  glowEffect: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    height: '100%',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});
