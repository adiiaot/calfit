import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadFeed, loadDiscoverFeed, PostData } from '../services/postService';
import { supabase } from '../../../services/supabase';

export function useFeed(userId: string) {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [discoverPosts, setDiscoverPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const channelRef = useRef<any>(null);

  // Reload feed every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userId) load();
    }, [userId])
  );

  // Subscribe to real-time post updates (likes_count, comments_count)
  // This means when another user likes or comments on a post,
  // the count updates live on screen without needing a manual pull-to-refresh.
  useEffect(() => {
    if (!userId) return;

    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`posts_realtime_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          const updated = payload.new as any;
          // Update the post in both feeds if it exists
          setPosts((prev) =>
            prev.map((p) =>
              p.id === updated.id
                ? {
                    ...p,
                    likes_count: updated.likes_count,
                    comments_count: updated.comments_count,
                  }
                : p
            )
          );
          setDiscoverPosts((prev) =>
            prev.map((p) =>
              p.id === updated.id
                ? {
                    ...p,
                    likes_count: updated.likes_count,
                    comments_count: updated.comments_count,
                  }
                : p
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        async (payload) => {
          // A new post was created — only add to feed if it's from
          // someone the current user follows, or the user themselves
          const newPost = payload.new as any;
          if (newPost.user_id === userId) {
            // Own post — already prepended optimistically, skip
            return;
          }
          // Reload feed to get the new post with full profile data
          const feed = await loadFeed(userId);
          setPosts(feed);
        }
      )
      .subscribe();

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
    prependPost,
  };
}