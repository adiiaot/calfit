import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../services/supabase';

export interface ModerationResult {
  safe: boolean;
  reason?: string;
}

export const pickPostImage = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
};

export const uploadPostImage = async (
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

    const filePath = `${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('posts-media')
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) return null;

    const { data } = supabase.storage
      .from('posts-media')
      .getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('uploadPostImage error:', err);
    return null;
  }
};

export const moderateImage = async (
  imageUri: string
): Promise<ModerationResult> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () =>
        resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
            },
            {
              type: 'text',
              text: `You are a content moderator for CalFit, a fitness app used by all ages including minors.

Review this image and respond ONLY with a JSON object:
{"safe": true} or {"safe": false, "reason": "brief reason"}

Reject if it contains: nudity, sexual content, revealing clothing exposing intimate areas, graphic violence, hateful content, or anything unrelated to fitness/food/health.

Approve if it shows: gym equipment, workouts, food/meals, fitness activities, progress photos with appropriate clothing, healthy lifestyle content.

Be strict — protect younger users.`,
            },
          ],
        }],
      }),
    });

    const claudeData = await claudeResponse.json();
    const text = claudeData.content?.[0]?.text ?? '{"safe":false}';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { safe: false, reason: 'Could not verify image safety' };

    return JSON.parse(match[0]);
  } catch (err) {
    console.error('moderateImage error:', err);
    return { safe: false, reason: 'Image verification failed. Please try again.' };
  }
};

export const approvePost = async (postId: string): Promise<void> => {
  await supabase
    .from('posts')
    .update({ moderation_status: 'approved', is_moderated: true })
    .eq('id', postId);
};

export const rejectPost = async (postId: string): Promise<void> => {
  await supabase.from('posts').delete().eq('id', postId);
};