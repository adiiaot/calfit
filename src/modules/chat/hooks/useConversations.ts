import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  loadConversations,
  ConversationData,
} from '../services/chatServices';

export function useConversations(userId: string) {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (userId) load();
    }, [userId])
  );

  const load = async () => {
    setIsLoading(true);
    const data = await loadConversations(userId);
    setConversations(data);
    setTotalUnread(data.reduce((sum, c) => sum + c.unread_count, 0));
    setIsLoading(false);
  };

  return { conversations, isLoading, totalUnread, reload: load };
}