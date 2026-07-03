import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC8yfL_9YR9ZvfO9ID6MKfn3eqCpZdhy-8",
  authDomain: "homequik-clone.firebaseapp.com",
  projectId: "homequik-clone",
  storageBucket: "homequik-clone.firebasestorage.app",
  messagingSenderId: "956042980288",
  appId: "1:956042980288:web:df5c2ef1a53848b3f03625"
};

const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Initialize Auth with persistence for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  // If already initialized, get existing auth instance
  auth = getAuth(app);
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };

export default app;
