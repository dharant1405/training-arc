import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton, TextField } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../stores/authStore';

export default function RegisterScreen() {
  const signUp = useAuthStore((state) => state.signUp);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [warriorName, setWarriorName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const handleSubmit = async () => {
    clearError();
    setFieldError(null);

    if (!warriorName.trim() || !email.trim() || !password) {
      setFieldError('Fill in every field to begin your arc.');
      return;
    }
    if (password.length < 6) {
      setFieldError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setFieldError('Passwords do not match.');
      return;
    }

    const success = await signUp(email.trim(), password, warriorName.trim());
    if (success) {
      setAwaitingConfirmation(true);
    }
  };

  if (awaitingConfirmation) {
    return (
      <CinematicBackground style={styles.centeredContainer}>
        <GlassPanel glow style={styles.confirmPanel}>
          <Text style={styles.headline}>ARC INITIATED</Text>
          <Text style={styles.confirmText}>
            Check your email to confirm your account, then return to enter the arc.
          </Text>
          <PrimaryButton
            label="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.submitButton}
          />
        </GlassPanel>
      </CinematicBackground>
    );
  }

  return (
    <CinematicBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>TRAINING ARC</Text>
          <Text style={styles.headline}>BEGIN YOUR ARC</Text>

          <GlassPanel style={styles.panel} glow>
            <TextField
              label="Warrior Name"
              value={warriorName}
              onChangeText={setWarriorName}
              placeholder="Your warrior identity"
              autoCapitalize="words"
            />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="warrior@email.com"
              keyboardType="email-address"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              isPassword
            />
            <TextField
              label="Confirm"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              isPassword
            />

            {(fieldError || error) && (
              <Text style={styles.error}>{fieldError ?? error}</Text>
            )}

            <PrimaryButton
              label="Create Account"
              onPress={handleSubmit}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          </GlassPanel>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already a warrior?</Text>
            <Link href="/(auth)/login" style={styles.link}>
              SIGN IN
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </CinematicBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    textAlign: 'center',
    letterSpacing: 3,
  },
  headline: {
    ...typography.title,
    textAlign: 'center',
  },
  panel: {
    gap: spacing.md,
  },
  confirmPanel: {
    gap: spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  link: {
    ...typography.label,
    color: colors.gold,
  },
});
