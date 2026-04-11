import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';

interface Props {
  name: string;
  calfitId: string;
  avatarUrl?: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  theme: typeof colors.dark;
  onPress: () => void;
}

export function ConversationRow({
  name,
  calfitId,
  avatarUrl,
  lastMessage,
  lastMessageTime,
  unreadCount,
  theme,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}
    >
      <UserAvatar uri={avatarUrl} name={name} size={48} theme={theme} />
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>{name}</Text>
          <Text style={[styles.time, { color: theme.textMuted }]}>
            {lastMessageTime}
          </Text>
        </View>
        <Text style={[styles.calfitId, { color: theme.textMuted }]}>
          @{calfitId}
        </Text>
        <Text
          style={[styles.lastMessage, {
            color: unreadCount > 0 ? theme.textPrimary : theme.textMuted,
            fontWeight: unreadCount > 0 ? '600' : '400',
          }]}
          numberOfLines={1}
        >
          {lastMessage}
        </Text>
      </View>
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.badgeText, { color: theme.bg }]}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
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
    borderWidth: 1,
  },
  info: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { fontSize: fontSize.base, fontWeight: '700' },
  time: { fontSize: fontSize.xs },
  calfitId: { fontSize: fontSize.xs, marginTop: 1 },
  lastMessage: { fontSize: fontSize.sm, marginTop: 2 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, flexShrink: 0,
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
});