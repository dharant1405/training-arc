import type { Workout } from '../types/workout';

export const WORKOUTS: Workout[] = [
  {
    id: 'wk-crimson-forge',
    title: 'Crimson Forge',
    category: 'Strength',
    description:
      'A brutal full-body forging session designed to build raw warrior power. Push past your limits.',
    difficulty: 'Warrior',
    durationMinutes: 35,
    xpReward: 250,
    muscleGroups: ['Chest', 'Back', 'Legs'],
    featured: true,
    exercises: [
      { id: 'ex-1', name: 'Push Ups', sets: 4, reps: 20, restSeconds: 45 },
      { id: 'ex-2', name: 'Bodyweight Squats', sets: 4, reps: 25, restSeconds: 45 },
      { id: 'ex-3', name: 'Plank Hold', sets: 3, reps: 60, restSeconds: 30 },
      { id: 'ex-4', name: 'Lunges', sets: 3, reps: 16, restSeconds: 30 },
    ],
  },
  {
    id: 'wk-shadow-agility',
    title: 'Shadow Agility',
    category: 'Cardio',
    description: 'Fast, explosive movement drills to sharpen your reflexes and endurance.',
    difficulty: 'Adept',
    durationMinutes: 20,
    xpReward: 150,
    muscleGroups: ['Full Body'],
    exercises: [
      { id: 'ex-5', name: 'High Knees', sets: 3, reps: 40, restSeconds: 30 },
      { id: 'ex-6', name: 'Jumping Jacks', sets: 3, reps: 30, restSeconds: 30 },
      { id: 'ex-7', name: 'Mountain Climbers', sets: 3, reps: 30, restSeconds: 30 },
    ],
  },
  {
    id: 'wk-iron-discipline',
    title: 'Iron Discipline',
    category: 'Core',
    description: 'A focused core-conditioning ritual to build unshakeable discipline.',
    difficulty: 'Novice',
    durationMinutes: 15,
    xpReward: 100,
    muscleGroups: ['Core'],
    exercises: [
      { id: 'ex-8', name: 'Sit Ups', sets: 3, reps: 20, restSeconds: 30 },
      { id: 'ex-9', name: 'Leg Raises', sets: 3, reps: 15, restSeconds: 30 },
      { id: 'ex-10', name: 'Plank Hold', sets: 3, reps: 45, restSeconds: 30 },
    ],
  },
  {
    id: 'wk-sovereign-power',
    title: "Sovereign's Power",
    category: 'Strength',
    description: 'An elite-tier trial reserved for warriors who have proven their resolve.',
    difficulty: 'Elite',
    durationMinutes: 45,
    xpReward: 400,
    muscleGroups: ['Full Body'],
    exercises: [
      { id: 'ex-11', name: 'Push Ups', sets: 5, reps: 25, restSeconds: 40 },
      { id: 'ex-12', name: 'Pull Ups', sets: 5, reps: 10, restSeconds: 60 },
      { id: 'ex-13', name: 'Bodyweight Squats', sets: 5, reps: 30, restSeconds: 40 },
      { id: 'ex-14', name: 'Burpees', sets: 4, reps: 15, restSeconds: 45 },
    ],
  },
];

export function getWorkoutById(id: string): Workout | undefined {
  return WORKOUTS.find((workout) => workout.id === id);
}

export function getFeaturedWorkout(): Workout {
  return WORKOUTS.find((workout) => workout.featured) ?? WORKOUTS[0];
}
