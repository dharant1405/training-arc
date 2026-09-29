import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton, SectionHeader, XPRing } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { getLevelProgress, getRankForLevel } from '../../services/gamification';
import { getFeaturedWorkout } from '../../data/workouts';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const warriorName = (user?.user_metadata?.warrior_name as string | undefined) ?? 'Warrior';

  const profile = useProfileStore((state) => state.profile);
  const status = useProfileStore((state) => state.status);
  const error = useProfileStore((state) => state.error);
  const syncStatus = useProfileStore((state) => state.syncStatus);
  const load = useProfileStore((state) => state.load);

  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user?.id) return;
    load(user.id, warriorName);
  }, [load, user?.id, warriorName]);

  useEffect(() => {
    if (status !== 'ready') return;
    entrance.setValue(0);
    Animated.timing(entrance, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [status, entrance]);

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
  const initial = profile.warriorName.charAt(0).toUpperCase() || 'W';
  const goProfile = () => router.push('/(tabs)/profile');

  const entranceStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
      },
    ],
  };

  return (
    <CinematicBackground>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: spacing.md + insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={entranceStyle}>
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.identityTap, pressed && styles.pressed]}
              onPress={goProfile}
              hitSlop={8}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
              <View style={styles.identityText}>
                <Text style={styles.greeting}>WELCOME BACK</Text>
                <Text style={styles.warriorName} numberOfLines={1}>
                  {profile.warriorName.toUpperCase()}
                </Text>
                <Text style={styles.identityMeta} numberOfLines={1}>
                  {rank.name.toUpperCase()} RANK <Text style={styles.identityDot}>•</Text> LV{' '}
                  {levelProgress.level}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
              onPress={goProfile}
              hitSlop={10}
            >
              <Text style={styles.settingsIcon}>⚙</Text>
            </Pressable>
          </View>

          {syncStatus === 'error' && (
            <View style={styles.syncBanner}>
              <View style={styles.syncIconWrap}>
                <Text style={styles.syncIcon}>!</Text>
              </View>
              <View style={styles.syncTextWrap}>
                <Text style={styles.syncTitle}>Cloud sync unavailable</Text>
                <Text style={styles.syncSubtitle} numberOfLines={1}>
                  Progress is saved locally.
                </Text>
              </View>
            </View>
          )}

          <GlassPanel style={styles.heroPanel}>
            <Text style={styles.heroRank}>{rank.name.toUpperCase()} RANK</Text>

            <View style={styles.ringWrap}>
              <View style={styles.ringGlow} />
              <XPRing progress={levelProgress.progress} level={levelProgress.level} size={140} strokeWidth={10} />
            </View>

            <Text style={styles.heroXp}>
              {levelProgress.xpIntoLevel} / {levelProgress.currentLevelXp} XP
            </Text>

            <View style={styles.heroDivider} />

            <Text style={styles.nextLevelLabel}>NEXT LEVEL</Text>
            <Text style={styles.nextLevelValue}>{levelProgress.xpToNextLevel} XP TO GO</Text>
          </GlassPanel>

          <View style={styles.streakStrip}>
            {profile.streakDays > 0 ? (
              <Text style={styles.streakActive}>🔥 {profile.streakDays} DAY STREAK</Text>
            ) : (
              <View style={styles.streakZeroWrap}>
                <Text style={styles.streakZeroTitle}>🔥 START YOUR STREAK</Text>
                <Text style={styles.streakZeroSubtitle}>Complete your first training today.</Text>
              </View>
            )}
          </View>

          <PrimaryButton
            label="START TRAINING  →"
            onPress={() => router.push('/(tabs)/arena')}
            style={styles.ctaButton}
          />

          <View style={styles.statsRow}>
            <StatCard label="WORKOUTS" value={String(profile.workoutsCompleted)} />
            <StatCard label="STREAK" value={String(profile.streakDays)} />
            <StatCard label="TOTAL XP" value={String(profile.totalXp)} />
          </View>

          <View style={styles.featuredSection}>
            <SectionHeader title="FEATURED TRAINING" />
            <GlassPanel style={styles.featuredPanel}>
              <Text style={styles.featuredCategory} numberOfLines={1}>
                {featured.category.toUpperCase()}
              </Text>
              <Text style={styles.featuredTitle} numberOfLines={1}>
                {featured.title}
              </Text>
              <Text style={styles.featuredMeta} numberOfLines={1}>
                {featured.durationMinutes} MIN · +{featured.xpReward} XP
              </Text>
              <PrimaryButton
                label="ENTER TRAINING →"
                variant="ghost"
                onPress={() => router.push(`/workout/${featured.id}/details`)}
                style={styles.featuredButton}
              />
            </GlassPanel>
          </View>
        </Animated.View>
      </ScrollView>
    </CinematicBackground>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel style={styles.statCard}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
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
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  identityTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.deepCrimson,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  identityText: {
    flex: 1,
    gap: 1,
  },
  greeting: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  warriorName: {
    ...typography.title,
    fontSize: 18,
  },
  identityMeta: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: '700',
    fontSize: 11,
  },
  identityDot: {
    color: colors.textMuted,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.crimson,
    borderRadius: 10,
  },
  syncIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.deepCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncIcon: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  syncTextWrap: {
    flex: 1,
    gap: 1,
  },
  syncTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  syncSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
  },
  heroPanel: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
  },
  heroRank: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
  },
  ringWrap: {
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGlow: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: colors.crimsonGlow,
    opacity: 0.16,
  },
  heroXp: {
    ...typography.body,
    marginTop: spacing.xs,
    fontWeight: '700',
    fontSize: 13,
  },
  heroDivider: {
    width: '50%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  nextLevelLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
  },
  nextLevelValue: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  streakStrip: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  streakActive: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '700',
  },
  streakZeroWrap: {
    alignItems: 'center',
    gap: 1,
  },
  streakZeroTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  streakZeroSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
  },
  ctaButton: {
    marginTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  featuredSection: {
    marginTop: spacing.md,
  },
  featuredPanel: {
    gap: 2,
  },
  featuredCategory: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  featuredTitle: {
    ...typography.title,
    fontSize: 19,
    marginTop: 2,
  },
  featuredMeta: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  featuredButton: {
    marginTop: spacing.xs,
  },
});
