import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CinematicBackground, GlassPanel, PrimaryButton, ProgressBar } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getWorkoutById } from '../../../data/workouts';
import { useSessionStore } from '../../../stores/sessionStore';
import { useMotivationStore } from '../../../stores/motivationStore';

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

  // Motivation is entirely local to motivationStore — it never touches
  // sessionStore, so it can't affect session/XP/completion state.
  // activeMotivationVideoId was locked in on Workout Details when the user
  // pressed "Start Training," so later library edits (deleting the video,
  // changing favorites) can't disrupt this already-running workout — if the
  // video is gone we show "unavailable" rather than silently swapping in a
  // different one.
  const motivationVideos = useMotivationStore((state) => state.videos);
  const activeMotivationVideoId = useMotivationStore((state) => state.activeMotivationVideoId);
  const clearActiveMotivation = useMotivationStore((state) => state.clearActiveMotivation);
  const activeMotivation = activeMotivationVideoId
    ? motivationVideos.find((video) => video.id === activeMotivationVideoId) ?? null
    : null;
  const motivationUnavailable = Boolean(activeMotivationVideoId) && !activeMotivation;

  const motivationPlayer = useVideoPlayer(null);
  const [isMotivationVisible, setIsMotivationVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const { isPlaying } = useEvent(motivationPlayer, 'playingChange', {
    isPlaying: motivationPlayer.playing,
  });
  const { status: motivationStatus } = useEvent(motivationPlayer, 'statusChange', {
    status: motivationPlayer.status,
  });
  const motivationFailed = motivationUnavailable || motivationStatus === 'error';

  useEffect(() => {
    motivationPlayer.replaceAsync(activeMotivation?.uri ?? null).catch(() => {});
  }, [activeMotivation?.uri, motivationPlayer]);

  useEffect(() => {
    motivationPlayer.muted = isMuted;
  }, [isMuted, motivationPlayer]);

  useEffect(() => {
    // Pausing on hide keeps this to "no unexpected audio" — the video never
    // plays unless the panel is visible and the user explicitly hit play.
    if (!isMotivationVisible) motivationPlayer.pause();
  }, [isMotivationVisible, motivationPlayer]);

  // Purely presentational: a subtle fade/scale pulse whenever the visible
  // exercise or phase changes. Isolated from session/timer state — it never
  // reads or writes restRemaining, so it cannot affect the rest countdown.
  const pulse = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    pulse.setValue(0);
    Animated.timing(pulse, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [phase, session?.currentExerciseIndex, pulse]);

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
            clearActiveMotivation();
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

  const statusLabel = phase === 'RESTING' ? 'RESTING' : isPaused ? 'PAUSED' : 'IN PROGRESS';
  const statusColor =
    phase === 'RESTING' ? colors.gold : isPaused ? colors.textMuted : colors.crimson;

  const pulseStyle = {
    opacity: pulse,
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
  };

  return (
    <CinematicBackground>
      <View
        style={[
          styles.container,
          { paddingTop: spacing.md + insets.top, paddingBottom: spacing.md + insets.bottom },
        ]}
      >
        <View>
          <View style={styles.hudRow}>
            <Text style={styles.brand}>TRAINING</Text>
            <View style={styles.statusChip}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.progressLabel} numberOfLines={1}>
            {String(session.currentExerciseIndex + 1).padStart(2, '0')} /{' '}
            {String(workout.exercises.length).padStart(2, '0')}
          </Text>
          <View style={styles.overallBar}>
            <ProgressBar progress={overallProgress} height={6} />
          </View>
        </View>

        {activeMotivationVideoId !== null && !isMotivationVisible && (
          <Pressable
            onPress={() => setIsMotivationVisible(true)}
            hitSlop={8}
            style={styles.motivationReopen}
          >
            <Text style={styles.motivationReopenText}>▸ MOTIVATION</Text>
          </Pressable>
        )}

        {activeMotivationVideoId !== null && isMotivationVisible && (
          <View style={styles.motivationPanel}>
            <View style={styles.motivationHeaderRow}>
              <Text style={styles.motivationLabel}>MOTIVATION</Text>
              <Pressable onPress={() => setIsMotivationVisible(false)} hitSlop={10}>
                <Text style={styles.motivationHideIcon}>×</Text>
              </Pressable>
            </View>

            {motivationFailed ? (
              <Text style={styles.motivationUnavailableText}>MOTIVATION VIDEO UNAVAILABLE</Text>
            ) : (
              <View style={styles.motivationRow}>
                <View style={styles.motivationVideoFrame}>
                  <VideoView style={styles.motivationVideo} player={motivationPlayer} />
                </View>
                <View style={styles.motivationInfo}>
                  <Text style={styles.motivationTitle} numberOfLines={1}>
                    🔥 {activeMotivation?.title.toUpperCase()}
                  </Text>
                  <Text style={styles.motivationCategory} numberOfLines={1}>
                    {activeMotivation?.category.toUpperCase()}
                  </Text>
                  <View style={styles.motivationControls}>
                    <Pressable
                      onPress={() => (isPlaying ? motivationPlayer.pause() : motivationPlayer.play())}
                      hitSlop={8}
                      style={styles.motivationControlButton}
                    >
                      <Text style={styles.motivationControlIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setIsMuted((muted) => !muted)}
                      hitSlop={8}
                      style={styles.motivationControlButton}
                    >
                      <Text style={styles.motivationControlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        <Animated.View style={[styles.exercisePanelWrap, pulseStyle]}>
          <GlassPanel style={styles.exercisePanel}>
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

                <View style={styles.nextWrap}>
                  <Text style={styles.nextLabel}>NEXT</Text>
                  <Text style={styles.nextName} numberOfLines={1}>
                    {exercise.name.toUpperCase()}
                  </Text>
                </View>

                <PrimaryButton
                  label="SKIP REST"
                  onPress={skipRest}
                  variant="ghost"
                  style={styles.skipButton}
                />
              </>
            ) : (
              <>
                <Text style={styles.exerciseIndexGhost}>
                  {String(session.currentExerciseIndex + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.exerciseEyebrow}>CURRENT EXERCISE</Text>
                <Text style={styles.exerciseName} numberOfLines={2}>
                  {exercise.name.toUpperCase()}
                </Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.sets} SETS × {exercise.reps} REPS
                </Text>
              </>
            )}
          </GlassPanel>
        </Animated.View>

        <View style={styles.actions}>
          {phase === 'ACTIVE' && (
            <PrimaryButton
              label={isLastExercise ? 'COMPLETE WORKOUT →' : 'COMPLETE EXERCISE →'}
              onPress={() => completeCurrentExercise(workout)}
              loading={isCompleting}
              disabled={isPaused || isCompleting || session.status !== 'IN_PROGRESS'}
              style={styles.primaryAction}
            />
          )}

          <View style={styles.secondaryRow}>
            <PrimaryButton
              label={isPaused ? '▶  RESUME' : 'Ⅱ  PAUSE'}
              onPress={isPaused ? resume : pause}
              variant="ghost"
              disabled={isCompleting}
              style={styles.secondaryButton}
            />
          </View>

          <PrimaryButton
            label="ABANDON TRAINING"
            onPress={handleAbandon}
            variant="ghost"
            disabled={isCompleting}
            style={styles.abandonButton}
          />
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
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressLabel: {
    ...typography.display,
    fontSize: 22,
    marginTop: spacing.xs,
  },
  overallBar: {
    marginTop: spacing.sm,
  },
  motivationPanel: {
    marginTop: spacing.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 16,
    padding: spacing.sm,
  },
  motivationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  motivationLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 9,
  },
  motivationHideIcon: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  motivationUnavailableText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  motivationReopen: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  motivationReopenText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  motivationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  motivationVideoFrame: {
    width: 88,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.panel,
  },
  motivationVideo: {
    width: '100%',
    height: '100%',
  },
  motivationInfo: {
    flex: 1,
    gap: 2,
  },
  motivationTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  motivationCategory: {
    ...typography.caption,
    fontSize: 10,
  },
  motivationControls: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  motivationControlButton: {
    paddingVertical: 2,
  },
  motivationControlIcon: {
    color: colors.gold,
    fontSize: 15,
  },
  exercisePanelWrap: {
    flex: 1,
    marginVertical: spacing.lg,
  },
  exercisePanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  exerciseIndexGhost: {
    position: 'absolute',
    top: spacing.sm,
    color: colors.crimsonGlow,
    fontSize: 72,
    fontWeight: '800',
  },
  exerciseEyebrow: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 11,
  },
  exerciseName: {
    ...typography.display,
    fontSize: 28,
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
    fontSize: 48,
  },
  restBar: {
    width: '80%',
    marginTop: spacing.xs,
  },
  nextWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
    gap: 2,
  },
  nextLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
  },
  nextName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    marginTop: spacing.md,
    width: 160,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryAction: {},
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
  },
  abandonButton: {
    height: 44,
  },
});
