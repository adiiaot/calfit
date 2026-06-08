// src/services/voiceRecorderService.ts
// Uses Deepgram for speech-to-text — 200 hrs/month free, no credit card
//
// SETUP:
// 1. deepgram.com → Sign up free with dev@bigcut.store
// 2. Dashboard → API Keys → Create Key → copy it
// 3. Add to .env:  EXPO_PUBLIC_DEEPGRAM_KEY=your_key_here
// 4. npx expo start --clear

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

let recording: Audio.Recording | null = null;

/** Requests microphone permission from the user. @returns Whether permission was granted. */
export const requestMicPermission = async (): Promise<boolean> => {
  try {
    const { status: existing } = await Audio.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch { return false; }
};

/** Starts an audio recording. @returns Whether recording started successfully. */
export const startRecording = async (): Promise<boolean> => {
  try {
    const granted = await requestMicPermission();
    if (!granted) return false;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recording = rec;
    return true;
  } catch (e) { if (__DEV__) console.error('startRecording error:', e); return false; }
};

/** Stops the current audio recording and returns the file URI. @returns The recording file URI, or null if no recording was in progress. */
export const stopRecording = async (): Promise<string | null> => {
  if (!recording) return null;
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    return uri ?? null;
  } catch (e) { recording = null; return null; }
};

/** Cancels the current audio recording without saving. */
export const cancelRecording = async (): Promise<void> => {
  if (!recording) return;
  try {
    await recording.stopAndUnloadAsync();
    recording = null;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  } catch { recording = null; }
};

// ── TRANSCRIBE WITH DEEPGRAM ──────────────────────────────────
// Deepgram is synchronous — no polling needed.
// POST audio → get transcript back immediately in one request.
// Simpler and faster than AssemblyAI's async approach.
/** Transcribes an audio file using Deepgram speech-to-text. @param uri - The file URI of the audio recording. @returns The transcribed text, or null on failure. */
export const transcribeAudio = async (uri: string): Promise<string | null> => {
  const apiKey = process.env.EXPO_PUBLIC_DEEPGRAM_KEY;
  if (!apiKey) { if (__DEV__) console.warn('EXPO_PUBLIC_DEEPGRAM_KEY not set'); return null; }

  try {
    // Read audio as base64 then convert to binary blob for upload
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

    // Decode base64 to binary string and build byte array
    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // Deepgram: POST raw audio bytes, get JSON transcript back immediately
    // ?model=nova-3 — their best model, included in free tier
    // &smart_format=true — adds punctuation and capitalisation
    // &detect_language=true — handles any accent automatically
    const res = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&detect_language=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'audio/m4a',
        },
        body: bytes,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      if (__DEV__) console.error('Deepgram error:', res.status, err);
      return null;
    }

    const data = await res.json();
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    return transcript?.trim() || null;

  } catch (e) {
    if (__DEV__) console.error('transcribeAudio error:', e);
    return null;
  }
};

/** Formats a duration in milliseconds to mm:ss format. @param ms - Duration in milliseconds. @returns Formatted string in mm:ss. */
export const formatDuration = (ms: number): string => {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  return `${mins}:${(secs % 60).toString().padStart(2, '0')}`;
};