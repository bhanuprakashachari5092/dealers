import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Colors } from '../../constants/Colors';
import { LayoutDashboard, Users, Briefcase, Bell, User } from 'lucide-react-native';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomWidth: 1,
          borderBottomColor: Colors.cardBorder,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: Colors.primary, // Hamburger icon color
        headerTitleStyle: {
          fontWeight: '800',
          color: Colors.text,
        },
        drawerStyle: {
          backgroundColor: Colors.background,
          width: 280,
        },
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerLabelStyle: {
          fontWeight: '600',
        },
        drawerActiveBackgroundColor: 'rgba(212, 175, 55, 0.1)',
      }}>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Dashboard',
          title: 'Overview',
          drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="new-leads"
        options={{
          drawerLabel: 'New Leads',
          title: 'New Leads',
          drawerIcon: ({ color, size }) => <Users size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="my-leads"
        options={{
          drawerLabel: 'My Leads',
          title: 'My Leads',
          drawerIcon: ({ color, size }) => <Briefcase size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          drawerLabel: 'Alerts',
          title: 'Alerts',
          drawerIcon: ({ color, size }) => <Bell size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Profile',
          title: 'Profile',
          drawerIcon: ({ color, size }) => <User size={size} color={color} />
        }}
      />
    </Drawer>
  );
}
