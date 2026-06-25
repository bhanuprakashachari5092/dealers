import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { usePreciseLocation } from '../hooks/usePreciseLocation';

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;
  if (Platform.OS === 'web') {
    return null;
  }
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: true,
        },
        android: {},
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.warn('Error getting expo push token, falling back without project ID:', e);
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (err2) {
        console.warn('Push token fetching failed completely', err2);
      }
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    Notifications.setNotificationChannelAsync('new-leads', {
      name: 'New Leads',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableVibrate: true,
      showBadge: true,
    });
  }

  return token;
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
    // Check if user is logged in
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
        console.error('Failed to restore session', e);
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
            console.log('Saved push token to Firestore:', token);
          } catch (err) {
            console.warn('Failed to save push token to Firestore', err);
          }
        }
      });
    }
  }, [user?.id]);

  // Watch dealer location continuously and update Firestore using precise GPS tracking
  usePreciseLocation(user?.id || undefined);

  const signIn = async (dealerId: string, phoneNumber: string, rememberMe: boolean) => {
    try {
      const dealerDocRef = doc(db, 'dealers', dealerId.trim());
      const dealerDocSnap = await getDoc(dealerDocRef);

      if (!dealerDocSnap.exists()) {
        throw new Error('Dealer ID not found. Please register as a dealer first.');
      }

      const dealerData = dealerDocSnap.data();
      const dbPhone = dealerData.phone || '';
      
      // Normalize both numbers: strip non-digits, compare last 10 digits
      const normalize = (num: string) => num.replace(/\D/g, '').slice(-10);

      if (normalize(dbPhone) !== normalize(phoneNumber)) {
        throw new Error('Incorrect phone number for this Dealer ID.');
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
      console.warn('Authentication failed:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('auth_token');
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
