import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MotivationCategory, MotivationVideo } from '../types/motivation';

type AddVideoInput = {
  title: string;
  category: MotivationCategory;
  uri: string;
  durationMs: number | null;
};

// The pre-workout choice made on Workout Details: the user's favorite, a
// specific category, or explicitly no motivation video.
export type MotivationSelectionMode = 'favorite' | MotivationCategory | 'none';

type MotivationState = {
  videos: MotivationVideo[];
  selectedVideoId: string | null;
  // Standing preference chosen on Workout Details — persists as a
  // convenience across workouts until the user changes it.
  pendingSelectionMode: MotivationSelectionMode | null;
  // The video resolved from pendingSelectionMode at the moment the user
  // pressed "Start Training," locked for that workout run so later library
  // edits (deleting a video, changing favorites) can't disrupt an active
  // session. Cleared when the workout ends (complete or abandon).
  activeMotivationVideoId: string | null;
  addVideo: (input: AddVideoInput) => void;
  removeVideo: (id: string) => void;
  toggleFavorite: (id: string) => void;
  selectVideo: (id: string | null) => void;
  setPendingSelectionMode: (mode: MotivationSelectionMode | null) => void;
  lockInMotivationForWorkout: () => void;
  clearActiveMotivation: () => void;
};

let localCounter = 0;

export const useMotivationStore = create<MotivationState>()(
  persist(
    (set, get) => ({
      videos: [],
      selectedVideoId: null,
      pendingSelectionMode: null,
      activeMotivationVideoId: null,

      addVideo: (input) => {
        localCounter += 1;
        const video: MotivationVideo = {
          id: `motivation-${Date.now()}-${localCounter}`,
          title: input.title,
          category: input.category,
          uri: input.uri,
          durationMs: input.durationMs,
          isFavorite: false,
          sortOrder: get().videos.length,
          createdAt: new Date().toISOString(),
        };
        set({ videos: [...get().videos, video] });
      },

      removeVideo: (id) => {
        const { videos, selectedVideoId } = get();
        set({
          videos: videos.filter((video) => video.id !== id),
          selectedVideoId: selectedVideoId === id ? null : selectedVideoId,
        });
      },

      toggleFavorite: (id) => {
        set({
          videos: get().videos.map((video) =>
            video.id === id ? { ...video, isFavorite: !video.isFavorite } : video,
          ),
        });
      },

      selectVideo: (id) => set({ selectedVideoId: id }),

      setPendingSelectionMode: (mode) => set({ pendingSelectionMode: mode }),

      lockInMotivationForWorkout: () => {
        const { videos, pendingSelectionMode } = get();
        const resolved = resolveMotivationSelection(videos, pendingSelectionMode);
        set({ activeMotivationVideoId: resolved?.id ?? null });
      },

      clearActiveMotivation: () => set({ activeMotivationVideoId: null }),
    }),
    {
      name: 'training-arc-motivation-library',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/**
 * Resolves a pre-workout MotivationSelectionMode into an actual video.
 * "favorite" -> the user's favorited video, if any. A category -> the first
 * existing video already in that category, in library order (no randomness,
 * nothing fabricated). "none" or unset -> no video. Used once, at
 * "Start Training," to lock in that workout's motivation video.
 */
export function resolveMotivationSelection(
  videos: MotivationVideo[],
  mode: MotivationSelectionMode | null,
): MotivationVideo | null {
  if (!mode || mode === 'none') return null;
  if (mode === 'favorite') {
    return videos.find((video) => video.isFavorite) ?? null;
  }
  return videos.find((video) => video.category === mode) ?? null;
}

/**
 * The video to show as the current workout motivation: the explicitly
 * selected one if it still exists, otherwise the user's favorite, otherwise
 * none. Never fabricates a selection.
 */
export function getEffectiveMotivation(
  videos: MotivationVideo[],
  selectedVideoId: string | null,
): MotivationVideo | null {
  if (selectedVideoId) {
    const selected = videos.find((video) => video.id === selectedVideoId);
    if (selected) return selected;
  }
  return videos.find((video) => video.isFavorite) ?? null;
}
