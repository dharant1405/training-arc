// Single authoritative source for XP -> level -> rank -> streak -> achievement
// math. Every screen must read progression through these functions —
// never recompute level/rank/streak/achievements locally.

import type { WarriorProfile } from '../types/profile';
import type { Workout } from '../types/workout';

export type Rank = {
  name: string;
  minLevel: number;
};

const RANKS: Rank[] = [
  { name: 'Initiate', minLevel: 1 },
  { name: 'Shadow', minLevel: 5 },
  { name: 'Warrior', minLevel: 10 },
  { name: 'Vanguard', minLevel: 18 },
  { name: 'Sovereign', minLevel: 28 },
  { name: 'Legend', minLevel: 40 },
];

const BASE_XP = 100;
const XP_GROWTH = 1.18;

/** XP required to go from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  return Math.round(BASE_XP * Math.pow(XP_GROWTH, level - 1));
}

/** Total cumulative XP needed to reach `level` from zero. */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export type LevelProgress = {
  level: number;
  currentLevelXp: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  progress: number; // 0..1
};

export function getLevelProgress(totalXp: number): LevelProgress {
  let level = 1;
  let remaining = totalXp;

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }

  const currentLevelXp = xpForLevel(level);
  return {
    level,
    currentLevelXp,
    xpIntoLevel: remaining,
    xpToNextLevel: currentLevelXp - remaining,
    progress: currentLevelXp === 0 ? 0 : remaining / currentLevelXp,
  };
}

export function getRankForLevel(level: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.minLevel) {
      current = rank;
    }
  }
  return current;
}

export function getNextRank(level: number): Rank | null {
  return RANKS.find((rank) => rank.minLevel > level) ?? null;
}

// --- Streak ---------------------------------------------------------------

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A completion on the same calendar day never increases the streak (prevents
 * double-counting same-day completions). A completion the day after the last
 * one extends it. Anything else — first ever completion, or a missed day —
 * resets the streak to 1.
 */
export function calculateStreak(
  previousStreak: number,
  lastCompletionDate: string | null,
  now: Date = new Date(),
): number {
  const today = toDateKey(now);
  if (lastCompletionDate === today) {
    return previousStreak;
  }
  const yesterday = toDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  if (lastCompletionDate === yesterday) {
    return previousStreak + 1;
  }
  return 1;
}

// --- Achievements -----------------------------------------------------------

export const ACHIEVEMENT_IDS = {
  firstTraining: 'first-training',
  warrior: 'warrior',
  noDaysOff: 'no-days-off',
  risingLegend: 'rising-legend',
} as const;

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: ACHIEVEMENT_IDS.firstTraining,
    title: 'First Training',
    description: 'Complete your first workout.',
    icon: '🔥',
  },
  {
    id: ACHIEVEMENT_IDS.warrior,
    title: 'Warrior',
    description: 'Complete 10 workouts.',
    icon: '⚔',
  },
  {
    id: ACHIEVEMENT_IDS.noDaysOff,
    title: 'No Days Off',
    description: 'Reach a 7-day streak.',
    icon: '📅',
  },
  {
    id: ACHIEVEMENT_IDS.risingLegend,
    title: 'Rising Legend',
    description: 'Reach Level 10.',
    icon: '⭐',
  },
];

/** IDs of every achievement whose condition is currently satisfied. */
export function evaluateAchievements(profile: WarriorProfile, level: number): string[] {
  const unlocked: string[] = [];
  if (profile.workoutsCompleted >= 1) unlocked.push(ACHIEVEMENT_IDS.firstTraining);
  if (profile.workoutsCompleted >= 10) unlocked.push(ACHIEVEMENT_IDS.warrior);
  if (profile.streakDays >= 7) unlocked.push(ACHIEVEMENT_IDS.noDaysOff);
  if (level >= 10) unlocked.push(ACHIEVEMENT_IDS.risingLegend);
  return unlocked;
}

