import { supabase } from '../../../services/supabase';
import * as ImagePicker from 'expo-image-picker';

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
  // Also include own stories
  followingIds.push(userId);

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

// ── PICK IMAGE FROM GALLERY ───────────────────────────────────
export const pickStoryImage = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [9, 16], // Story aspect ratio
    quality: 0.8,
    base64: false,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
};

// ── UPLOAD STORY IMAGE TO SUPABASE STORAGE ────────────────────
export const uploadStoryImage = async (
  imageUri: string,
  userId: string
): Promise<string | null> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const { decode } = await import('base64-arraybuffer');

    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () =>
        resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const filePath = `stories/${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('posts-media') // reuse existing bucket
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('uploadStoryImage error:', error.message);
      return null;
    }

    const { data } = supabase.storage
      .from('posts-media')
      .getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('uploadStoryImage failed:', err);
    return null;
  }
};

// ── CREATE MANUAL STORY ───────────────────────────────────────
export const createManualStory = async (
  userId: string,
  imageUrl: string,
  caption?: string
): Promise<StoryData | null> => {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: userId,
      type: 'manual',
      content_type: 'image',
      caption: caption ?? null,
      image_url: imageUrl,
      metadata: {},
      expires_at: expiresAt,
    })
    .select(`
      id, user_id, type, content_type, caption,
      image_url, metadata, expires_at, created_at,
      profiles:user_id (full_name, calfit_id, avatar_url)
    `)
    .single();

  if (error) {
    console.error('createManualStory error:', error.message);
    return null;
  }
return data as unknown as StoryData;
};

// ── AUTO-GENERATED STORIES ────────────────────────────────────
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