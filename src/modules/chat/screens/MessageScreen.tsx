import {
  View, Text, StyleSheet, 
  ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { AndroidSafeView } from '../../shared/AndriodSafeView';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { ConversationRow } from '../components/conversationRow';
import { useConversations } from '../hooks/useConversations';
import { EmptyState } from '../../shared/EmptyState';
import { ConversationData } from '../services/chatServices';

export default function MessagesScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user } = useAuthStore();
  const theme = colors[colorScheme];
  const { conversations, isLoading } = useConversations(user?.id ?? '');

  const handleOpenChat = (conv: ConversationData) => {
    const otherUser = conv.other_user;
    navigation.navigate('Chat', {
      conversationId: conv.id,
      otherUserId: otherUser?.id,
      otherUserName: otherUser?.full_name ?? 'CalFit User',
      otherUserCalfitId: otherUser?.calfit_id ?? '',
      otherUserAvatar: otherUser?.avatar_url ?? null,
      otherUserGoal: otherUser?.goal ?? '',
      otherUserStreak: otherUser?.streak_count ?? 0,
    });
  };

  return (

        <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
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

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : conversations.length === 0 ? (
        <EmptyState
          theme={theme}
          icon="paper-plane-outline"
          title="No messages yet"
          subtitle="Follow members on the Social feed and start a conversation about workouts and goals."
          buttonLabel="Go to Social Feed"
          onButtonPress={() => navigation.goBack()}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {conversations.map((conv) => (
            <ConversationRow
              key={conv.id}
              name={conv.other_user?.full_name ?? 'CalFit User'}
              calfitId={conv.other_user?.calfit_id ?? ''}
              avatarUrl={conv.other_user?.avatar_url}
              lastMessage={conv.last_message ?? 'Say hello!'}
              lastMessageTime={
                conv.last_message_at
                  ? new Date(conv.last_message_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : ''
              }
              unreadCount={conv.unread_count}
              theme={theme}
              onPress={() => handleOpenChat(conv)}
            />
          ))}
        </ScrollView>
      )}
        </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: spacing.sm },
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});