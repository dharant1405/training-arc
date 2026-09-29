import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getWorkoutById } from '../../../data/workouts';
import type { Difficulty } from '../../../types/workout';
import { MOTIVATION_CATEGORIES } from '../../../types/motivation';
import {
  resolveMotivationSelection,
  useMotivationStore,
  type MotivationSelectionMode,
} from '../../../stores/motivationStore';

const SELECTION_MODES: MotivationSelectionMode[] = ['favorite', ...MOTIVATION_CATEGORIES, 'none'];

export default function WorkoutDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = getWorkoutById(id);
  const [isStarting, setIsStarting] = useState(false);

  const motivationVideos = useMotivationStore((state) => state.videos);
  const pendingSelectionMode = useMotivationStore((state) => state.pendingSelectionMode);
  const setPendingSelectionMode = useMotivationStore((state) => state.setPendingSelectionMode);
  const lockInMotivationForWorkout = useMotivationStore((state) => state.lockInMotivationForWorkout);

  useEffect(() => {
    // First-ever visit: default to "favorite" so motivation behaves the way
    // it always has unless the user deliberately picks something else. Never
    // overwrites an existing choice.
    if (pendingSelectionMode === null) setPendingSelectionMode('favorite');
  }, [pendingSelectionMode, setPendingSelectionMode]);

  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [entrance]);

  if (!workout) {
    return (
      <CinematicBackground style={styles.centered}>
        <Text style={styles.errorText}>This trial could not be found.</Text>
        <PrimaryButton label="Back to Arena" onPress={() => router.back()} style={styles.backButton} />
      </CinematicBackground>
    );
  }

  const entranceStyle = {
    opacity: entrance,
    transform: [
      { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  const resolvedMotivation = resolveMotivationSelection(motivationVideos, pendingSelectionMode);
  const motivationPreview = (() => {
    if (!pendingSelectionMode || pendingSelectionMode === 'none') return null;
    if (resolvedMotivation) return `🔥 ${resolvedMotivation.title}`;
    if (pendingSelectionMode === 'favorite') return 'No favorite motivation yet.';
    return 'No motivation video available for this category.';
  })();

  return (
    <CinematicBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: spacing.md + insets.top, paddingBottom: spacing.xxl + insets.bottom },
        ]}
      >
        <Animated.View style={entranceStyle}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [styles.backButtonRow, pressed && styles.pressed]}
            >
              <Text style={styles.backText}>← BACK</Text>
            </Pressable>
          </View>
          <Text style={styles.briefingLabel}>MISSION BRIEFING</Text>

          <View style={styles.hero}>
            <Text style={styles.category} numberOfLines={1}>
              {workout.category.toUpperCase()}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {workout.title}
            </Text>
            <DifficultyBadge difficulty={workout.difficulty} />
          </View>

          <Divider />

          <View style={styles.metaRow}>
            <MetaChip label="Duration" value={`${workout.durationMinutes} min`} />
            <MetaChip label="Exercises" value={String(workout.exercises.length)} />
            <MetaChip label="XP" value={`+${workout.xpReward}`} accent />
          </View>

          {workout.muscleGroups.length > 0 && (
            <View style={styles.targetsRow}>
              <Text style={styles.targetsLabel}>TARGETS</Text>
              <Text style={styles.targetsValue}>{workout.muscleGroups.join(' · ')}</Text>
            </View>
          )}

          <Divider />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MISSION OBJECTIVE</Text>
            {workout.description ? (
              <Text style={styles.description}>{workout.description}</Text>
            ) : (
              <Text style={styles.emptyDescription}>No briefing available for this mission.</Text>
            )}
          </View>

          <Divider />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TRAINING SEQUENCE</Text>
            <GlassPanel style={styles.exercisePanel}>
              {workout.exercises.map((exercise, index) => (
                <View
                  key={exercise.id}
                  style={[
                    styles.exerciseRow,
                    index === workout.exercises.length - 1 && styles.exerciseRowLast,
                  ]}
                >
                  <Text style={styles.exerciseIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName} numberOfLines={1}>
                      {exercise.name.toUpperCase()}
                    </Text>
                    <Text style={styles.exerciseMeta}>
                      {exercise.sets} SETS × {exercise.reps} REPS
                    </Text>
                  </View>
                </View>
              ))}
            </GlassPanel>
          </View>

          <Divider />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MOTIVATION</Text>
            <View style={styles.motivationChipRow}>
              {SELECTION_MODES.map((mode) => {
                const active = mode === pendingSelectionMode;
                const label = mode === 'favorite' ? 'Favorite' : mode === 'none' ? 'None' : mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setPendingSelectionMode(mode)}
                    style={[styles.motivationChip, active && styles.motivationChipActive]}
                  >
                    <Text
                      style={[styles.motivationChipText, active && styles.motivationChipTextActive]}
                    >
                      {label.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {motivationPreview && (
              <Text style={styles.motivationPreview} numberOfLines={1}>
                {motivationPreview}
              </Text>
            )}
            {pendingSelectionMode === 'favorite' && !resolvedMotivation && (
              <Pressable onPress={() => router.push('/motivation')} hitSlop={8}>
                <Text style={styles.motivationLink}>Open Motivation Armory →</Text>
              </Pressable>
            )}
          </View>

          <PrimaryButton
            label="START TRAINING →"
            onPress={() => {
              if (isStarting) return;
              setIsStarting(true);
              lockInMotivationForWorkout();
              router.replace(`/workout/${workout.id}/execute`);
            }}
            disabled={isStarting}
            style={styles.startButton}
          />
        </Animated.View>
      </ScrollView>
    </CinematicBackground>
  );
}

function MetaChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipValue, accent && styles.chipValueAccent]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.chipLabel} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{difficulty.toUpperCase()}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  backButton: {
    width: 180,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonRow: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  briefingLabel: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  hero: {
    marginTop: spacing.sm,
    gap: 4,
    alignItems: 'flex-start',
  },
  category: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    ...typography.display,
    fontSize: 28,
  },
  badge: {
    marginTop: 2,
    backgroundColor: colors.deepCrimson,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  chipValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  chipValueAccent: {
    color: colors.gold,
  },
  chipLabel: {
    ...typography.caption,
    fontSize: 10,
    marginTop: 2,
  },
  targetsRow: {
    marginTop: spacing.sm,
    gap: 2,
  },
  targetsLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
  },
  targetsValue: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 11,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  exercisePanel: {
    paddingVertical: spacing.xs,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseRowLast: {
    borderBottomWidth: 0,
  },
  exerciseIndex: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    width: 22,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  exerciseMeta: {
    ...typography.caption,
    marginTop: 1,
  },
  motivationChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  motivationChip: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.glass,
  },
  motivationChipActive: {
    backgroundColor: colors.deepCrimson,
    borderColor: colors.crimson,
  },
  motivationChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  motivationChipTextActive: {
    color: colors.white,
  },
  motivationPreview: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  motivationLink: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  startButton: {
    marginTop: spacing.lg,
  },
});
