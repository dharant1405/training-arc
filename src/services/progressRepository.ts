import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { WorkoutCompletionRecord } from '../types/progress';

type CompletionRow = {
  id: string;
  workout_id: string;
  xp_earned: number;
  completed_at: string;
  duration_seconds: number | null;
};

export async function getRecentCompletions(
  userId: string,
  limit = 30,
): Promise<WorkoutCompletionRecord[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('workout_completions')
    .select('id, workout_id, xp_earned, completed_at, duration_seconds')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: CompletionRow) => ({
    id: row.id,
    workoutId: row.workout_id,
    xpEarned: row.xp_earned,
    completedAt: row.completed_at,
    durationSeconds: row.duration_seconds,
  }));
}

export async function getAchievementUnlockDates(userId: string): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('achievements')
    .select('achievement_key, unlocked_at')
    .eq('user_id', userId);

  if (error) throw error;

  const dates: Record<string, string> = {};
  for (const row of data ?? []) {
    dates[row.achievement_key as string] = row.unlocked_at as string;
  }
  return dates;
}
