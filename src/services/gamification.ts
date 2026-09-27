// Single authoritative source for XP -> level -> rank math.
// Every screen must read progression through these functions —
// never recompute level/rank locally.

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
