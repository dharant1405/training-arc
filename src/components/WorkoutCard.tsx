import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Workout } from '../types/workout';
import { GlassPanel } from './GlassPanel';

type WorkoutCardProps = {
  workout: Workout;
  onPress: () => void;
};

export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  return (
    <Pressable onPress={onPress}>
      <GlassPanel glow style={styles.panel}>
        <View style={styles.headerRow}>
          <Text style={styles.category}>{workout.category.toUpperCase()}</Text>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{workout.difficulty}</Text>
          </View>
        </View>

        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {workout.description}
        </Text>

        <View style={styles.statsRow}>
          <Stat label="Exercises" value={String(workout.exercises.length)} />
          <Stat label="Minutes" value={String(workout.durationMinutes)} />
          <Stat label="XP" value={`+${workout.xpReward}`} accent />
        </View>
      </GlassPanel>
    </Pressable>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  difficultyBadge: {
    backgroundColor: colors.deepCrimson,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  difficultyText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  statValueAccent: {
    color: colors.gold,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
