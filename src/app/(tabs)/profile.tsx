import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  CinematicBackground,
  GlassPanel,
  PrimaryButton,
  ProgressBar,
  SectionHeader,
  XPRing,
} from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { deriveAttributes, getLevelProgress, getRankForLevel } from '../../services/gamification';

export default function ProfileScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const profile = useProfileStore((state) => state.profile);
  const updateWarriorName = useProfileStore((state) => state.updateWarriorName);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

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

  return (
    <CinematicBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>PROFILE</Text>

        <View style={styles.avatarWrap}>
          {/* No avatar upload yet — Supabase Storage isn't wired up for the
              MVP, so every warrior gets this deterministic initial avatar
              until profile.avatarUrl is populated by a future upload flow. */}
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{profile.warriorName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.warriorName}>{profile.warriorName.toUpperCase()}</Text>
        <PrimaryButton label="Edit Name" onPress={openEdit} variant="ghost" style={styles.editButton} />

        <GlassPanel glow style={styles.heroPanel}>
          <View style={styles.heroRow}>
            <View style={styles.heroInfo}>
              <Text style={styles.rankLabel}>{rank.name.toUpperCase()} RANK</Text>
              <Text style={styles.levelText}>LEVEL {levelProgress.level}</Text>
              <Text style={styles.xpText}>
                {levelProgress.xpIntoLevel} / {levelProgress.currentLevelXp} XP
              </Text>
              <Text style={styles.streakText}>🔥 {profile.streakDays} DAY STREAK</Text>
            </View>
            <XPRing progress={levelProgress.progress} level={levelProgress.level} size={100} />
          </View>
        </GlassPanel>

        <GlassPanel style={styles.workoutsPanel}>
          <Text style={styles.workoutsValue}>{profile.workoutsCompleted}</Text>
          <Text style={styles.workoutsLabel}>TOTAL WORKOUTS</Text>
        </GlassPanel>

        <SectionHeader title="Attributes" />
        <GlassPanel style={styles.attributesPanel}>
          <AttributeRow label="Strength" value={attributes.strength} />
          <AttributeRow label="Endurance" value={attributes.endurance} />
          <AttributeRow label="Discipline" value={attributes.discipline} />
          <AttributeRow label="Agility" value={attributes.agility} />
        </GlassPanel>

        <PrimaryButton
          label="Sign Out"
          onPress={handleSignOut}
          variant="ghost"
          style={styles.signOutButton}
        />
      </ScrollView>

      <Modal
        visible={isEditing}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassPanel glow style={styles.modalPanel}>
            <Text style={styles.modalTitle}>WARRIOR NAME</Text>
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

function AttributeRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.attributeRow}>
      <Text style={styles.attributeLabel}>{label.toUpperCase()}</Text>
      <View style={styles.attributeBarWrap}>
        <ProgressBar progress={value / 100} height={8} />
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
    gap: spacing.md,
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    letterSpacing: 3,
    alignSelf: 'flex-start',
  },
  avatarWrap: {
    marginTop: spacing.sm,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.deepCrimson,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '800',
  },
  warriorName: {
    ...typography.title,
  },
  editButton: {
    width: 140,
    height: 40,
  },
  heroPanel: {
    width: '100%',
    marginTop: spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  rankLabel: {
    ...typography.subtitle,
    color: colors.gold,
  },
  levelText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  xpText: {
    ...typography.caption,
  },
  streakText: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '700',
  },
  workoutsPanel: {
    width: '100%',
    alignItems: 'center',
  },
  workoutsValue: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  workoutsLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  attributesPanel: {
    width: '100%',
    gap: spacing.md,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  attributeLabel: {
    ...typography.caption,
    width: 88,
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
  },
  signOutButton: {
    marginTop: spacing.md,
    width: '100%',
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
  modalTitle: {
    ...typography.label,
    color: colors.gold,
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
