// src/services/voiceRecorderService.ts
// ─────────────────────────────────────────────────────────────
// Shared voice recording + transcription service
// Used by: CoachScreen, ChatScreen, MealPlannerScreen

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// ── WHY NO EncodingType enum ──────────────────────────────────
// expo-file-system v16+ removed the EncodingType enum.
// Use the string literal 'base64' directly instead of
// FileSystem.EncodingType.Base64 which no longer exists.

let recording: Audio.Recording | null = null;

// ── REQUEST PERMISSIONS ───────────────────────────────────────
export const requestMicPermission = async (): Promise<boolean> => {
  try {
    // First check current status
    const { status: existing } = await Audio.getPermissionsAsync();
    if (existing === 'granted') return true;

    // Request if not yet granted
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

// ── START RECORDING ───────────────────────────────────────────
export const startRecording = async (): Promise<boolean> => {
  try {
    const granted = await requestMicPermission();
    if (!granted) return false;

    // Required on iOS — allows recording in silent mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recording = rec;
    return true;
  } catch (e) {
    console.error('startRecording error:', e);
    return false;
  }
};

// ── STOP RECORDING ────────────────────────────────────────────
export const stopRecording = async (): Promise<string | null> => {
  if (!recording) return null;
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    // Reset audio mode after recording
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    return uri ?? null;
  } catch (e) {
    console.error('stopRecording error:', e);
    recording = null;
    return null;
  }
};

// ── CANCEL RECORDING ──────────────────────────────────────────
export const cancelRecording = async (): Promise<void> => {
  if (!recording) return;
  try {
    await recording.stopAndUnloadAsync();
    recording = null;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  } catch {
    recording = null;
  }
};

// ── TRANSCRIBE AUDIO ──────────────────────────────────────────
// Reads audio as base64 and sends to Claude for transcription.
// NOTE: Claude does not support raw audio input yet.
// This returns null until a speech-to-text service is wired up.
// When the Anthropic API key is active, swap this body with
// a call to Whisper or Google STT — callers stay unchanged.
export const transcribeAudio = async (uri: string): Promise<string | null> => {
  try {
    // FIX: Use string literal 'base64' not FileSystem.EncodingType.Base64
    // The EncodingType enum was removed in expo-file-system v16+
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // Placeholder: Claude cannot process audio natively yet.
    // Return null so VoiceMicButton shows the "type for now" alert.
    // Replace this body with a real STT API call when available.
    return null;
  } catch (e) {
    console.error('transcribeAudio error:', e);
    return null;
  }
};

// ── FORMAT DURATION ───────────────────────────────────────────
export const formatDuration = (ms: number): string => {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, '0')}`;
};