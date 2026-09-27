import type { WarriorProfile } from '../types/profile';

// Demo repository — returns local placeholder progression so the UI has
// real data to render before the `profiles`/`workout_sessions` Supabase
// tables exist. Swap the body of this function for a Supabase query later;
// callers never need to change.
export async function getWarriorProfile(warriorName: string): Promise<WarriorProfile> {
  return {
    warriorName,
    totalXp: 1450,
    streakDays: 12,
    workoutsCompleted: 27,
    achievementsUnlocked: 4,
    attributes: {
      strength: 68,
      endurance: 54,
      discipline: 81,
      agility: 47,
    },
  };
}
