import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { usePreciseLocation } from '../hooks/usePreciseLocation';

// EXTREMELY SAFE Notification handling for Expo Go SDK 53+
let Notifications: any = null;
if (Constants.appOwnership !== 'expo' && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e) {
    // Silent fail
  }
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications || Constants.appOwnership === 'expo' || Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (e) {
    return null;
  }
}

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

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('auth_token');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (e) {
        // Silent recovery - remove console.warn to hide yellow box
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, []);

  useEffect(() => {
    if (user?.id) {
      registerForPushNotificationsAsync().then(async (token) => {
        if (token) {
          try {
            const dealerRef = doc(db, 'dealers', user.id);
            await updateDoc(dealerRef, { pushToken: token });
          } catch (err) {}
        }
      });
    }
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

      try {
        await AsyncStorage.setItem('auth_token', 'firebase_auth_token_active');
        if (rememberMe) {
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (storageErr) {
        // Silent recovery
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
