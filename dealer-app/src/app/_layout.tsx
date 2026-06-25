import { Stack, router } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, StyleSheet, Pressable, TouchableOpacity, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { BriefcaseBusiness, X } from 'lucide-react-native';
import Animated, { SlideInDown, SlideOutUp } from 'react-native-reanimated';

const ScrollbarStyle = () => {
  if (Platform.OS !== 'web') return null;
  return (
    <style dangerouslySetInnerHTML={{__html: `
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.3);
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.5);
      }
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
      }
    `}} />
  );
};

function InAppNotificationBanner() {
  const [activeBanner, setActiveBanner] = useState<any | null>(null);

  useEffect(() => {
    // 1. Foreground listener: displays the banner inside the app in real time
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      
      // Update state to render the floating drop-down banner
      setActiveBanner({ title, body, data });
      
      // Auto-dismiss after 6 seconds
      const timer = setTimeout(() => {
        setActiveBanner(null);
      }, 6000);
      
      return () => clearTimeout(timer);
    });

    // 2. Clicked/Tapped listener: handles user clicks on native notifications
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      setActiveBanner(null);
      try {
        router.replace('/(tabs)/new-leads');
      } catch (err) {
        console.warn("Navigation from notification click failed:", err);
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  if (!activeBanner) return null;

  return (
    <Animated.View 
      entering={SlideInDown.springify()} 
      exiting={SlideOutUp}
      style={styles.bannerContainer}
    >
      <Pressable 
        style={styles.bannerPressable}
        onPress={() => {
          setActiveBanner(null);
          try {
            router.replace('/(tabs)/new-leads');
          } catch (e) {
            console.warn(e);
          }
        }}
      >
        <View style={styles.bannerIconContainer}>
          <BriefcaseBusiness size={20} color="#fff" />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {activeBanner.title || "New Lead Nearby!"}
          </Text>
          <Text style={styles.bannerBody} numberOfLines={2}>
            {activeBanner.body || "Click to view details."}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.bannerCloseButton}
          onPress={(e) => {
            e.stopPropagation();
            setActiveBanner(null);
          }}
        >
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
          flex: 1, 
          width: '100%', 
          maxWidth: Platform.OS === 'web' ? 450 : '100%', 
          alignSelf: 'center', 
          backgroundColor: Colors.background,
          position: 'relative'
        }}>
          <StatusBar style="light" />
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
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  bannerPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  bannerBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
  },
  bannerCloseButton: {
    padding: 6,
  }
});
