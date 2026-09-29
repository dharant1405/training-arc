import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CinematicBackground, GlassPanel, PrimaryButton } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { useMotivationStore } from '../../../stores/motivationStore';
import type { MotivationVideo } from '../../../types/motivation';

function formatDuration(durationMs: number | null): string | null {
  if (!durationMs || durationMs <= 0) return null;
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export default function MotivationPreviewScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const video = useMotivationStore((state) => state.videos.find((item) => item.id === id));

  return (
    <CinematicBackground style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingTop: spacing.md + insets.top, paddingBottom: spacing.md + insets.bottom },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>

        <Text style={styles.eyebrow}>MOTIVATION PREVIEW</Text>

        {!video ? (
          <View style={styles.missingWrap}>
            <Text style={styles.missingTitle}>MOTIVATION UNAVAILABLE</Text>
            <Text style={styles.missingText}>This video is no longer in your library.</Text>
            <PrimaryButton label="Back to Armory" onPress={() => router.back()} style={styles.backButton} />
          </View>
        ) : (
          <PreviewPlayer video={video} />
        )}
      </View>
    </CinematicBackground>
  );
}

function PreviewPlayer({ video }: { video: MotivationVideo }) {
  const player = useVideoPlayer(video.uri);
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const durationLabel = formatDuration(video.durationMs);

  return (
    <View style={styles.playerWrap}>
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>

      <View style={styles.videoFrame}>
        <VideoView style={styles.video} player={player} nativeControls />
        {status === 'error' && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>MOTIVATION UNAVAILABLE</Text>
            <Text style={styles.errorText}>
              The original video can no longer be played from this device.
              {error?.message ? ` (${error.message})` : ''}
            </Text>
          </View>
        )}
      </View>

      <GlassPanel style={styles.infoPanel}>
        <View style={styles.infoRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{video.category.toUpperCase()}</Text>
          </View>
          {video.isFavorite && (
            <View style={styles.favoriteBadge}>
              <Text style={styles.favoriteBadgeText}>★ FAVORITE</Text>
            </View>
          )}
        </View>
        {durationLabel && <Text style={styles.metaText}>{durationLabel}</Text>}
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  backRow: {
    alignSelf: 'flex-start',
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
    fontSize: 11,
    marginTop: spacing.sm,
  },
  missingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  missingTitle: {
    ...typography.title,
    fontSize: 16,
    textAlign: 'center',
  },
  missingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    width: 180,
  },
  playerWrap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 18,
  },
  videoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: spacing.md,
    gap: spacing.xs,
  },
  errorTitle: {
    ...typography.label,
    color: colors.danger,
    fontSize: 11,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoPanel: {
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.deepCrimson,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  favoriteBadge: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  favoriteBadgeText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
