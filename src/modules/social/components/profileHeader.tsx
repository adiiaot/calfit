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

// CHANGED: Returns singular label when count === 1, plural otherwise
function statLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
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
          {/* CHANGED: each stat uses singular/plural helper */}
          {[
            {
              value: postsCount,
              label: statLabel(postsCount, 'Post', 'Posts'),
            },
            {
              value: followersCount,
              label: statLabel(followersCount, 'Follower', 'Followers'),
            },
            {
              value: followingCount,
              label: 'Following', // "Following" is always the same word
            },
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

      {/* Name + ID + goal + bio */}
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
      <View style={[styles.streakRow, { backgroundColor: (theme as any).orange + '18' }]}>
        <Text style={[styles.streakText, { color: (theme as any).orange }]}>
          🔥 {streakCount} {statLabel(streakCount, 'day streak', 'day streak')}
        </Text>
      </View>

      {/* Action buttons */}
      {isCurrentUser ? (
        <TouchableOpacity
          onPress={onEditPress}
          style={[styles.editBtn, { borderColor: theme.border }]}
        >
          <Text style={[styles.editBtnText, { color: theme.textPrimary }]}>Edit Profile</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={onFollowPress}
            style={[
              styles.followBtn,
              {
                backgroundColor: isFollowing ? theme.card : theme.accent,
                borderColor: isFollowing ? theme.border : theme.accent,
              },
            ]}
          >
            <Text style={[
              styles.followBtnText,
              { color: isFollowing ? theme.textPrimary : theme.bg },
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          {onMessagePress && (
            <TouchableOpacity
              onPress={onMessagePress}
              style={[styles.msgBtn, { borderColor: theme.border }]}
            >
              <Ionicons name="chatbubble-outline" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: fontSize.lg, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xs, textAlign: 'center' },

  name: { fontSize: fontSize.lg, fontWeight: '800' },
  handle: { fontSize: fontSize.sm },
  goalPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  goalText: { fontSize: fontSize.xs, fontWeight: '600' },
  bio: { fontSize: fontSize.sm, lineHeight: 18 },

  streakRow: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  streakText: { fontSize: fontSize.sm, fontWeight: '700' },

  editBtn: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  editBtnText: { fontSize: fontSize.base, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  followBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  followBtnText: { fontSize: fontSize.base, fontWeight: '700' },
  msgBtn: {
    width: 42, height: 42,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});