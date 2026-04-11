import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';
import { loadComments, addComment, CommentData } from '../services/commentService';
import { PostData } from '../services/postService';

interface Props {
  theme: typeof colors.dark;
  post: PostData | null;
  visible: boolean;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
  onClose: () => void;
}

export function CommentSheet({
  theme,
  post,
  visible,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose,
}: Props) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (visible && post) {
      fetchComments();
    }
  }, [visible, post?.id]);

  const fetchComments = async () => {
    if (!post) return;
    setIsLoading(true);
    const data = await loadComments(post.id);
    setComments(data);
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!text.trim() || !post || isSending) return;
    setIsSending(true);
    const newComment = await addComment(currentUserId, post.id, text.trim());
    if (newComment) {
      setComments((prev) => [...prev, newComment]);
      setText('');
    }
    setIsSending(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!post) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Comments
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {comments.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="chatbubble-outline" size={32} color={theme.textMuted} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    No comments yet. Be the first!
                  </Text>
                </View>
              ) : (
                comments.map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    <UserAvatar
                      uri={c.profiles?.avatar_url}
                      name={c.profiles?.full_name ?? 'User'}
                      size={32}
                      theme={theme}
                    />
                    <View style={[styles.bubble, {
                      backgroundColor: theme.bg,
                      borderColor: theme.border,
                    }]}>
                      <View style={styles.bubbleTop}>
                        <Text style={[styles.commentAuthor, { color: theme.accent }]}>
                          {c.profiles?.full_name ?? 'User'}
                        </Text>
                        <Text style={[styles.commentTime, { color: theme.textMuted }]}>
                          {timeAgo(c.created_at)}
                        </Text>
                      </View>
                      <Text style={[styles.commentContent, { color: theme.textPrimary }]}>
                        {c.content}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* Input */}
          <View style={[styles.inputRow, { borderTopColor: theme.border }]}>
            <UserAvatar
              uri={currentUserAvatar}
              name={currentUserName}
              size={32}
              theme={theme}
            />
            <View style={[styles.inputWrap, {
              backgroundColor: theme.bg,
              borderColor: theme.border,
            }]}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Add a comment..."
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { color: theme.textPrimary }]}
                multiline
                maxLength={300}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || isSending}
              style={[styles.sendBtn, {
                backgroundColor: text.trim() ? theme.accent : theme.border,
              }]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={theme.bg} />
              ) : (
                <Ionicons name="send" size={16} color={theme.bg} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: { fontSize: fontSize.lg, fontWeight: '700' },
  loading: { height: 120, alignItems: 'center', justifyContent: 'center' },
  list: { maxHeight: 320, padding: spacing.lg },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: fontSize.sm },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  bubble: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 3,
  },
  bubbleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthor: { fontSize: fontSize.xs, fontWeight: '700' },
  commentTime: { fontSize: 9 },
  commentContent: { fontSize: fontSize.base, lineHeight: 18 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
  },
  inputWrap: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxHeight: 80,
  },
  input: { fontSize: fontSize.base },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});