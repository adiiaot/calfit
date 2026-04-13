import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { GroupWorkout } from '../services/groupWorkoutService';

interface Props {
  workout: GroupWorkout;
  theme: typeof colors.dark;
  currentUserId: string;
  isOwner: boolean;
  onComplete: () => void;
  onDelete: () => void;
}

export function GroupWorkoutCard({
  workout,
  theme,
  currentUserId,
  isOwner,
  onComplete,
  onDelete,
}: Props) {
  const isCompleted = workout.completed_by.includes(currentUserId);
  const completedCount = workout.completed_by.length;

  const diffColor = {
    beginner: theme.accent,
    intermediate: theme.orange,
    advanced: theme.red,
  }[workout.difficulty];

  return (
    <View style={[styles.container, {
      backgroundColor: isCompleted ? theme.accent + '12' : theme.bg,
      borderColor: isCompleted ? theme.accent : theme.border,
    }]}>
      <View style={styles.left}>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{workout.name}</Text>
        {workout.description ? (
          <Text style={[styles.desc, { color: theme.textMuted }]} numberOfLines={1}>
            {workout.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
            <Text style={[styles.diffText, { color: diffColor }]}>
              {workout.difficulty}
            </Text>
          </View>
          <Text style={[styles.duration, { color: theme.textMuted }]}>
            ⏱ {workout.duration}
          </Text>
          <Text style={[styles.completedCount, { color: theme.textMuted }]}>
            ✓ {completedCount} done
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {isCompleted ? (
          <View style={[styles.doneBtn, { backgroundColor: theme.accent }]}>
            <Ionicons name="checkmark" size={18} color={theme.bg} />
          </View>
        ) : (
          <TouchableOpacity
            onPress={onComplete}
            style={[styles.completeBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.completeBtnText, { color: theme.bg }]}>Done</Text>
          </TouchableOpacity>
        )}
        {isOwner && (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={14} color={theme.red} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  left: { flex: 1 },
  name: { fontSize: fontSize.base, fontWeight: '700' },
  desc: { fontSize: fontSize.xs, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  diffBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  diffText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  duration: { fontSize: fontSize.xs },
  completedCount: { fontSize: fontSize.xs },
  right: { alignItems: 'center', gap: spacing.xs, flexShrink: 0 },
  doneBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  completeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  completeBtnText: { fontSize: fontSize.xs, fontWeight: '700' },
});