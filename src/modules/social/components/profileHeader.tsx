import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';

interface Props {
  theme: typeof colors.dark;
  name: string;
  calfitId: string;
  avatarUrl?: string | null;
  bio?: string;
  goal?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  streakCount: number;
  isCurrentUser: boolean;
  isFollowing: boolean;
  onFollowPress: () => void;
  onMessagePress?: () => void;
  onEditPress?: () => void;
}

export function ProfileHeader({
  theme,
  name,
  calfitId,
  avatarUrl,
  bio,
  goal,
  followersCount,
  followingCount,
  postsCount,
  streakCount,
  isCurrentUser,
  isFollowing,
  onFollowPress,
  onMessagePress,
  onEditPress,
}: Props) {
  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <UserAvatar uri={avatarUrl} name={name} size={72} theme={theme} />
        <View style={styles.statsRow}>
          {[
            { label: 'Posts', value: postsCount },
            { label: 'Followers', value: followersCount },
            { label: 'Following', value: followingCount },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Name + ID + bio */}
      <Text style={[styles.name, { color: theme.textPrimary }]}>{name}</Text>
      <Text style={[styles.handle, { color: theme.textMuted }]}>@{calfitId}</Text>
      {goal && (
        <View style={[styles.goalPill, { backgroundColor: theme.accentDim as string }]}>
          <Text style={[styles.goalText, { color: theme.accent }]}>🎯 {goal}</Text>
        </View>
      )}
      {bio && (
        <Text style={[styles.bio, { color: theme.textSecondary }]}>{bio}</Text>
      )}

      {/* Streak */}
      <View style={[styles.streakRow, { backgroundColor: theme.orange + '18' }]}>
        <Text style={[styles.streakText, { color: theme.orange }]}>
          🔥 {streakCount} day streak
        </Text>
      </View>

      {/* Action buttons */}
      {isCurrentUser ? (
        <TouchableOpacity
          onPress={onEditPress}
          style={[styles.editBtn, { borderColor: theme.border, backgroundColor: theme.bg }]}
        >
          <Text style={[styles.editBtnText, { color: theme.textPrimary }]}>
            Edit Profile
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={onFollowPress}
            style={[styles.followBtn, {
              backgroundColor: isFollowing ? theme.card : theme.accent,
              borderColor: isFollowing ? theme.border : theme.accent,
              borderWidth: 1,
              flex: 1,
            }]}
          >
            <Text style={[styles.followBtnText, {
              color: isFollowing ? theme.textPrimary : theme.bg,
            }]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMessagePress}
            style={[styles.messageBtn, {
              backgroundColor: theme.card,
              borderColor: theme.border,
            }]}
          >
            <Ionicons name="paper-plane-outline" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xs, marginTop: 2 },
  name: { fontSize: fontSize.xl, fontWeight: '800' },
  handle: { fontSize: fontSize.sm },
  goalPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  goalText: { fontSize: fontSize.xs, fontWeight: '600' },
  bio: { fontSize: fontSize.base, lineHeight: 20 },
  streakRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  streakText: { fontSize: fontSize.sm, fontWeight: '700' },
  editBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  editBtnText: { fontSize: fontSize.base, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  followBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  followBtnText: { fontSize: fontSize.base, fontWeight: '700' },
  messageBtn: {
    width: 44, height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});