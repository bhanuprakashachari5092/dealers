import { Stack, router } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, StyleSheet, Pressable, TouchableOpacity, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { BriefcaseBusiness, X } from 'lucide-react-native';
import Animated, { SlideInDown, SlideOutUp } from 'react-native-reanimated';

// Safely require Notifee outside of component tree for foreground service registration
if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
  try {
    const notifee = require('@notifee/react-native').default;
    notifee.registerForegroundService((notification: any) => {
      return new Promise(() => {
        // Keep the service running
      });
    });
  } catch (e) {
    // Ignore if notifee is not linked
  }
}

const ScrollbarStyle = () => {
  if (Platform.OS !== 'web') return null;
  return (
    <style dangerouslySetInnerHTML={{__html: `
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.5); }
      * { scrollbar-width: thin; scrollbar-color: rgba(156, 163, 175, 0.3) transparent; }
    `}} />
  );
};

type BannerData = {
  title: string;
  body: string;
  data?: any;
};

function InAppNotificationBanner() {
  const [activeBanner, setActiveBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    // Only load notifications if NOT in Expo Go (to prevent crash in SDK 53+)
    if (Constants.appOwnership === 'expo' || Platform.OS === 'web') return;

    let Notifications: any = null;
    try {
      Notifications = require('expo-notifications');
    } catch (e) {
      return;
    }

    if (!Notifications) return;

    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
      const { title, body, data } = notification.request.content;
      setActiveBanner({ title, body, data });
      const timer = setTimeout(() => setActiveBanner(null), 6000);
      return () => clearTimeout(timer);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
      setActiveBanner(null);
      try {
        router.replace('/(tabs)/new-leads');
      } catch (err) {}
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  if (!activeBanner) return null;

  return (
    <Animated.View entering={SlideInDown.springify()} exiting={SlideOutUp} style={styles.bannerContainer}>
      <Pressable 
        style={styles.bannerPressable}
        onPress={() => {
          setActiveBanner(null);
          try { router.replace('/(tabs)/new-leads'); } catch (e) {}
        }}
      >
        <View style={styles.bannerIconContainer}>
          <BriefcaseBusiness size={20} color="#fff" />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle} numberOfLines={1}>{activeBanner.title || "New Lead Nearby!"}</Text>
          <Text style={styles.bannerBody} numberOfLines={2}>{activeBanner.body || "Click to view details."}</Text>
        </View>
        <TouchableOpacity style={styles.bannerCloseButton} onPress={(e) => { e.stopPropagation(); setActiveBanner(null); }}>
          <X size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ScrollbarStyle />
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ 
          flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 450 : '100%',
          alignSelf: 'center', backgroundColor: Colors.background, position: 'relative'
        }}>
          <StatusBar style="auto" />
          <InAppNotificationBanner />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 16, right: 16,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, zIndex: 9999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10,
    elevation: 8, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  bannerPressable: { flexDirection: 'row', alignItems: 'center' },
  bannerIconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  bannerTextContainer: { flex: 1, paddingRight: 8 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  bannerBody: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', lineHeight: 16 },
  bannerCloseButton: { padding: 6 }
});
