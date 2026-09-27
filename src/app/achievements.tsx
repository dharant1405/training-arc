import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CinematicBackground, GlassPanel } from '../components';
import { colors, spacing, typography } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { useProfileStore } from '../stores/profileStore';
import { useProgressStore } from '../stores/progressStore';
import { ACHIEVEMENTS, getAchievementProgress, getLevelProgress } from '../services/gamification';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const unlockedAt = useProgressStore((state) => state.achievementUnlockedAt);
  const loadProgress = useProgressStore((state) => state.load);

  useEffect(() => {
    if (user?.id) loadProgress(user.id);
  }, [loadProgress, user?.id]);

  const unlockedIds = profile?.unlockedAchievementIds ?? [];
  const level = profile ? getLevelProgress(profile.totalXp).level : 1;

  return (
    <CinematicBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.lg + insets.top, paddingBottom: spacing.xxl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>ACHIEVEMENTS</Text>
        <Text style={styles.headline}>
          {unlockedIds.length} / {ACHIEVEMENTS.length} unlocked
        </Text>

        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = unlockedIds.includes(achievement.id);
          const progress = profile
            ? getAchievementProgress(achievement.id, profile, level)
            : null;
          const unlockedDate = unlockedAt[achievement.id];

          return (
            <GlassPanel key={achievement.id} style={styles.card}>
              <Text style={styles.icon}>{unlocked ? achievement.icon : '🔒'}</Text>
              <View style={styles.info}>
                <Text style={[styles.name, !unlocked && styles.lockedText]}>
                  {achievement.title}
                </Text>
                <Text style={styles.description}>{achievement.description}</Text>

                {unlocked ? (
                  <Text style={styles.unlockedLabel}>
                    UNLOCKED
                    {unlockedDate ? ` · ${new Date(unlockedDate).toLocaleDateString()}` : ''}
                  </Text>
                ) : (
                  progress && (
                    <Text style={styles.progressLabel}>
                      {progress.current} / {progress.target}
                    </Text>
                  )
                )}
              </View>
            </GlassPanel>
          );
        })}
      </ScrollView>
    </CinematicBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
  },
  headline: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  lockedText: {
    color: colors.textMuted,
  },
  description: {
    ...typography.caption,
  },
  unlockedLabel: {
    ...typography.label,
    color: colors.success,
    fontSize: 10,
    marginTop: 4,
  },
  progressLabel: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
    marginTop: 4,
  },
});
