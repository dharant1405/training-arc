export type MotivationCategory =
  | 'Anime'
  | 'Love Failure'
  | 'Weight Loss'
  | 'Bodybuilding'
  | 'Calisthenics'
  | 'Custom';

export const MOTIVATION_CATEGORIES: MotivationCategory[] = [
  'Anime',
  'Love Failure',
  'Weight Loss',
  'Bodybuilding',
  'Calisthenics',
  'Custom',
];

export type MotivationVideo = {
  id: string;
  title: string;
  category: MotivationCategory;
  uri: string;
  durationMs: number | null;
  isFavorite: boolean;
  sortOrder: number;
  createdAt: string;
};
