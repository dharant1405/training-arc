import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { CinematicBackground, GlassPanel, PrimaryButton, TextField } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { supabase } from '../../lib/supabase';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return; // prevent double-tap from firing a second reset email

    setFieldError(null);
    setRequestError(null);

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setFieldError('Enter the email you registered with.');
      return;
    }
    if (!EMAIL_PATTERN.test(normalized)) {
      setFieldError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    if (__DEV__) console.log('[AUTH-RESET] forgot-password requested');

    const redirectTo = Linking.createURL('/reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, { redirectTo });

    setIsSubmitting(false);

    if (error) {
      if (__DEV__) console.log(`[AUTH-RESET] reset email error=${error.message}`);
      setRequestError(error.message);
      return;
    }

    setIsSent(true);
  };

  return (
    <CinematicBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow}>
            <Text style={styles.backText}>← BACK</Text>
          </Pressable>

          <Text style={styles.eyebrow}>RESET PASSWORD</Text>
          <Text style={styles.headline}>Forgot your password?</Text>
          <Text style={styles.subtitle}>
            Enter the email on your account and we'll send you a link to reset it.
          </Text>

          <GlassPanel style={styles.panel} glow>
            {isSent ? (
              <View style={styles.successWrap}>
                <Text style={styles.successTitle}>CHECK YOUR EMAIL</Text>
                <Text style={styles.successBody}>
                  If an account exists for {email.trim()}, a reset link is on its way. Open it on
                  this device to continue.
                </Text>
                <PrimaryButton
                  label="Back to Login"
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.submitButton}
                />
              </View>
            ) : (
              <>
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="warrior@email.com"
                  keyboardType="email-address"
                  error={fieldError}
                />

                {requestError && <Text style={styles.error}>{requestError}</Text>}

                <PrimaryButton
                  label="SEND RESET LINK"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  style={styles.submitButton}
                />
              </>
            )}
          </GlassPanel>
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
    gap: spacing.md,
  },
  backRow: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.lg,
    paddingVertical: spacing.xs,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  eyebrow: {
    ...typography.label,
    color: colors.gold,
    textAlign: 'center',
    letterSpacing: 3,
    marginTop: spacing.xl,
  },
  headline: {
    ...typography.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  panel: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  successWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  successTitle: {
    ...typography.label,
    color: colors.gold,
  },
  successBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
