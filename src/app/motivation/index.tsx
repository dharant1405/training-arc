import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useMotivationStore } from '../../stores/motivationStore';
import { MOTIVATION_CATEGORIES, type MotivationCategory, type MotivationVideo } from '../../types/motivation';

type CategoryFilter = MotivationCategory | 'all';

function formatDuration(durationMs: number | null): string {
  if (!durationMs || durationMs <= 0) return '--:--';
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function MotivationLibraryScreen() {
  const insets = useSafeAreaInsets();
  const { select } = useLocalSearchParams<{ select?: string }>();
  const isSelecting = select === '1' || select === 'true';

  const videos = useMotivationStore((state) => state.videos);
  const selectedVideoId = useMotivationStore((state) => state.selectedVideoId);
  const selectVideo = useMotivationStore((state) => state.selectVideo);
  const toggleFavorite = useMotivationStore((state) => state.toggleFavorite);
  const removeVideo = useMotivationStore((state) => state.removeVideo);

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const favoriteCount = videos.filter((video) => video.isFavorite).length;
  const filteredVideos =
    activeCategory === 'all' ? videos : videos.filter((video) => video.category === activeCategory);
  const favorites = activeCategory === 'all' ? filteredVideos.filter((video) => video.isFavorite) : [];
  const others = activeCategory === 'all' ? filteredVideos.filter((video) => !video.isFavorite) : filteredVideos;

  const handleSelect = (video: MotivationVideo) => {
    if (!isSelecting) {
      router.push(`/motivation/${video.id}/preview`);
      return;
    }
    selectVideo(video.id);
    router.back();
  };

  const handleDelete = (video: MotivationVideo) => {
    Alert.alert(
      'Delete Motivation?',
      `"${video.title}" will be removed from your motivation library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeVideo(video.id) },
      ],
    );
  };

  return (
    <CinematicBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.md + insets.top, paddingBottom: spacing.xxl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>

        <Text style={styles.eyebrow}>{isSelecting ? 'CHOOSE MOTIVATION' : 'MOTIVATION ARMORY'}</Text>
        <Text style={styles.headline}>{isSelecting ? 'Pick what fuels this session.' : 'FUEL YOUR TRAINING.'}</Text>
        <Text style={styles.subtitle}>
          {isSelecting
            ? 'Your selection is locked in for this workout only.'
            : 'Choose what pushes you beyond your limits.'}
        </Text>

        {videos.length > 0 && (
          <GlassPanel style={styles.summaryPanel}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{videos.length}</Text>
              <Text style={styles.summaryLabel}>VIDEOS</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryValue, styles.summaryValueGold]}>{favoriteCount}</Text>
              <Text style={styles.summaryLabel}>FAVORITES</Text>
            </View>
          </GlassPanel>
        )}

        <PrimaryButton
          label="+ ADD MOTIVATION"
          onPress={() => router.push('/motivation/add')}
          style={styles.addButton}
        />

        {videos.length === 0 ? (
          <GlassPanel style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>ARMORY EMPTY</Text>
            <Text style={styles.emptySubtitle}>Add your first motivation video to begin.</Text>
          </GlassPanel>
        ) : (
          <>
            <View style={styles.categoryRow}>
              <CategoryChip
                label="All"
                active={activeCategory === 'all'}
                onPress={() => setActiveCategory('all')}
              />
              {MOTIVATION_CATEGORIES.map((category) => (
                <CategoryChip
                  key={category}
                  label={category}
                  active={activeCategory === category}
                  onPress={() => setActiveCategory(category)}
                />
              ))}
            </View>

            {filteredVideos.length === 0 ? (
              <GlassPanel style={styles.emptyPanel}>
                <Text style={styles.emptyTitle}>NO MOTIVATION HERE</Text>
                <Text style={styles.emptySubtitle}>Add a video to this category.</Text>
              </GlassPanel>
            ) : (
              <>
                {favorites.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>FAVORITES</Text>
                    {favorites.map((video) => (
                      <MotivationCard
                        key={video.id}
                        video={video}
                        isSelecting={isSelecting}
                        isSelected={video.id === selectedVideoId}
                        onPress={() => handleSelect(video)}
                        onToggleFavorite={() => toggleFavorite(video.id)}
                        onDelete={() => handleDelete(video)}
                      />
                    ))}
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {activeCategory === 'all' ? 'MY MOTIVATION' : activeCategory.toUpperCase()}
                  </Text>
                  {others.map((video) => (
                    <MotivationCard
                      key={video.id}
                      video={video}
                      isSelecting={isSelecting}
                      isSelected={video.id === selectedVideoId}
                      onPress={() => handleSelect(video)}
                      onToggleFavorite={() => toggleFavorite(video.id)}
                      onDelete={() => handleDelete(video)}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </CinematicBackground>
  );
}

function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.categoryChip, active && styles.categoryChipActive]}>
      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

function MotivationCard({
  video,
  isSelecting,
  isSelected,
  onPress,
  onToggleFavorite,
  onDelete,
}: {
  video: MotivationVideo;
  isSelecting: boolean;
  isSelected: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <GlassPanel
          style={StyleSheet.flatten([
            styles.card,
            video.isFavorite && styles.cardFavorite,
            isSelected && styles.cardSelected,
            pressed && styles.cardPressed,
          ])}
        >
          <View style={styles.thumbnail}>
            <Text style={styles.thumbnailIcon}>▶</Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {video.title}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {video.category.toUpperCase()} · {formatDuration(video.durationMs)}
            </Text>
            {isSelected && <Text style={styles.selectedHint}>SELECTED</Text>}
            {isSelecting && !isSelected && <Text style={styles.selectHint}>TAP TO USE THIS VIDEO</Text>}
          </View>

          <View style={styles.cardActions}>
            <Pressable onPress={onToggleFavorite} hitSlop={10} style={styles.iconButton}>
              <Text style={[styles.iconText, video.isFavorite && styles.iconTextActive]}>
                {video.isFavorite ? '★' : '☆'}
              </Text>
            </Pressable>
            <Pressable onPress={onDelete} hitSlop={10} style={styles.iconButton}>
              <Text style={styles.deleteIcon}>🗑</Text>
            </Pressable>
          </View>
        </GlassPanel>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  backRow: {
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
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
  headline: {
    ...typography.display,
    fontSize: 22,
    marginTop: 2,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  summaryValueGold: {
    color: colors.gold,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  addButton: {
    marginTop: spacing.md,
  },
  emptyPanel: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 15,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.glass,
  },
  categoryChipActive: {
    backgroundColor: colors.deepCrimson,
    borderColor: colors.gold,
  },
  categoryChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  cardFavorite: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  cardSelected: {
    borderColor: colors.crimson,
  },
  cardPressed: {
    opacity: 0.8,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.deepCrimson,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbnailIcon: {
    color: colors.white,
    fontSize: 18,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardMeta: {
    ...typography.caption,
  },
  selectHint: {
    ...typography.label,
    color: colors.gold,
    fontSize: 9,
    marginTop: 2,
  },
  selectedHint: {
    ...typography.label,
    color: colors.crimson,
    fontSize: 9,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexShrink: 0,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  iconTextActive: {
    color: colors.gold,
  },
  deleteIcon: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
