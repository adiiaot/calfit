import {
  View, StyleSheet, SafeAreaView, Text,
  TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { useState, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, fontSize } from '../../../theme';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/chatInput';
import { ProgressSnapshot } from '../components/progressSnapshot';
import { UserAvatar } from '../../shared/UserAvatar';
import { useChat } from '../hooks/useChat';

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colorScheme } = useThemeStore();
  const { user } = useAuthStore();
  const theme = colors[colorScheme];

  const {
    conversationId,
    otherUserName,
    otherUserCalfitId,
    otherUserAvatar,
    otherUserGoal,
    otherUserStreak,
  } = route.params ?? {};

  const { messages, isLoading, send } = useChat(
    conversationId,
    user?.id ?? ''
  );

  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await send(text);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <UserAvatar
            uri={otherUserAvatar}
            name={otherUserName ?? 'User'}
            size={34}
            theme={theme}
          />
          <View>
            <Text style={[styles.headerName, { color: theme.textPrimary }]}>
              {otherUserName}
            </Text>
            <Text style={[styles.headerId, { color: theme.textMuted }]}>
              @{otherUserCalfitId}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ProgressSnapshot
        theme={theme}
        name={otherUserName ?? 'User'}
        calfitId={otherUserCalfitId ?? ''}
        goal={otherUserGoal ?? ''}
        streakCount={otherUserStreak ?? 0}
        avatarUrl={otherUserAvatar}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
          >
            {messages.length === 0 && (
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubbles-outline" size={40} color={theme.textMuted} />
                <Text style={[styles.emptyChatText, { color: theme.textMuted }]}>
                  Start a conversation about workouts and goals!
                </Text>
              </View>
            )}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                content={msg.content}
                time={formatTime(msg.created_at)}
                isMe={msg.sender_id === user?.id}
                theme={theme}
              />
            ))}
          </ScrollView>
        )}
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          theme={theme}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40 },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  headerName: { fontSize: fontSize.base, fontWeight: '700' },
  headerId: { fontSize: fontSize.xs },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { flex: 1 },
  messageListContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyChatText: {
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: 20,
  },
});