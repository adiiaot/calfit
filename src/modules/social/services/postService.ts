import { supabase } from '../../../services/supabase';

export interface PostData {
  id: string;
  user_id: string;
  content: string;
  type: 'workout' | 'meal' | 'milestone' | 'text';
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    full_name: string;
    calfit_id: string;
    avatar_url: string | null;
    goal: string;
  } | null;
  is_liked?: boolean;
}

const POST_SELECT = `
  id, user_id, content, type, image_url,
  likes_count, comments_count, moderation_status, created_at,
  profiles:user_id (full_name, calfit_id, avatar_url, goal)
`;

export const loadFeed = async (
  userId: string,
  page = 0
): Promise<PostData[]> => {
  const limit = 20;
  const offset = page * limit;

  const { data: followData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = ((followData ?? []) as any[]).map((f) => f.following_id);
  followingIds.push(userId);

  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .in('user_id', followingIds)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];

  const posts = data as any[];
  const postIds = posts.map((p) => p.id);

  const { data: likedData } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);

  const likedSet = new Set(((likedData ?? []) as any[]).map((l) => l.post_id));
  return posts.map((p) => ({ ...p, is_liked: likedSet.has(p.id) }));
};

export const loadDiscoverFeed = async (userId: string): Promise<PostData[]> => {
  const { data: followData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = ((followData ?? []) as any[]).map((f) => f.following_id);
  followingIds.push(userId);

  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .not('user_id', 'in', `(${followingIds.join(',')})`)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data as any[];
};

export const createPost = async (
  userId: string,
  content: string,
  type: PostData['type'],
  imageUrl?: string
): Promise<PostData | null> => {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content,
      type,
      image_url: imageUrl ?? null,
      likes_count: 0,
      comments_count: 0,
      moderation_status: imageUrl ? 'pending' : 'approved',
    })
    .select(POST_SELECT)
    .single();

  if (error) {
    console.error('createPost error:', error.message);
    return null;
  }
  return data as any;
};

export const toggleLike = async (
  userId: string,
  postId: string,
  isLiked: boolean
): Promise<boolean> => {
  if (isLiked) {
    await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);
    await supabase.rpc('decrement_likes', { post_id: postId });
  } else {
    await supabase
      .from('post_likes')
      .insert({ user_id: userId, post_id: postId });
    await supabase.rpc('increment_likes', { post_id: postId });
  }
  return true;
};

export const deletePost = async (postId: string): Promise<boolean> => {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  return !error;
};

export const loadUserPosts = async (userId: string): Promise<PostData[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', userId)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as any[];
};

// ── SHARE POST ────────────────────────────────────────────────
import { Share } from 'react-native';

export const sharePost = async (post: PostData): Promise<void> => {
  try {
    const authorName = post.profiles?.full_name ?? 'A CalFit member';

    let shareMessage = `${authorName} on CalFit:\n\n"${post.content}"`;

    if (post.type === 'workout') {
      shareMessage = `💪 ${authorName} just logged a workout on CalFit!\n\n"${post.content}"`;
    } else if (post.type === 'meal') {
      shareMessage = `🥗 ${authorName} shared a meal on CalFit!\n\n"${post.content}"`;
    } else if (post.type === 'milestone') { 
      shareMessage = `🏆 ${authorName} hit a milestone on CalFit!\n\n"${post.content}"`;
    }

    shareMessage += `\n\nJoin me on CalFit 👉 `;

    await Share.share({
      message: shareMessage,
      title: 'Check this out on CalFit',
      url: 'https://calfit.tech',
    });
  } catch (error: any) {
    if (error?.message !== 'User did not share') {
      console.error('sharePost error:', error);
    }
  }
};