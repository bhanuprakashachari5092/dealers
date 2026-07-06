import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { usePreciseLocation } from '../hooks/usePreciseLocation';

// Dynamically import Notifications to prevent crash in Expo Go SDK 53+
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {}

type User = {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  regions: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (dealerId: string, phoneNumber: string, rememberMe: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const notifiedLeads = useRef<Set<string>>(new Set());

  // Setup Notification Channel (Professional Level)
  useEffect(() => {
    if (Platform.OS === 'android' && Notifications) {
      Notifications.setNotificationChannelAsync('new-leads-pro', {
        name: 'New Lead Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default', // You can use a custom sound file here later
      });
    }
  }, []);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('auth_token');
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, []);

  // Professional Lead Monitor - Background Listener
  useEffect(() => {
    if (!user?.id) return;

    // Listen for leads assigned to this dealer that are still "New"
    const q = query(
      collection(db, "bookings"),
      where("eligibleDealers", "array-contains", user.id.trim())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        const leadId = change.doc.id;

        // Trigger only for NEW leads that haven't been notified yet and are not accepted
        if (
          (change.type === "added" || change.type === "modified") &&
          (!data.dealerId || data.dealerId === "") &&
          !notifiedLeads.current.has(leadId)
        ) {

          // Professional Local Notification Trigger
          if (Notifications && Platform.OS !== 'web') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "🚨 New Lead Received!",
                body: `Customer ${data.customerName || 'Nearby'} needs ${data.serviceName || 'Service'} in ${data.customerAddress || 'your area'}.`,
                data: { leadId, screen: 'new-leads' },
                sound: true,
                priority: 'max',
              },
              trigger: null, // Immediate
            });

            notifiedLeads.current.add(leadId);
          }
        } else if (data.dealerId && data.dealerId !== "") {
          // If lead is accepted, remove from notified set to keep memory clean
          notifiedLeads.current.delete(leadId);
        }
      });
    });

    return () => unsubscribe();
  }, [user?.id]);

  usePreciseLocation(user?.id || undefined);

  const signIn = async (dealerId: string, phoneNumber: string, rememberMe: boolean) => {
    try {
      const dealerDocRef = doc(db, 'dealers', dealerId.trim());
      const dealerDocSnap = await getDoc(dealerDocRef);

      if (!dealerDocSnap.exists()) {
        throw new Error('Dealer ID not found.');
      }

      const dealerData = dealerDocSnap.data();
      const dbPhone = dealerData.phone || '';
      const normalize = (num: string) => num.replace(/\D/g, '').slice(-10);

      if (normalize(dbPhone) !== normalize(phoneNumber)) {
        throw new Error('Incorrect phone number.');
      }

      const userData: User = {
        id: dealerDocSnap.id,
        name: dealerData.ownerName || dealerData.businessName || 'Dealer Agent',
        email: dealerData.email || 'dealer@vendor99.com',
        company: dealerData.businessName || 'Vendor99 Dealer',
        phone: dbPhone,
        regions: dealerData.city || 'Hyderabad'
      };

      setUser(userData);
      await AsyncStorage.setItem('auth_token', 'firebase_auth_token_active');
      if (rememberMe) {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('auth_token');
    } catch (e) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
