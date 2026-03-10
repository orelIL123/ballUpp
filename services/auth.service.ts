import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { firebaseConfigError, getFirebaseAuth, isFirebaseConfigured } from '@/services/firebase';

function assertFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(firebaseConfigError ?? 'Firebase is not configured.');
  }
}

export function observeAuthState(listener: (user: User | null) => void) {
  if (!isFirebaseConfigured) {
    listener(null);
    return () => undefined;
  }

  return onAuthStateChanged(getFirebaseAuth(), listener);
}

export async function loginWithEmail(email: string, password: string) {
  assertFirebaseConfigured();
  const credentials = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  return credentials.user;
}

export async function registerWithEmail(email: string, password: string) {
  assertFirebaseConfigured();
  const credentials = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  return credentials.user;
}

export async function logout() {
  if (!isFirebaseConfigured) {
    return;
  }

  await signOut(getFirebaseAuth());
}

export async function getCurrentAuthToken() {
  if (!isFirebaseConfigured) {
    return null;
  }

  const currentUser = getFirebaseAuth().currentUser;

  if (!currentUser) {
    return null;
  }

  return currentUser.getIdToken();
}
