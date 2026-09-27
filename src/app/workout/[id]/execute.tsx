import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton, ProgressBar } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getWorkoutById } from '../../../data/workouts';
import { useSessionStore } from '../../../stores/sessionStore';

export default function WorkoutExecuteScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = getWorkoutById(id);

  const session = useSessionStore((state) => state.session);
  const phase = useSessionStore((state) => state.phase);
  const restRemaining = useSessionStore((state) => state.restRemaining);
  const restTotal = useSessionStore((state) => state.restTotal);
  const isCompleting = useSessionStore((state) => state.isCompleting);
  const startSession = useSessionStore((state) => state.startSession);
  const pause = useSessionStore((state) => state.pause);
  const resume = useSessionStore((state) => state.resume);
  const tickRest = useSessionStore((state) => state.tickRest);
  const skipRest = useSessionStore((state) => state.skipRest);
  const completeCurrentExercise = useSessionStore((state) => state.completeCurrentExercise);
  const abandon = useSessionStore((state) => state.abandon);
  const clear = useSessionStore((state) => state.clear);

  useEffect(() => {
    if (!workout) return;
    startSession(workout);
    // Only re-run if the workout identity actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout?.id]);

  useEffect(() => {
    if (!session || session.status !== 'IN_PROGRESS' || phase !== 'RESTING') return;
    const interval = setInterval(tickRest, 1000);
    return () => clearInterval(interval);
  }, [session?.status, phase, tickRest]);

  useEffect(() => {
    if (session?.status === 'COMPLETED') {
      router.replace(`/workout/${session.workoutId}/complete`);
    }
  }, [session?.status, session?.workoutId]);

  if (!workout) {
    return (
      <CinematicBackground style={styles.centered}>
        <Text style={styles.errorText}>This trial could not be found.</Text>
        <PrimaryButton
          label="Back to Arena"
          onPress={() => router.replace('/(tabs)/arena')}
          style={styles.backButton}
        />
      </CinematicBackground>
    );
  }

  if (!session || session.workoutId !== workout.id || session.status === 'ABANDONED') {
    return (
      <CinematicBackground style={styles.centered}>
        <Text style={styles.errorText}>Preparing your training session…</Text>
      </CinematicBackground>
    );
  }

  const handleAbandon = () => {
    Alert.alert(
      'Abandon Training?',
      'You will lose progress on this session. No XP will be awarded.',
      [
        { text: 'Keep Training', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: () => {
            abandon();
            clear();
            router.replace(`/workout/${workout.id}/details`);
          },
        },
      ],
    );
  };

  const exercise = workout.exercises[session.currentExerciseIndex];
  const isLastExercise = session.currentExerciseIndex === workout.exercises.length - 1;
  const isPaused = session.status === 'PAUSED';
  const overallProgress =
    (session.currentExerciseIndex + (phase === 'RESTING' ? 1 : 0)) / workout.exercises.length;

  return (
    <CinematicBackground>
      <View
        style={[
          styles.container,
          { paddingTop: spacing.lg + insets.top, paddingBottom: spacing.lg + insets.bottom },
        ]}
      >
        <View>
          <Text style={styles.brand}>{workout.title.toUpperCase()}</Text>
          <Text style={styles.progressLabel}>
            EXERCISE {session.currentExerciseIndex + 1} / {workout.exercises.length}
          </Text>
          <View style={styles.overallBar}>
            <ProgressBar progress={overallProgress} />
          </View>
        </View>

        <GlassPanel glow style={styles.exercisePanel}>
          {phase === 'RESTING' ? (
            <>
              <Text style={styles.restLabel}>REST</Text>
              <Text style={styles.restTimer}>{formatTime(restRemaining)}</Text>
              <View style={styles.restBar}>
                <ProgressBar
                  progress={restTotal ? 1 - restRemaining / restTotal : 0}
                  height={6}
                />
              </View>
              <PrimaryButton
                label="Skip Rest"
                onPress={skipRest}
                variant="ghost"
                style={styles.skipButton}
              />
            </>
          ) : (
            <>
              <Text style={styles.exerciseName}>{exercise.name.toUpperCase()}</Text>
              <Text style={styles.exerciseMeta}>
                {exercise.sets} SETS × {exercise.reps} REPS
              </Text>
            </>
          )}
        </GlassPanel>

        <View style={styles.actions}>
          {phase === 'ACTIVE' && (
            <PrimaryButton
              label={isLastExercise ? 'Complete Workout' : 'Complete Exercise'}
              onPress={() => completeCurrentExercise(workout)}
              loading={isCompleting}
              disabled={isPaused || isCompleting || session.status !== 'IN_PROGRESS'}
              style={styles.primaryAction}
            />
          )}

          <View style={styles.secondaryRow}>
            <PrimaryButton
              label={isPaused ? 'Resume' : 'Pause'}
              onPress={isPaused ? resume : pause}
              variant="ghost"
              disabled={isCompleting}
              style={styles.secondaryButton}
            />
            <PrimaryButton
              label="Abandon"
              onPress={handleAbandon}
              variant="ghost"
              disabled={isCompleting}
              style={styles.secondaryButton}
            />
          </View>
        </View>
      </View>
    </CinematicBackground>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
    justifyContent: 'space-between',
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
  },
  progressLabel: {
    ...typography.subtitle,
    marginTop: spacing.xs,
  },
  overallBar: {
    marginTop: spacing.sm,
  },
  exercisePanel: {
    flex: 1,
    marginVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  exerciseName: {
    ...typography.display,
    fontSize: 26,
    textAlign: 'center',
  },
  exerciseMeta: {
    ...typography.subtitle,
    color: colors.gold,
  },
  restLabel: {
    ...typography.label,
    color: colors.crimson,
    fontSize: 14,
  },
  restTimer: {
    ...typography.display,
    fontSize: 44,
  },
  restBar: {
    width: '80%',
    marginTop: spacing.xs,
  },
  skipButton: {
    marginTop: spacing.md,
    width: 160,
  },
  actions: {
    gap: spacing.md,
  },
  primaryAction: {},
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
  },
});
