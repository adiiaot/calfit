import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

/** Requests microphone permission from the user. @returns Whether permission was granted. */
export const requestMicPermission = async (): Promise<boolean> => {
  try {
    const { status: existing } = await getRecordingPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await requestRecordingPermissionsAsync();
    return status === 'granted';
  } catch { return false; }
};

/** Transcribes an audio file using Deepgram speech-to-text via Supabase Edge Function proxy. @param uri - The file URI of the audio recording. @returns The transcribed text, or null on failure. */
export const transcribeAudio = async (uri: string): Promise<string | null> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

    const { data, error } = await supabase.functions.invoke('deepgram-proxy', {
      body: { audioBase64: base64, mimeType: 'audio/m4a' },
    });

    if (error) {
      if (__DEV__) console.error('Deepgram proxy error:', error);
      return null;
    }

    const transcript = data?.transcript?.trim();
    return transcript || null;

  } catch (e) {
    if (__DEV__) console.error('transcribeAudio error:', e);
    return null;
  }
};

/** Formats a duration in milliseconds to m:ss format. @param ms - Duration in milliseconds. @returns Formatted string in m:ss. */
export const formatDuration = (ms: number): string => {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  return `${mins}:${(secs % 60).toString().padStart(2, '0')}`;
};
