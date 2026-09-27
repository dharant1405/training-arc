export type WorkoutCompletionRecord = {
  id: string;
  workoutId: string;
  xpEarned: number;
  completedAt: string;
  durationSeconds: number | null;
};
