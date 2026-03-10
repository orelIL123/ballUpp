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

const PHONE_EMAIL_DOMAIN = 'phone.footchibol.app';

/** Convert phone to a unique email for Firebase Auth (no SMS). */
export function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized =
    digits.length === 9 && /^[2-9]/.test(digits)
      ? `972${digits}`
      : digits.length === 10 && digits.startsWith('0')
        ? `972${digits.slice(1)}`
        : digits.startsWith('972')
          ? digits
          : digits;
  return `${normalized}@${PHONE_EMAIL_DOMAIN}`;
}

/** Sign in with phone number and password (phone is converted to email internally). */
export async function loginWithPhoneAndPassword(phone: string, password: string): Promise<User> {
  assertFirebaseConfigured();
  const email = phoneToEmail(phone);
  const credentials = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return credentials.user;
}

/** Register with display name, phone and password. Redirect to onboarding after. */
export async function registerWithPhoneAndPassword(
  displayName: string,
  phone: string,
  password: string,
): Promise<User> {
  assertFirebaseConfigured();
  const email = phoneToEmail(phone);
  const credentials = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
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
