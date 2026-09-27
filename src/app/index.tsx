import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CinematicBackground } from '../components';
import { colors, spacing, typography } from '../theme';
import { useAuthStore } from '../stores/authStore';

const MIN_SPLASH_MS = 1400;

export default function SplashScreen() {
  const status = useAuthStore((state) => state.status);
  const fade = useRef(new Animated.Value(0)).current;
  const startedAt = useRef(Date.now());

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  useEffect(() => {
    if (status === 'checking') return;

    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);

    const timeout = setTimeout(() => {
      router.replace(status === 'signedIn' ? '/(tabs)/home' : '/(auth)/login');
    }, remaining);

    return () => clearTimeout(timeout);
  }, [status]);

  return (
    <CinematicBackground style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <Text style={styles.title}>TRAINING ARC</Text>
        <Text style={styles.tagline}>DISCIPLINE BUILDS LEGENDS</Text>
        <View style={styles.loadingBar}>
          <View style={styles.loadingFill} />
        </View>
        <Text style={styles.footer}>FORGE YOUR LIMITS</Text>
      </Animated.View>
    </CinematicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.display,
    color: colors.white,
    letterSpacing: 4,
  },
  tagline: {
    ...typography.label,
    color: colors.gold,
  },
  loadingBar: {
    width: 160,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.glass,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  loadingFill: {
    width: '60%',
    height: '100%',
    backgroundColor: colors.crimson,
  },
  footer: {
    ...typography.caption,
    marginTop: spacing.xxl,
    letterSpacing: 2,
  },
});
