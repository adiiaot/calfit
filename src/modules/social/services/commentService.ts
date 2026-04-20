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

  // Increment comment count on the post
  await supabase.rpc('increment_comments', { post_id: postId });

  // ── Notify post owner ──────────────────────────────────────
  // Fetch the post owner's user_id so we can notify them
  // Skip notification if the commenter is the post owner
  try {
    const { data: postData } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (postData && postData.user_id !== userId) {
      const commenterName = (data as any)?.profiles?.full_name ?? 'Someone';
      const preview = content.length > 40
        ? content.slice(0, 40) + '...'
        : content;

      const { sendNotification } = await import(
        '../../../services/notificationService'
      );
      await sendNotification(
        postData.user_id,
        'social',
        `${commenterName} commented on your post`,
        `"${preview}"`,
        'View Post'
      );
    }
  } catch (e) {
    // Silent fail — notification is non-critical
  }

  return data as any;
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  return !error;
};