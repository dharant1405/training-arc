import { create } from 'zustand';
import type { WorkoutCompletionRecord } from '../types/progress';
import { getAchievementUnlockDates, getRecentCompletions } from '../services/progressRepository';

type ProgressState = {
  completions: WorkoutCompletionRecord[];
  achievementUnlockedAt: Record<string, string>;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  load: (userId: string) => Promise<void>;
};

export const useProgressStore = create<ProgressState>((set) => ({
  completions: [],
  achievementUnlockedAt: {},
  status: 'idle',
  error: null,

  load: async (userId: string) => {
    set({ status: 'loading', error: null });
    try {
      const [completions, achievementUnlockedAt] = await Promise.all([
        getRecentCompletions(userId),
        getAchievementUnlockDates(userId),
      ]);
      set({ completions, achievementUnlockedAt, status: 'ready' });
    } catch (err) {
      // No history available (offline, not configured, brand-new user with
      // an empty table) — an empty history is a legitimate, displayable
      // state, not a hard error.
      set({
        completions: [],
        achievementUnlockedAt: {},
        status: 'error',
        error: err instanceof Error ? err.message : 'Could not load training history.',
      });
    }
  },
}));
