// ─────────────────────────────────────────────────────────────────────────────
// src/modules/live/screens/GoLiveScreen.tsx
//
// WHO CAN USE: Premium tier only. Pro and Free users see an upgrade prompt.
// FLOW: Enter title → pick category → preview camera → Go Live
//       When live: timer + viewer count + mic/camera toggles + End Stream
// ─────────────────────────────────────────────────────────────────────────────

import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { AndroidSafeView } from '../../shared/AndriodSafeView';
import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
  initBroadcaster,
  joinChannel,
  leaveChannel,
  toggleMic,
  toggleCamera,
  switchCamera,
  createStreamRecord,
  endStreamRecord,
  destroyEngine,
} from '../../../services/AgoraService';
import { RtcSurfaceView, VideoSourceType } from 'react-native-agora';

const RED    = '#FF5959';
const ORANGE = '#FFB347';
const PURPLE = '#B280FF';

const CATEGORIES = ['Fitness', 'Nutrition', 'Wellness', 'Q&A', 'Challenges'];

// ── UPGRADE GATE ──────────────────────────────────────────────
function UpgradeGate({ theme, onClose }: { theme: typeof colors.light; onClose: () => void }) {
  const navigation = useNavigation<any>();
  return (
    <View style={[gate.wrap, { backgroundColor: theme.card }]}>
      <Text style={gate.emoji}>🔴</Text>
      <Text style={[gate.title, { color: theme.textPrimary }]}>Premium Feature</Text>
      <Text style={[gate.sub, { color: theme.textSecondary }]}>
        Live streaming is available on the Premium plan. Upgrade to go live with your followers.
      </Text>
      <TouchableOpacity
        onPress={() => { onClose(); navigation.navigate('Subscription'); }}
        style={[gate.btn, { backgroundColor: theme.accent }]}
      >
        <Text style={[gate.btnText, { color: theme.bg }]}>Upgrade to Premium</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} style={gate.skip}>
        <Text style={[gate.skipText, { color: theme.textMuted }]}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function GoLiveScreen() {
  const navigation  = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile, userTier } = useAuthStore();
  const theme = colors[colorScheme];

  const isPremium = userTier === 'premium';

  // Pre-live form state
  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState('Fitness');
  const [starting, setStarting] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Live state
  const [isLive, setIsLive]         = useState(false);
  const [streamId, setStreamId]     = useState<string | null>(null);
  const [micMuted, setMicMuted]     = useState(false);
  const [camOff, setCamOff]         = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration]     = useState(0); // seconds

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start camera preview when screen mounts (Premium only)
  useEffect(() => {
    if (!isPremium) return;
    let mounted = true;

    const startPreview = async () => {
      try {
        await initBroadcaster();
        if (mounted) setPreviewing(true);
      } catch (e) {
        console.error('Preview error:', e);
      }
    };

    startPreview();

    return () => {
      mounted = false;
      // Stop preview but don't destroy engine yet — user might go live
      try { leaveChannel(); } catch (_) {}
    };
  }, [isPremium]);

  // Duration timer while live
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLive]);

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleGoLive = async () => {
    if (!title.trim()) {
      Alert.alert('Add a title', 'Give your stream a title so viewers know what to expect.');
      return;
    }
    if (!user?.id) return;

    setStarting(true);
    try {
      const record = await createStreamRecord(user.id, title.trim(), category);
      if (!record) throw new Error('Could not create stream');

      await joinChannel(record.channelName);
      setStreamId(record.id);
      setIsLive(true);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not start stream. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const handleEndStream = () => {
    Alert.alert('End Stream?', 'Your live stream will end for all viewers.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Stream', style: 'destructive', onPress: async () => {
          await leaveChannel();
          if (streamId) await endStreamRecord(streamId);
          destroyEngine();
          setIsLive(false);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleToggleMic = async () => {
    const next = !micMuted;
    setMicMuted(next);
    await toggleMic(next);
  };

  const handleToggleCam = async () => {
    const next = !camOff;
    setCamOff(next);
    await toggleCamera(next);
  };

  // ── UPGRADE GATE ──────────────────────────────────────────
  if (!isPremium) {
    return (
      <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Go Live</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.gateWrap}>
          <UpgradeGate theme={theme} onClose={() => navigation.goBack()} />
        </View>
      </AndroidSafeView>
    );
  }

  // ── LIVE VIEW ─────────────────────────────────────────────
  if (isLive) {
    return (
      <View style={styles.liveContainer}>
        {/* Camera feed */}
        {previewing && !camOff && (
          <RtcSurfaceView
            style={StyleSheet.absoluteFill}
            canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
          />
        )}

        {/* Dark overlay at top and bottom */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.liveTopOverlay}
        >
          {/* Live badge + duration */}
          <View style={styles.liveBadgeRow}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <Text style={styles.liveDuration}>{formatDuration(duration)}</Text>
          </View>

          {/* Viewer count */}
          <View style={styles.viewerBadge}>
            <Ionicons name="eye-outline" size={14} color="#fff" />
            <Text style={styles.viewerText}>{viewerCount}</Text>
          </View>
        </LinearGradient>

        {/* Bottom controls */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.liveBottomOverlay}
        >
          <Text style={styles.liveTitleText} numberOfLines={1}>{title}</Text>
          <View style={styles.liveControls}>
            <TouchableOpacity onPress={handleToggleMic} style={[styles.liveCtrlBtn, micMuted && styles.ctrlBtnOff]}>
              <Ionicons name={micMuted ? 'mic-off' : 'mic'} size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleCam} style={[styles.liveCtrlBtn, camOff && styles.ctrlBtnOff]}>
              <Ionicons name={camOff ? 'videocam-off' : 'videocam'} size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchCamera()} style={styles.liveCtrlBtn}>
              <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEndStream} style={styles.endBtn}>
              <Text style={styles.endBtnText}>End</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // ── PRE-LIVE SETUP ────────────────────────────────────────
  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      {/* Header */}
      <LinearGradient
        colors={[RED, ORANGE] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Go Live</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Camera preview */}
        <View style={styles.previewBox}>
          {previewing ? (
            <RtcSurfaceView
              style={StyleSheet.absoluteFill}
              canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="videocam-outline" size={40} color="#ffffff66" />
              <Text style={styles.previewPlaceholderText}>Camera preview</Text>
            </View>
          )}
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>PREVIEW</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Stream title</Text>
          <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Morning HIIT with Coach Favour"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.textPrimary }]}
              maxLength={60}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: category === cat ? RED : theme.card,
                    borderColor: category === cat ? RED : theme.border,
                  },
                ]}
              >
                <Text style={[styles.catPillText, { color: category === cat ? '#fff' : theme.textSecondary }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.tipsTitle, { color: theme.textPrimary }]}>Tips for a great stream</Text>
          {[
            'Good lighting — face a window or use a ring light',
            'Stable surface or tripod for your phone',
            'Check your Wi-Fi or use mobile data',
            'Announce your stream on your social feed first',
          ].map(tip => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Go Live button */}
        <TouchableOpacity
          onPress={handleGoLive}
          disabled={starting || !title.trim()}
          style={[styles.goLiveBtn, { opacity: starting || !title.trim() ? 0.5 : 1 }]}
        >
          <LinearGradient
            colors={[RED, ORANGE] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.goLiveBtnGrad}
          >
            {starting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View style={styles.goLiveDot} />
                <Text style={styles.goLiveBtnText}>Go Live</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:              { flex: 1 },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 4 },
  headerTitle:       { fontSize: fontSize.lg, fontWeight: '800' },
  backBtn:           { width: 40, alignItems: 'flex-start' },
  scroll:            { padding: spacing.lg, gap: spacing.lg },
  previewBox:        { height: 220, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#111', position: 'relative' },
  previewPlaceholder:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  previewPlaceholderText: { color: '#ffffff66', fontSize: fontSize.sm },
  previewBadge:      { position: 'absolute', top: spacing.sm, left: spacing.sm, backgroundColor: '#000000AA', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  previewBadgeText:  { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  section:           { gap: spacing.sm },
  label:             { fontSize: fontSize.sm, fontWeight: '600' },
  inputWrap:         { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md },
  input:             { fontSize: fontSize.base, paddingVertical: spacing.md },
  catRow:            { flexDirection: 'row' },
  catPill:           { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99, borderWidth: 1, marginRight: spacing.sm },
  catPillText:       { fontSize: fontSize.sm, fontWeight: '600' },
  tipsCard:          { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  tipsTitle:         { fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.xs },
  tipRow:            { flexDirection: 'row', gap: spacing.sm },
  tipBullet:         { color: RED, fontWeight: '700' },
  tipText:           { fontSize: fontSize.sm, lineHeight: 20, flex: 1 },
  goLiveBtn:         { borderRadius: radius.lg, overflow: 'hidden' },
  goLiveBtnGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md + 2, gap: spacing.sm },
  goLiveDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  goLiveBtnText:     { color: '#fff', fontSize: fontSize.lg, fontWeight: '800' },
  gateWrap:          { flex: 1, padding: spacing.lg, justifyContent: 'center' },

  // Live view
  liveContainer:     { flex: 1, backgroundColor: '#000' },
  liveTopOverlay:    { paddingTop: 52, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  liveBadgeRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  liveBadge:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: RED, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  liveDot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText:     { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  liveDuration:      { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },
  viewerBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#00000066', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  viewerText:        { color: '#fff', fontSize: fontSize.sm, fontWeight: '600' },
  liveBottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  liveTitleText:     { color: '#fff', fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.md },
  liveControls:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveCtrlBtn:       { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
  ctrlBtnOff:        { backgroundColor: '#FF5959AA' },
  endBtn:            { marginLeft: 'auto' as any, backgroundColor: RED, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.md },
  endBtnText:        { color: '#fff', fontSize: fontSize.base, fontWeight: '800' },
});

const gate = StyleSheet.create({
  wrap:     { alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  emoji:    { fontSize: 48 },
  title:    { fontSize: fontSize.xl, fontWeight: '900', textAlign: 'center' },
  sub:      { fontSize: fontSize.base, textAlign: 'center', lineHeight: 22 },
  btn:      { width: '100%', paddingVertical: spacing.md, borderRadius: radius.lg, alignItems: 'center' },
  btnText:  { fontSize: fontSize.base, fontWeight: '800' },
  skip:     { paddingVertical: spacing.sm },
  skipText: { fontSize: fontSize.sm },
});