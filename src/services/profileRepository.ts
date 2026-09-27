import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { WarriorProfile } from '../types/profile';
import type { Workout } from '../types/workout';
import { getRankForLevel, type WorkoutCompletionResult } from './gamification';

type ProfileRow = {
  warrior_name: string;
  avatar_url: string | null;
  xp: number;
  streak: number;
  total_workouts: number;
  last_completion_date: string | null;
};

function defaultProfile(warriorName: string): WarriorProfile {
  return {
    warriorName,
    avatarUrl: null,
    totalXp: 0,
    streakDays: 0,
    workoutsCompleted: 0,
    achievementsUnlocked: 0,
    unlockedAchievementIds: [],
    lastCompletionDate: null,
  };
}

async function getUnlockedAchievementIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('achievement_key')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.achievement_key as string);
}

function rowToProfile(row: ProfileRow, unlockedAchievementIds: string[]): WarriorProfile {
  return {
    warriorName: row.warrior_name,
    avatarUrl: row.avatar_url,
    totalXp: row.xp,
    streakDays: row.streak,
    workoutsCompleted: row.total_workouts,
    achievementsUnlocked: unlockedAchievementIds.length,
    unlockedAchievementIds,
    lastCompletionDate: row.last_completion_date,
  };
}

/**
 * Fetches the warrior's profile row, creating one with fresh-start defaults
 * (XP 0, level 1, streak 0, 0 workouts) the first time this user is seen.
 * Never resets an existing row — only ever inserts when none exists yet.
 */
export async function getOrCreateWarriorProfile(
  userId: string,
  fallbackName: string,
): Promise<WarriorProfile> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('warrior_name, avatar_url, xp, streak, total_workouts, last_completion_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    const unlockedAchievementIds = await getUnlockedAchievementIds(userId);
    return rowToProfile(existing as ProfileRow, unlockedAchievementIds);
  }

  const fresh = defaultProfile(fallbackName);
  const { error: insertError } = await supabase.from('profiles').insert({
    user_id: userId,
    warrior_name: fresh.warriorName,
    avatar_url: fresh.avatarUrl,
    xp: fresh.totalXp,
    level: 1,
    rank: getRankForLevel(1).name,
    streak: fresh.streakDays,
    total_workouts: fresh.workoutsCompleted,
    last_completion_date: fresh.lastCompletionDate,
  });

  if (insertError) throw insertError;
  return fresh;
}

/**
 * Persists the outcome of a single guarded workout completion: the updated
 * profile row, the workout_completions record, and any newly unlocked
 * achievement rows. Called at most once per completion — the in-flight
 * guard in sessionStore prevents this from ever being invoked twice for the
 * same completion.
 */
export async function saveWorkoutCompletion(
  userId: string,
  completionId: string,
  workout: Workout,
  nextProfile: WarriorProfile,
  result: WorkoutCompletionResult,
  durationSeconds: number | null,
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      warrior_name: nextProfile.warriorName,
      avatar_url: nextProfile.avatarUrl,
      xp: nextProfile.totalXp,
      level: result.newLevel,
      rank: getRankForLevel(result.newLevel).name,
      streak: nextProfile.streakDays,
      total_workouts: nextProfile.workoutsCompleted,
      last_completion_date: nextProfile.lastCompletionDate,
    })
    .eq('user_id', userId);

  if (profileError) throw profileError;

  // Upsert keyed by the client-supplied completion id (the session id) so a
  // retry after a partial failure (e.g. the achievements insert below threw)
  // re-writes the same row instead of inserting a second completion record.
  const { error: completionError } = await supabase.from('workout_completions').upsert(
    {
      id: completionId,
      user_id: userId,
      workout_id: workout.id,
      xp_earned: result.xpAwarded,
      duration_seconds: durationSeconds,
    },
    { onConflict: 'id' },
  );

  if (completionError) throw completionError;

  if (result.newlyUnlockedAchievements.length > 0) {
    const { error: achievementsError } = await supabase.from('achievements').insert(
      result.newlyUnlockedAchievements.map((achievement) => ({
        user_id: userId,
        achievement_key: achievement.id,
      })),
    );
    // A unique-violation here means the achievement was already recorded
    // (e.g. a retried sync after a partial failure) — that's fine, not an error.
    if (achievementsError && achievementsError.code !== '23505') {
      throw achievementsError;
    }
  }
}

export async function updateWarriorName(userId: string, warriorName: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }
  const { error } = await supabase
    .from('profiles')
    .update({ warrior_name: warriorName })
    .eq('user_id', userId);
  if (error) throw error;
}

export { defaultProfile };
