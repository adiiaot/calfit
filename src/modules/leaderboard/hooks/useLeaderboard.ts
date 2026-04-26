import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getGlobalLeaderboard,
  getFriendsLeaderboard,
  LeaderboardEntry,
  LeaderboardCategory,
} from '../services/LeaderboardService';

// ── WHY: getMyRank was never exported from LeaderboardService.
// Instead of a separate DB call, we derive rank from the already-
// loaded global entries — the current user's rank is their position
// in the sorted list, which the service already computes.
//
// Also removed updateMyScore from the critical load path —
// it was awaited before the 3 parallel queries and if it hit a
// missing table it would freeze isLoading forever.

export function useLeaderboard(userId: string) {
  const [globalEntries, setGlobalEntries]   = useState<LeaderboardEntry[]>([]);
  const [friendsEntries, setFriendsEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank]                 = useState(0);
  const [isLoading, setIsLoading]           = useState(true);
  const [isRefreshing, setIsRefreshing]     = useState(false);
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('overall');
  const loadingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (userId) load();
    }, [userId, activeCategory])
  );

  const load = async () => {
    if (!userId || loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);

    try {
      // 10s safety timeout — if any query hangs on a missing table,
      // we fall out of loading rather than spinning forever
      const TIMEOUT = new Promise<[LeaderboardEntry[], LeaderboardEntry[]]>(
        (resolve) => setTimeout(() => resolve([[], []]), 10_000)
      );

      const FETCH = Promise.all([
        getGlobalLeaderboard(userId, activeCategory).catch(() => [] as LeaderboardEntry[]),
        getFriendsLeaderboard(userId, activeCategory).catch(() => [] as LeaderboardEntry[]),
      ]);

      const [global, friends] = await Promise.race([FETCH, TIMEOUT]);

      setGlobalEntries(global);
      setFriendsEntries(friends);

      // Derive rank from the sorted global list — no extra DB call needed
      const me = global.find((e) => e.isCurrentUser);
      setMyRank(me?.rank ?? 0);
    } catch {
      setGlobalEntries([]);
      setFriendsEntries([]);
      setMyRank(0);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const refresh = async () => {
    setIsRefreshing(true);
    loadingRef.current = false; // allow reload
    await load();
    setIsRefreshing(false);
  };

  const changeCategory = (category: LeaderboardCategory) => {
    if (category !== activeCategory) {
      setActiveCategory(category);
    }
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