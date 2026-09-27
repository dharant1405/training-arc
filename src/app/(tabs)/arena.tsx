import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CinematicBackground, SectionHeader, WorkoutCard } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { WORKOUTS, getFeaturedWorkout } from '../../data/workouts';
import type { Workout } from '../../types/workout';

export default function ArenaScreen() {
  const insets = useSafeAreaInsets();
  const featured = getFeaturedWorkout();
  const otherWorkouts = WORKOUTS.filter((workout) => workout.id !== featured.id);

  const openWorkout = (workout: Workout) => {
    router.push(`/workout/${workout.id}/details`);
  };

  return (
    <CinematicBackground>
      <FlatList
        data={otherWorkouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: spacing.lg + insets.top }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.brand}>TRAINING ARENA</Text>
            <Text style={styles.headline}>What will you train today?</Text>

            <SectionHeader title="Featured Trial" />
            <WorkoutCard workout={featured} onPress={() => openWorkout(featured)} />

            <View style={styles.sectionSpacer}>
              <SectionHeader title="More Trials" />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardSpacer}>
            <WorkoutCard workout={item} onPress={() => openWorkout(item)} />
          </View>
        )}
      />
    </CinematicBackground>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
  },
  headline: {
    ...typography.title,
  },
  sectionSpacer: {
    marginTop: spacing.sm,
  },
  cardSpacer: {
    marginBottom: spacing.md,
  },
});
