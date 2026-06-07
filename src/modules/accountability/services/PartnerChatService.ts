import { supabase } from '../../../services/supabase';

export type MessageType = 'text' | 'image' | 'video' | 'audio';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: MessageType;
  media_url?: string | null;
  media_duration?: number | null;
  created_at: string;
  read: boolean;
}

export interface SendMessageResult {
  success: boolean;
  message?: string;
}

const fileToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  return response.blob();
};

export const uploadMedia = async (
  userId: string,
  fileUri: string,
  fileType: 'image' | 'video' | 'audio'
): Promise<string | null> => {
  try {
    const extMap: Record<string, string> = { image: 'jpg', video: 'mp4', audio: 'm4a' };
    const contentTypeMap: Record<string, string> = {
      image: 'image/jpeg', video: 'video/mp4', audio: 'audio/mp4',
    };
    const ext = extMap[fileType];
    const contentType = contentTypeMap[fileType];
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const blob = await fileToBlob(fileUri);
    const { error: uploadError } = await supabase.storage
      .from('partner-media')
      .upload(fileName, blob, { contentType, upsert: false });

    if (uploadError) {
      console.error('uploadMedia error:', uploadError.message);
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('does not exist')) {
        console.warn('The "partner-media" storage bucket does not exist. Create it in Supabase Dashboard → Storage → New bucket → name: partner-media → Public');
      } else if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('policy')) {
        console.warn('RLS policy blocking upload. Run supabase/migrations/storage_rls_policies.sql in Supabase Dashboard SQL Editor to fix.');
      }
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('partner-media')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (e) {
    console.error('uploadMedia exception:', e);
    return null;
  }
};

export const sendMediaMessage = async (
  senderId: string,
  receiverId: string,
  messageType: MessageType,
  mediaUrl: string,
  text?: string,
  duration?: number
): Promise<SendMessageResult> => {
  const { error } = await supabase.from('partner_messages').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    message: text?.trim() ?? '',
    message_type: messageType,
    media_url: mediaUrl,
    media_duration: duration ?? null,
    read: false,
  });

  if (error) {
    console.error('sendMediaMessage error:', error.message);
    return { success: false, message: error.message };
  }
  return { success: true };
};

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
    message_type: 'text',
    read: false,
  });

  if (error) {
    console.error('sendMessage error:', error.message);
    return { success: false, message: error.message };
  }
  return { success: true };
};

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

export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('partner_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read', false);

  if (error) return 0;
  return count ?? 0;
};

export const markAsRead = async (userId: string, senderId: string): Promise<void> => {
  await supabase
    .from('partner_messages')
    .update({ read: true })
    .eq('sender_id', senderId)
    .eq('receiver_id', userId)
    .eq('read', false);
};
