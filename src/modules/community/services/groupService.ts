import { supabase } from '../../../services/supabase';

export interface GroupData {
  id: string;
  name: string;
  description: string;
  category: string;
  creator_id: string;
  member_count: number;
  streak: number;
  emoji: string;
  is_joined?: boolean;
  is_owner?: boolean;
}

// ── CREATE GROUP ──────────────────────────────────────────────
export const createGroup = async (
  userId: string,
  name: string,
  description: string,
  category: string
): Promise<GroupData | null> => {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      name,
      description,
      category,
      creator_id: userId,
      member_count: 1,
    })
    .select()
    .single();

  if (error) {
    console.error('createGroup error:', error.message);
    return null;
  }
  return data as any;
};

// ── LOAD MY GROUPS ────────────────────────────────────────────
export const loadMyGroups = async (userId: string): Promise<GroupData[]> => {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      role,
      groups:group_id (
        id, name, description, category,
        creator_id, member_count, streak
      )
    `)
    .eq('user_id', userId);

  if (error || !data) return [];

  return (data as any[])
    .filter((item) => item.groups !== null)
    .map((item) => ({
      ...item.groups,
      emoji: getEmojiForCategory(item.groups?.category),
      is_joined: true,
      is_owner: item.role === 'creator',
    }));
};

// ── LOAD DISCOVER GROUPS ──────────────────────────────────────
export const loadDiscoverGroups = async (userId: string): Promise<GroupData[]> => {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, description, category, creator_id, member_count, streak')
    .order('member_count', { ascending: false })
    .limit(20);

  if (error || !data) return [];

  const { data: myGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  const joinedIds = new Set(
    ((myGroups ?? []) as any[]).map((g) => g.group_id)
  );

  return (data as any[]).map((g) => ({
    ...g,
    emoji: getEmojiForCategory(g.category),
    is_joined: joinedIds.has(g.id),
    is_owner: g.creator_id === userId,
  }));
};

// ── JOIN GROUP ────────────────────────────────────────────────
export const joinGroup = async (
  userId: string,
  groupId: string
): Promise<boolean> => {
  // Add member record
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ user_id: userId, group_id: groupId, role: 'member' });

  if (memberError) {
    console.error('joinGroup error:', memberError.message);
    return false;
  }

  // Increment member count directly
  const { error: countError } = await supabase.rpc(
    'increment_group_member_count',
    { gid: groupId }
  );

  if (countError) {
    // Non-critical — log but don't fail the join
    console.warn('increment member count error:', countError.message);
  }

  return true;
};

// ── LEAVE GROUP ───────────────────────────────────────────────
export const leaveGroup = async (
  userId: string,
  groupId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('user_id', userId)
    .eq('group_id', groupId);

  if (error) {
    console.error('leaveGroup error:', error.message);
    return false;
  }

  // Decrement member count
  await supabase.rpc('decrement_group_member_count', { gid: groupId });

  return true;
};

// ── DELETE GROUP ──────────────────────────────────────────────
// The creator_id RLS policy requires the user to be authenticated
// and the row's creator_id must match auth.uid().
// Passing userId here ensures the correct session is active.
export const deleteGroup = async (
  userId: string,
  groupId: string
): Promise<{ success: boolean; error?: string }> => {
  // First verify this user is actually the creator
  const { data: group, error: fetchError } = await supabase
    .from('groups')
    .select('creator_id')
    .eq('id', groupId)
    .single();

  if (fetchError || !group) {
    return { success: false, error: 'Group not found.' };
  }

  if (group.creator_id !== userId) {
    return { success: false, error: 'Only the group creator can delete this group.' };
  }

  // Delete all members first (cascade may handle this but being explicit)
  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId);

  // Delete the group
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)
    .eq('creator_id', userId); // Double-lock: matches RLS policy

  if (error) {
    console.error('deleteGroup error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// ── GET OWNED GROUP COUNT ─────────────────────────────────────
export const getOwnedGroupCount = async (userId: string): Promise<number> => {
  const { count } = await supabase
    .from('groups')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', userId);
  return count ?? 0;
};

// ── EMOJI MAP ─────────────────────────────────────────────────
const getEmojiForCategory = (category: string): string => {
  const map: Record<string, string> = {
    Fitness: '💪',
    Nutrition: '🥗',
    'Weight Loss': '⚡',
    'Muscle Gain': '🏋️',
    Running: '🏃',
    'Mental Health': '🧘',
    Yoga: '🌿',
    Sports: '⚽',
  };
  return map[category] ?? '✨';
};