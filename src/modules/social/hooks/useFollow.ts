import { useState } from 'react';
import { followUser, unfollowUser } from '../services/followService';

export function useFollow(currentUserId: string) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const toggle = async (
    targetUserId: string,
    currentlyFollowing: boolean
  ): Promise<boolean> => {
    setLoadingIds((prev) => new Set(prev).add(targetUserId));

    const success = currentlyFollowing
      ? await unfollowUser(currentUserId, targetUserId)
      : await followUser(currentUserId, targetUserId);

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(targetUserId);
      return next;
    });

    return success;
  };

  const isLoading = (userId: string) => loadingIds.has(userId);

  return { toggle, isLoading };
}