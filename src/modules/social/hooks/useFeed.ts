import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadFeed, loadDiscoverFeed, PostData } from '../services/postService';

export function useFeed(userId: string) {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [discoverPosts, setDiscoverPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (userId) load();
    }, [userId])
  );

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