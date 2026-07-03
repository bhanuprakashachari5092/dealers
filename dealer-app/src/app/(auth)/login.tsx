import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Keyboard, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { InputField } from '../../components/ui/InputField';
import { Button } from '../../components/ui/Button';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { Card } from '../../components/ui/Card';
import { LuxuryLoader } from '../../components/ui/LuxuryLoader';

export default function LoginScreen() {
  const [dealerId, setDealerId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!dealerId || !phoneNumber) {
      setError('Enter Dealer ID and Phone Number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(dealerId, phoneNumber, rememberMe);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/vendor99-logo.png')}
            style={styles.brandLogo}
            resizeMode="cover"
          />
          <Text style={styles.subtitle}>DEALER PORTAL</Text>
        </View>

        <Card variant="elevated" style={styles.formCard}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.instructionText}>Login to manage your leads</Text>

          <InputField
            label="Dealer ID"
            placeholder="Dealer ID"
            value={dealerId}
            onChangeText={setDealerId}
            autoCapitalize="characters"
          />

          <InputField
            label="Phone Number"
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
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
          />
        </Card>

        {/* Massive spacer for keyboard safety */}
        <View style={{ height: 400 }} />
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <LuxuryLoader text="Authenticating..." />
        </View>
      )}
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  brandLogo: {
    width: 280,
    height: 80,
    marginBottom: 10,
    borderRadius: 40,
    overflow: 'hidden',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  formCard: {
    padding: 24,
    marginHorizontal: 4,
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
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#0B0E14',
    borderRadius: 2,
  },
  checkboxLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 14, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.text,
    fontWeight: '600',
  },
});
