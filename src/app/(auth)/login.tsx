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

export default function LoginScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (__DEV__) console.log('[AUTH-DEBUG] login pressed');
    clearError();
    setFieldError(null);

    if (!email.trim() || !password) {
      setFieldError('Enter your email and password to continue.');
      return;
    }

    const success = await signIn(email.trim(), password);
    if (success) {
      router.replace('/(tabs)/home');
    }
  };

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
          <Text style={styles.headline}>WELCOME BACK, WARRIOR</Text>

          <GlassPanel style={styles.panel} glow>
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

            <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
              Forgot Password?
            </Link>

            {(fieldError || error) && (
              <Text style={styles.error}>{fieldError ?? error}</Text>
            )}

            <PrimaryButton
              label="Enter the Arc"
              onPress={handleSubmit}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          </GlassPanel>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Link href="/(auth)/register" style={styles.link}>
              CREATE ACCOUNT
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
  forgotLink: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
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
