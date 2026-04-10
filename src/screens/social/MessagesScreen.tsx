import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── TYPES ─────────────────────────────────────────────────────
interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantCalfitId: string;
  participantGoal: string;
  participantStreak: number;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  time: string;
}

// ── PROGRESS SNAPSHOT ─────────────────────────────────────────
function ProgressSnapshot({
  theme,
  name,
  calfitId,
  goal,
  streak,
}: {
  theme: typeof colors.dark;
  name: string;
  calfitId: string;
  goal: string;
  streak: number;
}) {
  return (
    <View style={[styles.snapshot, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      {/* Avatar */}
      <View style={[styles.snapshotAvatar, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}>
        <Text style={[styles.snapshotInitial, { color: theme.accent }]}>
          {name[0]?.toUpperCase() ?? 'U'}
        </Text>
      </View>

      {/* Info — CalFit ID and goal ONLY, no personal data */}
      <View style={styles.snapshotInfo}>
        <Text style={[styles.snapshotName, { color: theme.textPrimary }]}>{name}</Text>
        <Text style={[styles.snapshotId, { color: theme.textMuted }]}>@{calfitId}</Text>
      </View>

      {/* Progress stats — fitness data only */}
      <View style={styles.snapshotStats}>
        {[
          { label: 'Streak', value: `${streak}🔥`, color: theme.orange },
          { label: 'Goal', value: goal || 'Active', color: theme.accent },
        ].map((s) => (
          <View key={s.label} style={[styles.snapshotStat, {
            backgroundColor: s.color + '15',
          }]}>
            <Text style={[styles.snapshotStatValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.snapshotStatLabel, { color: theme.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── CHAT SCREEN ───────────────────────────────────────────────
function ChatScreen({
  theme,
  conversation,
  currentUserId,
  onBack,
}: {
  theme: typeof colors.dark;
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: conversation.participantId,
      content: `Hey! Let's crush our goals together 💪`,
      time: '10:30 AM',
    },
  ]);
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      content: text.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setText('');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Header — CalFit ID only, no personal info */}
      <View style={[styles.chatHeader, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <View style={[styles.chatAvatar, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}>
            <Text style={[styles.chatAvatarText, { color: theme.accent }]}>
              {conversation.participantName[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <View>
            <Text style={[styles.chatName, { color: theme.textPrimary }]}>
              {conversation.participantName}
            </Text>
            <Text style={[styles.chatId, { color: theme.textMuted }]}>
              @{conversation.participantCalfitId}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress snapshot — fitness stats only */}
      <ProgressSnapshot
        theme={theme}
        name={conversation.participantName}
        calfitId={conversation.participantCalfitId}
        goal={conversation.participantGoal}
        streak={conversation.participantStreak}
      />

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <View key={msg.id} style={[
                styles.messageRow,
                isMe ? styles.messageRowRight : styles.messageRowLeft,
              ]}>
                <View style={[styles.messageBubble, {
                  backgroundColor: isMe ? theme.accent : theme.card,
                  borderColor: isMe ? theme.accent : theme.border,
                }]}>
                  <Text style={[styles.messageText, {
                    color: isMe ? theme.bg : theme.textPrimary,
                  }]}>
                    {msg.content}
                  </Text>
                  <Text style={[styles.messageTime, {
                    color: isMe ? theme.bg + 'aa' : theme.textMuted,
                  }]}>
                    {msg.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={[styles.messageInput, {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        }]}>
          <View style={[styles.messageInputField, {
            backgroundColor: theme.bg,
            borderColor: theme.border,
          }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message about workouts, goals..."
              placeholderTextColor={theme.textMuted}
              style={[styles.messageInputText, { color: theme.textPrimary }]}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendBtn, {
              backgroundColor: text.trim() ? theme.accent : theme.border,
            }]}
          >
            <Ionicons name="send" size={18} color={theme.bg} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── MAIN MESSAGES SCREEN ──────────────────────────────────────
export default function MessagesScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [user?.id])
  );

  const loadConversations = async () => {
    if (!user?.id) return;
    // Will load from Supabase messages table in Phase 4
    // For now shows empty state
    setConversations([]);
  };

  // If a conversation is open show the chat view
  if (activeConversation) {
    return (
      <ChatScreen
        theme={theme}
        conversation={activeConversation}
        currentUserId={user?.id ?? ''}
        onBack={() => setActiveConversation(null)}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Social</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Messages</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Privacy notice */}
      <View style={[styles.privacyNote, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}>
        <Ionicons name="shield-checkmark-outline" size={14} color={theme.accent} />
        <Text style={[styles.privacyNoteText, { color: theme.accent }]}>
          Only CalFit IDs and fitness progress are shared. No personal info.
        </Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="paper-plane-outline" size={52} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            No messages yet
          </Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            Follow members on the Social feed and start a conversation about workouts and goals.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.emptyBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.emptyBtnText, { color: theme.bg }]}>
              Go to Social Feed
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              onPress={() => setActiveConversation(conv)}
              style={[styles.convRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[styles.convAvatar, {
                backgroundColor: theme.accentDim as string,
                borderColor: theme.accent,
              }]}>
                <Text style={[styles.convAvatarText, { color: theme.accent }]}>
                  {conv.participantName[0]?.toUpperCase() ?? 'U'}
                </Text>
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convTop}>
                  <Text style={[styles.convName, { color: theme.textPrimary }]}>
                    {conv.participantName}
                  </Text>
                  <Text style={[styles.convTime, { color: theme.textMuted }]}>
                    {conv.lastMessageTime}
                  </Text>
                </View>
                <Text style={[styles.convId, { color: theme.textMuted }]}>
                  @{conv.participantCalfitId}
                </Text>
                <Text style={[styles.convLast, { color: theme.textSecondary }]} numberOfLines={1}>
                  {conv.lastMessage}
                </Text>
              </View>
              {conv.unread > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.unreadText, { color: theme.bg }]}>{conv.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },
  pageTitle: { fontSize: fontSize.lg, fontWeight: '700' },

  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  privacyNoteText: { fontSize: fontSize.xs, fontWeight: '600', flex: 1 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  emptyBtnText: { fontSize: fontSize.base, fontWeight: '700' },

  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  convAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, flexShrink: 0,
  },
  convAvatarText: { fontSize: fontSize.xl, fontWeight: '700' },
  convInfo: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: fontSize.base, fontWeight: '700' },
  convTime: { fontSize: fontSize.xs },
  convId: { fontSize: fontSize.xs, marginTop: 1 },
  convLast: { fontSize: fontSize.sm, marginTop: 2 },
  unreadBadge: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { fontSize: 9, fontWeight: '800' },

  // Chat screen
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chatAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  chatAvatarText: { fontSize: fontSize.base, fontWeight: '700' },
  chatName: { fontSize: fontSize.base, fontWeight: '700' },
  chatId: { fontSize: fontSize.xs },

  // Progress snapshot
  snapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  snapshotAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, flexShrink: 0,
  },
  snapshotInitial: { fontSize: fontSize.xl, fontWeight: '800' },
  snapshotInfo: { flex: 1 },
  snapshotName: { fontSize: fontSize.base, fontWeight: '700' },
  snapshotId: { fontSize: fontSize.xs, marginTop: 2 },
  snapshotStats: { flexDirection: 'row', gap: spacing.xs },
  snapshotStat: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
    minWidth: 52,
  },
  snapshotStatValue: { fontSize: fontSize.sm, fontWeight: '800' },
  snapshotStatLabel: { fontSize: 9, marginTop: 1 },

  // Messages
  messageList: { flex: 1 },
  messageListContent: { padding: spacing.lg, gap: spacing.sm },
  messageRow: { flexDirection: 'row' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  messageText: { fontSize: fontSize.base, lineHeight: 20 },
  messageTime: { fontSize: 9, alignSelf: 'flex-end' },

  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
  },
  messageInputField: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxHeight: 100,
  },
  messageInputText: { fontSize: fontSize.base },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
});