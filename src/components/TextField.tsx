import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type TextFieldProps = TextInputProps & {
  label: string;
  isPassword?: boolean;
  error?: string | null;
};

export function TextField({ label, isPassword, error, style, ...rest }: TextFieldProps) {
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View style={styles.container}>
      <Text style={typography.label}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecure}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
        />
        {isPassword && (
          <Pressable onPress={() => setIsSecure((prev) => !prev)} hitSlop={12}>
            <Text style={styles.toggle}>{isSecure ? 'SHOW' : 'HIDE'}</Text>
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    height: 50,
    color: colors.textPrimary,
    fontSize: 15,
  },
  toggle: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});
