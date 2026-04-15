import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getGlobalLeaderboard,
  getFriendsLeaderboard,
  updateMyScore,
  getMyRank,
  LeaderboardEntry,
  LeaderboardCategory,
} from '../services/LeaderboardService';

export function useLeaderboard(userId: string) {
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [friendsEntries, setFriendsEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('overall');

  useFocusEffect(
    useCallback(() => {
      if (userId) load();
    }, [userId, activeCategory])
  );

  const load = async () => {
    if (!userId) return;
    setIsLoading(true);

    // Update my score before loading
    await updateMyScore(userId);

    const [global, friends, rank] = await Promise.all([
      getGlobalLeaderboard(userId, activeCategory),
      getFriendsLeaderboard(userId, activeCategory),
      getMyRank(userId, activeCategory),
    ]);

    setGlobalEntries(global);
    setFriendsEntries(friends);
    setMyRank(rank);
    setIsLoading(false);
  };

  const refresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const changeCategory = (category: LeaderboardCategory) => {
    setActiveCategory(category);
  };

  return {
    globalEntries,
    friendsEntries,
    myRank,
    isLoading,
    isRefreshing,
    activeCategory,
    refresh,
    changeCategory,
  };
}