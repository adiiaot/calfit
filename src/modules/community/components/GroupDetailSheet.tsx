import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { GroupData } from '../services/groupService';
import { GroupWorkoutCard } from './GroupWorkoutCard';
import {
  loadGroupWorkouts,
  addGroupWorkout,
  completeGroupWorkout,
  deleteGroupWorkout,
  GroupWorkout,
} from '../services/groupWorkoutService';

interface Props {
  theme: typeof colors.dark;
  group: GroupData | null;
  visible: boolean;
  currentUserId: string;
  onClose: () => void;
  onDeleteGroup: () => void;
}

export function GroupDetailSheet({
  theme,
  group,
  visible,
  currentUserId,
  onClose,
  onDeleteGroup,
}: Props) {
  const [workouts, setWorkouts] = useState<GroupWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDesc, setWorkoutDesc] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [difficulty, setDifficulty] = useState<GroupWorkout['difficulty']>('beginner');

  useEffect(() => {
    if (visible && group) fetchWorkouts();
  }, [visible, group?.id]);

  const fetchWorkouts = async () => {
    if (!group) return;
    setIsLoading(true);
    const data = await loadGroupWorkouts(group.id);
    setWorkouts(data);
    setIsLoading(false);
  };

  const handleAddWorkout = async () => {
    if (!group || !workoutName.trim()) return;
    const workout = await addGroupWorkout(
      group.id,
      currentUserId,
      workoutName.trim(),
      workoutDesc.trim(),
      workoutDuration.trim(),
      difficulty
    );
    if (workout) {
      setWorkouts((prev) => [workout, ...prev]);
      setWorkoutName('');
      setWorkoutDesc('');
      setWorkoutDuration('');
      setDifficulty('beginner');
      setShowAddForm(false);
    }
  };

  const handleComplete = async (workoutId: string) => {
    await completeGroupWorkout(workoutId, currentUserId);
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? { ...w, completed_by: [...w.completed_by, currentUserId] }
          : w
      )
    );
    Alert.alert('Workout Complete! 💪', 'Logged to your group progress.');
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    await deleteGroupWorkout(workoutId);
    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
  };

  if (!group) return null;

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
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <Text style={styles.groupEmoji}>{group.emoji}</Text>
              <View>
                <Text style={[styles.groupName, { color: theme.textPrimary }]}>
                  {group.name}
                </Text>
                <Text style={[styles.groupMeta, { color: theme.textMuted }]}>
                  {group.member_count} members
                  {group.streak > 0 ? ` · 🔥 ${group.streak}d` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {group.is_owner && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Delete Group',
                      'This will permanently delete the group and all workouts.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => { onDeleteGroup(); onClose(); },
                        },
                      ]
                    )
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.red} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.body}
          >
            <Text style={[styles.desc, { color: theme.textSecondary }]}>
              {group.description}
            </Text>

            {/* Workouts header */}
            <View style={styles.workoutsHeader}>
              <Text style={[styles.workoutsTitle, { color: theme.textPrimary }]}>
                Group Workouts
              </Text>
              {group.is_owner && (
                <TouchableOpacity
                  onPress={() => setShowAddForm(!showAddForm)}
                  style={[styles.addBtn, { backgroundColor: theme.accent }]}
                >
                  <Ionicons name="add" size={16} color={theme.bg} />
                  <Text style={[styles.addBtnText, { color: theme.bg }]}>
                    Add
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Add workout form */}
            {showAddForm && group.is_owner && (
              <View style={[styles.addForm, {
                backgroundColor: theme.bg,
                borderColor: theme.accent,
              }]}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Workout Name
                </Text>
                <View style={[styles.formInput, {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }]}>
                  <TextInput
                    value={workoutName}
                    onChangeText={setWorkoutName}
                    placeholder="e.g. Morning Push Circuit"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.formInputText, { color: theme.textPrimary }]}
                  />
                </View>

                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Description (optional)
                </Text>
                <View style={[styles.formInput, {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }]}>
                  <TextInput
                    value={workoutDesc}
                    onChangeText={setWorkoutDesc}
                    placeholder="What does this workout involve?"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.formInputText, { color: theme.textPrimary }]}
                  />
                </View>

                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Duration
                </Text>
                <View style={[styles.formInput, {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }]}>
                  <TextInput
                    value={workoutDuration}
                    onChangeText={setWorkoutDuration}
                    placeholder="e.g. 30 mins"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.formInputText, { color: theme.textPrimary }]}
                  />
                </View>

                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Difficulty
                </Text>
                <View style={styles.diffRow}>
                  {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDifficulty(d)}
                      style={[styles.diffPill, {
                        backgroundColor: difficulty === d ? theme.accent : theme.card,
                        borderColor: difficulty === d ? theme.accent : theme.border,
                      }]}
                    >
                      <Text style={[styles.diffPillText, {
                        color: difficulty === d ? theme.bg : theme.textSecondary,
                      }]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleAddWorkout}
                  disabled={!workoutName.trim()}
                  style={[styles.saveBtn, {
                    backgroundColor: workoutName.trim() ? theme.accent : theme.border,
                  }]}
                >
                  <Text style={[styles.saveBtnText, {
                    color: workoutName.trim() ? theme.bg : theme.textMuted,
                  }]}>
                    Save Workout
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Workout list */}
            {isLoading ? (
              <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.lg }} />
            ) : workouts.length === 0 ? (
              <View style={styles.noWorkouts}>
                <Ionicons name="barbell-outline" size={32} color={theme.textMuted} />
                <Text style={[styles.noWorkoutsText, { color: theme.textMuted }]}>
                  {group.is_owner
                    ? 'Add workouts for your group to complete together.'
                    : 'No workouts added yet.'}
                </Text>
              </View>
            ) : (
              workouts.map((w) => (
                <GroupWorkoutCard
                  key={w.id}
                  workout={w}
                  theme={theme}
                  currentUserId={currentUserId}
                  isOwner={group.is_owner ?? false}
                  onComplete={() => handleComplete(w.id)}
                  onDelete={() => handleDeleteWorkout(w.id)}
                />
              ))
            )}
          </ScrollView>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  groupEmoji: { fontSize: 28 },
  groupName: { fontSize: fontSize.lg, fontWeight: '700' },
  groupMeta: { fontSize: fontSize.xs, marginTop: 2 },
  body: { padding: spacing.lg },
  desc: { fontSize: fontSize.base, lineHeight: 20, marginBottom: spacing.md },
  workoutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  workoutsTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  addBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  addForm: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    marginBottom: spacing.md,
    gap: 4,
  },
  formLabel: { fontSize: fontSize.xs, fontWeight: '600', marginTop: spacing.sm },
  formInput: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  formInputText: { fontSize: fontSize.base },
  diffRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  diffPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  diffPillText: { fontSize: fontSize.xs, fontWeight: '600' },
  saveBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { fontSize: fontSize.base, fontWeight: '700' },
  noWorkouts: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  noWorkoutsText: { fontSize: fontSize.sm, textAlign: 'center' },
});