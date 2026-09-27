export type WarriorProfile = {
  warriorName: string;
  totalXp: number;
  streakDays: number;
  workoutsCompleted: number;
  achievementsUnlocked: number;
  unlockedAchievementIds: string[];
  lastCompletionDate: string | null;
  attributes: {
    strength: number;
    endurance: number;
    discipline: number;
    agility: number;
  };
};
