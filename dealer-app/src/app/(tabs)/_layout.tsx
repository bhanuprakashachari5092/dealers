import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { LayoutDashboard, Users, Briefcase, Bell, User } from 'lucide-react-native';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const AnimatedTabIcon = ({ focused, IconProvider, label }: { focused: boolean, IconProvider: any, label: string }) => {
  const scale = useSharedValue(focused ? 1.1 : 1);
  const translateY = useSharedValue(focused ? -2 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 10, stiffness: 200 });
    translateY.value = withTiming(focused ? -2 : 0, { duration: 200 });
  }, [focused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <View style={styles.tabItemContainer}>
      <Animated.View style={[animatedIconStyle, focused && styles.activeIconWrapper]}>
        <IconProvider size={22} color={focused ? Colors.primary : Colors.textSecondary} />
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
        {label}
      </Text>
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
        tabBarShowLabel: false, // We render our own custom labels inside the icon component
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={styles.blurBackground} />
        ),
        tabBarItemStyle: {
          ...Platform.select({ web: { outline: 'none' } as any, default: {} }),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <AnimatedTabIcon focused={focused} IconProvider={LayoutDashboard} label="Home" />
        }}
      />
      <Tabs.Screen
        name="new-leads"
        options={{
          title: 'New Leads',
          tabBarIcon: ({ focused }) => <AnimatedTabIcon focused={focused} IconProvider={Users} label="New" />
        }}
      />
      <Tabs.Screen
        name="my-leads"
        options={{
          title: 'My Leads',
          tabBarIcon: ({ focused }) => <AnimatedTabIcon focused={focused} IconProvider={Briefcase} label="My Leads" />
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => <AnimatedTabIcon focused={focused} IconProvider={Bell} label="Alerts" />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <AnimatedTabIcon focused={focused} IconProvider={User} label="Profile" />
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.9)' : 'transparent', // Fallback for android if BlurView glitches
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    overflow: 'hidden',
    height: Platform.OS === 'ios' ? 78 : 64, // Slimmer height
    paddingBottom: Platform.OS === 'ios' ? 20 : 8, // Tighter padding
    paddingTop: 8,
    elevation: 0,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2, // Tighter gap between icon and label
  },
  activeIconWrapper: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10, // Slightly smaller text
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeTabLabel: {
    color: Colors.primary,
    fontWeight: '700',
  }
});
