import React, { useEffect, useState, useRef } from 'react';
import Constants from 'expo-constants';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Image, Switch, Platform } from 'react-native';
import { api, Lead } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { MapPin, Wrench, Clock, Navigation, Compass, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Audio } from 'expo-av';

// Pulsing location dot component
const LocationPing = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(2, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pingContainer}>
      <Animated.View style={[styles.pingCircle, animatedStyle]} />
      <View style={styles.pingDot} />
    </View>
  );
};

// Pulsing and rotating radar component for empty state
const RadarPulse = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2.2, { duration: 2500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.radarContainer}>
      <Animated.View style={[styles.radarCirclePulse, pulseStyle]} />
      <Animated.View style={[styles.radarCircle, rotateStyle]}>
        <Compass size={44} color={Colors.primary} />
      </Animated.View>
    </View>
  );
};

// Pulsing check animation for acceptance overlay
const SuccessCheck = () => {
  const scale = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withTiming(1.0, { duration: 400, easing: Easing.out(Easing.back(1.5)) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.successCheckWrapper, animatedStyle]}>
      <CheckCircle2 size={80} color={Colors.success} />
    </Animated.View>
  );
};

export default function NewLeadsScreen() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptedLeadIds, setAcceptedLeadIds] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const prevCount = useRef(0);

  const playRingingSound = async () => {
    try {
      if (sound) await sound.unloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=classic-phone-ringing-120536.mp3' },
        { shouldPlay: true, isLooping: true }
      );
      setSound(newSound);
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  };

  const stopRingingSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
      try {
        const Notifications = require('expo-notifications');
        Notifications.requestPermissionsAsync().catch(() => {});
      } catch (e) {
        // Notifications module not available in this environment
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || Constants.appOwnership === 'expo') return;
    const toggleForegroundService = async () => {
      try {
        const notifee = require('@notifee/react-native').default;
        const { AndroidImportance } = require('@notifee/react-native');
        
        if (alertsEnabled) {
          const channelId = await notifee.createChannel({
            id: 'leads-foreground',
            name: 'Leads Listener',
            importance: AndroidImportance.DEFAULT,
          });

          await notifee.displayNotification({
            title: 'Vendor99 is Active',
            body: 'Listening for new leads nearby...',
            android: {
              channelId,
              asForegroundService: true,
              color: '#D4AF37', // Gold color
            },
          });
        } else {
          await notifee.stopForegroundService();
        }
      } catch (e) {
        // Failed to toggle foreground service (likely not natively linked yet)
      }
    };
    
    toggleForegroundService();
  }, [alertsEnabled]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    const unsubscribe = api.subscribeToLeads('new', user.id, (data) => {
      const sortedLeads = data.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      
      if (alertsEnabled && sortedLeads.length > prevCount.current && prevCount.current !== 0) {
        if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
          try {
            const Notifications = require('expo-notifications');
            Notifications.scheduleNotificationAsync({
              content: {
                title: "New Lead Available! 🔔",
                body: "A new customer is looking for service nearby.",
                sound: true,
              },
              trigger: null,
            }).catch(() => {});
          } catch (e) {
            // Notifications module not available
          }
        }
        // Play continuous ringing sound
        playRingingSound();
      } else if (sortedLeads.length === 0) {
        // Stop ringing if no leads left
        stopRingingSound();
      }
      prevCount.current = sortedLeads.length;
      
      setLeads(sortedLeads);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.id, alertsEnabled]);

  const handleAccept = async (id: string) => {
    if (!user?.id) {
      Alert.alert('Authentication Error', 'You must be logged in to accept leads.');
      return;
    }
    stopRingingSound();
    setAcceptingId(id);
    try {
      const success = await api.acceptLead(id, user.id);
      if (success) {
        setAcceptedLeadIds(prev => [...prev, id]);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        
        // Delay removal from the list so the user can see the "Accepted" state
        setTimeout(() => {
          setLeads(prev => prev.filter(l => l.id !== id));
        }, 3000);
      }
    } catch (e) {
      Alert.alert('Lead Unavailable', 'Another dealer has already accepted this lead.');
      setLeads(prev => prev.filter(l => l.id !== id));
    } finally {
      setAcceptingId(null);
    }
  };

  const renderLead = ({ item, index }: { item: Lead; index: number }) => {
    const isAccepted = acceptedLeadIds.includes(item.id);
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 150).duration(500)}>
        <Card style={styles.card} variant="elevated">
          <View style={styles.cardHeader}>
            <View style={styles.customerInfo}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.customerName.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.customerName}>{item.customerName}</Text>
                <View style={styles.statusBadgeContainer}>
                  {!isAccepted && <LocationPing />}
                  <Text style={[styles.statusText, isAccepted && { color: Colors.primary }]}>
                    {isAccepted ? 'Assigned to You' : 'Searching for Dealer'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>Just now</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailBox}>
              <MapPin size={18} color={Colors.primary} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Area</Text>
              <Text style={styles.detailValue}>{item.area}</Text>
            </View>
            <View style={styles.detailBox}>
              <Navigation size={18} color={Colors.cyan} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailValue}>
                {item.dealerDistances && user?.id ? item.dealerDistances[user.id] || 'N/A' : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailBoxFull}>
              <Wrench size={18} color={Colors.success} style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Service Required</Text>
                <Text style={styles.detailValue}>{item.serviceRequired}</Text>
              </View>
            </View>
          </View>

          <Button
            title={isAccepted ? "Accepted" : "Accept Lead"}
            onPress={() => handleAccept(item.id)}
            loading={acceptingId === item.id && !isAccepted}
            disabled={isAccepted}
            style={[styles.acceptButton, isAccepted && { backgroundColor: Colors.success, borderColor: Colors.success }]}
          />
        </Card>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={styles.alertToggleContainer}>
        <Text style={styles.alertToggleText}>Ring on new lead (Alerts)</Text>
        <Switch 
          value={alertsEnabled} 
          onValueChange={setAlertsEnabled} 
          trackColor={{ false: Colors.textSecondary, true: Colors.primary }}
          thumbColor={Colors.white}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding nearby requests...</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={item => item.id}
          renderItem={renderLead}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <RadarPulse />
              <Text style={styles.emptyTitle}>No leads available right now.</Text>
              <Text style={styles.emptyText}>We're actively looking for nearby customer requests. You'll be notified immediately.</Text>
            </View>
          }
        />
      )}
      
      {showConfetti && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.overlayLottieWrapper}>
            <SuccessCheck />
          </View>
          <Text style={styles.loadingOverlayText}>Lead Accepted Successfully!</Text>
        </Animated.View>
      )}
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  alertToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(25, 28, 36, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  alertToggleText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  list: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 20,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
    marginLeft: 6,
  },
  timeBadge: {
    backgroundColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  detailBox: {
    width: '48%',
    marginBottom: 16,
  },
  detailBoxFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginBottom: 6,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
  },
  acceptButton: {
    marginTop: 4,
  },
  pingContainer: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    position: 'absolute',
  },
  pingCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    position: 'absolute',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    padding: 20,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 0,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
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
  overlayLottieWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  loadingOverlayText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  radarContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  radarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  radarCirclePulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    zIndex: 1,
  },
  successCheckWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
