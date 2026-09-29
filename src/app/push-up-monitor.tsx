import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CinematicBackground, GlassPanel, PrimaryButton } from '../components';
import { colors, radius, spacing, typography } from '../theme';
import { usePushUpMonitor } from '../hooks/usePushUpMonitor';

type CameraFacing = 'front' | 'back';

function formatClock(timestampMs: number): string {
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * V2 Feature 2 — Push-Up Monitor.
 *
 * The camera preview here is real device input. Rep counting only advances when
 * a pose engine hands over genuinely analysed frames: this build ships no engine
 * (see services/pose/poseDetector.ts), so the counter stays at zero and the UI
 * says so instead of inventing repetitions.
 *
 * Session state is local to this screen's hook — nothing is written to
 * sessionStore, Supabase or device storage.
 */
export default function PushUpMonitorScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission, refreshPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraFacing>('front');
  const monitor = usePushUpMonitor();

  const isMonitoring = monitor.status === 'MONITORING';
  const isGranted = permission?.granted === true;
  const canAskAgain = permission?.canAskAgain ?? true;

  const handlePermissionAction = async () => {
    if (canAskAgain) {
      await requestPermission();
      return;
    }
    // Already blocked: requesting again would resolve to "denied" without any
    // prompt, so send the warrior to system settings instead.
    try {
      await Linking.openSettings();
    } catch {
      // Some platforms/launchers can't open settings — the guidance text stays
      // on screen and nothing crashes.
    }
  };

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      monitor.stop();
      return;
    }
    monitor.start();
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

        <Text style={styles.eyebrow}>WORKOUT MONITORING</Text>
        <Text style={styles.headline}>PUSH-UP MONITOR</Text>
        <Text style={styles.subtitle}>
          Live camera rep counting. Counting stays inactive until a pose engine is running.
        </Text>
        <GlassPanel style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelLabel}>CAMERA</Text>
            {isGranted && (
              <Pressable
                onPress={() => setFacing((prev) => (prev === 'front' ? 'back' : 'front'))}
                hitSlop={8}
              >
                <Text style={styles.chipText}>
                  {facing === 'front' ? 'FRONT CAMERA' : 'BACK CAMERA'} · SWITCH
                </Text>
              </Pressable>
            )}
          </View>

          {permission === null && (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.crimson} size="large" />
              <Text style={styles.hintText}>Preparing camera…</Text>
            </View>
          )}

          {permission !== null && !isGranted && (
            <View style={styles.permissionBlock}>
              <Text style={styles.permissionTitle}>
                {canAskAgain ? 'CAMERA ACCESS NEEDED' : 'CAMERA ACCESS BLOCKED'}
              </Text>
              <Text style={styles.permissionText}>
                Training Arc needs camera access to watch your push-up form. Frames are analysed
                on this device only — nothing is uploaded.
              </Text>
              {!canAskAgain && (
                <Text style={styles.permissionHint}>
                  Camera access for Training Arc is switched off in your system settings.
                </Text>
              )}
              <PrimaryButton
                label={canAskAgain ? 'ENABLE CAMERA' : 'OPEN SETTINGS'}
                onPress={handlePermissionAction}
              />
              <PrimaryButton label="CHECK AGAIN" onPress={refreshPermission} variant="ghost" />
            </View>
          )}

          {isGranted && isMonitoring && (
            <View style={styles.cameraFrame}>
              <CameraView style={styles.cameraView} facing={facing} />
            </View>
          )}

          {isGranted && !isMonitoring && (
            <View style={styles.cameraIdle}>
              <Text style={styles.cameraIdleTitle}>CAMERA READY</Text>
              <Text style={styles.cameraIdleText}>
                Press START MONITORING to open the live camera preview.
              </Text>
            </View>
          )}
        </GlassPanel>

        <GlassPanel style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelLabel}>POSE ENGINE</Text>
            <Text
              style={[
                styles.statusValue,
                monitor.engineRunning ? styles.statusActive : styles.statusInactive,
              ]}
            >
              {monitor.engineRunning ? 'RUNNING' : 'INACTIVE'}
            </Text>
          </View>

          {monitor.availability.available ? (
            <Text style={styles.engineReason}>Engine: {monitor.availability.engine}</Text>
          ) : (
            <>
              <Text style={styles.engineReason}>{monitor.availability.reason}</Text>
              <Text style={styles.engineRequirement}>{monitor.availability.requirement}</Text>
            </>
          )}

          <Text style={styles.engineMeta} numberOfLines={2}>
            ENGINE ID: {monitor.engineId} · FRAMES ANALYSED: {monitor.poseFrameCount}
          </Text>
        </GlassPanel>

        <GlassPanel style={styles.metricsPanel}>
          <Text style={styles.panelLabel}>REPETITIONS</Text>
          <Text style={styles.repValue}>{monitor.repCount}</Text>

          <View style={styles.stateChip}>
            <Text style={styles.stateChipText}>{monitor.phase}</Text>
          </View>
          <Text style={styles.ruleText}>A repetition counts on UP → DOWN → UP.</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricCell}>
              <Text style={styles.metricValue}>{monitor.poseFrameCount}</Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                FRAMES ANALYSED
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCell}>
              <Text style={styles.metricValue} numberOfLines={1}>
                {monitor.lastPoseAtMs === null ? '—' : formatClock(monitor.lastPoseAtMs)}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                LAST POSE
              </Text>
            </View>
          </View>
        </GlassPanel>

        <View style={styles.controls}>
          <PrimaryButton
            label={isMonitoring ? 'STOP MONITORING' : 'START MONITORING'}
            onPress={handleToggleMonitoring}
            style={styles.controlButton}
          />
          <PrimaryButton
            label="RESET COUNT"
            onPress={monitor.resetCount}
            variant="ghost"
            style={styles.controlButton}
          />
        </View>

        <Text style={styles.footnote}>
          {monitor.engineRunning
            ? 'Repetitions are counted on this device from live pose data.'
            : 'No pose engine is running, so no repetitions are counted, displayed or stored.'}
        </Text>

      </ScrollView>
    </CinematicBackground>
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
    ...typography.display,
    fontSize: 26,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  panel: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  panelLabel: {
    ...typography.label,
    color: colors.gold,
    fontSize: 10,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  permissionBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  permissionTitle: {
    ...typography.title,
    fontSize: 15,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  permissionHint: {
    ...typography.caption,
    color: colors.gold,
  },
  cameraFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.panelElevated,
    overflow: 'hidden',
  },
  cameraView: {
    flex: 1,
  },
  cameraIdle: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  cameraIdleTitle: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 11,
  },
  cameraIdleText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statusValue: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusActive: {
    color: colors.success,
  },
  statusInactive: {
    color: colors.textMuted,
  },
  engineReason: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  engineRequirement: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  engineMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  metricsPanel: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  repValue: {
    color: colors.gold,
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stateChip: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.glass,
  },
  stateChipText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  ruleText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  controls: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  controlButton: {
    height: 48,
  },
  footnote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },

});
