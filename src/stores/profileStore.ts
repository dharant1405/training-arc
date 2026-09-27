import { create } from 'zustand';
import type { WarriorProfile } from '../types/profile';
import type { Workout } from '../types/workout';
import { getWarriorProfile, saveWarriorProfile } from '../services/profileRepository';
import { applyWorkoutCompletion, type WorkoutCompletionResult } from '../services/gamification';

type ProfileState = {
  profile: WarriorProfile | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  load: (warriorName: string) => Promise<void>;
  applyCompletion: (workout: Workout) => Promise<WorkoutCompletionResult>;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  status: 'idle',
  error: null,

  load: async (warriorName: string) => {
    set({ status: 'loading', error: null });
    try {
      const profile = await getWarriorProfile(warriorName);
      set({ profile, status: 'ready' });
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load warrior profile.',
      });
    }
  },

  applyCompletion: async (workout: Workout) => {
    const { profile } = get();
    if (!profile) {
      throw new Error('Cannot complete a workout before the warrior profile has loaded.');
    }
    const { profile: nextProfile, result } = applyWorkoutCompletion(profile, workout);
    await saveWarriorProfile(nextProfile);
    set({ profile: nextProfile });
    return result;
  },
}));
