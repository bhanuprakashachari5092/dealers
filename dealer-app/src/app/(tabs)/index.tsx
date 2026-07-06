import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api, DealerStats } from '../../services/api';
import { Colors, Gradients } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, CheckCircle, TrendingUp, Calendar, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { Sparkline } from '../../components/ui/Sparkline';

const { width } = Dimensions.get('window');

function AnimatedNumber({ value, style }: { value: number; style?: any }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1200;
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
  
  // Dummy data for sparkline trend (e.g., leads over last 7 days)
  const trendData = [12, 15, 10, 24, 18, 30, 25];

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
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.welcome}>Control Room Overview</Text>
          <Text style={styles.name}>{user?.name || 'Dealer'} <Text style={{ color: Colors.primary }}>•</Text></Text>
        </Animated.View>

        {/* Highlight Card with Sparkline */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.highlightCardContainer}>
          <Card variant="elevated" style={styles.highlightCard}>
            <View style={styles.highlightHeader}>
              <View>
                <Text style={styles.statLabelLight}>Total Assigned Leads</Text>
                <View style={styles.valueRow}>
                  <AnimatedNumber value={stats?.totalLeads || 0} style={styles.highlightValue} />
                  <View style={styles.growthBadge}>
                    <TrendingUp size={14} color={Colors.success} />
                    <Text style={styles.growthText}>+12%</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <TrendingUp size={28} color={Colors.primary} />
              </View>
            </View>
            
            <View style={styles.sparklineContainer}>
              <Sparkline data={trendData} width={width - 72} height={60} color={Colors.primary} />
            </View>
          </Card>
        </Animated.View>

        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.statCardContainer}>
            <Card variant="elevated" style={styles.statCard}>
              <View style={[styles.iconContainerSmall, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                <Users size={20} color={Colors.cyan} />
              </View>
              <AnimatedNumber value={stats?.newLeads || 0} style={styles.statValue} />
              <Text style={styles.statLabel}>New Leads</Text>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.statCardContainer}>
            <Card variant="elevated" style={styles.statCard}>
              <View style={[styles.iconContainerSmall, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <CheckCircle size={20} color={Colors.success} />
              </View>
              <AnimatedNumber value={stats?.acceptedLeads || 0} style={styles.statValue} />
              <Text style={styles.statLabel}>Accepted</Text>
            </Card>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(800)}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <View style={styles.bannerContent}>
              <View>
                <Text style={styles.bannerTitle}>SYSTEM OPTIMIZED</Text>
                <Text style={styles.bannerText}>Your response time is in the top 10% of dealers.</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  welcome: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  highlightCardContainer: {
    marginBottom: 16,
  },
  highlightCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  highlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  highlightValue: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
    marginRight: 12,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  statLabelLight: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sparklineContainer: {
    marginTop: 10,
    height: 60,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCardContainer: {
    width: '48%',
  },
  statCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  banner: {
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  bannerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: '100%',
  },
});
