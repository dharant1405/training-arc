import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { CinematicBackground, GlassPanel, PrimaryButton, TextField } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

const MIN_PASSWORD_LENGTH = 6;

type ScreenState = 'processing' | 'ready' | 'invalid' | 'success';

/**
 * Extracts auth params from a Supabase recovery link, which may put them in
 * the query string or the URL fragment depending on flow type. Both use the
 * same key=value&key=value shape, so this works for either.
 */
function parseAuthParams(url: string): Record<string, string> {
  const match = url.match(/[?#](.*)$/);
  if (!match) return {};
  const result: Record<string, string> = {};
  new URLSearchParams(match[1]).forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export default function ResetPasswordScreen() {
  const url = Linking.useLinkingURL();
  const signOut = useAuthStore((state) => state.signOut);

  const [screenState, setScreenState] = useState<ScreenState>('processing');
  const [linkError, setLinkError] = useState<string | null>(null);
  const processedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!url || processedUrl.current === url) return;
    processedUrl.current = url;

    const params = parseAuthParams(url);

    if (params.error || params.error_description) {
      setLinkError(
        params.error_description?.replace(/\+/g, ' ') ??
          'This reset link is invalid or has expired.',
      );
      setScreenState('invalid');
      return;
    }

    if (!params.access_token || !params.refresh_token) {
      setScreenState('invalid');
      return;
    }

    supabase.auth
      .setSession({ access_token: params.access_token, refresh_token: params.refresh_token })
      .then(({ error }) => {
        if (error) {
          if (__DEV__) console.log(`[AUTH-RESET] recovery session error=${error.message}`);
          setLinkError('This reset link is invalid or has expired.');
          setScreenState('invalid');
          return;
        }
        setScreenState('ready');
      });
  }, [url]);

  return (
    <CinematicBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>NEW PASSWORD</Text>
          <Text style={styles.headline}>Set a new password</Text>

          <GlassPanel style={styles.panel} glow>
            {screenState === 'processing' && (
              <Text style={styles.infoText}>Verifying your reset link…</Text>
            )}

            {screenState === 'invalid' && (
              <View style={styles.centeredBlock}>
                <Text style={styles.errorText}>
                  {linkError ?? 'This reset link is invalid or has expired.'}
                </Text>
                <PrimaryButton
                  label="Request a New Link"
                  onPress={() => router.replace('/(auth)/forgot-password')}
                  style={styles.submitButton}
                />
              </View>
            )}

            {screenState === 'ready' && (
              <ResetForm
                onSuccess={async () => {
                  await signOut();
                  setScreenState('success');
                }}
              />
            )}

            {screenState === 'success' && (
              <View style={styles.centeredBlock}>
                <Text style={styles.successTitle}>PASSWORD UPDATED</Text>
                <Text style={styles.infoText}>
                  Your password has been changed. Sign in with your new password to continue.
                </Text>
                <PrimaryButton
                  label="Back to Login"
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.submitButton}
                />
              </View>
            )}
          </GlassPanel>
        </ScrollView>
      </KeyboardAvoidingView>
    </CinematicBackground>
  );
}

function ResetForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setFieldError(null);
    setRequestError(null);

    if (!password) {
      setFieldError('Enter a new password.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setFieldError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    if (__DEV__) console.log('[AUTH-RESET] password update started');

    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      if (__DEV__) console.log(`[AUTH-RESET] password update error=${error.message}`);
      setRequestError(error.message);
      return;
    }

    if (__DEV__) console.log('[AUTH-RESET] password update success');
    onSuccess();
  };

  return (
    <>
      <TextField
        label="New Password"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        isPassword
      />
      <TextField
        label="Confirm Password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="••••••••"
        isPassword
        error={fieldError}
      />

      {requestError && <Text style={styles.errorText}>{requestError}</Text>}

      <PrimaryButton
        label="UPDATE PASSWORD"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submitButton}
      />
    </>
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
  eyebrow: {
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
  submitButton: {
    marginTop: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  successTitle: {
    ...typography.label,
    color: colors.gold,
    textAlign: 'center',
  },
  centeredBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
});
