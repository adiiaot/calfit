import { supabase } from '../../../services/supabase';

export const followUser = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) return false;

  // ── Notify the person being followed ──────────────────────
  // Fetch the follower's name to include in the notification
  try {
    const { data: followerProfile } = await supabase
      .from('profiles')
      .select('full_name, calfit_id')
      .eq('id', followerId)
      .single();

    const followerName =
      followerProfile?.full_name ??
      followerProfile?.calfit_id ??
      'Someone';

    const { sendNotification } = await import(
      '../../../services/notificationService'
    );
    await sendNotification(
      followingId,
      'social',
      `${followerName} started following you`,
      'Tap to view their profile.',
      'View Profile'
    );
  } catch (e) {
    // Silent fail — notification is non-critical
  }

  return true;
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