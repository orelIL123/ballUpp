import { getApp, getApps, initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export { firebaseConfig };

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigError =
  missingConfig.length > 0
    ? `חסרים משתני Firebase: ${missingConfig.join(', ')}.`
    : null;

if (missingConfig.length > 0) {
  console.warn(`Firebase config is incomplete: ${missingConfig.join(', ')}`);
}

const app = firebaseConfigError
  ? null
  : getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

let authInstance: Auth | null = null;

type ReactNativeAuthModule = {
  initializeAuth: (appInstance: NonNullable<typeof app>, options: { persistence: unknown }) => Auth;
  getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
};

export const isFirebaseConfigured = !firebaseConfigError;

export function getFirebaseAuth() {
  if (!app) {
    throw new Error(firebaseConfigError ?? 'Firebase is not configured.');
  }

  if (authInstance) {
    return authInstance;
  }

  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
    return authInstance;
  }

  try {
    const { initializeAuth, getReactNativePersistence } = require('@firebase/auth') as ReactNativeAuthModule;
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    authInstance = getAuth(app);
  }

  return authInstance;
}

export function getFirestoreDb() {
  if (!app) {
    throw new Error(firebaseConfigError ?? 'Firebase is not configured.');
  }

  return getFirestore(app);
}

export function getFirebaseStorage() {
  if (!app) {
    throw new Error(firebaseConfigError ?? 'Firebase is not configured.');
  }

  return getStorage(app);
}
