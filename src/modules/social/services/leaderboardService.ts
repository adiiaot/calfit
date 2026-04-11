import { supabase } from '../../../services/supabase';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  calfit_id: string;
  avatar_url: string | null;
  goal: string;
  streak_count: number;
  isCurrentUser?: boolean;
}

export const getGlobalLeaderboard = async (
  currentUserId: string
): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, calfit_id, avatar_url, goal, streak_count')
    .order('streak_count', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return (data as any[]).map((u, i) => ({
    rank: i + 1,
    user_id: u.id,
    full_name: u.full_name ?? 'CalFit User',
    calfit_id: u.calfit_id ?? u.id.slice(0, 8),
    avatar_url: u.avatar_url ?? null,
    goal: u.goal ?? 'Get Fit',
    streak_count: u.streak_count ?? 0,
    isCurrentUser: u.id === currentUserId,
  }));
};

export const getFriendsLeaderboard = async (
  currentUserId: string
): Promise<LeaderboardEntry[]> => {
  const { data: followData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId);

  const followingIds = ((followData ?? []) as any[]).map((f) => f.following_id);
  followingIds.push(currentUserId);

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, calfit_id, avatar_url, goal, streak_count')
    .in('id', followingIds)
    .order('streak_count', { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((u, i) => ({
    rank: i + 1,
    user_id: u.id,
    full_name: u.full_name ?? 'CalFit User',
    calfit_id: u.calfit_id ?? u.id.slice(0, 8),
    avatar_url: u.avatar_url ?? null,
    goal: u.goal ?? 'Get Fit',
    streak_count: u.streak_count ?? 0,
    isCurrentUser: u.id === currentUserId,
  }));
};