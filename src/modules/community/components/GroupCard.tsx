import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { GroupData } from '../services/groupService';

interface Props {
  group: GroupData;
  theme: typeof colors.dark;
  onPress: () => void;
  onJoin: () => void;
  onDelete: () => void;
}

export function GroupCard({ group, theme, onPress, onJoin, onDelete }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, {
        backgroundColor: theme.card,
        borderColor: group.is_owner ? theme.accent : theme.border,
        borderWidth: group.is_owner ? 2 : 1,
      }]}
    >
      {/* Emoji */}
      <View style={[styles.emoji, { backgroundColor: theme.accentDim as string }]}>
        <Text style={styles.emojiText}>{group.emoji}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>{group.name}</Text>
          {group.is_owner && (
            <View style={[styles.ownerBadge, {
              backgroundColor: theme.accent + '22',
              borderColor: theme.accent,
            }]}>
              <Text style={[styles.ownerBadgeText, { color: theme.accent }]}>Owner</Text>
            </View>
          )}
        </View>
        <Text style={[styles.desc, { color: theme.textMuted }]} numberOfLines={1}>
          {group.description}
        </Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textMuted }]}>
              {group.member_count} members
            </Text>
          </View>
          {group.streak > 0 && (
            <View style={styles.metaItem}>
              <Text>🔥</Text>
              <Text style={[styles.metaText, { color: theme.accent }]}>
                {group.streak}d streak
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action */}
      {group.is_owner ? (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={theme.red} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onJoin}
          style={[styles.joinBtn, {
            backgroundColor: group.is_joined ? theme.card : theme.accent,
            borderColor: group.is_joined ? theme.border : theme.accent,
            borderWidth: 1,
          }]}
        >
          <Text style={[styles.joinBtnText, {
            color: group.is_joined ? theme.textSecondary : theme.bg,
          }]}>
            {group.is_joined ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  emoji: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  emojiText: { fontSize: 24 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { fontSize: fontSize.base, fontWeight: '700' },
  ownerBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radius.sm, borderWidth: 1,
  },
  ownerBadgeText: { fontSize: 9, fontWeight: '700' },
  desc: { fontSize: fontSize.xs, marginTop: 2 },
  meta: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.xs },
  joinBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  joinBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
});