import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyMetrics, BodyMetricsInput } from '../types/bmi';

/**
 * V2 Feature 1 — body metrics (height/weight) for BMI monitoring.
 *
 * Persistence is local-only, using the same mechanism as the Motivation
 * Armory library (zustand `persist` + AsyncStorage) rather than the Supabase
 * `profiles` row: BMI needs height and weight, and V1's cloud profile schema
 * carries neither. Nothing here touches auth, gamification, workout sessions
 * or the Supabase schema.
 *
 * Only what the warrior entered is stored. BMI itself is always derived with
 * `calculateBmi` at render time, so no duplicate/calculated value is persisted.
 */
type BmiState = {
  /**
   * Measurements keyed by user id, oldest first. Keying by user means signing
   * in as a different warrior on a shared device never shows someone else's
   * body metrics. One entry per save, so a future history/chart screen can
   * read straight from this without a data migration.
   */
  metricsByUser: Record<string, BodyMetrics[]>;
  /**
   * True once device storage has been read. The screen waits for this so a
   * returning warrior never sees a false "no measurements" empty state.
   */
  hydrated: boolean;

  markHydrated: () => void;
  /** Appends one measurement. Returns false when nothing valid was saved. */
  saveMetrics: (userId: string, input: BodyMetricsInput) => boolean;
};

/** Stable empty reference so selectors never return a new array each render. */
export const EMPTY_METRICS: BodyMetrics[] = [];

let localCounter = 0;

function sortByRecordedAt(metrics: BodyMetrics[]): BodyMetrics[] {
  return [...metrics].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

/** Measurements for one warrior, oldest first. Identity is stable per user. */
export function selectMetricsForUser(state: BmiState, userId: string | null): BodyMetrics[] {
  if (!userId) return EMPTY_METRICS;
  return state.metricsByUser[userId] ?? EMPTY_METRICS;
}

export const useBmiStore = create<BmiState>()(
  persist(
    (set, get) => ({
      metricsByUser: {},
      hydrated: false,

      markHydrated: () => set({ hydrated: true }),

      saveMetrics: (userId, input) => {
        // Defensive guard: never write an unusable measurement to storage.
        if (!userId) return false;
        if (!Number.isFinite(input.heightCm) || !Number.isFinite(input.weightKg)) return false;
        if (input.heightCm <= 0 || input.weightKg <= 0) return false;

        localCounter += 1;
        const measurement: BodyMetrics = {
          id: `body-metrics-${Date.now()}-${localCounter}`,
          heightCm: input.heightCm,
          weightKg: input.weightKg,
          recordedAt: new Date().toISOString(),
        };

        const existing = get().metricsByUser[userId] ?? [];
        set({
          metricsByUser: {
            ...get().metricsByUser,
            [userId]: sortByRecordedAt([...existing, measurement]),
          },
        });
        return true;
      },
    }),
    {
      name: 'training-arc-body-metrics',
      storage: createJSONStorage(() => AsyncStorage),
      // Only the warrior's own inputs are written to the device.
      partialize: (state) => ({ metricsByUser: state.metricsByUser }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
