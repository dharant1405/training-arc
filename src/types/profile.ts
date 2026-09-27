export type WarriorProfile = {
  warriorName: string;
  avatarUrl: string | null;
  totalXp: number;
  streakDays: number;
  workoutsCompleted: number;
  achievementsUnlocked: number;
  unlockedAchievementIds: string[];
  lastCompletionDate: string | null;
};
