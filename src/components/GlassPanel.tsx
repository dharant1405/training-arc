import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

type GlassPanelProps = ViewProps & {
  style?: ViewStyle;
  glow?: boolean;
};

export function GlassPanel({ style, glow, children, ...rest }: GlassPanelProps) {
  return (
    <View style={[styles.panel, glow && styles.glow, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 20,
  },
  glow: {
    shadowColor: colors.crimson,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
