import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ScrollView, Modal, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';
import { PostData } from '../services/postService';
import { supabase } from '../../../services/supabase';

const KUDOS = ['🔥 Fire', '💪 Strong', '🎯 Goals', '🙌 Well done'];

const TYPE_CONFIG = (theme: typeof colors.dark) => ({
  workout:   { icon: 'barbell-outline',    color: theme.orange,       label: 'Workout' },
  meal:      { icon: 'restaurant-outline', color: theme.accentSecond, label: 'Meal' },
  milestone: { icon: 'trophy-outline',     color: (theme as any).gold, label: 'Milestone' },
  text:      { icon: 'chatbubble-outline', color: theme.textMuted,    label: 'Update' },
});

interface Props {
  post: PostData;
  theme: typeof colors.dark;
  currentUserId?: string;
  currentUserName?: string;
  onLike: (postId: string, isLiked: boolean) => void;
  onComment: (post: PostData) => void;
  onShare: (post: PostData) => void;
  onDelete?: (postId: string) => void;
  onEditComplete?: (postId: string, newContent: string) => void;
  onProfilePress?: (userId: string) => void;
}

// ── EDIT MODAL ────────────────────────────────────────────────
function EditPostModal({
  theme,
  post,
  visible,
  onClose,
  onSave,
}: {
  theme: typeof colors.dark;
  post: PostData;
  visible: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await onSave(content.trim());
    setSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.modalCancel, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Edit Post</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving || !content.trim()}>
              {saving
                ? <ActivityIndicator size="small" color={theme.accent} />
                : <Text style={[styles.modalSave, {
                    color: content.trim() ? theme.accent : theme.textMuted,
                  }]}>Save</Text>
              }
            </TouchableOpacity>
          </View>
          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            style={[styles.editInput, { color: theme.textPrimary }]}
            placeholderTextColor={theme.textMuted}
            placeholder="What's on your mind?"
          />
          <Text style={[styles.charCount, { color: theme.textMuted }]}>
            {content.length}/500
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ── POST CARD ─────────────────────────────────────────────────
export function PostCard({
  post,
  theme,
  currentUserId,
  currentUserName,
  onLike,
  onComment,
  onShare,
  onDelete,
  onEditComplete,
  onProfilePress,
}: Props) {
  const [showKudos, setShowKudos] = useState(false);
  const [sentKudos, setSentKudos] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const config = TYPE_CONFIG(theme)[post.type] ?? TYPE_CONFIG(theme).text;
  const isOwner = currentUserId === post.user_id;

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleKudos = async (kudos: string) => {
    setSentKudos(kudos);
    setShowKudos(false);
    if (!post.user_id || currentUserId === post.user_id) return;
    try {
      const { notifyKudosReceived } = await import('../../../services/notificationService');
      await notifyKudosReceived(post.user_id, currentUserName ?? 'Someone', kudos, post.content);
    } catch (e) {}
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      'Delete Post',
      'This will permanently remove your post from the feed and your profile. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('posts')
              .delete()
              .eq('id', post.id)
              .eq('user_id', currentUserId!); // RLS double-check

            if (error) {
              Alert.alert('Error', 'Could not delete post. Please try again.');
              return;
            }
            // Notify parent to remove from local state
            onDelete?.(post.id);
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setShowMenu(false);
    setShowEdit(true);
  };

  const handleSaveEdit = async (newContent: string) => {
    const { error } = await supabase
      .from('posts')
      .update({ content: newContent })
      .eq('id', post.id)
      .eq('user_id', currentUserId!);

    if (error) {
      Alert.alert('Error', 'Could not update post. Please try again.');
      return;
    }
    onEditComplete?.(post.id, newContent);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => onProfilePress?.(post.user_id)}
        >
          <UserAvatar
            uri={post.profiles?.avatar_url}
            name={post.profiles?.full_name ?? 'User'}
            size={40}
            theme={theme}
          />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.authorName, { color: theme.textPrimary }]}>
                {post.profiles?.full_name ?? 'CalFit User'}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: config.color + '22' }]}>
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
        </TouchableOpacity>

        {/* Three-dots menu — only visible to post owner */}
        {isOwner && (
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.menuBtn}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Text style={[styles.content, { color: theme.textPrimary }]}>{post.content}</Text>

      {/* Image */}
      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        {/* Like */}
        <TouchableOpacity
          onPress={() => onLike(post.id, post.is_liked ?? false)}
          style={styles.action}
        >
          <Ionicons
            name={post.is_liked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.is_liked ? (theme as any).red : theme.textMuted}
          />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>
            {post.likes_count}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity onPress={() => onComment(post)} style={styles.action}>
          <Ionicons name="chatbubble-outline" size={20} color={theme.textMuted} />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>
            {post.comments_count}
          </Text>
        </TouchableOpacity>

        {/* Kudos */}
        <TouchableOpacity
          onPress={() => { if (!sentKudos) setShowKudos(!showKudos); }}
          style={styles.action}
        >
          <Ionicons
            name="hand-right-outline"
            size={20}
            color={sentKudos ? theme.accent : theme.textMuted}
          />
          <Text style={[styles.actionLabel, {
            color: sentKudos ? theme.accent : theme.textMuted,
          }]}>
            {sentKudos ? sentKudos.split(' ')[0] : 'Kudos'}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity onPress={() => onShare(post)} style={styles.action}>
          <Ionicons name="share-outline" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Kudos picker */}
      {showKudos && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.kudosRow, { borderTopColor: theme.border }]}
        >
          {KUDOS.map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => handleKudos(k)}
              style={[styles.kudosBtn, {
                backgroundColor: theme.accentDim as string,
                borderColor: theme.accent,
              }]}
            >
              <Text style={[styles.kudosBtnText, { color: theme.accent }]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Owner menu modal ─────────────────────────────── */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuSheet, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>
              Post Options
            </Text>

            <TouchableOpacity
              onPress={handleEdit}
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
            >
              <Ionicons name="create-outline" size={20} color={theme.textPrimary} />
              <View style={styles.menuItemInfo}>
                <Text style={[styles.menuItemLabel, { color: theme.textPrimary }]}>
                  Edit Post
                </Text>
                <Text style={[styles.menuItemSub, { color: theme.textMuted }]}>
                  Update your post content
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={styles.menuItem}
            >
              <Ionicons name="trash-outline" size={20} color={(theme as any).red} />
              <View style={styles.menuItemInfo}>
                <Text style={[styles.menuItemLabel, { color: (theme as any).red }]}>
                  Delete Post
                </Text>
                <Text style={[styles.menuItemSub, { color: theme.textMuted }]}>
                  Permanently remove from feed and profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowMenu(false)}
              style={[styles.menuCancel, { borderTopColor: theme.border }]}
            >
              <Text style={[styles.menuCancelText, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit modal */}
      {showEdit && (
        <EditPostModal
          theme={theme}
          post={post}
          visible={showEdit}
          onClose={() => setShowEdit(false)}
          onSave={handleSaveEdit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  authorInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  authorName: { fontSize: fontSize.base, fontWeight: '700' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  postMeta: { fontSize: fontSize.xs, marginTop: 2 },
  menuBtn: { padding: spacing.xs },

  content: { fontSize: fontSize.base, lineHeight: 22, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  image: { width: '100%', height: 220 },

  actions: {
  flexDirection: 'row',
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderTopWidth: 1,
  justifyContent: 'space-between', // ← change from gap: spacing.lg to this
},
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionLabel: { fontSize: fontSize.sm },

  kudosRow: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  kudosBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, marginRight: spacing.sm,
  },
  kudosBtnText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Owner menu modal
  menuOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    paddingTop: spacing.md,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: fontSize.xs, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, padding: spacing.lg,
    borderBottomWidth: 1,
  },
  menuItemInfo: { flex: 1 },
  menuItemLabel: { fontSize: fontSize.base, fontWeight: '600' },
  menuItemSub: { fontSize: fontSize.xs, marginTop: 2 },
  menuCancel: {
    alignItems: 'center', padding: spacing.lg, borderTopWidth: 1,
  },
  menuCancelText: { fontSize: fontSize.base, fontWeight: '600' },

  // Edit modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    maxHeight: '80%', minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: fontSize.base, fontWeight: '700' },
  modalCancel: { fontSize: fontSize.base },
  modalSave: { fontSize: fontSize.base, fontWeight: '700' },
  editInput: {
    fontSize: fontSize.base, lineHeight: 24,
    padding: spacing.lg, minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: fontSize.xs, textAlign: 'right', paddingRight: spacing.lg, paddingBottom: spacing.md },
});