import { supabase } from '../../../services/supabase';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface SendMessageResult {
  success: boolean;
  message?: string;
}

// Send a message to a partner
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  message: string
): Promise<SendMessageResult> => {
  if (!message.trim()) return { success: false, message: 'Message cannot be empty' };

  const { error } = await supabase.from('partner_messages').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    message: message.trim(),
    read: false,
  });

  if (error) {
    console.error('sendMessage error:', error.message);
    return { success: false, message: error.message };
  }

  return { success: true };
};

// Load recent messages between two users
export const loadMessages = async (
  userId: string,
  partnerId: string,
  limit = 50
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('partner_messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('loadMessages error:', error.message);
    return [];
  }

  return (data as ChatMessage[]).reverse();
};

// Subscribe to new messages (real-time)
export const subscribeToMessages = (
  userId: string,
  partnerId: string,
  onMessage: (message: ChatMessage) => void
) => {
  const channel = supabase
    .channel(`chat-${userId}-${partnerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'partner_messages',
        filter: `sender_id=eq.${partnerId},receiver_id=eq.${userId}`,
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Get unread message count
export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('partner_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read', false);

  if (error) return 0;
  return count ?? 0;
};

// Mark messages as read
export const markAsRead = async (userId: string, senderId: string): Promise<void> => {
  await supabase
    .from('partner_messages')
    .update({ read: true })
    .eq('sender_id', senderId)
    .eq('receiver_id', userId)
    .eq('read', false);
};
