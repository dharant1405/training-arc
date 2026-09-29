import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CinematicBackground, GlassPanel, PrimaryButton, TextField } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useMotivationStore } from '../../stores/motivationStore';
import { MOTIVATION_CATEGORIES, type MotivationCategory } from '../../types/motivation';

type PickedAsset = { uri: string; durationMs: number | null; fileSizeBytes: number | null };

function formatDuration(durationMs: number | null): string | null {
  if (!durationMs || durationMs <= 0) return null;
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AddMotivationScreen() {
  const insets = useSafeAreaInsets();
  const addVideo = useMotivationStore((state) => state.addVideo);

  const [asset, setAsset] = useState<PickedAsset | null>(null);
  const [isPicking, setIsPicking] = useState(true);
  const [pickError, setPickError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MotivationCategory>('Anime');
  const [formError, setFormError] = useState<string | null>(null);

  const hasLaunched = useRef(false);

  useEffect(() => {
    if (hasLaunched.current) return;
    hasLaunched.current = true;
    launchPicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const launchPicker = async () => {
    setIsPicking(true);
    setPickError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPickError('Training Arc needs permission to access your videos to add motivation clips.');
        setIsPicking(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        router.back();
        return;
      }

      const picked = result.assets[0];
      setAsset({
        uri: picked.uri,
        durationMs: picked.duration ?? null,
        fileSizeBytes: picked.fileSize ?? null,
      });
      setIsPicking(false);
    } catch {
      setPickError('Could not open your video library. Please try again.');
      setIsPicking(false);
    }
  };

  const handleSave = () => {
    if (!asset) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setFormError('Give this motivation a title.');
      return;
    }
    addVideo({ title: trimmed, category, uri: asset.uri, durationMs: asset.durationMs });
    router.back();
  };

  const fileName = asset?.uri.split('/').pop() ?? null;
  const durationLabel = asset ? formatDuration(asset.durationMs) : null;
  const fileSizeLabel = asset ? formatFileSize(asset.fileSizeBytes) : null;

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
          <Text style={styles.backText}>← CANCEL</Text>
        </Pressable>

        <Text style={styles.eyebrow}>MOTIVATION ARMORY</Text>
        <Text style={styles.headline}>ADD NEW FUEL</Text>
        <Text style={styles.subtitle}>Import something that makes you refuse to quit.</Text>

        {isPicking && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.crimson} size="large" />
            <Text style={styles.hintText}>Opening your video library…</Text>
          </View>
        )}

        {!isPicking && pickError && (
          <GlassPanel style={styles.pickerPanel}>
            <Text style={styles.pickerLabel}>SELECT MOTIVATION VIDEO</Text>
            <Text style={styles.pickerHint}>Choose a video from your device.</Text>
            <Text style={styles.errorText}>{pickError}</Text>
            <PrimaryButton label="CHOOSE VIDEO" onPress={launchPicker} style={styles.pickerButton} />
          </GlassPanel>
        )}

        {!isPicking && asset && (
          <View style={styles.form}>
            <GlassPanel style={styles.selectedPanel}>
              <Text style={styles.selectedLabel}>VIDEO SELECTED</Text>
              <Text style={styles.selectedFileName} numberOfLines={1}>
                {fileName ?? 'video'}
              </Text>
              {(durationLabel || fileSizeLabel) && (
                <Text style={styles.selectedMeta} numberOfLines={1}>
                  {[durationLabel, fileSizeLabel].filter(Boolean).join(' · ')}
                </Text>
              )}
              <Pressable onPress={launchPicker} hitSlop={8} style={styles.replaceLink}>
                <Text style={styles.replaceLinkText}>↻ CHOOSE DIFFERENT VIDEO</Text>
              </Pressable>
            </GlassPanel>

            <TextField
              label="Motivation Name"
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Never Give Up"
              error={formError}
            />

            <View style={styles.categoryBlock}>
              <Text style={styles.categoryLabel}>CATEGORY</Text>
              <View style={styles.categoryRow}>
                {MOTIVATION_CATEGORIES.map((option) => {
                  const active = option === category;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setCategory(option)}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                    >
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                        {option.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <PrimaryButton
              label="ADD TO ARMORY →"
              onPress={handleSave}
              style={styles.saveButton}
            />
          </View>
        )}
      </ScrollView>
    </CinematicBackground>
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  hintText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  pickerPanel: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pickerLabel: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
  },
  pickerHint: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  pickerButton: {
    marginTop: spacing.sm,
    width: 200,
  },
  form: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  selectedPanel: {
    gap: 2,
  },
  selectedLabel: {
    ...typography.label,
    color: colors.gold,
    fontSize: 10,
  },
  selectedFileName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  selectedMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  replaceLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  replaceLinkText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  categoryBlock: {
    gap: spacing.xs,
  },
  categoryLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 11,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
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
  saveButton: {
    marginTop: spacing.sm,
  },
});
