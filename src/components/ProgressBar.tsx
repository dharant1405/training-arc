import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type ProgressBarProps = {
  progress: number; // 0..1
  height?: number;
};

export function ProgressBar({ progress, height = 8 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.glass,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.crimson,
  },
});
