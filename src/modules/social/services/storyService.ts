import { supabase } from '../../../services/supabase';

export interface StoryData {
  id: string;
  user_id: string;
  type: 'auto' | 'manual';
  content_type: 'streak' | 'workout' | 'milestone' | 'meal' | 'image';
  caption: string | null;
  image_url: string | null;
  metadata: Record<string, any>;
  expires_at: string;
  created_at: string;
  profiles: {
    full_name: string;
    calfit_id: string;
    avatar_url: string | null;
  } | null;
}

export const loadStories = async (userId: string): Promise<StoryData[]> => {
  const { data: followData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = ((followData ?? []) as any[]).map((f) => f.following_id);
  if (followingIds.length === 0) return [];

  const { data, error } = await supabase
    .from('stories')
    .select(`
      id, user_id, type, content_type, caption,
      image_url, metadata, expires_at, created_at,
      profiles:user_id (full_name, calfit_id, avatar_url)
    `)
    .in('user_id', followingIds)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as any[];
};

export const autoGenerateWorkoutStory = async (
  userId: string,
  workoutName: string,
  caloriesBurned: number
): Promise<void> => {
  await supabase.from('stories').insert({
    user_id: userId,
    type: 'auto',
    content_type: 'workout',
    caption: `Just completed ${workoutName}! ${caloriesBurned} kcal burned 💪`,
    metadata: { workout_name: workoutName, calories: caloriesBurned },
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
};

export const autoGenerateStreakStory = async (
  userId: string,
  streakCount: number
): Promise<void> => {
  await supabase.from('stories').insert({
    user_id: userId,
    type: 'auto',
    content_type: 'streak',
    caption: `${streakCount} day streak on CalFit! 🔥`,
    metadata: { streak_count: streakCount },
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
};