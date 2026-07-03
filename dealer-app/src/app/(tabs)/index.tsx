import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api, DealerStats } from '../../services/api';
import { Colors, Gradients } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, CheckCircle, TrendingUp, Calendar } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

function AnimatedNumber({ value, style }: { value: number; style?: any }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.floor(easeProgress * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <Text style={style}>{displayValue}</Text>;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DealerStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = api.subscribeStats(user.id, (data) => {
      setStats(data);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      const data = await api.getStats(user.id);
      setStats(data);
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  };

  return (
    <AnimatedBackground>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name || 'Dealer'}</Text>
        </Animated.View>

        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.statCardContainer}>
            <Card variant="elevated" style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <TrendingUp size={24} color={Colors.primary} />
              </View>
              <AnimatedNumber value={stats?.totalLeads || 0} style={styles.statValue} />
              <Text style={styles.statLabel}>Total Leads</Text>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.statCardContainer}>
            <Card variant="elevated" style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Users size={24} color={Colors.success} />
              </View>
              <AnimatedNumber value={stats?.newLeads || 0} style={styles.statValue} />
              <Text style={styles.statLabel}>New Leads</Text>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.statCardContainer}>
            <Card variant="elevated" style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <CheckCircle size={24} color={Colors.warning} />
              </View>
              <AnimatedNumber value={stats?.acceptedLeads || 0} style={styles.statValue} />
              <Text style={styles.statLabel}>Accepted Leads</Text>
            </Card>
          </Animated.View>


        </View>

        <Animated.View entering={FadeInUp.delay(600).duration(800)}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.banner}
          >
            <Text style={styles.bannerTitle}>Boost Your Sales!</Text>
            <Text style={styles.bannerText}>Upgrade your subscription to get premium leads directly in your area.</Text>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  welcome: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statCardContainer: {
    width: '48%',
    marginBottom: 16,
  },
  statCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(25, 28, 36, 0.85)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  statValueExpiry: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    marginTop: 10,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  banner: {
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  bannerTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  bannerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
});
