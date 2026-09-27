import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CinematicBackground, GlassPanel } from '../components';
import { colors, spacing, typography } from '../theme';
import { useProfileStore } from '../stores/profileStore';
import { ACHIEVEMENTS } from '../services/gamification';

export default function AchievementsScreen() {
  const profile = useProfileStore((state) => state.profile);
  const unlockedIds = profile?.unlockedAchievementIds ?? [];

  return (
    <CinematicBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>ACHIEVEMENTS</Text>
        <Text style={styles.headline}>
          {unlockedIds.length} / {ACHIEVEMENTS.length} unlocked
        </Text>

        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = unlockedIds.includes(achievement.id);
          return (
            <GlassPanel key={achievement.id} style={styles.card}>
              <Text style={styles.icon}>{unlocked ? achievement.icon : '🔒'}</Text>
              <View style={styles.info}>
                <Text style={[styles.name, !unlocked && styles.lockedText]}>
                  {achievement.title}
                </Text>
                <Text style={styles.description}>{achievement.description}</Text>
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
});
