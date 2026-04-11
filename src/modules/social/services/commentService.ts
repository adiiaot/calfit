import { supabase } from '../../../services/supabase';

export interface CommentData {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    calfit_id: string;
    avatar_url: string | null;
  } | null;
}

export const loadComments = async (postId: string): Promise<CommentData[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id, post_id, user_id, content, created_at,
      profiles:user_id (full_name, calfit_id, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data as any[]) ?? [];
};

export const addComment = async (
  userId: string,
  postId: string,
  content: string
): Promise<CommentData | null> => {
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, post_id: postId, content })
    .select(`
      id, post_id, user_id, content, created_at,
      profiles:user_id (full_name, calfit_id, avatar_url)
    `)
    .single();

  if (error) return null;

  await supabase.rpc('increment_comments', { post_id: postId });

  return data as any;
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  return !error;
};