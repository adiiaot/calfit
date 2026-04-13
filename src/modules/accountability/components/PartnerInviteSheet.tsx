import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Modal, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';

interface Props {
  theme: typeof colors.dark;
  visible: boolean;
  isAdding: boolean;
  onClose: () => void;
  onAdd: (calfitId: string) => void;
}

export function PartnerInviteSheet({
  theme,
  visible,
  isAdding,
  onClose,
  onAdd,
}: Props) {
  const [calfitId, setCalfitId] = useState('');

  const handleAdd = () => {
    if (!calfitId.trim()) return;
    onAdd(calfitId.trim().toLowerCase().replace('@', ''));
    setCalfitId('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Add Partner
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Enter their CalFit ID
            </Text>
            <View style={[styles.inputRow, {
              backgroundColor: theme.bg,
              borderColor: theme.border,
            }]}>
              <Text style={[styles.atSign, { color: theme.accent }]}>@</Text>
              <TextInput
                value={calfitId}
                onChangeText={(v) => setCalfitId(v.toLowerCase().replace(/\s/g, ''))}
                placeholder="their_calfit_id"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { color: theme.textPrimary }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Ask your partner to share their CalFit ID from their profile or Settings.
            </Text>

            <View style={[styles.privacyNote, {
              backgroundColor: theme.accentDim as string,
              borderColor: theme.accent,
            }]}>
              <Ionicons name="shield-checkmark-outline" size={14} color={theme.accent} />
              <Text style={[styles.privacyText, { color: theme.accent }]}>
                Only fitness progress and streaks are shared. No personal info.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleAdd}
              disabled={!calfitId.trim() || isAdding}
              style={[styles.addBtn, {
                backgroundColor: calfitId.trim() ? theme.accent : theme.border,
              }]}
            >
              {isAdding ? (
                <ActivityIndicator color={theme.bg} />
              ) : (
                <Text style={[styles.addBtnText, {
                  color: calfitId.trim() ? theme.bg : theme.textMuted,
                }]}>
                  Add Partner
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  dismiss: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  label: { fontSize: fontSize.sm, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  atSign: { fontSize: fontSize.xl, fontWeight: '700' },
  input: { flex: 1, fontSize: fontSize.lg },
  hint: { fontSize: fontSize.xs, lineHeight: 16 },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  privacyText: { fontSize: fontSize.xs, flex: 1, lineHeight: 16, fontWeight: '600' },
  addBtn: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  addBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});