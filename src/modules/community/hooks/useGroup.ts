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
      setMyGroups((prev) => [newGroup, ...prev]);
      setDiscoverGroups((prev) => [newGroup, ...prev]);
      setOwnedCount((prev) => prev + 1);
    }
    return group;
  };

  const join = async (groupId: string) => {
    // Optimistic update — increment member count immediately in both lists
    // This is what was missing before — is_joined was set but count stayed stale
    const updateCount = (groups: GroupData[]) =>
      groups.map((g) =>
        g.id === groupId
          ? { ...g, is_joined: true, member_count: g.member_count + 1 }
          : g
      );

    setDiscoverGroups((prev) => updateCount(prev));
    setMyGroups((prev) => {
      // Add to My Groups if not already there
      const exists = prev.find((g) => g.id === groupId);
      if (exists) return updateCount(prev);
      const group = discoverGroups.find((g) => g.id === groupId);
      if (group) return [...prev, { ...group, is_joined: true, member_count: group.member_count + 1 }];
      return prev;
    });

    const success = await joinGroup(userId, groupId);

    // If Supabase call failed, revert
    if (!success) {
      const revert = (groups: GroupData[]) =>
        groups.map((g) =>
          g.id === groupId
            ? { ...g, is_joined: false, member_count: Math.max(g.member_count - 1, 0) }
            : g
        );
      setDiscoverGroups((prev) => revert(prev));
      setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
    }
  };

  const leave = async (groupId: string) => {
    // Optimistic update — decrement count and remove from My Groups
    setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
    setDiscoverGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, is_joined: false, member_count: Math.max(g.member_count - 1, 0) }
          : g
      )
    );

    const success = await leaveGroup(userId, groupId);

    // Revert if failed
    if (!success) {
      reload();
    }
  };

  const remove = async (groupId: string): Promise<{ success: boolean; error?: string }> => {
    const result = await deleteGroup(userId, groupId);
    if (result.success) {
      setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
      setDiscoverGroups((prev) => prev.filter((g) => g.id !== groupId));
      setOwnedCount((prev) => Math.max(prev - 1, 0));
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