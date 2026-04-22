import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadFeed, loadDiscoverFeed, PostData } from '../services/postService';
import { supabase } from '../../../services/supabase';

export function useFeed(userId: string) {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [discoverPosts, setDiscoverPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (userId) load();
    }, [userId])
  );

  // All .on() listeners MUST be chained before .subscribe() is called once.
  // Adding listeners after subscribe() causes the "cannot add callbacks" error.
  useEffect(() => {
    if (!userId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

   const channel = supabase
  .channel(`posts_feed_${userId.slice(0, 8)}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          const updated = payload.new as any;
          const patcher = (prev: PostData[]) =>
            prev.map((p) =>
              p.id === updated.id
                ? { ...p, likes_count: updated.likes_count, comments_count: updated.comments_count }
                : p
            );
          setPosts(patcher);
          setDiscoverPosts(patcher);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          const deleted = payload.old as any;
          const remover = (prev: PostData[]) => prev.filter((p) => p.id !== deleted.id);
          setPosts(remover);
          setDiscoverPosts(remover);
        }
      )
      .subscribe(); // ← called once, after all listeners are registered

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  const load = async () => {
    setIsLoading(true);
    const [feed, discover] = await Promise.all([
      loadFeed(userId),
      loadDiscoverFeed(userId),
    ]);
    setPosts(feed);
    setDiscoverPosts(discover);
    setIsLoading(false);
  };

  const refresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const updatePost = (postId: string, updates: Partial<PostData>) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
    );
  };

  const removePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setDiscoverPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const prependPost = (post: PostData) => {
    setPosts((prev) => [post, ...prev]);
  };

  return {
    posts,
    discoverPosts,
    isLoading,
    isRefreshing,
    refresh,
    updatePost,
    removePost,
    prependPost,
  };
}