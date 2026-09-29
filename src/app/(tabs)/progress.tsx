import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CinematicBackground, GlassPanel, XPRing } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { useProgressStore } from '../../stores/progressStore';
import { getLevelProgress, getRankForLevel } from '../../services/gamification';
import { getWorkoutById } from '../../data/workouts';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const RECENT_TRAINING_LIMIT = 5;

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const mondayOffset = (start.getDay() + 6) % 7; // Monday = 0
  start.setDate(start.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  if (isSameDay(date, today)) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDuration(durationSeconds: number | null): string | null {
  if (!durationSeconds || durationSeconds <= 0) return null;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const completions = useProgressStore((state) => state.completions);
  const progressStatus = useProgressStore((state) => state.status);
  const load = useProgressStore((state) => state.load);

  useEffect(() => {
    if (user?.id) load(user.id);
  }, [load, user?.id]);

  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [entrance]);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);

  const weekDays = useMemo(() => {
    return DAY_LABELS.map((label, index) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + index);
      const trained = completions.some((completion) =>
        isSameDay(new Date(completion.completedAt), day),
      );
      return { label, trained };
    });
  }, [completions, weekStart]);

  const weeklyXp = useMemo(() => {
    return completions
      .filter((completion) => new Date(completion.completedAt) >= weekStart)
      .reduce((sum, completion) => sum + completion.xpEarned, 0);
  }, [completions, weekStart]);

  const recentTraining = completions.slice(0, RECENT_TRAINING_LIMIT);

  if (progressStatus === 'loading' || !profile) {
    return (
      <CinematicBackground style={styles.centered}>
        <ActivityIndicator color={colors.crimson} size="large" />
      </CinematicBackground>
    );
  }

  const levelProgress = getLevelProgress(profile.totalXp);
  const rank = getRankForLevel(levelProgress.level);

  const entranceStyle = {
    opacity: entrance,
    transform: [
      { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  return (
    <CinematicBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: spacing.md + insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={entranceStyle}>
          <Text style={styles.eyebrow}>WARRIOR PROGRESS</Text>
          <Text style={styles.headline}>Track your growth. Keep moving forward.</Text>
          <Text style={styles.statusLine} numberOfLines={1}>
            LV {levelProgress.level} <Text style={styles.statusDot}>•</Text> {rank.name.toUpperCase()}{' '}
            <Text style={styles.statusDot}>•</Text> {profile.totalXp} XP
          </Text>

          <GlassPanel style={styles.progressionPanel}>
            <Text style={styles.progressionLabel}>PROGRESSION</Text>

            <View style={styles.ringWrap}>
              <View style={styles.ringGlow} />
              <XPRing progress={levelProgress.progress} level={levelProgress.level} size={132} strokeWidth={10} />
            </View>

            <Text style={styles.progressionRank}>{rank.name.toUpperCase()} RANK</Text>

            <View style={styles.progressionDivider} />

            <Text style={styles.progressionXp}>
              {levelProgress.xpIntoLevel} / {levelProgress.currentLevelXp} XP
            </Text>
            <Text style={styles.progressionNextLevel}>
              {levelProgress.xpToNextLevel} XP TO NEXT LEVEL
            </Text>
          </GlassPanel>

          <View style={styles.statsRow}>
            <StatCard label="STREAK" value={`🔥 ${profile.streakDays}`} />
            <StatCard label="WORKOUTS" value={String(profile.workoutsCompleted)} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WEEKLY TRAINING</Text>
            <GlassPanel style={styles.weekPanel}>
              <View style={styles.weekRow}>
                {weekDays.map((day) => (
                  <View key={day.label} style={styles.dayColumn}>
                    <Text style={[styles.dayDot, day.trained && styles.dayDotFilled]}>
                      {day.trained ? '●' : '—'}
                    </Text>
                    <Text style={styles.dayLabel}>{day.label}</Text>
                  </View>
                ))}
              </View>
            </GlassPanel>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WEEKLY XP</Text>
            <GlassPanel style={styles.weeklyXpPanel}>
              <Text style={styles.weeklyXpValue}>{weeklyXp} XP</Text>
              <Text style={styles.weeklyXpCaption}>Earned so far this week</Text>
            </GlassPanel>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECENT TRAINING</Text>
            {recentTraining.length === 0 ? (
              <GlassPanel style={styles.emptyPanel}>
                <Text style={styles.emptyTitle}>NO TRAINING RECORDED</Text>
                <Text style={styles.emptyText}>
                  Complete your first mission to begin your progression.
                </Text>
              </GlassPanel>
            ) : (
              <View style={styles.historyList}>
                {recentTraining.map((completion) => {
                  const workout = getWorkoutById(completion.workoutId);
                  const duration = formatDuration(completion.durationSeconds);
                  return (
                    <GlassPanel key={completion.id} style={styles.historyRow}>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyTitle} numberOfLines={1}>
                          {workout?.title ?? 'Workout'}
                        </Text>
                        <Text style={styles.historyMeta} numberOfLines={1}>
                          {formatRelativeDate(completion.completedAt)}
                          {duration ? ` · ${duration}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.historyXp}>+{completion.xpEarned} XP</Text>
                    </GlassPanel>
                  );
                })}
              </View>
            )}
          </View>

          <Pressable onPress={() => router.push('/achievements')}>
            {({ pressed }) => (
              <GlassPanel
                style={StyleSheet.flatten([
                  styles.achievementsPanel,
                  pressed && styles.achievementsPanelPressed,
                ])}
              >
                <View style={styles.achievementsInfo}>
                  <Text style={styles.achievementsTitle}>ACHIEVEMENTS</Text>
                  <Text style={styles.achievementsSubtitle}>
                    View your unlocked warrior achievements.
                  </Text>
                </View>
                <Text style={styles.achievementsArrow}>→</Text>
              </GlassPanel>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </CinematicBackground>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel style={styles.statCard}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
  },
  headline: {
    ...typography.title,
    fontSize: 20,
    marginTop: 2,
  },
  statusLine: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  statusDot: {
    color: colors.textMuted,
  },
  progressionPanel: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
  },
  progressionLabel: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
  },
  ringWrap: {
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGlow: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: colors.crimsonGlow,
    opacity: 0.16,
  },
  progressionRank: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  progressionDivider: {
    width: '50%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  progressionXp: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
  },
  progressionNextLevel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 11,
  },
  weekPanel: {
    paddingVertical: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  dayDot: {
    color: colors.textMuted,
    fontSize: 16,
  },
  dayDotFilled: {
    color: colors.crimson,
  },
  dayLabel: {
    ...typography.caption,
    fontSize: 10,
  },
  weeklyXpPanel: {
    alignItems: 'center',
  },
  weeklyXpValue: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: '800',
  },
  weeklyXpCaption: {
    ...typography.caption,
    marginTop: 2,
  },
  emptyPanel: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 15,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  historyList: {
    gap: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  historyMeta: {
    ...typography.caption,
  },
  historyXp: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 0,
  },
  achievementsPanel: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  achievementsPanelPressed: {
    opacity: 0.8,
  },
  achievementsInfo: {
    flex: 1,
    gap: 2,
  },
  achievementsTitle: {
    ...typography.label,
    color: colors.gold,
    fontSize: 12,
  },
  achievementsSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  achievementsArrow: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
  },
});
