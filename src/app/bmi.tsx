import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton, TextField } from '../components';
import { colors, radius, spacing, typography } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { selectMetricsForUser, useBmiStore } from '../stores/bmiStore';
import {
  BMI_CATEGORIES,
  BMI_SCALE_MAX,
  BMI_SCALE_MIN,
  calculateBmi,
  formatBmi,
  getBmiBandWeight,
  getBmiCategory,
  getBmiScaleProgress,
  validateBodyMetrics,
} from '../services/bmi';
import type { BmiCategoryId, BodyMetrics, BodyMetricsFieldErrors } from '../types/bmi';

// One color per category, drawn from the existing Training Arc palette.
const CATEGORY_COLORS: Record<BmiCategoryId, string> = {
  underweight: colors.textSecondary,
  normal: colors.success,
  overweight: colors.gold,
  obesity: colors.crimson,
};

function formatRecordedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * V2 Feature 1 — Body Metrics / BMI monitoring.
 *
 * Reads and writes only what the warrior entered (height, weight) and derives
 * BMI from it. Measurements are stored locally per user id through bmiStore;
 * nothing on this screen touches auth, gamification or workout state.
 */
export default function BodyMetricsScreen() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);

  const hydrated = useBmiStore((state) => state.hydrated);
  const measurements = useBmiStore((state) => selectMetricsForUser(state, userId));
  const saveMetrics = useBmiStore((state) => state.saveMetrics);

  const [isEditing, setIsEditing] = useState(false);
  const [draftHeight, setDraftHeight] = useState('');
  const [draftWeight, setDraftWeight] = useState('');
  const [fieldErrors, setFieldErrors] = useState<BodyMetricsFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [entrance]);

  const latest: BodyMetrics | null =
    measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const bmi = latest ? calculateBmi(latest.heightCm, latest.weightKg) : null;
  const category = bmi === null ? null : getBmiCategory(bmi);
  const hasMetrics = Boolean(latest) && bmi !== null && category !== null;

  const openEditor = () => {
    setDraftHeight(latest ? String(latest.heightCm) : '');
    setDraftWeight(latest ? String(latest.weightKg) : '');
    setFieldErrors({});
    setFormError(null);
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setFieldErrors({});
    setFormError(null);
  };

  const handleSave = () => {
    const { errors, input } = validateBodyMetrics({ heightCm: draftHeight, weightKg: draftWeight });
    setFieldErrors(errors);
    if (!input) {
      setFormError('Enter a realistic height and weight to save your body metrics.');
      return;
    }
    if (!userId) {
      setFormError('Sign in again to save your body metrics.');
      return;
    }
    if (!saveMetrics(userId, input)) {
      setFormError('Could not save your body metrics. Please try again.');
      return;
    }
    closeEditor();
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [
      { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  return (
    <CinematicBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.md + insets.top, paddingBottom: spacing.xxl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>

        <Text style={styles.eyebrow}>BODY METRICS</Text>
        <Text style={styles.headline}>KNOW YOUR BASELINE.</Text>
        <Text style={styles.subtitle}>
          Height and weight only — BMI is calculated on this device from what you enter.
        </Text>

        {!hydrated && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.crimson} size="large" />
            <Text style={styles.hintText}>Reading your body metrics…</Text>
          </View>
        )}

        {hydrated && !hasMetrics && (
          <GlassPanel style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>BODY METRICS</Text>
            <Text style={styles.emptyText}>Add your height and weight to track BMI.</Text>
            <PrimaryButton label="SET BODY METRICS" onPress={openEditor} style={styles.primaryAction} />
          </GlassPanel>
        )}

        {hydrated && hasMetrics && latest && bmi !== null && category !== null && (
          <Animated.View style={entranceStyle}>
            <GlassPanel style={styles.bmiPanel}>
              <Text style={styles.bmiLabel}>CURRENT BMI</Text>
              <Text style={styles.bmiValue}>{formatBmi(bmi)}</Text>

              <View style={[styles.categoryChip, { borderColor: CATEGORY_COLORS[category.id] }]}>
                <Text style={[styles.categoryChipText, { color: CATEGORY_COLORS[category.id] }]}>
                  {category.label}
                </Text>
              </View>
              <Text style={styles.bmiRange}>{category.rangeLabel}</Text>

              <View style={styles.scaleWrap}>
                <View style={styles.scaleTrack}>
                  {BMI_CATEGORIES.map((band) => (
                    <View
                      key={band.id}
                      style={[
                        styles.scaleBand,
                        { flex: getBmiBandWeight(band), backgroundColor: CATEGORY_COLORS[band.id] },
                      ]}
                    />
                  ))}
                </View>
                <View style={[styles.scaleMarker, { left: `${getBmiScaleProgress(bmi) * 100}%` }]} />
              </View>

              <View style={styles.scaleBounds}>
                <Text style={styles.scaleBound}>{BMI_SCALE_MIN}</Text>
                <Text style={styles.scaleBound}>{BMI_SCALE_MAX}</Text>
              </View>

              <View style={styles.legend}>
                {BMI_CATEGORIES.map((band) => (
                  <View key={band.id} style={styles.legendRow}>
                    <View
                      style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[band.id] }]}
                    />
                    <Text style={styles.legendLabel} numberOfLines={1}>
                      {band.label}
                    </Text>
                    <Text style={styles.legendRange} numberOfLines={1}>
                      {band.rangeLabel}
                    </Text>
                  </View>
                ))}
              </View>
            </GlassPanel>
          </Animated.View>
        )}
        {hydrated && hasMetrics && latest && (
          <>
            <View style={styles.statsRow}>
              <StatCard label="HEIGHT" value={`${latest.heightCm} cm`} />
              <StatCard label="WEIGHT" value={`${latest.weightKg} kg`} />
            </View>

            <GlassPanel style={styles.metaPanel}>
              <Text style={styles.metaLabel}>LAST UPDATED</Text>
              <Text style={styles.metaValue}>{formatRecordedAt(latest.recordedAt)}</Text>
              <Text style={styles.metaNote}>Measurements stay on this device.</Text>
            </GlassPanel>

            <View style={styles.actions}>
              <PrimaryButton
                label="UPDATE MEASUREMENTS"
                onPress={openEditor}
                style={styles.actionButton}
              />
            </View>
          </>
        )}
      </ScrollView>
      <Modal visible={isEditing} transparent animationType="fade" onRequestClose={closeEditor}>
        <View style={styles.modalBackdrop}>
          <GlassPanel style={styles.modalPanel}>
            <Text style={styles.modalEyebrow}>UPDATE</Text>
            <Text style={styles.modalTitle}>BODY METRICS</Text>
            <View style={styles.modalDivider} />

            <TextField
              label="HEIGHT (CM)"
              value={draftHeight}
              onChangeText={setDraftHeight}
              error={fieldErrors.heightCm}
              keyboardType="decimal-pad"
              placeholder="e.g. 178"
              maxLength={5}
            />
            <TextField
              label="WEIGHT (KG)"
              value={draftWeight}
              onChangeText={setDraftWeight}
              error={fieldErrors.weightKg}
              keyboardType="decimal-pad"
              placeholder="e.g. 74"
              maxLength={6}
            />

            {formError && <Text style={styles.formError}>{formError}</Text>}
            <Text style={styles.modalNote}>
              BMI is calculated from these numbers — nothing is estimated.
            </Text>

            <View style={styles.modalActions}>
              <PrimaryButton
                label="Cancel"
                onPress={closeEditor}
                variant="ghost"
                style={styles.modalButton}
              />
              <PrimaryButton label="Save" onPress={handleSave} style={styles.modalButton} />
            </View>
          </GlassPanel>
        </View>
      </Modal>
    </CinematicBackground>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel style={styles.statCard}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backRow: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  backText: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 12,
  },
  eyebrow: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
  },
  headline: {
    ...typography.title,
    fontSize: 22,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
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
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  primaryAction: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  bmiPanel: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  bmiLabel: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
  },
  bmiValue: {
    color: colors.textPrimary,
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: 1,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.glass,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  bmiRange: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scaleWrap: {
    width: '100%',
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  scaleTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  scaleBand: {
    height: '100%',
    opacity: 0.65,
  },
  scaleMarker: {
    position: 'absolute',
    top: -4,
    width: 3,
    height: 20,
    marginLeft: -1.5,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  scaleBounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xs,
  },
  scaleBound: {
    ...typography.caption,
    fontSize: 10,
  },
  legend: {
    width: '100%',
    marginTop: spacing.md,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.65,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  legendRange: {
    ...typography.caption,
    fontSize: 10,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metaPanel: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  metaLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 10,
  },
  metaValue: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontSize: 15,
  },
  metaNote: {
    ...typography.caption,
    fontSize: 10,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  actionButton: {
    height: 44,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalPanel: {
    width: '100%',
    gap: spacing.md,
  },
  modalEyebrow: {
    ...typography.label,
    color: colors.gold,
    fontSize: 10,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 18,
    marginTop: -spacing.xs,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  formError: {
    color: colors.danger,
    fontSize: 12,
  },
  modalNote: {
    ...typography.caption,
    fontSize: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
