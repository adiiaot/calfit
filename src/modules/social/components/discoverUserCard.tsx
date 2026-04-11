import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';

interface Props {
  userId: string;
  name: string;
  calfitId: string;
  avatarUrl?: string | null;
  goal: string;
  isFollowing: boolean;
  theme: typeof colors.dark;
  onFollow: () => void;
  onProfilePress?: () => void;
}

export function DiscoverUserCard({
  name,
  calfitId,
  avatarUrl,
  goal,
  isFollowing,
  theme,
  onFollow,
  onProfilePress,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onProfilePress}
      style={[styles.container, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}
    >
      <UserAvatar uri={avatarUrl} name={name} size={48} theme={theme} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{name}</Text>
        <Text style={[styles.handle, { color: theme.textMuted }]}>@{calfitId}</Text>
        {goal ? (
          <View style={[styles.goalPill, {
            backgroundColor: theme.accentDim as string,
          }]}>
            <Text style={[styles.goalText, { color: theme.accent }]}>
              🎯 {goal}
            </Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={onFollow}
        style={[styles.followBtn, {
          backgroundColor: isFollowing ? theme.card : theme.accent,
          borderColor: isFollowing ? theme.border : theme.accent,
          borderWidth: 1,
        }]}
      >
        <Text style={[styles.followBtnText, {
          color: isFollowing ? theme.textSecondary : theme.bg,
        }]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
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
  name: { fontSize: fontSize.base, fontWeight: '700' },
  handle: { fontSize: fontSize.xs, marginTop: 2 },
  goalPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  goalText: { fontSize: fontSize.xs, fontWeight: '600' },
  followBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  followBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
});