export type AchievementProgress = {
  current: number;
  target: number;
};

/**
 * Numeric progress toward an achievement, for achievements where a fraction
 * is meaningful (e.g. "7 / 10 workouts"). Returns null for achievements that
 * are purely boolean (e.g. "complete your first workout").
 */
export function getAchievementProgress(
  achievementId: string,
  profile: Pick<WarriorProfile, 'workoutsCompleted' | 'streakDays'>,
  level: number,
): AchievementProgress | null {
  switch (achievementId) {
    case ACHIEVEMENT_IDS.warrior:
      return { current: Math.min(profile.workoutsCompleted, 10), target: 10 };
    case ACHIEVEMENT_IDS.noDaysOff:
      return { current: Math.min(profile.streakDays, 7), target: 7 };
    case ACHIEVEMENT_IDS.risingLegend:
      return { current: Math.min(level, 10), target: 10 };
    default:
      return null;
  }
}

// --- Attributes --------------------------------------------------------------

export type Attributes = {
  strength: number;
  endurance: number;
  discipline: number;
  agility: number;
};

/**
 * Deterministic, centralized attribute derivation from real training
 * statistics — never fabricated or AI-generated. Every input is a value the
 * player actually earned (level, streak, workout count).
 */
export function deriveAttributes(
  profile: Pick<WarriorProfile, 'totalXp' | 'streakDays' | 'workoutsCompleted'>,
): Attributes {
  const level = getLevelProgress(profile.totalXp).level;
  const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

  return {
    strength: clamp(level * 6 + profile.workoutsCompleted * 1.5),
    endurance: clamp(profile.workoutsCompleted * 3 + profile.streakDays * 1.2),
    discipline: clamp(profile.streakDays * 5 + level * 2),
    agility: clamp(level * 4 + profile.streakDays * 2),
  };
}

// --- Workout completion ------------------------------------------------------

export type WorkoutCompletionResult = {
  xpAwarded: number;
  totalXp: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  streakDays: number;
  workoutsCompleted: number;
  newlyUnlockedAchievements: Achievement[];
};

/**
 * The single entry point for turning a successful workout completion into
 * updated profile state. Only call this on a genuine, guarded completion —
 * never for opening/viewing/starting/pausing/abandoning a workout.
 */
export function applyWorkoutCompletion(
  profile: WarriorProfile,
  workout: Workout,
  now: Date = new Date(),
): { profile: WarriorProfile; result: WorkoutCompletionResult } {
  const previousLevel = getLevelProgress(profile.totalXp).level;
  const totalXp = profile.totalXp + workout.xpReward;
  const newLevel = getLevelProgress(totalXp).level;
  const streakDays = calculateStreak(profile.streakDays, profile.lastCompletionDate, now);
  const workoutsCompleted = profile.workoutsCompleted + 1;

  const provisionalProfile: WarriorProfile = {
    ...profile,
    totalXp,
    streakDays,
    workoutsCompleted,
    lastCompletionDate: toDateKey(now),
  };

  const unlockedIds = evaluateAchievements(provisionalProfile, newLevel);
  const newlyUnlockedIds = unlockedIds.filter((id) => !profile.unlockedAchievementIds.includes(id));
  const unlockedAchievementIds = [...profile.unlockedAchievementIds, ...newlyUnlockedIds];

  const nextProfile: WarriorProfile = {
    ...provisionalProfile,
    unlockedAchievementIds,
    achievementsUnlocked: unlockedAchievementIds.length,
  };

  return {
    profile: nextProfile,
    result: {
      xpAwarded: workout.xpReward,
      totalXp,
      previousLevel,
      newLevel,
      leveledUp: newLevel > previousLevel,
      streakDays,
      workoutsCompleted,
      newlyUnlockedAchievements: newlyUnlockedIds.map(
        (id) => ACHIEVEMENTS.find((achievement) => achievement.id === id)!,
      ),
    },
  };
}
