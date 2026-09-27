import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton, SectionHeader, XPRing } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { getLevelProgress, getRankForLevel } from '../../services/gamification';
import { getFeaturedWorkout } from '../../data/workouts';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const warriorName = (user?.user_metadata?.warrior_name as string | undefined) ?? 'Warrior';

  const profile = useProfileStore((state) => state.profile);
  const status = useProfileStore((state) => state.status);
  const error = useProfileStore((state) => state.error);
  const syncStatus = useProfileStore((state) => state.syncStatus);
  const syncError = useProfileStore((state) => state.syncError);
  const load = useProfileStore((state) => state.load);

  useEffect(() => {
    if (!user?.id) return;
    load(user.id, warriorName);
  }, [load, user?.id, warriorName]);

  const featured = getFeaturedWorkout();

  if (status === 'loading' || status === 'idle') {
    return (
      <CinematicBackground style={styles.centered}>
        <ActivityIndicator color={colors.crimson} size="large" />
      </CinematicBackground>
    );
  }

  if (status === 'error' || !profile) {
    return (
      <CinematicBackground style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Something went wrong.'}</Text>
        <PrimaryButton
          label="Retry"
          onPress={() => user?.id && load(user.id, warriorName)}
          style={styles.retryButton}
        />
      </CinematicBackground>
    );
  }

  const levelProgress = getLevelProgress(profile.totalXp);
  const rank = getRankForLevel(levelProgress.level);

  return (
    <CinematicBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>TRAINING ARC</Text>
        <Text style={styles.warriorName}>{profile.warriorName.toUpperCase()}</Text>

        {syncStatus === 'error' && (
          <Text style={styles.syncWarning}>
            ⚠ {syncError ?? 'Not synced to the cloud yet.'}
          </Text>
        )}

        <GlassPanel glow style={styles.heroPanel}>
          <View style={styles.heroRow}>
            <View style={styles.heroInfo}>
              <Text style={styles.rankLabel}>{rank.name.toUpperCase()} RANK</Text>
              <Text style={styles.streakText}>🔥 {profile.streakDays} DAY STREAK</Text>
              <Text style={styles.xpText}>
                {levelProgress.xpIntoLevel} / {levelProgress.currentLevelXp} XP
              </Text>
            </View>
            <XPRing progress={levelProgress.progress} level={levelProgress.level} size={120} />
          </View>
        </GlassPanel>

        <View style={styles.statsRow}>
          <StatCard label="Workouts" value={String(profile.workoutsCompleted)} />
          <StatCard label="Total XP" value={String(profile.totalXp)} />
          <StatCard label="Achievements" value={String(profile.achievementsUnlocked)} />
        </View>

        <SectionHeader title="Today's Training" />
        <GlassPanel glow style={styles.featuredPanel}>
          <Text style={styles.featuredCategory}>{featured.category.toUpperCase()}</Text>
          <Text style={styles.featuredTitle}>{featured.title}</Text>
          <Text style={styles.featuredMeta}>
            {featured.durationMinutes} min · +{featured.xpReward} XP
          </Text>
          <PrimaryButton
            label="Enter Training"
            onPress={() => router.push(`/workout/${featured.id}/details`)}
            style={styles.enterButton}
          />
        </GlassPanel>
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
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    width: 160,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
  },
  warriorName: {
    ...typography.display,
    fontSize: 28,
  },
  syncWarning: {
    ...typography.caption,
    color: colors.danger,
  },
  heroPanel: {
    marginTop: spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  rankLabel: {
    ...typography.subtitle,
    color: colors.gold,
  },
  streakText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '700',
  },
  xpText: {
    ...typography.caption,
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
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  featuredPanel: {
    gap: spacing.xs,
  },
  featuredCategory: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  featuredTitle: {
    ...typography.title,
  },
  featuredMeta: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  enterButton: {
    marginTop: spacing.xs,
  },
});
