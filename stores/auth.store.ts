import type { User } from 'firebase/auth';
import { create } from 'zustand';

import { observeAuthState } from '@/services/auth.service';
import { createDemoProfile, createGuestProfile } from '@/services/demo-data';
import { getPlayerProfile } from '@/services/players.service';
import type { Gender, PlayStyle, PlayerLevel, UserProfile } from '@/types/models';

type AuthStatus = 'loading' | 'authenticated' | 'signed_out';

type AuthState = {
  status: AuthStatus;
  firebaseUser: User | null;
  profile: UserProfile | null;
  error: string | null;
  isGuest: boolean;
  demoUserId: string | null;
  bootstrap: () => () => void;
  refreshProfile: (uid?: string) => Promise<UserProfile | null>;
  setError: (error: string | null) => void;
  loginAsGuest: () => void;
  createDemoAccount: (input: {
    displayName: string;
    city: string;
    level: PlayerLevel;
    gender: Gender;
    playStyle: PlayStyle;
  }) => void;
  logoutLocal: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  firebaseUser: null,
  profile: null,
  error: null,
  isGuest: false,
  demoUserId: null,
  bootstrap: () =>
    observeAuthState(async (user) => {
      if (!user) {
        set({
          status: 'signed_out',
          firebaseUser: null,
          profile: null,
          error: null,
          isGuest: false,
          demoUserId: null,
        });
        return;
      }

      const profile = await get().refreshProfile(user.uid);

      set({
        status: 'authenticated',
        firebaseUser: user,
        profile,
        error: null,
        isGuest: false,
        demoUserId: null,
      });
    }),
  refreshProfile: async (uid) => {
    const resolvedUid = uid ?? get().firebaseUser?.uid ?? get().demoUserId ?? (get().isGuest ? 'guest-user' : undefined);

    if (!resolvedUid) {
      set({ profile: null });
      return null;
    }

    try {
      const profile = await getPlayerProfile(resolvedUid);
      set({ profile });
      return profile;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'שגיאה בטעינת הפרופיל.',
      });
      return null;
    }
  },
  setError: (error) => set({ error }),
  loginAsGuest: () =>
    set({
      status: 'authenticated',
      firebaseUser: null,
      profile: createGuestProfile(),
      error: null,
      isGuest: true,
      demoUserId: 'guest-user',
    }),
  createDemoAccount: (input) => {
    const profile = createDemoProfile(input);
    set({
      status: 'authenticated',
      firebaseUser: null,
      profile,
      error: null,
      isGuest: true,
      demoUserId: profile.uid,
    });
  },
  logoutLocal: () =>
    set({
      status: 'signed_out',
      firebaseUser: null,
      profile: null,
      error: null,
      isGuest: false,
      demoUserId: null,
    }),
}));
