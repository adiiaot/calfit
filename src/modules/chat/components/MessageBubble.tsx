import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, fontSize } from '../../../theme';

export interface MessageBubbleProps {
  content: string;
  time: string;
  isMe: boolean;
  theme: typeof colors.dark;
  onLongPress?: () => void;
  reaction?: string;
}

export function MessageBubble({
  content,
  time,
  isMe,
  theme,
  onLongPress,
  reaction,
}: MessageBubbleProps) {
  return (
    <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
      <TouchableOpacity
        onLongPress={onLongPress}
        activeOpacity={0.85}
        style={[styles.bubble, {
          backgroundColor: isMe ? theme.accent : theme.card,
          borderColor: isMe ? theme.accent : theme.border,
          borderBottomRightRadius: isMe ? radius.xs : radius.xl,
          borderBottomLeftRadius: isMe ? radius.xl : radius.xs,
        }]}
      >
        <Text style={[styles.content, {
          color: isMe ? theme.bg : theme.textPrimary,
        }]}>
          {content}
        </Text>
        <Text style={[styles.time, {
          color: isMe ? theme.bg + 'aa' : theme.textMuted,
        }]}>
          {time}
        </Text>
      </TouchableOpacity>

      {reaction && (
        <View style={[styles.reaction, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <Text style={styles.reactionEmoji}>{reaction}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 4,
  },
  content: { fontSize: fontSize.base, lineHeight: 22 },
  time: { fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
  reaction: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  reactionEmoji: { fontSize: 12 },
});