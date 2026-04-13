import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Modal,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';

const CATEGORIES = [
  'Fitness', 'Nutrition', 'Weight Loss',
  'Muscle Gain', 'Running', 'Mental Health', 'Yoga', 'Sports',
];

interface Props {
  theme: typeof colors.dark;
  visible: boolean;
  canCreate: boolean;
  ownedCount: number;
  groupLimit: number;
  userTier: string;
  onClose: () => void;
  onCreate: (name: string, description: string, category: string) => void;
}

export function CreateGroupSheet({
  theme,
  visible,
  canCreate,
  ownedCount,
  groupLimit,
  userTier,
  onClose,
  onCreate,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fitness');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), category);
    setName('');
    setDescription('');
    setCategory('Fitness');
    onClose();
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
              Create a Group
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {!canCreate ? (
            <View style={styles.locked}>
              <Ionicons name="lock-closed" size={36} color={theme.textMuted} />
              <Text style={[styles.lockedTitle, { color: theme.textPrimary }]}>
                Group Limit Reached
              </Text>
              <Text style={[styles.lockedSub, { color: theme.textMuted }]}>
                You have created {ownedCount} of {groupLimit === Infinity ? 'unlimited' : groupLimit} groups on your {userTier} plan.
              </Text>
              <View style={[styles.tierInfo, {
                backgroundColor: theme.accentDim as string,
                borderColor: theme.accent,
              }]}>
                <Text style={[styles.tierText, { color: theme.accent }]}>
                  Free: 1 · Pro: 5 · Premium: Unlimited
                </Text>
              </View>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.form}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Group Name
              </Text>
              <View style={[styles.input, {
                backgroundColor: theme.bg,
                borderColor: theme.border,
              }]}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Morning Warriors"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.inputText, { color: theme.textPrimary }]}
                  maxLength={40}
                />
              </View>

              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Description
              </Text>
              <View style={[styles.input, {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                height: 80,
                alignItems: 'flex-start',
              }]}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What is this group about?"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.inputText, { color: theme.textPrimary, flex: 1 }]}
                  multiline
                  maxLength={120}
                />
              </View>

              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: spacing.lg }}
              >
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCategory(c)}
                      style={[styles.catPill, {
                        backgroundColor: category === c ? theme.accent : theme.bg,
                        borderColor: category === c ? theme.accent : theme.border,
                      }]}
                    >
                      <Text style={[styles.catPillText, {
                        color: category === c ? theme.bg : theme.textSecondary,
                      }]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleCreate}
                disabled={!name.trim()}
                style={[styles.createBtn, {
                  backgroundColor: name.trim() ? theme.accent : theme.border,
                }]}
              >
                <Text style={[styles.createBtnText, {
                  color: name.trim() ? theme.bg : theme.textMuted,
                }]}>
                  Create Group
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  form: { padding: spacing.lg },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  inputText: { fontSize: fontSize.base },
  categoryRow: { flexDirection: 'row', gap: spacing.sm },
  catPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  catPillText: { fontSize: fontSize.sm, fontWeight: '600' },
  createBtn: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  createBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
  locked: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  lockedTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  lockedSub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
  tierInfo: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  tierText: { fontSize: fontSize.sm, fontWeight: '600' },
});