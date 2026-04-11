import { supabase } from '../../../services/supabase';

export const followUser = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });
  return !error;
};

export const unfollowUser = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  return !error;
};

export const isFollowing = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  return !!data;
};

export const getFollowCounts = async (userId: string) => {
  const [followers, following] = await Promise.all([
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);
  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
};

export const getFollowing = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  return ((data ?? []) as any[]).map((f) => f.following_id);
};