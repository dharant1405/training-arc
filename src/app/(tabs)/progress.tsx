import { useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton, ProgressBar, SectionHeader } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { useProgressStore } from '../../stores/progressStore';
import { getLevelProgress, getRankForLevel } from '../../services/gamification';
import { getWorkoutById } from '../../data/workouts';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const WEEKLY_XP_GOAL = 1000;
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

  return (
    <CinematicBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: spacing.lg + insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>PROGRESS</Text>
        <Text style={styles.headline}>Your training history</Text>

        <PrimaryButton
          label="View Achievements"
          onPress={() => router.push('/achievements')}
          variant="ghost"
          style={styles.achievementsButton}
        />

        <View style={styles.statsRow}>
          <StatCard label="Level" value={String(levelProgress.level)} />
          <StatCard label="Rank" value={rank.name} />
          <StatCard label="Streak" value={`🔥 ${profile.streakDays}`} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Total XP" value={String(profile.totalXp)} />
          <StatCard label="Workouts" value={String(profile.workoutsCompleted)} />
        </View>

        <SectionHeader title="This Week" />
        <GlassPanel style={styles.weekPanel}>
          <View style={styles.weekRow}>
            {weekDays.map((day) => (
              <View key={day.label} style={styles.dayColumn}>
                <Text style={[styles.dayDot, day.trained && styles.dayDotFilled]}>
                  {day.trained ? '●' : '○'}
                </Text>
                <Text style={styles.dayLabel}>{day.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.weeklyXpLabel}>WEEKLY XP · {weeklyXp}</Text>
          <ProgressBar progress={weeklyXp / WEEKLY_XP_GOAL} />
        </GlassPanel>

        <SectionHeader title="Recent Training" />
        {recentTraining.length === 0 ? (
          <GlassPanel style={styles.emptyPanel}>
            <Text style={styles.emptyText}>
              No training history yet. Complete a workout in the Arena to start your story.
            </Text>
          </GlassPanel>
        ) : (
          recentTraining.map((completion) => {
            const workout = getWorkoutById(completion.workoutId);
            return (
              <GlassPanel key={completion.id} style={styles.historyRow}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{workout?.title ?? 'Workout'}</Text>
                  <Text style={styles.historyDate}>{formatRelativeDate(completion.completedAt)}</Text>
                </View>
                <Text style={styles.historyXp}>+{completion.xpEarned} XP</Text>
              </GlassPanel>
            );
          })
        )}
      </ScrollView>
    </CinematicBackground>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
  },
  headline: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  achievementsButton: {
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  weekPanel: {
    gap: spacing.sm,
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
  weeklyXpLabel: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  emptyPanel: {
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyInfo: {
    gap: 2,
  },
  historyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  historyDate: {
    ...typography.caption,
  },
  historyXp: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '800',
  },
});
