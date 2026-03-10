import { create } from 'zustand';

import { subscribeToCircles } from '@/services/circles.service';
import type { Circle } from '@/types/models';

type CirclesState = {
  circles: Circle[];
  loading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;
  startListening: () => void;
  stopListening: () => void;
};

export const useCirclesStore = create<CirclesState>((set, get) => ({
  circles: [],
  loading: true,
  error: null,
  unsubscribe: null,
  startListening: () => {
    if (get().unsubscribe) {
      return;
    }

    set({ loading: true, error: null });
    const unsubscribe = subscribeToCircles(
      (circles) => set({ circles, loading: false, error: null }),
      (error) => set({ error: error.message, loading: false }),
    );

    set({ unsubscribe });
  },
  stopListening: () => {
    get().unsubscribe?.();
    set({ unsubscribe: null });
  },
}));
