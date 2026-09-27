import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getWorkoutById } from '../../../data/workouts';

export default function WorkoutDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = getWorkoutById(id);
  const [isStarting, setIsStarting] = useState(false);

  if (!workout) {
    return (
      <CinematicBackground style={styles.centered}>
        <Text style={styles.errorText}>This trial could not be found.</Text>
        <PrimaryButton label="Back to Arena" onPress={() => router.back()} style={styles.backButton} />
      </CinematicBackground>
    );
  }

  return (
    <CinematicBackground>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.category}>{workout.category.toUpperCase()}</Text>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.description}>{workout.description}</Text>

        <View style={styles.metaRow}>
          <MetaChip label="Difficulty" value={workout.difficulty} />
          <MetaChip label="Duration" value={`${workout.durationMinutes} min`} />
          <MetaChip label="XP" value={`+${workout.xpReward}`} />
        </View>

        <GlassPanel style={styles.panel}>
          <Text style={styles.panelTitle}>Muscle Groups</Text>
          <Text style={styles.panelBody}>{workout.muscleGroups.join(' · ')}</Text>
        </GlassPanel>

        <GlassPanel style={styles.panel}>
          <Text style={styles.panelTitle}>Exercises</Text>
          {workout.exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseRow}>
              <Text style={styles.exerciseIndex}>{index + 1}</Text>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.sets} sets × {exercise.reps} reps
                </Text>
              </View>
            </View>
          ))}
        </GlassPanel>

        <PrimaryButton
          label="Start Training"
          onPress={() => {
            if (isStarting) return;
            setIsStarting(true);
            router.replace(`/workout/${workout.id}/execute`);
          }}
          disabled={isStarting}
          style={styles.startButton}
        />
      </ScrollView>
    </CinematicBackground>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
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
    color: colors.danger,
    textAlign: 'center',
  },
  backButton: {
    width: 180,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  category: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    ...typography.display,
    fontSize: 26,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
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
  chipLabel: {
    ...typography.caption,
  },
  panel: {
    gap: spacing.sm,
  },
  panelTitle: {
    ...typography.subtitle,
  },
  panelBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  exerciseIndex: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '800',
    width: 20,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseMeta: {
    ...typography.caption,
  },
  startButton: {
    marginTop: spacing.sm,
  },
});
