import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors, Gradients } from '../../constants/Colors';
import { InputField } from '../../components/ui/InputField';
import { Button } from '../../components/ui/Button';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { Card } from '../../components/ui/Card';
import { LuxuryLoader } from '../../components/ui/LuxuryLoader';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, FadeIn, FadeOut } from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';

const SuccessCheckOverlay = () => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.successOverlayInner, style]}>
      <View style={styles.successCheckCircle}>
        <CheckCircle2 size={64} color={Colors.success} />
      </View>
      <Text style={styles.successOverlayText}>Access Granted</Text>
    </Animated.View>
  );
};

export default function LoginScreen() {
  const [dealerId, setDealerId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loginState, setLoginState] = useState<'idle' | 'loading' | 'success'>('idle');

  const { signIn } = useAuth();
  const router = useRouter();

  // Checkbox animation
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withSpring(rememberMe ? 1 : 0.5, { damping: 15, stiffness: 300 });
    checkOpacity.value = withTiming(rememberMe ? 1 : 0, { duration: 150 });
  }, [rememberMe]);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!dealerId || !phoneNumber) {
      setError('Enter Dealer ID and Phone Number');
      return;
    }
    setError('');
    setLoginState('loading');
    
    try {
      await signIn(dealerId, phoneNumber, rememberMe);
      setLoginState('success');
      
      // Allow the beautiful success animation to play before routing
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoginState('idle');
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <View style={styles.header}>
            <Text style={styles.vendorTitle}>
              <Text style={{ color: Colors.white }}>VENDOR</Text>
              <Text style={{ color: Colors.error }}>99</Text>
            </Text>
            <Text style={styles.subtitle}>DEALER PORTAL</Text>
          </View>

          <Card variant="elevated" style={styles.formCard}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.instructionText}>Login to manage your leads</Text>

            <InputField
              label="Dealer ID"
              placeholder="Enter your ID"
              value={dealerId}
              onChangeText={setDealerId}
              autoCapitalize="characters"
              editable={loginState === 'idle'}
            />

            <InputField
              label="Phone Number"
              placeholder="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={loginState === 'idle'}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
                disabled={loginState !== 'idle'}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  <Animated.View style={[styles.checkboxInner, animatedCheckStyle]} />
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title="Log In"
              onPress={handleLogin}
              loading={loginState === 'loading'}
              disabled={loginState !== 'idle'}
              style={{ marginTop: 8 }}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {loginState !== 'idle' && (
        <Animated.View 
          entering={FadeIn.duration(400)} 
          exiting={FadeOut.duration(300)} 
          style={styles.loadingOverlay}
        >
          {loginState === 'loading' ? (
            <LuxuryLoader text="Authenticating..." />
          ) : (
            <SuccessCheckOverlay />
          )}
        </Animated.View>
      )}
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  vendorTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 8,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  formCard: {
    padding: 24,
    marginHorizontal: 4,
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: Colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  checkboxLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 14, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successOverlayInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheckCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successOverlayText: {
    color: Colors.success,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
