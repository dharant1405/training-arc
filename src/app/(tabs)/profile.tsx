import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);
  const warriorName = (user?.user_metadata?.warrior_name as string | undefined) ?? 'Warrior';

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <CinematicBackground style={styles.container}>
      <GlassPanel glow style={styles.panel}>
        <Text style={styles.title}>{warriorName.toUpperCase()}</Text>
        <Text style={styles.message}>
          Your full warrior profile — attributes, avatar, and rank history — arrives in the next
          phase.
        </Text>
        <PrimaryButton
          label="Sign Out"
          onPress={handleSignOut}
          variant="ghost"
          style={styles.signOutButton}
        />
      </GlassPanel>
    </CinematicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  panel: {
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  title: {
    ...typography.title,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  signOutButton: {
    marginTop: spacing.md,
    width: '100%',
  },
});
