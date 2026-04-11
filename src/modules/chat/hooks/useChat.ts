import { useState, useEffect, useRef } from 'react';
import {
  loadMessages,
  sendMessage,
  subscribeToMessages,
  markMessagesRead,
  MessageData,
} from '../services/chatServices';

export function useChat(conversationId: string, currentUserId: string) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    init();
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [conversationId]);

  const init = async () => {
    setIsLoading(true);
    const msgs = await loadMessages(conversationId);
    setMessages(msgs);
    setIsLoading(false);
    await markMessagesRead(conversationId, currentUserId);
    unsubscribeRef.current = subscribeToMessages(conversationId, (newMsg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      if (newMsg.sender_id !== currentUserId) {
        markMessagesRead(conversationId, currentUserId);
      }
    });
  };

  const send = async (content: string): Promise<boolean> => {
    if (!content.trim() || isSending) return false;
    setIsSending(true);
    const msg = await sendMessage(conversationId, currentUserId, content.trim());
    if (msg) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }
    setIsSending(false);
    return !!msg;
  };

  return { messages, isLoading, isSending, send };
}