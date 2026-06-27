import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { InputField } from '../../components/ui/InputField';
import { Button } from '../../components/ui/Button';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { Card } from '../../components/ui/Card';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming, FadeIn } from 'react-native-reanimated';

export default function LoginScreen() {
  const [dealerId, setDealerId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();
  const router = useRouter();

  // Entrance animations
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const logoScale = useSharedValue(0.5);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12 });
    formOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    formTranslateY.value = withDelay(300, withSpring(0, { damping: 15 }));
  }, []);

  const animatedFormStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn(dealerId, phoneNumber, rememberMe);
      // Let the animation play for a few seconds so the user can see the Lottie overlay
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <Animated.View style={[styles.header, animatedLogoStyle]}>
            <View style={styles.logoCircleWrapper}>
              <ShieldCheck size={48} color={Colors.primary} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.titleVendor}>VENDOR</Text>
              <Text style={styles.title99}>99</Text>
            </View>
            <Text style={styles.subtitle}>DEALER PORTAL</Text>
          </Animated.View>

          <Animated.View style={animatedFormStyle}>
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.instructionText}>Login to manage your leads</Text>

              <InputField
                label="Dealer ID"
                placeholder="Enter your Dealer ID"
                value={dealerId}
                onChangeText={setDealerId}
                autoCapitalize="characters"
              />

              <InputField
                label="Phone Number"
                placeholder="Enter your registered phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <View style={styles.row}>
                <TouchableOpacity 
                  style={styles.checkboxContainer} 
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Remember me</Text>
                </TouchableOpacity>


              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                title="Log In"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay when signing in */}
      {loading && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.loadingOverlay}>
          <View style={styles.overlayLoaderWrapper}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={styles.loadingText}>Authenticating...</Text>
        </Animated.View>
      )}
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircleWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleVendor: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 1,
  },
  title99: {
    fontSize: 28,
    fontWeight: '900',
    color: '#EF4444', // Premium Red color
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  formCard: {
    padding: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  checkboxLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPassword: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayLoaderWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
});
