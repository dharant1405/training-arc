import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import type { Achievement } from '../services/gamification';
import { GlassPanel } from './GlassPanel';
import { PrimaryButton } from './PrimaryButton';

type AchievementUnlockedCardProps = {
  visible: boolean;
  achievement: Achievement | null;
  onContinue: () => void;
};

export function AchievementUnlockedCard({
  visible,
  achievement,
  onContinue,
}: AchievementUnlockedCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [visible, opacity]);

  if (!achievement) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity }]}>
          <GlassPanel glow style={styles.panel}>
            <Text style={styles.label}>ACHIEVEMENT UNLOCKED</Text>
            <Text style={styles.icon}>{achievement.icon}</Text>
            <Text style={styles.title}>{achievement.title}</Text>
            <Text style={styles.description}>{achievement.description}</Text>
            <PrimaryButton label="Continue" onPress={onContinue} style={styles.button} />
          </GlassPanel>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
  },
  panel: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.gold,
    fontSize: 12,
  },
  icon: {
    fontSize: 40,
    marginTop: spacing.xs,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    width: 180,
  },
});
