import { supabase } from '../../../services/supabase';

export interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

// ── CONVERSATION DATA TYPE ────────────────────────────────────
// Returned by loadConversations() and used by MessageScreen + useConversations
export interface ConversationData {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_message_at: string | null;
  other_user: {
    id: string;
    full_name: string;
    calfit_id: string;
    avatar_url: string | null;
    goal: string;
    streak_count: number;
  } | null;
  unread_count: number;
}

export const getOrCreateConversation = async (
  userId: string,
  otherUserId: string
): Promise<string | null> => {
  // Check if conversation already exists between these two users
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_1.eq.${userId},participant_2.eq.${otherUserId}),` +
      `and(participant_1.eq.${otherUserId},participant_2.eq.${userId})`
    )
    .maybeSingle();

  if (existing) return existing.id;

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({ participant_1: userId, participant_2: otherUserId })
    .select('id')
    .single();

  if (error) {
    console.error('getOrCreateConversation error:', error.message);
    return null;
  }
  return data.id;
};

export const loadConversations = async (userId: string): Promise<ConversationData[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2, last_message, last_message_at')
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error || !data) return [];

  const result = await Promise.all(
    (data as any[]).map(async (conv) => {
      const otherUserId =
        conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, calfit_id, avatar_url, goal, streak_count')
        .eq('id', otherUserId)
        .single();

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('read', false)
        .neq('sender_id', userId);

      return {
        ...conv,
        other_user: profile ?? null,
        unread_count: count ?? 0,
      };
    })
  );

  return result;
};

export const loadMessages = async (conversationId: string): Promise<MessageData[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, read, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as MessageData[];
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<MessageData | null> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select('id, conversation_id, sender_id, content, read, created_at')
    .single();

  if (error) {
    console.error('sendMessage error:', error.message);
    return null;
  }

  // Update conversation last_message
  await supabase
    .from('conversations')
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  // ── Notify the recipient ───────────────────────────────────
  // Find the other participant and notify them of the new message.
  // Skip if the sender is somehow the only participant.
  try {
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_1, participant_2')
      .eq('id', conversationId)
      .single();

    if (conv) {
      const recipientId =
        conv.participant_1 === senderId ? conv.participant_2 : conv.participant_1;

      if (recipientId && recipientId !== senderId) {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('full_name, calfit_id')
          .eq('id', senderId)
          .single();

        const senderName =
          senderProfile?.full_name ??
          senderProfile?.calfit_id ??
          'Someone';

        const preview = content.length > 40
          ? content.slice(0, 40) + '...'
          : content;

        const { sendNotification } = await import(
          '../../../services/notificationService'
        );
        await sendNotification(
          recipientId,
          'social',
          `${senderName} sent you a message`,
          `"${preview}"`,
          'Reply'
        );
      }
    }
  } catch (e) {
    // Silent fail — notification is non-critical
  }

  return data as MessageData;
};

export const subscribeToMessages = (
  conversationId: string,
  onMessage: (message: MessageData) => void
) => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as MessageData)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

export const markMessagesRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('read', false);
};

export const getTotalUnreadCount = async (userId: string): Promise<number> => {
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

  if (!convs || convs.length === 0) return 0;

  const convIds = (convs as any[]).map((c) => c.id);
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convIds)
    .eq('read', false)
    .neq('sender_id', userId);

  return count ?? 0;
};