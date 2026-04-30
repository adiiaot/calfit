// ─────────────────────────────────────────────────────────────────────────────
// src/services/agoraService.ts
//
// WHY LAZY LOADING:
//   react-native-agora is a native module. Importing it at the top level
//   causes it to try to link at bundle time. In Expo Go (which doesn't have
//   the native Agora code compiled in), this throws immediately and crashes
//   the entire app before anything renders.
//
//   Solution: all Agora imports are inside async functions using require().
//   This means the module is only loaded when a user actually tries to go
//   live or watch a stream — not at app startup. Expo Go works normally for
//   every other screen. The live features simply show an error if Agora
//   isn't available (i.e. in Expo Go).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase';

export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? 'da1a2d5d9ffa4ff28e2e4d1504c5537d';

// ── SAFE REQUIRE ──────────────────────────────────────────────
// Returns the agora module or null if not available (Expo Go).
const getAgora = () => {
  try {
    return require('react-native-agora');
  } catch {
    return null;
  }
};

// ── ENGINE SINGLETON ──────────────────────────────────────────
let engine: any | null = null;

export const getEngine = () => {
  if (!engine) {
    const agora = getAgora();
    if (!agora) throw new Error('react-native-agora is not available in Expo Go. Use a dev client build.');
    engine = agora.createAgoraRtcEngine();
  }
  return engine;
};

export const destroyEngine = () => {
  if (engine) {
    engine.release();
    engine = null;
  }
};

// ── CHECK AVAILABILITY ────────────────────────────────────────
// Call this before any Agora operation to give a clean error in Expo Go.
export const isAgoraAvailable = (): boolean => {
  return getAgora() !== null;
};

// ── BROADCASTER SETUP ─────────────────────────────────────────
export const initBroadcaster = async () => {
  const agora = getAgora();
  if (!agora) throw new Error('Live streaming requires a dev client build.');

  const eng = getEngine();
  await eng.initialize({ appId: AGORA_APP_ID });
  await eng.setChannelProfile(agora.ChannelProfileType.ChannelProfileLiveBroadcasting);
  await eng.setClientRole(agora.ClientRoleType.ClientRoleBroadcaster);
  await eng.enableVideo();
  await eng.setVideoEncoderConfiguration({
    dimensions: { width: 1280, height: 720 },
    frameRate: 15,
    bitrate: 1130,
    minBitrate: -1,
    orientationMode: agora.OrientationMode.OrientationModeAdaptive,
    degradationPrefer: agora.DegradationPreference.MaintainQuality,
    mirrorMode: agora.VideoMirrorModeType.VideoMirrorModeAuto,
  });
  await eng.startPreview();
  return eng;
};

// ── AUDIENCE SETUP ────────────────────────────────────────────
export const initAudience = async () => {
  const agora = getAgora();
  if (!agora) throw new Error('Live streaming requires a dev client build.');

  const eng = getEngine();
  await eng.initialize({ appId: AGORA_APP_ID });
  await eng.setChannelProfile(agora.ChannelProfileType.ChannelProfileLiveBroadcasting);
  await eng.setClientRole(agora.ClientRoleType.ClientRoleAudience);
  await eng.enableVideo();
  return eng;
};

// ── JOIN / LEAVE ──────────────────────────────────────────────
export const joinChannel = async (channelName: string) => {
  const eng = getEngine();
  await eng.joinChannel('', channelName, 0, {});
};

export const leaveChannel = async () => {
  try {
    const eng = getEngine();
    await eng.leaveChannel();
  } catch {
    // Silent — engine may already be destroyed
  }
};

// ── CONTROLS ──────────────────────────────────────────────────
export const toggleMic = (muted: boolean) => {
  try { getEngine().muteLocalAudioStream(muted); } catch {}
};

export const toggleCamera = (off: boolean) => {
  try { getEngine().muteLocalVideoStream(off); } catch {}
};

export const switchCamera = () => {
  try { getEngine().switchCamera(); } catch {}
};

// ── SUPABASE: CREATE STREAM RECORD ───────────────────────────
export const createStreamRecord = async (
  hostId: string,
  title: string,
  category: string
): Promise<{ id: string; channelName: string } | null> => {
  const { data, error } = await supabase
    .from('live_streams')
    .insert({
      host_id:      hostId,
      title,
      category,
      channel_name: `calfit_${hostId}_${Date.now()}`,
      is_live:      true,
    })
    .select('id, channel_name')
    .single();

  if (error) {
    console.error('createStreamRecord error:', error.message);
    return null;
  }
  return { id: data.id, channelName: data.channel_name };
};

// ── SUPABASE: END STREAM ──────────────────────────────────────
export const endStreamRecord = async (streamId: string) => {
  await supabase
    .from('live_streams')
    .update({ is_live: false, ended_at: new Date().toISOString() })
    .eq('id', streamId);
};

// ── SUPABASE: VIEWER COUNT ────────────────────────────────────
export const incrementViewerCount = async (streamId: string) => {
  await supabase.rpc('increment_viewer_count', { stream_id: streamId });
};

export const decrementViewerCount = async (streamId: string) => {
  await supabase.rpc('decrement_viewer_count', { stream_id: streamId });
};