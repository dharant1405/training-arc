import { create } from 'zustand';
import type { WarriorProfile } from '../types/profile';
import type { Workout } from '../types/workout';
import {
  defaultProfile,
  getOrCreateWarriorProfile,
  saveWorkoutCompletion,
  updateWarriorName as updateWarriorNameRemote,
} from '../services/profileRepository';
import { applyWorkoutCompletion, type WorkoutCompletionResult } from '../services/gamification';
import { useProgressStore } from './progressStore';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

type PendingCompletion = {
  completionId: string;
  workout: Workout;
  nextProfile: WarriorProfile;
  result: WorkoutCompletionResult;
  durationSeconds: number | null;
};

type ProfileState = {
  userId: string | null;
  profile: WarriorProfile | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  pendingCompletion: PendingCompletion | null;
  load: (userId: string, warriorName: string) => Promise<void>;
  applyCompletion: (
    completionId: string,
    workout: Workout,
    durationSeconds: number | null,
  ) => Promise<WorkoutCompletionResult>;
  retrySync: () => Promise<void>;
  updateWarriorName: (warriorName: string) => Promise<void>;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  userId: null,
  profile: null,
  status: 'idle',
  error: null,
  syncStatus: 'idle',
  syncError: null,
  pendingCompletion: null,

  load: async (userId: string, warriorName: string) => {
    set({ status: 'loading', error: null, userId });
    try {
      const profile = await getOrCreateWarriorProfile(userId, warriorName);
      set({ profile, status: 'ready', syncStatus: 'synced', syncError: null });
    } catch (err) {
      // Cloud unavailable (not configured, offline, etc.) — fall back to a
      // fresh local profile so the app stays usable rather than getting
      // stuck behind a hard error screen.
      set({
        profile: defaultProfile(warriorName),
        status: 'ready',
        syncStatus: 'error',
        syncError:
          err instanceof Error
            ? err.message
            : 'Could not reach the cloud. Your progress will stay on this device for now.',
      });
    }
  },

  applyCompletion: async (completionId: string, workout: Workout, durationSeconds: number | null) => {
    const { profile, userId } = get();
    if (!profile) {
      throw new Error('Cannot complete a workout before the warrior profile has loaded.');
    }

    const { profile: nextProfile, result } = applyWorkoutCompletion(profile, workout);
    // Local state updates immediately — the player's XP/level/streak/
    // achievements never wait on a network round trip.
    set({ profile: nextProfile });

    if (!userId) {
      set({
        syncStatus: 'error',
        syncError: 'No signed-in warrior — this completion was not saved to the cloud.',
      });
      return result;
    }

    set({ syncStatus: 'syncing', syncError: null });
    try {
      await saveWorkoutCompletion(userId, completionId, workout, nextProfile, result, durationSeconds);
      set({ syncStatus: 'synced', syncError: null, pendingCompletion: null });
      useProgressStore.getState().load(userId);
    } catch (err) {
      set({
        syncStatus: 'error',
        syncError: err instanceof Error ? err.message : 'Failed to save your progress to the cloud.',
        pendingCompletion: { completionId, workout, nextProfile, result, durationSeconds },
      });
    }

    return result;
  },

  retrySync: async () => {
    const { userId, pendingCompletion } = get();
    if (!userId || !pendingCompletion) return;

    set({ syncStatus: 'syncing', syncError: null });
    try {
      await saveWorkoutCompletion(
        userId,
        pendingCompletion.completionId,
        pendingCompletion.workout,
        pendingCompletion.nextProfile,
        pendingCompletion.result,
        pendingCompletion.durationSeconds,
      );
      set({ syncStatus: 'synced', syncError: null, pendingCompletion: null });
      useProgressStore.getState().load(userId);
    } catch (err) {
      set({
        syncStatus: 'error',
        syncError: err instanceof Error ? err.message : 'Failed to save your progress to the cloud.',
      });
    }
  },

  updateWarriorName: async (warriorName: string) => {
    const { profile, userId } = get();
    if (!profile) return;
    set({ profile: { ...profile, warriorName } });
    if (!userId) return;
    try {
      await updateWarriorNameRemote(userId, warriorName);
    } catch (err) {
      set({
        syncStatus: 'error',
        syncError: err instanceof Error ? err.message : 'Failed to save your warrior name.',
      });
    }
  },
}));
