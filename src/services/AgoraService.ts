// ─────────────────────────────────────────────────────────────────────────────
// src/services/agoraService.ts
// ─────────────────────────────────────────────────────────────────────────────

import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  VideoEncoderConfiguration,
  DegradationPreference,
  OrientationMode,
  VideoMirrorModeType,
  VideoDimensions,
} from 'react-native-agora';
import { supabase } from './supabase';

export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? 'da1a2d5d9ffa4ff28e2e4d1504c5537d';

// WHY dimensions object: react-native-agora v4 moved width/height into a
// nested VideoDimensions object rather than top-level fields. Using top-level
// width/height gives a TypeScript error in v4.
const VIDEO_CONFIG: VideoEncoderConfiguration = {
  dimensions: {
    width: 1280,
    height: 720,
  } as VideoDimensions,
  frameRate: 15,
  bitrate: 1130,
  minBitrate: -1,
  orientationMode: OrientationMode.OrientationModeAdaptive,
  degradationPreference: DegradationPreference.MaintainQuality,
  mirrorMode: VideoMirrorModeType.VideoMirrorModeAuto,
};

// ── ENGINE SINGLETON ──────────────────────────────────────────
let engine: IRtcEngine | null = null;

export const getEngine = (): IRtcEngine => {
  if (!engine) {
    engine = createAgoraRtcEngine();
  }
  return engine;
};

export const destroyEngine = () => {
  if (engine) {
    engine.release();
    engine = null;
  }
};

export const buildChannelName = (streamId: string) => `calfit_live_${streamId}`;

// ── BROADCASTER SETUP ─────────────────────────────────────────
export const initBroadcaster = async () => {
  const eng = getEngine();
  await eng.initialize({ appId: AGORA_APP_ID });
  await eng.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
  await eng.setClientRole(ClientRoleType.ClientRoleBroadcaster);
  await eng.enableVideo();
  await eng.setVideoEncoderConfiguration(VIDEO_CONFIG);
  await eng.startPreview();
  return eng;
};

// ── AUDIENCE SETUP ────────────────────────────────────────────
export const initAudience = async () => {
  const eng = getEngine();
  await eng.initialize({ appId: AGORA_APP_ID });
  await eng.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
  await eng.setClientRole(ClientRoleType.ClientRoleAudience);
  await eng.enableVideo();
  return eng;
};

// ── JOIN CHANNEL ──────────────────────────────────────────────
// WHY empty string not null: react-native-agora v4 joinChannel signature
// expects token as string | undefined. Passing null causes a TypeScript error.
// Empty string '' means "no token" in Testing mode — functionally identical.
export const joinChannel = async (channelName: string) => {
  const eng = getEngine();
  await eng.joinChannel('', channelName, 0, {});
};

export const leaveChannel = async () => {
  const eng = getEngine();
  await eng.leaveChannel();
};

// ── CAMERA / MIC CONTROLS ─────────────────────────────────────
export const toggleMic = async (muted: boolean) => {
  getEngine().muteLocalAudioStream(muted);
};

export const toggleCamera = async (off: boolean) => {
  getEngine().muteLocalVideoStream(off);
};

export const switchCamera = async () => {
  getEngine().switchCamera();
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