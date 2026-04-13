import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';

interface Props {
  theme: typeof colors.dark;
  name: string;
  calfitId: string;
  avatarUrl?: string | null;
  role: string;
  streakCount: number;
  onPress?: () => void;
}

const ROLE_COLORS = (theme: typeof colors.dark): Record<string, string> => ({
  creator: theme.accent,
  admin: theme.orange,
  moderator: theme.accentSecond,
  member: theme.textMuted,
});

export function MemberCard({
  theme,
  name,
  calfitId,
  avatarUrl,
  role,
  streakCount,
  onPress,
}: Props) {
  const roleColor = ROLE_COLORS(theme)[role] ?? theme.textMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}
    >
      <UserAvatar uri={avatarUrl} name={name} size={40} theme={theme} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{name}</Text>
        <Text style={[styles.handle, { color: theme.textMuted }]}>@{calfitId}</Text>
      </View>
      <View style={styles.right}>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + '22' }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{role}</Text>
        </View>
        <Text style={[styles.streak, { color: theme.orange }]}>
          {streakCount}🔥
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  info: { flex: 1 },
  name: { fontSize: fontSize.base, fontWeight: '700' },
  handle: { fontSize: fontSize.xs, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  roleText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  streak: { fontSize: fontSize.sm, fontWeight: '700' },
});