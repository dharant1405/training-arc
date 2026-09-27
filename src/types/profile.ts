export type WarriorProfile = {
  warriorName: string;
  totalXp: number;
  streakDays: number;
  workoutsCompleted: number;
  achievementsUnlocked: number;
  attributes: {
    strength: number;
    endurance: number;
    discipline: number;
    agility: number;
  };
};
