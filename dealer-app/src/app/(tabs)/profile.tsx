import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { User, MapPin, Building, Mail, LogOut, Phone, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <AnimatedBackground>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={16} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.name}>{user?.name || 'Dealer Name'}</Text>
          <Text style={styles.role}>Vendor99 Premium Dealer</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          <Card variant="elevated" style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconBg}>
                <Building size={20} color={Colors.primary} />
              </View>
              <View style={styles.rowData}>
                <Text style={styles.rowLabel}>Company Name</Text>
                <Text style={styles.rowValue}>{user?.company || 'Not specified'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.iconBg}>
                <Mail size={20} color={Colors.primary} />
              </View>
              <View style={styles.rowData}>
                <Text style={styles.rowLabel}>Email Address</Text>
                <Text style={styles.rowValue}>{user?.email || 'vendor@example.com'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.iconBg}>
                <Phone size={20} color={Colors.primary} />
              </View>
              <View style={styles.rowData}>
                <Text style={styles.rowLabel}>Phone Number</Text>
                <Text style={styles.rowValue}>{user?.phone || 'Not specified'}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Service Areas</Text>
          <Card variant="elevated" style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <MapPin size={20} color={Colors.success} />
              </View>
              <View style={styles.rowData}>
                <Text style={styles.rowLabel}>Active Regions</Text>
                <Text style={styles.rowValue}>{user?.regions || 'Not specified'}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.footer}>
          <Button 
            title="Log Out Securely" 
            variant="danger" 
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </Animated.View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 36,
    fontWeight: '900',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.success,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F8FAFC',
  },
  name: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  role: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowData: {
    marginLeft: 16,
    flex: 1,
  },
  rowLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 2,
    fontWeight: '500',
  },
  rowValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.8)',
    marginLeft: 64,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  logoutButton: {
    paddingVertical: 16, // Extra padding as requested
  },
});
