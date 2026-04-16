import { useState, useEffect } from 'react';
import {
  loadMyGroups,
  loadDiscoverGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  deleteGroup,
  getOwnedGroupCount,
  GroupData,
} from '../services/groupService';

export function useGroup(userId: string, userTier: string) {
  const [myGroups, setMyGroups] = useState<GroupData[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<GroupData[]>([]);
  const [ownedCount, setOwnedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const getGroupLimit = (): number => {
    if (userTier === 'premium') return 999;
    if (userTier === 'pro') return 5;
    return 1;
  };

  const groupLimit = getGroupLimit();
  const canCreate = ownedCount < groupLimit;

  // Only load once on mount — not on every focus
  // useFocusEffect was causing reload after delete which brought groups back
  useEffect(() => {
    if (userId) reload();
  }, [userId]);

  const reload = async () => {
    setIsLoading(true);
    const [mine, discover, count] = await Promise.all([
      loadMyGroups(userId),
      loadDiscoverGroups(userId),
      getOwnedGroupCount(userId),
    ]);
    setMyGroups(mine);
    setDiscoverGroups(discover);
    setOwnedCount(count);
    setIsLoading(false);
  };

 // Function to create a new group
 const create = async (
  name: string,
  description: string,
  category: string
): Promise<GroupData | null> => {
  if (!canCreate) return null;
  const group = await createGroup(userId, name, description, category);
  if (group) {
    const newGroup: GroupData = {
      ...group,
      emoji: '✨',
      is_joined: true,
      is_owner: true,
    };
    // Add to both My Groups and Discover simultaneously
    setMyGroups((prev) => [newGroup, ...prev]);
    setDiscoverGroups((prev) => [newGroup, ...prev]);
    setOwnedCount((prev) => prev + 1);
  }
  return group;
};

// Function to join a Group
  const join = async (groupId: string) => {
    await joinGroup(userId, groupId);
    const group = discoverGroups.find((g) => g.id === groupId);
    if (group) {
      setMyGroups((prev) => [...prev, { ...group, is_joined: true }]);
      setDiscoverGroups((prev) =>
        prev.map((g) => g.id === groupId ? { ...g, is_joined: true } : g)
      );
    }
  };

  // Function to Leave a Group

  const leave = async (groupId: string) => {
    await leaveGroup(userId, groupId);
    setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
    setDiscoverGroups((prev) =>
      prev.map((g) => g.id === groupId ? { ...g, is_joined: false } : g)
    );
  };

  // Function to Remove a Group (only for owners)
  const remove = async (groupId: string): Promise<{ success: boolean; error?: string }> => {
    // Remove from UI immediately before Supabase call
    // This prevents useFocusEffect from re-fetching it before delete completes
    setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
    setDiscoverGroups((prev) => prev.filter((g) => g.id !== groupId));
    setOwnedCount((prev) => Math.max(prev - 1, 0));

    const result = await deleteGroup(userId, groupId);

    if (!result.success) {
      // Delete failed — restore correct state from Supabase
      await reload();
    }

    return result;
  };

  return {
    myGroups,
    discoverGroups,
    canCreate,
    ownedCount,
    groupLimit,
    isLoading,
    create,
    join,
    leave,
    remove,
    reload,
  };
}