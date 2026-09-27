export type SessionStatus = 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
export type ExercisePhase = 'ACTIVE' | 'RESTING';

export type WorkoutSession = {
  id: string;
  workoutId: string;
  startedAt: string;
  currentExerciseIndex: number;
  completedExercises: number;
  status: SessionStatus;
};
