import { supabase } from '../../../services/supabase';

/** Supported media types for chat messages. */
export type MessageType = 'text' | 'image' | 'video' | 'audio';

/** A single chat message between accountability partners. */
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

/** Result returned after attempting to send a message. */
export interface SendMessageResult {
  success: boolean;
  message?: string;
}

const fileToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  return response.blob();
};

/**
 * Upload a media file (image, video, or audio) to the "partner-media" storage bucket.
 *
 * @param userId - The user ID used to namespace the uploaded file.
 * @param fileUri - The local file URI to upload.
 * @param fileType - The category of media being uploaded.
 * @returns The public URL of the uploaded file, or null on failure.
 */
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
      if (__DEV__) console.error('uploadMedia error:', uploadError.message);
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('does not exist')) {
        if (__DEV__) console.warn('The "partner-media" storage bucket does not exist. Create it in Supabase Dashboard → Storage → New bucket → name: partner-media → Public');
      } else if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('policy')) {
        if (__DEV__) console.warn('RLS policy blocking upload. Run supabase/migrations/storage_rls_policies.sql in Supabase Dashboard SQL Editor to fix.');
      }
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('partner-media')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (e) {
    if (__DEV__) console.error('uploadMedia exception:', e);
    return null;
  }
};

/**
 * Send a message that contains media (image / video / audio).
 *
 * @param senderId - The message sender's user ID.
 * @param receiverId - The message recipient's user ID.
 * @param messageType - The type of media being sent.
 * @param mediaUrl - The public URL of the uploaded media.
 * @param text - Optional text caption accompanying the media.
 * @param duration - Optional playback duration in seconds (audio/video).
 * @returns A result indicating success or failure with an error message.
 */
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
    if (__DEV__) console.error('sendMediaMessage error:', error.message);
    return { success: false, message: error.message };
  }
  return { success: true };
};

/**
 * Send a plain-text message to a partner.
 *
 * @param senderId - The message sender's user ID.
 * @param receiverId - The message recipient's user ID.
 * @param message - The text content to send (must not be empty).
 * @returns A result indicating success or failure with an error message.
 */
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
    if (__DEV__) console.error('sendMessage error:', error.message);
    return { success: false, message: error.message };
  }
  return { success: true };
};

/**
 * Load the most recent chat messages between the user and a partner, ordered newest-first,
 * then reversed to chronological order.
 *
 * @param userId - The requesting user's ID.
 * @param partnerId - The partner's user ID.
 * @param limit - Maximum number of messages to fetch (default 50).
 * @returns An array of chat messages in chronological order (oldest first).
 */
export const loadMessages = async (
  userId: string,
  partnerId: string,
  limit = 50
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('partner_messages')
    .select('id, sender_id, receiver_id, message, message_type, media_url, media_duration, created_at, read')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (__DEV__) console.error('loadMessages error:', error.message);
    return [];
  }

  return (data as ChatMessage[]).reverse();
};

/**
 * Subscribe to real-time incoming messages from a specific partner.
 *
 * @param userId - The current user's ID (messages are received as the receiver).
 * @param partnerId - The partner's user ID (messages are expected from this sender).
 * @param onMessage - Callback invoked with each new ChatMessage received.
 * @returns An unsubscribe function to clean up the subscription.
 */
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

/**
 * Get the total number of unread messages for a user across all partners.
 *
 * @param userId - The user ID to count unread messages for.
 * @returns The count of unread messages, or 0 on error.
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('partner_messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read', false);

  if (error) return 0;
  return count ?? 0;
};

/**
 * Mark all unread messages from a specific sender as read.
 *
 * @param userId - The receiver's user ID.
 * @param senderId - The sender's user ID whose messages should be marked read.
 */
export const markAsRead = async (userId: string, senderId: string): Promise<void> => {
  await supabase
    .from('partner_messages')
    .update({ read: true })
    .eq('sender_id', senderId)
    .eq('receiver_id', userId)
    .eq('read', false);
};
