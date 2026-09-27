import { StyleSheet, Text } from 'react-native';
import { CinematicBackground } from './CinematicBackground';
import { GlassPanel } from './GlassPanel';
import { colors, spacing, typography } from '../theme';

type ComingSoonProps = {
  title: string;
  message?: string;
};

export function ComingSoon({ title, message }: ComingSoonProps) {
  return (
    <CinematicBackground style={styles.container}>
      <GlassPanel glow style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>
          {message ?? 'This chapter of your arc is being forged. Check back soon, warrior.'}
        </Text>
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
  },
  title: {
    ...typography.title,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
