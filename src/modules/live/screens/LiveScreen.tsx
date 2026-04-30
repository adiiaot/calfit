import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Image, ActivityIndicator,
} from 'react-native';
import { AndroidSafeView } from '../../shared/AndriodSafeView';
import { useState, useEffect, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { supabase } from '../../../services/supabase';
import { EmptyState } from '../../shared/EmptyState';
import { UserAvatar } from '../../shared/UserAvatar';

const RED    = '#FF5959';
const ORANGE = '#FFB347';
const BLUE   = '#6699FF';
const GOLD   = '#FFD133';
const GREEN  = '#2DDC8C';

// ── TYPES ─────────────────────────────────────────────────────
interface LiveStream {
  id:           string;
  channel_name: string;
  title:        string;
  category:     string;
  is_live:      boolean;
  viewer_count: number;
  started_at:   string;
  host: {
    id:         string;
    full_name:  string;
    avatar_url: string | null;
    calfit_id:  string;
  };
}

// ── PULSING DOT ───────────────────────────────────────────────
function PulseDot({ color = RED }: { color?: string }) {
  return <View style={[pd.dot, { backgroundColor: color }]} />;
}
const pd = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4 },
});

function StreamCard({ stream, theme, onPress }: {
  stream: LiveStream;
  theme: typeof colors.light;
  onPress: () => void;
}) {
  const elapsed = stream.is_live
    ? Math.floor((Date.now() - new Date(stream.started_at).getTime()) / 60000)
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[sc.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      activeOpacity={0.85}
    >
      {/* Thumbnail area */}
      <View style={sc.thumb}>
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          style={StyleSheet.absoluteFill}
        />
        {/* FIXED: uri + theme instead of userId + avatarUrl */}
        <UserAvatar
          uri={stream.host.avatar_url}
          name={stream.host.full_name}
          size={56}
          theme={theme}
        />
        {stream.is_live && (
          <View style={sc.liveBadge}>
            <PulseDot color="#fff" />
            <Text style={sc.liveBadgeText}>LIVE</Text>
          </View>
        )}
        {elapsed !== null && (
          <View style={sc.durationBadge}>
            <Text style={sc.durationText}>
              {elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={sc.info}>
        <Text style={[sc.title, { color: theme.textPrimary }]} numberOfLines={2}>{stream.title}</Text>
        <Text style={[sc.host, { color: theme.textSecondary }]}>{stream.host.full_name}</Text>
        <View style={sc.meta}>
          <View style={[sc.catPill, { backgroundColor: theme.accentDim as string }]}>
            <Text style={[sc.catText, { color: theme.accent }]}>{stream.category}</Text>
          </View>
          {stream.is_live && (
            <View style={sc.viewerRow}>
              <Ionicons name="eye-outline" size={12} color={theme.textMuted} />
              <Text style={[sc.viewerText, { color: theme.textMuted }]}>{stream.viewer_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const sc = StyleSheet.create({
  card:         { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', marginBottom: spacing.sm },
  thumb:        { width: 110, height: 90, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  liveBadge:    { position: 'absolute', top: spacing.xs, left: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: RED, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs },
  liveBadgeText:{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  durationBadge:{ position: 'absolute', bottom: spacing.xs, right: spacing.xs, backgroundColor: '#000000AA', paddingHorizontal: 5, paddingVertical: 2, borderRadius: radius.xs },
  durationText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  info:         { flex: 1, padding: spacing.md, gap: spacing.xs },
  title:        { fontSize: fontSize.base, fontWeight: '700', lineHeight: 20 },
  host:         { fontSize: fontSize.sm },
  meta:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  catPill:      { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 99 },
  catText:      { fontSize: 10, fontWeight: '700' },
  viewerRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewerText:   { fontSize: 11 },
});

// ── GO LIVE PROMO CARD ─────────────────────────────────────────
function GoLiveCard({ theme, onPress }: { theme: typeof colors.light; onPress: () => void }) {
  return (
    <View style={[glc.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <LinearGradient
        colors={[RED, ORANGE] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={glc.strip}
      >
        <View style={glc.stripRow}>
          <PulseDot color="#fff" />
          <Text style={glc.stripLabel}>GO LIVE</Text>
        </View>
        <View style={glc.premBadge}>
          <Text style={glc.premText}>Premium</Text>
        </View>
      </LinearGradient>

      <View style={glc.body}>
        <Text style={[glc.title, { color: theme.textPrimary }]}>Start a Live Stream</Text>
        <Text style={[glc.sub, { color: theme.textSecondary }]}>
          Stream your workouts, meal prep sessions, and Q&As live with your followers.
        </Text>

        <View style={glc.pills}>
          {['🏋️ Workout streams', '🥗 Meal prep', '💬 Live chat', '👁️ Reactions'].map(f => (
            <View key={f} style={[glc.pill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={[glc.pillText, { color: theme.textSecondary }]}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={onPress} style={glc.btn}>
          <Ionicons name="radio-outline" size={18} color="#fff" />
          <Text style={glc.btnText}>Start a Live Stream</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const glc = StyleSheet.create({
  wrap:       { marginBottom: spacing.md, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  strip:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  stripRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stripLabel: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  premBadge:  { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.25)' },
  premText:   { color: '#fff', fontSize: 10, fontWeight: '700' },
  body:       { padding: spacing.lg, gap: spacing.md },
  title:      { fontSize: fontSize.xl, fontWeight: '900' },
  sub:        { fontSize: fontSize.sm, lineHeight: 20 },
  pills:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill:       { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
  pillText:   { fontSize: 11, fontWeight: '600' },
  btn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: RED, paddingVertical: spacing.md, borderRadius: radius.lg },
  btnText:    { color: '#fff', fontSize: fontSize.base, fontWeight: '800' },
});

// ── CATEGORY PILL ─────────────────────────────────────────────
const CATEGORIES = ['All', 'Fitness', 'Nutrition', 'Wellness', 'Q&A', 'Challenges'];

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function LiveScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab]   = useState<'Live Now' | 'Scheduled'>('Live Now');
  const [activeCategory, setCategory] = useState('All');
  const [streams, setStreams]       = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('live_streams')
      .select(`
        id, channel_name, title, category, is_live, viewer_count, started_at,
        host:host_id ( id, full_name, avatar_url, calfit_id )
      `)
      .eq('is_live', true)
      .order('viewer_count', { ascending: false });

    if (!error && data) {
      setStreams(data as any[]);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  // Realtime: update list when streams go live or end
  useEffect(() => {
    const channel = supabase
      .channel('live_streams_list')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'live_streams' },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = streams.filter(s =>
    activeCategory === 'All' || s.category === activeCategory
  );

  const handleGoLive = () => navigation.navigate('GoLive');

  const handleWatch = (stream: LiveStream) => {
    navigation.navigate('WatchLive', {
      streamId:    stream.id,
      channelName: stream.channel_name,
      hostName:    stream.host.full_name,
      title:       stream.title,
    });
  };

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
        <View style={styles.headerCenter}>
          <PulseDot color="#fff" />
          <Text style={styles.headerTitle}>Live</Text>
        </View>
        <TouchableOpacity onPress={handleGoLive} style={styles.goLiveBtn}>
          <View style={styles.goLiveDot} />
          <Ionicons name="radio-outline" size={14} color="#fff" />
          <Text style={styles.goLiveBtnText}>Go Live</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab toggle */}
      <View style={[styles.tabToggle, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {(['Live Now', 'Scheduled'] as const).map(tab => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, active && { backgroundColor: RED }]}
            >
              <Text style={[styles.tabBtnText, { color: active ? '#fff' : theme.textMuted, fontWeight: active ? '700' : '500' }]}>
                {tab}{tab === 'Live Now' && filtered.length > 0 ? ` · ${filtered.length}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            style={[styles.catPill, {
              backgroundColor: activeCategory === cat ? RED : theme.card,
              borderColor: activeCategory === cat ? RED : theme.border,
            }]}
          >
            <Text style={[styles.catPillText, { color: activeCategory === cat ? '#fff' : theme.textSecondary }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(); }} tintColor={RED} />}
      >
        <GoLiveCard theme={theme} onPress={handleGoLive} />

        {isLoading ? (
          <ActivityIndicator color={RED} style={{ marginTop: spacing.xl }} />
        ) : activeTab === 'Live Now' ? (
          filtered.length === 0 ? (
            <EmptyState theme={theme} icon="radio-outline" title="No one is live right now"
              subtitle="Be the first to go live and share your workout with the CalFit community." />
          ) : (
            filtered.map(s => (
              <StreamCard key={s.id} stream={s} theme={theme} onPress={() => handleWatch(s)} />
            ))
          )
        ) : (
          <EmptyState theme={theme} icon="calendar-outline" title="No scheduled streams"
            subtitle="Schedule a live session — your followers will get a reminder." />
        )}

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>About Live Streaming</Text>
          {[
            { icon: 'radio-outline',        color: RED,   text: 'Stream workouts, meal preps and Q&As' },
            { icon: 'eye-outline',           color: BLUE,  text: 'Free users see ads every 5 minutes' },
            { icon: 'star-outline',          color: GOLD,  text: 'Premium — watch with no interruptions' },
            { icon: 'people-circle-outline', color: GREEN, text: 'Viewers can react in real time' },
          ].map(r => (
            <View key={r.text} style={styles.infoRow}>
              <Ionicons name={r.icon as any} size={16} color={r.color} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>{r.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 4 },
  headerCenter:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerTitle:   { color: '#fff', fontSize: fontSize.lg, fontWeight: '900' },
  backBtn:       { width: 40 },
  goLiveBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 99 },
  goLiveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  goLiveBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },
  tabToggle:     { flexDirection: 'row', margin: spacing.lg, marginBottom: 0, borderRadius: radius.md, borderWidth: 1, padding: 3 },
  tabBtn:        { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabBtnText:    { fontSize: fontSize.sm },
  catScroll:     { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, maxHeight: 52 },
  catPill:       { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 99, borderWidth: 1, marginRight: spacing.sm },
  catPillText:   { fontSize: fontSize.sm, fontWeight: '600' },
  scroll:        { padding: spacing.lg },
  infoCard:      { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  infoTitle:     { fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.xs },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText:      { fontSize: fontSize.sm, flex: 1, lineHeight: 20 },
});