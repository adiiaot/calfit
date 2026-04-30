// ─────────────────────────────────────────────────────────────────────────────
// src/modules/live/screens/WatchLiveScreen.tsx
// RtcSurfaceView loaded lazily — safe in Expo Go.
// ─────────────────────────────────────────────────────────────────────────────

import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  initAudience, joinChannel, leaveChannel, destroyEngine,
  getEngine, decrementViewerCount, incrementViewerCount, isAgoraAvailable,
} from '../../../services/AgoraService';
import { supabase } from '../../../services/supabase';

const RED = '#FF5959';
const REACTIONS = ['🔥', '💪', '👏', '❤️', '⚡'];

const getRtcSurfaceView = () => {
  try { return require('react-native-agora').RtcSurfaceView; } catch { return null; }
};
const getVideoSourceType = () => {
  try { return require('react-native-agora').VideoSourceType; } catch { return null; }
};

export default function WatchLiveScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { streamId, channelName, hostName, title } = route.params ?? {};

  const [remoteUid, setRemoteUid]       = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [viewerCount, setViewerCount]   = useState(0);
  const [reactions, setReactions]       = useState<{ emoji: string; id: number }[]>([]);
  const reactionIdRef = useRef(0);
  const agoraReady = isAgoraAvailable();

  useEffect(() => {
    if (!agoraReady) { setIsConnecting(false); return; }
    let mounted = true;

    const join = async () => {
      try {
        const eng = await initAudience();
        eng.registerEventHandler({
          onUserJoined:      (_: any, uid: number) => { if (mounted) setRemoteUid(uid); },
          onUserOffline:     (_: any, uid: number) => { if (mounted && uid === remoteUid) setRemoteUid(null); },
          onJoinChannelSuccess: () => { if (mounted) setIsConnecting(false); },
          onError: (err: any) => console.error('Agora error:', err),
        });
        await joinChannel(channelName);
        await incrementViewerCount(streamId);
      } catch (e) {
        console.error('Watch join error:', e);
        if (mounted) setIsConnecting(false);
      }
    };

    join();
    return () => {
      mounted = false;
      leaveChannel();
      decrementViewerCount(streamId);
      destroyEngine();
    };
  }, [channelName, streamId, agoraReady]);

  useEffect(() => {
    const channel = supabase
      .channel(`stream_viewers_${streamId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_streams', filter: `id=eq.${streamId}` },
        (payload) => setViewerCount((payload.new as any).viewer_count ?? 0)
      ).subscribe();

    supabase.from('live_streams').select('viewer_count').eq('id', streamId).single()
      .then(({ data }) => { if (data) setViewerCount(data.viewer_count); });

    return () => { supabase.removeChannel(channel); };
  }, [streamId]);

  const handleReaction = (emoji: string) => {
    const id = ++reactionIdRef.current;
    setReactions(prev => [...prev.slice(-8), { emoji, id }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2000);
  };

  const RtcSurfaceView  = getRtcSurfaceView();
  const VideoSourceType = getVideoSourceType();

  return (
    <View style={styles.container}>
      {/* Remote video */}
      {agoraReady && remoteUid !== null && !isConnecting && RtcSurfaceView && VideoSourceType ? (
        <RtcSurfaceView
          style={StyleSheet.absoluteFill}
          canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
        />
      ) : (
        <View style={styles.placeholder}>
          {isConnecting ? (
            <>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.placeholderText}>
                {agoraReady ? 'Joining stream...' : 'Live video requires a production build'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="radio-outline" size={48} color="#ffffff44" />
              <Text style={styles.placeholderText}>Waiting for host...</Text>
            </>
          )}
        </View>
      )}

      {/* Top bar */}
      <LinearGradient colors={['rgba(0,0,0,0.65)', 'transparent']} style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <Text style={styles.hostName} numberOfLines={1}>{hostName}</Text>
        </View>
        <View style={styles.viewerPill}>
          <Ionicons name="eye-outline" size={13} color="#fff" />
          <Text style={styles.viewerText}>{viewerCount}</Text>
        </View>
      </LinearGradient>

      {/* Floating reactions */}
      <View style={styles.reactionFloat} pointerEvents="none">
        {reactions.map(r => <Text key={r.id} style={styles.reactionEmoji}>{r.emoji}</Text>)}
      </View>

      {/* Bottom */}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.bottomBar}>
        <Text style={styles.streamTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.reactionRow}>
          {REACTIONS.map(emoji => (
            <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={styles.reactionBtn}>
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#000' },
  placeholder:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  placeholderText:  { color: '#ffffff88', fontSize: 16, textAlign: 'center', paddingHorizontal: 32 },
  topBar:           { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 32 },
  closeBtn:         { width: 40, alignItems: 'flex-start' },
  topCenter:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveBadge:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: RED, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  liveDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText:    { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  hostName:         { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  viewerPill:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#00000066', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  viewerText:       { color: '#fff', fontSize: 13, fontWeight: '600' },
  reactionFloat:    { position: 'absolute', bottom: 120, right: 16, alignItems: 'flex-end', gap: 4 },
  reactionEmoji:    { fontSize: 24, marginBottom: 4 },
  bottomBar:        { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, paddingHorizontal: 16, paddingTop: 48, gap: 12 },
  streamTitle:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  reactionRow:      { flexDirection: 'row', gap: 8 },
  reactionBtn:      { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
});