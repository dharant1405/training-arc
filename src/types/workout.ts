export type Difficulty = 'Novice' | 'Adept' | 'Warrior' | 'Elite';

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
};

export type Workout = {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: Difficulty;
  durationMinutes: number;
  xpReward: number;
  muscleGroups: string[];
  exercises: Exercise[];
  featured?: boolean;
};
