import { create } from 'zustand';
import type { Workout } from '../types/workout';
import type { ExercisePhase, WorkoutSession } from '../types/session';
import type { WorkoutCompletionResult } from '../services/gamification';
import { useProfileStore } from './profileStore';

type SessionState = {
  session: WorkoutSession | null;
  phase: ExercisePhase;
  restRemaining: number;
  isCompleting: boolean;
  lastResult: WorkoutCompletionResult | null;

  startSession: (workout: Workout) => void;
  pause: () => void;
  resume: () => void;
  tickRest: () => void;
  skipRest: () => void;
  completeCurrentExercise: (workout: Workout) => Promise<void>;
  abandon: () => void;
  clear: () => void;
};

let sessionCounter = 0;

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  phase: 'ACTIVE',
  restRemaining: 0,
  isCompleting: false,
  lastResult: null,

  startSession: (workout) => {
    const { session } = get();
    // Guard duplicate session creation: a session already running for this
    // workout is reused rather than replaced by a second rapid START tap.
    if (session && session.workoutId === workout.id && session.status === 'IN_PROGRESS') {
      return;
    }

    sessionCounter += 1;
    set({
      session: {
        id: `session-${Date.now()}-${sessionCounter}`,
        workoutId: workout.id,
        startedAt: new Date().toISOString(),
        currentExerciseIndex: 0,
        completedExercises: 0,
        status: 'IN_PROGRESS',
      },
      phase: 'ACTIVE',
      restRemaining: 0,
      lastResult: null,
      isCompleting: false,
    });
  },

  pause: () => {
    const { session } = get();
    if (!session || session.status !== 'IN_PROGRESS') return;
    set({ session: { ...session, status: 'PAUSED' } });
  },

  resume: () => {
    const { session } = get();
    if (!session || session.status !== 'PAUSED') return;
    set({ session: { ...session, status: 'IN_PROGRESS' } });
  },

  tickRest: () => {
    const { session, phase, restRemaining } = get();
    if (!session || session.status !== 'IN_PROGRESS' || phase !== 'RESTING') return;
    if (restRemaining <= 1) {
      set({ phase: 'ACTIVE', restRemaining: 0 });
    } else {
      set({ restRemaining: restRemaining - 1 });
    }
  },

  skipRest: () => {
    const { session } = get();
    if (!session) return;
    set({ phase: 'ACTIVE', restRemaining: 0 });
  },

  completeCurrentExercise: async (workout) => {
    const { session, isCompleting } = get();
    // Guard duplicate completion: a request already in flight, or a session
    // that isn't actively running, is ignored outright.
    if (!session || session.status !== 'IN_PROGRESS' || isCompleting) return;

    const isLastExercise = session.currentExerciseIndex >= workout.exercises.length - 1;

    if (!isLastExercise) {
      const finishedExercise = workout.exercises[session.currentExerciseIndex];
      const restSeconds = finishedExercise.restSeconds ?? 0;
      set({
        session: {
          ...session,
          currentExerciseIndex: session.currentExerciseIndex + 1,
          completedExercises: session.completedExercises + 1,
        },
        phase: restSeconds > 0 ? 'RESTING' : 'ACTIVE',
        restRemaining: restSeconds,
      });
      return;
    }

    set({ isCompleting: true });
    try {
      const result = await useProfileStore.getState().applyCompletion(workout);
      set({
        session: {
          ...session,
          completedExercises: session.completedExercises + 1,
          status: 'COMPLETED',
        },
        lastResult: result,
      });
    } catch (err) {
      // Leave the session IN_PROGRESS so the user can retry completion —
      // never silently drop XP, never crash the app.
      console.warn('Workout completion failed, session left in progress for retry.', err);
    } finally {
      set({ isCompleting: false });
    }
  },

  abandon: () => {
    const { session } = get();
    if (!session) return;
    if (session.status !== 'IN_PROGRESS' && session.status !== 'PAUSED') return;
    set({ session: { ...session, status: 'ABANDONED' } });
  },

  clear: () => {
    set({ session: null, phase: 'ACTIVE', restRemaining: 0, lastResult: null, isCompleting: false });
  },
}));
