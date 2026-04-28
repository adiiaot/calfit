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

    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () =>
        resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const { decode } = await import('base64-arraybuffer');
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
  // If no API key, skip moderation and allow the post
  // (moderation is best-effort, not a hard blocker without the key)
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('moderateImage: no API key — skipping moderation');
    return { safe: true };
  }

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
      headers: {
        'Content-Type': 'application/json',
        // FIX: these two headers were missing — causing silent auth failures
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Haiku is fine for moderation
        max_tokens: 60,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
            },
            {
              type: 'text',
              // FIX: old prompt was blocking legitimate gym/fitness content.
              // New prompt explicitly approves fitness-appropriate attire
              // (sports bras, gym shorts, tank tops) which are expected on
              // a fitness platform. Only blocks actual NSFW content.
              text: `You are a content moderator for CalFit, a fitness and health app.

Respond ONLY with JSON: {"safe": true} or {"safe": false, "reason": "brief reason"}

APPROVE (safe: true):
- Workouts, gym sessions, exercise equipment
- Food, meals, healthy eating
- Progress photos (before/after)
- Fitness attire: sports bras, tank tops, gym shorts, leggings — normal for fitness
- Outdoor activities, running, sports
- Motivational fitness content

REJECT (safe: false):
- Nudity or sexually explicit content
- Graphic violence or gore
- Hateful symbols or content
- Content completely unrelated to health/fitness/food

Be permissive for genuine fitness content.`,
            },
          ],
        }],
      }),
    });

    if (!claudeResponse.ok) {
      // If Claude API fails (rate limit, server error etc), allow the post
      // Don't block users because of API issues on our end
      console.warn('moderateImage: API error', claudeResponse.status);
      return { safe: true };
    }

    const claudeData = await claudeResponse.json();
    const text = claudeData.content?.[0]?.text ?? '{"safe":true}';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { safe: true }; // can't parse = allow

    return JSON.parse(match[0]);
  } catch (err) {
    // Network error or parse error — don't block the user
    console.error('moderateImage error:', err);
    return { safe: true };
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