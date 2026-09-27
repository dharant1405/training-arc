import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { GlassPanel } from './GlassPanel';
import { PrimaryButton } from './PrimaryButton';

type LevelUpCelebrationProps = {
  visible: boolean;
  fromLevel: number;
  toLevel: number;
  xpAwarded: number;
  onContinue: () => void;
};

export function LevelUpCelebration({
  visible,
  fromLevel,
  toLevel,
  xpAwarded,
  onContinue,
}: LevelUpCelebrationProps) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.85);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [visible, scale, opacity]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <GlassPanel glow style={styles.panel}>
            <Text style={styles.bolt}>⚡</Text>
            <Text style={styles.label}>LEVEL UP</Text>
            <Text style={styles.levelLine}>
              LEVEL {fromLevel} → LEVEL {toLevel}
            </Text>
            <Text style={styles.xp}>+{xpAwarded} XP</Text>
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
  bolt: {
    fontSize: 40,
  },
  label: {
    ...typography.label,
    color: colors.gold,
    fontSize: 14,
  },
  levelLine: {
    ...typography.display,
    fontSize: 22,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  xp: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  button: {
    marginTop: spacing.md,
    width: 180,
  },
});
