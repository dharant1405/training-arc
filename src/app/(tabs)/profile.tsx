import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CinematicBackground, GlassPanel, PrimaryButton, ProgressBar, XPRing } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { deriveAttributes, getLevelProgress, getRankForLevel } from '../../services/gamification';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore((state) => state.signOut);
  const profile = useProfileStore((state) => state.profile);
  const updateWarriorName = useProfileStore((state) => state.updateWarriorName);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [entrance]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  if (!profile) {
    return (
      <CinematicBackground style={styles.centered}>
        <Text style={styles.message}>Loading your warrior profile…</Text>
      </CinematicBackground>
    );
  }

  const levelProgress = getLevelProgress(profile.totalXp);
  const rank = getRankForLevel(levelProgress.level);
  const attributes = deriveAttributes(profile);

  const openEdit = () => {
    setDraftName(profile.warriorName);
    setIsEditing(true);
  };

  const saveEdit = () => {
    const trimmed = draftName.trim();
    if (trimmed.length > 0) {
      updateWarriorName(trimmed);
    }
    setIsEditing(false);
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
        contentContainerStyle={[styles.content, { paddingTop: spacing.md + insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={entranceStyle}>
          <Text style={styles.eyebrow}>WARRIOR PROFILE</Text>

          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{profile.warriorName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.warriorName} numberOfLines={1}>
              {profile.warriorName.toUpperCase()}
            </Text>
            <Text style={styles.identityMeta} numberOfLines={1}>
              {rank.name.toUpperCase()} <Text style={styles.identityDot}>•</Text> LEVEL{' '}
              {levelProgress.level}
            </Text>
            <Pressable onPress={openEdit} hitSlop={8} style={styles.editLink}>
              <Text style={styles.editLinkText}>EDIT NAME</Text>
            </Pressable>
          </View>

          <GlassPanel style={styles.statusPanel}>
            <Text style={styles.statusLabel}>WARRIOR STATUS</Text>

            <View style={styles.ringWrap}>
              <View style={styles.ringGlow} />
              <XPRing progress={levelProgress.progress} level={levelProgress.level} size={132} strokeWidth={10} />
            </View>

            <Text style={styles.statusRank}>{rank.name.toUpperCase()} RANK</Text>

            <View style={styles.statusDivider} />

            <Text style={styles.statusXp}>
              {levelProgress.xpIntoLevel} / {levelProgress.currentLevelXp} XP
            </Text>
            <Text style={styles.statusNextLevel}>{levelProgress.xpToNextLevel} XP TO NEXT LEVEL</Text>
          </GlassPanel>

          <View style={styles.statsRow}>
            <StatCard label="WORKOUTS" value={String(profile.workoutsCompleted)} />
            <StatCard label="STREAK" value={String(profile.streakDays)} />
            <StatCard label="TOTAL XP" value={String(profile.totalXp)} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WARRIOR ATTRIBUTES</Text>
            <GlassPanel style={styles.attributesPanel}>
              <AttributeRow label="Strength" value={attributes.strength} />
              <AttributeRow label="Endurance" value={attributes.endurance} />
              <AttributeRow label="Discipline" value={attributes.discipline} />
              <AttributeRow label="Agility" value={attributes.agility} />
            </GlassPanel>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="Motivation Armory"
              onPress={() => router.push('/motivation')}
              variant="ghost"
              style={styles.actionButton}
            />
            <PrimaryButton
              label="Sign Out"
              onPress={handleSignOut}
              variant="ghost"
              style={styles.actionButton}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={isEditing}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassPanel style={styles.modalPanel}>
            <Text style={styles.modalEyebrow}>EDIT</Text>
            <Text style={styles.modalTitle}>WARRIOR NAME</Text>
            <View style={styles.modalDivider} />
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              style={styles.input}
              placeholder="Enter your warrior name"
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={24}
            />
            <View style={styles.modalActions}>
              <PrimaryButton
                label="Cancel"
                onPress={() => setIsEditing(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <PrimaryButton label="Save" onPress={saveEdit} style={styles.modalButton} />
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

function AttributeRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.attributeRow}>
      <Text style={styles.attributeLabel} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      <View style={styles.attributeBarWrap}>
        <ProgressBar progress={value / 100} height={7} />
      </View>
      <Text style={styles.attributeValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
    textAlign: 'center',
  },
  identity: {
    alignItems: 'center',
    marginTop: spacing.md,
    gap: 2,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.deepCrimson,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarInitial: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  warriorName: {
    ...typography.title,
    fontSize: 20,
    textAlign: 'center',
  },
  identityMeta: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: '700',
  },
  identityDot: {
    color: colors.textMuted,
  },
  editLink: {
    marginTop: spacing.xs,
    paddingVertical: 2,
  },
  editLinkText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusPanel: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
  },
  statusLabel: {
    ...typography.label,
    color: colors.gold,
    fontSize: 11,
  },
  ringWrap: {
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGlow: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: colors.crimsonGlow,
    opacity: 0.16,
  },
  statusRank: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statusDivider: {
    width: '50%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  statusXp: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
  },
  statusNextLevel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
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
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 11,
  },
  attributesPanel: {
    gap: spacing.md,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  attributeLabel: {
    ...typography.caption,
    width: 84,
    flexShrink: 0,
  },
  attributeBarWrap: {
    flex: 1,
  },
  attributeValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
    flexShrink: 0,
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
  input: {
    backgroundColor: colors.panelElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
