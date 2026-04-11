import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';
import { PostData } from '../services/postService';

const KUDOS = ['🔥 Fire', '💪 Strong', '🎯 Goals', '🙌 Well done'];

const TYPE_CONFIG = (theme: typeof colors.dark) => ({
  workout:   { icon: 'barbell-outline',    color: theme.orange,        label: 'Workout' },
  meal:      { icon: 'restaurant-outline', color: theme.accentSecond,  label: 'Meal' },
  milestone: { icon: 'trophy-outline',     color: theme.gold,          label: 'Milestone' },
  text:      { icon: 'chatbubble-outline', color: theme.textMuted,     label: 'Update' },
});

interface Props {
  post: PostData;
  theme: typeof colors.dark;
  onLike: (postId: string, isLiked: boolean) => void;
  onComment: (post: PostData) => void;
  onProfilePress?: (userId: string) => void;
}

export function PostCard({
  post,
  theme,
  onLike,
  onComment,
  onProfilePress,
}: Props) {
  const [showKudos, setShowKudos] = useState(false);
  const config = TYPE_CONFIG(theme)[post.type];

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <View style={[styles.card, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => onProfilePress?.(post.user_id)}
      >
        <UserAvatar
          uri={post.profiles?.avatar_url}
          name={post.profiles?.full_name ?? 'User'}
          size={40}
          theme={theme}
        />
        <View style={styles.authorInfo}>
          <View style={styles.authorRow}>
            <Text style={[styles.authorName, { color: theme.textPrimary }]}>
              {post.profiles?.full_name ?? 'CalFit User'}
            </Text>
            <View style={[styles.typeBadge, {
              backgroundColor: config.color + '22',
            }]}>
              <Ionicons name={config.icon as any} size={10} color={config.color} />
              <Text style={[styles.typeBadgeText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.postMeta, { color: theme.textMuted }]}>
            @{post.profiles?.calfit_id ?? 'user'} · {timeAgo(post.created_at)}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Content */}
      <Text style={[styles.content, { color: theme.textPrimary }]}>
        {post.content}
      </Text>

      {/* Image */}
      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Kudos pills */}
      {showKudos && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kudosRow}
        >
          {KUDOS.map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => setShowKudos(false)}
              style={[styles.kudosPill, {
                backgroundColor: theme.accentDim as string,
                borderColor: theme.accent,
              }]}
            >
              <Text style={[styles.kudosPillText, { color: theme.accent }]}>
                {k}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => onLike(post.id, post.is_liked ?? false)}
          style={styles.action}
        >
          <Ionicons
            name={post.is_liked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.is_liked ? theme.red : theme.textMuted}
          />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>
            {post.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onComment(post)}
          style={styles.action}
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.textMuted} />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>
            {post.comments_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowKudos(!showKudos)}
          style={styles.action}
        >
          <Ionicons name="hand-right-outline" size={20} color={theme.textMuted} />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>Kudos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action}>
          <Ionicons name="share-social-outline" size={20} color={theme.textMuted} />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  authorInfo: { flex: 1 },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  authorName: { fontSize: fontSize.base, fontWeight: '700' },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  postMeta: { fontSize: fontSize.xs, marginTop: 2 },
  content: {
    fontSize: fontSize.base,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  image: { width: '100%', height: 240 },
  kudosRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  kudosPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  kudosPillText: { fontSize: fontSize.sm, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionLabel: { fontSize: fontSize.xs, fontWeight: '600' },
});