import { supabase } from '../../../services/supabase';

export interface ConversationData {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_message_at: string;
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

export interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export const getOrCreateConversation = async (
  userId: string,
  otherUserId: string
): Promise<string | null> => {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_1.eq.${userId},participant_2.eq.${otherUserId}),` +
      `and(participant_1.eq.${otherUserId},participant_2.eq.${userId})`
    )
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ participant_1: userId, participant_2: otherUserId })
    .select('id')
    .single();

  if (error) return null;
  return data.id;
};

export const loadConversations = async (userId: string): Promise<ConversationData[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2, last_message, last_message_at')
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error || !data) return [];

  const result: ConversationData[] = await Promise.all(
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

  if (error) return null;

  await supabase
    .from('conversations')
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

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