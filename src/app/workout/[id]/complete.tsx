import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AchievementUnlockedCard,
  CinematicBackground,
  GlassPanel,
  LevelUpCelebration,
  PrimaryButton,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getWorkoutById } from '../../../data/workouts';
import { useSessionStore } from '../../../stores/sessionStore';
import { useProfileStore } from '../../../stores/profileStore';
import { useMotivationStore } from '../../../stores/motivationStore';
import { getLevelProgress } from '../../../services/gamification';

type RevealStep = { type: 'levelup' } | { type: 'achievement'; index: number } | { type: 'summary' };

export default function WorkoutCompleteScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = getWorkoutById(id);
  const lastResult = useSessionStore((state) => state.lastResult);
  const clear = useSessionStore((state) => state.clear);
  const clearActiveMotivation = useMotivationStore((state) => state.clearActiveMotivation);
  const syncStatus = useProfileStore((state) => state.syncStatus);
  const syncError = useProfileStore((state) => state.syncError);
  const retrySync = useProfileStore((state) => state.retrySync);

  const steps = useMemo<RevealStep[]>(() => {
    if (!lastResult) return [{ type: 'summary' }];
    const built: RevealStep[] = [];
    if (lastResult.leveledUp) built.push({ type: 'levelup' });
    lastResult.newlyUnlockedAchievements.forEach((_, index) =>
      built.push({ type: 'achievement', index }),
    );
    built.push({ type: 'summary' });
    return built;
  }, [lastResult]);

  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex];

  // Guards against a rapid double-tap on "Continue" advancing two reveal
  // steps at once (the modal's fade-out isn't instant, so the button can
  // still be tappable for a moment after the first tap registers).
  const advanceStep = (fromIndex: number) => {
    setStepIndex((i) => (i === fromIndex ? i + 1 : i));
  };

  const handleReturnHome = () => {
    clear();
    clearActiveMotivation();
    router.replace('/(tabs)/home');
  };

  // Purely presentational entrance — isolated from the reveal state machine.
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [entrance]);

  if (!workout || !lastResult) {
    return (
      <CinematicBackground style={styles.centered}>
        <Text style={styles.errorText}>No completion to show.</Text>
        <PrimaryButton label="Back to Home" onPress={handleReturnHome} style={styles.backButton} />
      </CinematicBackground>
    );
  }

  const levelProgress = getLevelProgress(lastResult.totalXp);

  const entranceStyle = {
    opacity: entrance,
    transform: [
      { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };

  return (
    <CinematicBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: spacing.lg + insets.top, paddingBottom: spacing.lg + insets.bottom },
        ]}
      >
        <Animated.View style={entranceStyle}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>MISSION CLEARED</Text>
            <Text style={styles.headline}>TRAINING COMPLETE</Text>
            <View style={styles.headerDivider} />
            <Text style={styles.workoutName} numberOfLines={1}>
              {workout.title.toUpperCase()}
            </Text>
          </View>

          <GlassPanel style={styles.xpPanel}>
            <Text style={styles.xpLabel}>XP EARNED</Text>
            <Text style={styles.xpValue}>+{lastResult.xpAwarded} XP</Text>

            <View style={styles.xpDivider} />

            <Text style={styles.levelLabel}>LEVEL {lastResult.newLevel}</Text>
            <Text style={styles.nextLevelLabel}>NEXT LEVEL</Text>
            <Text style={styles.nextLevelValue}>{levelProgress.xpToNextLevel} XP TO GO</Text>
          </GlassPanel>

          <View style={styles.streakStrip}>
            <Text style={styles.streakText}>🔥 STREAK · {lastResult.streakDays} DAYS</Text>
          </View>

          <View style={styles.summaryRow}>
            <SummaryStat label="WORKOUT" value={`${workout.durationMinutes} MIN`} />
            <SummaryStat label="EXERCISES" value={String(workout.exercises.length)} />
            <SummaryStat label="TOTAL WORKOUTS" value={String(lastResult.workoutsCompleted)} />
          </View>

          {syncStatus === 'error' && (
            <GlassPanel style={styles.syncPanel}>
              <Text style={styles.syncText}>
                ⚠ {syncError ?? 'Could not save this to the cloud.'} Your XP is safe on this device.
              </Text>
              <PrimaryButton
                label="Retry Save"
                onPress={retrySync}
                variant="ghost"
                style={styles.retryButton}
              />
            </GlassPanel>
          )}

          <PrimaryButton
            label="RETURN TO HOME →"
            onPress={handleReturnHome}
            style={styles.returnButton}
          />
        </Animated.View>
      </ScrollView>

      <LevelUpCelebration
        visible={currentStep?.type === 'levelup'}
        fromLevel={lastResult.previousLevel}
        toLevel={lastResult.newLevel}
        xpAwarded={lastResult.xpAwarded}
        onContinue={() => advanceStep(stepIndex)}
      />

      {currentStep?.type === 'achievement' && (
        <AchievementUnlockedCard
          visible
          achievement={lastResult.newlyUnlockedAchievements[currentStep.index]}
          onContinue={() => advanceStep(stepIndex)}
        />
      )}
    </CinematicBackground>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel style={styles.summaryStat}>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
    </GlassPanel>
  );
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
    color: colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    width: 180,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  eyebrow: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
  },
  headline: {
    ...typography.display,
    fontSize: 26,
    textAlign: 'center',
  },
  headerDivider: {
    width: 40,
    height: 2,
    backgroundColor: colors.crimson,
    borderRadius: 1,
    marginTop: spacing.xs,
  },
  workoutName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  xpPanel: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: 2,
  },
  xpLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
  },
  xpValue: {
    color: colors.gold,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 2,
  },
  xpDivider: {
    width: '55%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  levelLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  nextLevelLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  nextLevelValue: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  streakStrip: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  streakText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  returnButton: {
    marginTop: spacing.md,
  },
  syncPanel: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  syncText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    width: 160,
  },
});
