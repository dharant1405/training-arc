import { create } from 'zustand';
import type { WarriorProfile } from '../types/profile';
import { getWarriorProfile } from '../services/profileRepository';

type ProfileState = {
  profile: WarriorProfile | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  load: (warriorName: string) => Promise<void>;
};

export const useProfileStore = create<ProfileState>((set) => ({
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
}));
