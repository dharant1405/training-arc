import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CinematicBackground, GlassPanel, ProgressBar } from '../components';
import { colors, spacing, typography } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { useProfileStore } from '../stores/profileStore';
import { useProgressStore } from '../stores/progressStore';
import { ACHIEVEMENTS, getAchievementProgress, getLevelProgress } from '../services/gamification';
import type { Achievement } from '../services/gamification';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const unlockedAt = useProgressStore((state) => state.achievementUnlockedAt);
  const loadProgress = useProgressStore((state) => state.load);

  useEffect(() => {
    if (user?.id) loadProgress(user.id);
  }, [loadProgress, user?.id]);

  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [entrance]);

  const unlockedIds = profile?.unlockedAchievementIds ?? [];
  const level = profile ? getLevelProgress(profile.totalXp).level : 1;
  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;
  const lockedCount = totalCount - unlockedCount;

  const entranceStyle = {
    opacity: entrance,
    transform: [
      { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  return (
    <CinematicBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.md + insets.top, paddingBottom: spacing.xxl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={entranceStyle}>
          <Text style={styles.eyebrow}>ACHIEVEMENTS</Text>
          <Text style={styles.headline}>PROVE YOUR PROGRESS.</Text>
          <Text style={styles.subtitle}>Every mission completed leaves a mark.</Text>

          <GlassPanel style={styles.overviewPanel}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewValue}>{unlockedCount}</Text>
                <Text style={styles.overviewLabel}>UNLOCKED</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={[styles.overviewValue, styles.overviewValueMuted]}>{lockedCount}</Text>
                <Text style={styles.overviewLabel}>LOCKED</Text>
              </View>
            </View>
            <View style={styles.overviewBarWrap}>
              <ProgressBar progress={totalCount > 0 ? unlockedCount / totalCount : 0} height={6} />
            </View>
          </GlassPanel>

          {profile && unlockedCount === 0 && (
            <View style={styles.emptyNotice}>
              <Text style={styles.emptyTitle}>NO ACHIEVEMENTS YET</Text>
              <Text style={styles.emptyText}>
                Complete your first training mission to begin your collection.
              </Text>
            </View>
          )}

          <View style={styles.list}>
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = unlockedIds.includes(achievement.id);
              const progress = profile
                ? getAchievementProgress(achievement.id, profile, level)
                : null;
              const unlockedDate = unlockedAt[achievement.id];

              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={unlocked}
                  unlockedDate={unlockedDate}
                  progress={progress}
                />
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </CinematicBackground>
  );
}

function AchievementCard({
  achievement,
  unlocked,
  unlockedDate,
  progress,
}: {
  achievement: Achievement;
  unlocked: boolean;
  unlockedDate: string | undefined;
  progress: { current: number; target: number } | null;
}) {
  return (
    <GlassPanel style={StyleSheet.flatten([styles.card, !unlocked && styles.cardLocked])}>
      <View style={[styles.iconBadge, unlocked && styles.iconBadgeUnlocked]}>
        <Text style={styles.icon}>{unlocked ? achievement.icon : '🔒'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, !unlocked && styles.lockedText]} numberOfLines={1}>
          {achievement.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {achievement.description}
        </Text>

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
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
  },
  headline: {
    ...typography.display,
    fontSize: 24,
    marginTop: 2,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  overviewPanel: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewStat: {
    flex: 1,
    alignItems: 'center',
  },
  overviewValue: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: '800',
  },
  overviewValueMuted: {
    color: colors.textSecondary,
  },
  overviewLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  overviewDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  overviewBarWrap: {
    marginTop: 2,
  },
  emptyNotice: {
    marginTop: spacing.md,
    gap: 2,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 15,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  list: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardLocked: {
    opacity: 0.7,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBadgeUnlocked: {
    backgroundColor: colors.deepCrimson,
    borderColor: colors.gold,
  },
  icon: {
    fontSize: 22,
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
