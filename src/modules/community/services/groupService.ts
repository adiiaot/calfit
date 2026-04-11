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

  return (data as any[]).map((item) => ({
    ...item.groups,
    emoji: getEmojiForCategory(item.groups?.category),
    is_joined: true,
    is_owner: item.role === 'creator',
  }));
};

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

export const joinGroup = async (
  userId: string,
  groupId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('group_members')
    .insert({ user_id: userId, group_id: groupId, role: 'member' });

  if (!error) {
    await supabase
      .from('groups')
      .update({ member_count: supabase.rpc('increment_group_members', { gid: groupId }) })
      .eq('id', groupId);
  }
  return !error;
};

export const leaveGroup = async (
  userId: string,
  groupId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('user_id', userId)
    .eq('group_id', groupId);
  return !error;
};

export const deleteGroup = async (groupId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);
  return !error;
};

export const getOwnedGroupCount = async (userId: string): Promise<number> => {
  const { count } = await supabase
    .from('groups')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', userId);
  return count ?? 0;
};

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