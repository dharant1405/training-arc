import { useEffect, useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton, SectionHeader } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useProfileStore } from '../../stores/profileStore';
import { getLevelProgress, getRankForLevel } from '../../services/gamification';
import { WORKOUTS, getFeaturedWorkout } from '../../data/workouts';
import type { Difficulty, Workout } from '../../types/workout';

export default function ArenaScreen() {
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((state) => state.profile);
  const featured = getFeaturedWorkout();
  const otherWorkouts = WORKOUTS.filter((workout) => workout.id !== featured.id);

  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [entrance]);

  const openWorkout = (workout: Workout) => {
    router.push(`/workout/${workout.id}/details`);
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [
      { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  const levelProgress = profile ? getLevelProgress(profile.totalXp) : null;
  const rank = levelProgress ? getRankForLevel(levelProgress.level) : null;

  return (
    <CinematicBackground>
      <FlatList
        data={otherWorkouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: spacing.md + insets.top }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View style={entranceStyle}>
            <View style={styles.header}>
              <Text style={styles.brand}>TRAINING ARENA</Text>
              <Text style={styles.subtitle}>Choose your next challenge.</Text>

              {profile && levelProgress && rank && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusText} numberOfLines={1}>
                    LV {levelProgress.level} <Text style={styles.statusDot}>•</Text>{' '}
                    {rank.name.toUpperCase()} <Text style={styles.statusDot}>•</Text> {profile.totalXp} XP
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.featuredWrap}>
              <Text style={styles.featuredEyebrow}>FEATURED MISSION</Text>
              <GlassPanel style={styles.featuredCard}>
                <Text style={styles.featuredCategory} numberOfLines={1}>
                  {featured.category.toUpperCase()}
                </Text>
                <Text style={styles.featuredTitle} numberOfLines={1}>
                  {featured.title}
                </Text>

                <View style={styles.featuredBadgeRow}>
                  <DifficultyBadge difficulty={featured.difficulty} />
                  <Text style={styles.featuredMetaText} numberOfLines={1}>
                    {featured.durationMinutes} MIN · {featured.exercises.length} EX · +{featured.xpReward} XP
                  </Text>
                </View>

                <PrimaryButton
                  label="ENTER TRAINING →"
                  onPress={() => openWorkout(featured)}
                  style={styles.featuredButton}
                />
              </GlassPanel>
            </View>

            <View style={styles.monitorWrap}>
              <Text style={styles.monitorEyebrow}>TRAINING TOOLS</Text>
              <GlassPanel style={styles.monitorCard}>
                <Text style={styles.monitorTitle} numberOfLines={1}>
                  PUSH-UP MONITOR
                </Text>
                <Text style={styles.monitorSubtitle}>
                  Open the live camera while you train push-ups.
                </Text>
                <Text style={styles.monitorNote}>
                  No pose engine on this build — repetitions are not counted yet.
                </Text>
                <PrimaryButton
                  label="OPEN MONITOR"
                  onPress={() => router.push('/push-up-monitor')}
                  variant="ghost"
                  style={styles.monitorButton}
                />
              </GlassPanel>
            </View>

            <View style={styles.listHeaderSpacer}>
              <SectionHeader title="AVAILABLE MISSIONS" />
            </View>
          </Animated.View>
        }
        ListEmptyComponent={
          <GlassPanel style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>NO TRAINING MISSIONS</Text>
            <Text style={styles.emptySubtitle}>Your arena is waiting.</Text>
          </GlassPanel>
        }
        renderItem={({ item }) => (
          <View style={styles.cardSpacer}>
            <MissionCard workout={item} onPress={() => openWorkout(item)} />
          </View>
        )}
      />
    </CinematicBackground>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{difficulty.toUpperCase()}</Text>
    </View>
  );
}

function MissionCard({ workout, onPress }: { workout: Workout; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <GlassPanel style={StyleSheet.flatten([styles.missionCard, pressed && styles.missionCardPressed])}>
          <View style={styles.missionInfo}>
            <Text style={styles.missionCategory} numberOfLines={1}>
              {workout.category.toUpperCase()}
            </Text>
            <Text style={styles.missionTitle} numberOfLines={1}>
              {workout.title}
            </Text>
            <View style={styles.missionMetaRow}>
              <DifficultyBadge difficulty={workout.difficulty} />
              <Text style={styles.missionMetaText} numberOfLines={1}>
                {workout.durationMinutes} MIN
              </Text>
            </View>
            <Text style={styles.missionXp} numberOfLines={1}>
              +{workout.xpReward} XP
            </Text>
          </View>

          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>VIEW</Text>
          </View>
        </GlassPanel>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: 2,
    marginBottom: spacing.md,
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
  },
  subtitle: {
    ...typography.title,
    fontSize: 20,
    marginTop: 2,
  },
  statusRow: {
    marginTop: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  statusDot: {
    color: colors.textMuted,
  },
  featuredWrap: {
    marginBottom: spacing.lg,
  },
  featuredEyebrow: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  featuredCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.crimson,
    gap: 2,
  },
  featuredCategory: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  featuredTitle: {
    ...typography.display,
    fontSize: 24,
    marginTop: 2,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  featuredMetaText: {
    ...typography.caption,
    flexShrink: 1,
  },
  featuredButton: {
    marginTop: spacing.md,
  },
  monitorWrap: {
    marginBottom: spacing.lg,
  },
  monitorEyebrow: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  monitorCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    gap: 2,
  },
  monitorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  monitorSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  monitorNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  monitorButton: {
    marginTop: spacing.md,
    height: 44,
  },
  listHeaderSpacer: {
    marginTop: spacing.xs,
  },
  cardSpacer: {
    marginBottom: spacing.sm,
  },
  emptyPanel: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  missionCardPressed: {
    opacity: 0.8,
  },
  missionInfo: {
    flex: 1,
    gap: 2,
  },
  missionCategory: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  missionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  missionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  missionMetaText: {
    ...typography.caption,
  },
  missionXp: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.deepCrimson,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewButton: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewButtonText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
