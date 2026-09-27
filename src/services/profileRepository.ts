import type { WarriorProfile } from '../types/profile';
import { ACHIEVEMENT_IDS } from './gamification';

function dateKeyDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Demo repository — returns local placeholder progression so the UI has
// real data to render before the `profiles`/`workout_sessions` Supabase
// tables exist. Swap the body of these functions for Supabase queries later;
// callers never need to change. The module-level variable stands in for a
// row in that future table, so completions persist across screens/navigation
// without an app restart.
let demoProfile: WarriorProfile = {
  warriorName: 'Warrior',
  totalXp: 1450,
  streakDays: 12,
  workoutsCompleted: 27,
  achievementsUnlocked: 3,
  unlockedAchievementIds: [
    ACHIEVEMENT_IDS.firstTraining,
    ACHIEVEMENT_IDS.warrior,
    ACHIEVEMENT_IDS.noDaysOff,
  ],
  lastCompletionDate: dateKeyDaysAgo(1),
  attributes: {
    strength: 68,
    endurance: 54,
    discipline: 81,
    agility: 47,
  },
};

export async function getWarriorProfile(warriorName: string): Promise<WarriorProfile> {
  return { ...demoProfile, warriorName };
}

export async function saveWarriorProfile(profile: WarriorProfile): Promise<void> {
  demoProfile = { ...profile };
}
