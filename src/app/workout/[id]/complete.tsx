import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

type RevealStep = { type: 'levelup' } | { type: 'achievement'; index: number } | { type: 'summary' };

export default function WorkoutCompleteScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = getWorkoutById(id);
  const lastResult = useSessionStore((state) => state.lastResult);
  const clear = useSessionStore((state) => state.clear);
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
    router.replace('/(tabs)/home');
  };

  if (!workout || !lastResult) {
    return (
      <CinematicBackground style={styles.centered}>
        <Text style={styles.errorText}>No completion to show.</Text>
        <PrimaryButton label="Back to Home" onPress={handleReturnHome} style={styles.backButton} />
      </CinematicBackground>
    );
  }

  return (
    <CinematicBackground>
      <View
        style={[
          styles.container,
          { paddingTop: spacing.lg + insets.top, paddingBottom: spacing.lg + insets.bottom },
        ]}
      >
        <Text style={styles.brand}>WORKOUT COMPLETE</Text>
        <Text style={styles.title}>{workout.title.toUpperCase()}</Text>

        <GlassPanel glow style={styles.panel}>
          <Text style={styles.xpAwarded}>+{lastResult.xpAwarded} XP</Text>

          {lastResult.leveledUp && (
            <Text style={styles.levelLine}>
              LEVEL {lastResult.previousLevel} → LEVEL {lastResult.newLevel}
            </Text>
          )}

          <Text style={styles.streak}>🔥 STREAK {lastResult.streakDays}</Text>

          <View style={styles.statsRow}>
            <Stat label="Workouts Completed" value={String(lastResult.workoutsCompleted)} />
            <Stat label="Achievements" value={`+${lastResult.newlyUnlockedAchievements.length}`} />
          </View>
        </GlassPanel>

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

        <PrimaryButton label="Return to Home" onPress={handleReturnHome} style={styles.returnButton} />
      </View>

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
    textAlign: 'center',
  },
  title: {
    ...typography.display,
    fontSize: 26,
    textAlign: 'center',
  },
  panel: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  xpAwarded: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: '800',
  },
  levelLine: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  streak: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  returnButton: {
    marginTop: spacing.sm,
  },
  syncPanel: {
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
