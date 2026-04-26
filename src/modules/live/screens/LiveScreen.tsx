import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AndroidSafeView } from '../../shared/AndriodSafeView';
import { useState, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { LiveStreamCard, LiveStreamData } from '../components/LiveStreamCard';
import { EmptyState } from '../../shared/EmptyState';

// ── COLORS ────────────────────────────────────────────────────
// Red is used ONLY for the header + live badges.
// Everything else uses the theme so dark/light mode works properly.
const RED    = '#FF3B30';
const ORANGE = '#FF6B35';
const BLUE   = '#6699FF';
const GREEN  = '#2DDC8C';
const GOLD   = '#FFD133';

// ── MOCK STREAMS ─────────────────────────────────────────────
const MOCK_STREAMS: LiveStreamData[] = [
  {
    id: '1', hostName: 'Coach Favour', hostAvatar: null,
    hostCalfitId: 'coachfavour',
    title: 'Morning HIIT — Full Body Burn',
    topic: 'Fitness · HIIT',
    viewerCount: 142, isLive: true,
  },
  {
    id: '2', hostName: 'Shepherd B.', hostAvatar: null,
    hostCalfitId: 'shepherd_b',
    title: 'Meal Prep Sunday — Nigerian Healthy Bowls',
    topic: 'Nutrition · Meal Prep',
    viewerCount: 0, isLive: false,
    scheduledFor: 'Sunday 3:00 PM',
  },
  {
    id: '3', hostName: 'FitMom NG', hostAvatar: null,
    hostCalfitId: 'fitmom_ng',
    title: 'Postpartum Recovery Workout',
    topic: 'Wellness · Recovery',
    viewerCount: 0, isLive: false,
    scheduledFor: 'Monday 7:00 AM',
  },
];

// ── ANIMATED PULSE DOT ────────────────────────────────────────
function PulseDot({ color = RED }: { color?: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: color,
      transform: [{ scale }],
    }} />
  );
}

// ── GO LIVE CARD ──────────────────────────────────────────────
// Contained red card — doesn't bleed red over the whole screen
function GoLiveCard({ theme, onPress }: { theme: typeof colors.dark; onPress: () => void }) {
  return (
    <View style={[glc.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Small coloured top strip — keeps red accent contained */}
      <LinearGradient
        colors={[RED, ORANGE] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={glc.strip}
      >
        <View style={glc.stripRow}>
          <PulseDot color="#fff" />
          <Text style={glc.stripLabel}>LIVE STREAMING</Text>
        </View>
        <View style={glc.premBadge}>
          <Text style={glc.premText}>Premium</Text>
        </View>
      </LinearGradient>

      {/* Card body — uses theme colors, not red */}
      <View style={glc.body}>
        <Text style={[glc.title, { color: theme.textPrimary }]}>
          Go Live with Your Followers
        </Text>
        <Text style={[glc.sub, { color: theme.textSecondary }]}>
          Stream workouts, meal preps and Q&As. Viewers can react and interact in real time.
        </Text>

        {/* Feature pills */}
        <View style={glc.pills}>
          {['🏋️ Workout streams', '🥗 Meal prep', '💬 Live chat', '👁️ Reactions'].map(f => (
            <View key={f} style={[glc.pill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={[glc.pillText, { color: theme.textSecondary }]}>{f}</Text>
            </View>
          ))}
        </View>

        {/* CTA button — red but contained */}
        <TouchableOpacity onPress={onPress} style={glc.btn}>
          <Ionicons name="radio-outline" size={18} color="#fff" />
          <Text style={glc.btnText}>Start a Live Stream</Text>
        </TouchableOpacity>

        <Text style={[glc.note, { color: theme.textMuted }]}>
          Activates when Agora is connected by BigCut
        </Text>
      </View>
    </View>
  );
}

const glc = StyleSheet.create({
  wrap:       { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  strip:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  stripRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stripLabel: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  premBadge:  { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.25)' },
  premText:   { color: '#fff', fontSize: 10, fontWeight: '700' },
  body:       { padding: spacing.lg, gap: spacing.md },
  title:      { fontSize: fontSize.xl, fontWeight: '900' },
  sub:        { fontSize: fontSize.sm, lineHeight: 20 },
  pills:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill:       { paddingHorizontal: spacing.sm, paddingVertical: 15, borderRadius: 99, borderWidth: 1 },
  pillText:   { fontSize: 11, fontWeight: '600' },
  btn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: RED, paddingVertical: spacing.md, borderRadius: radius.lg },
  btnText:    { color: '#fff', fontSize: fontSize.base, fontWeight: '800' },
  note:       { fontSize: fontSize.xs, textAlign: 'center' },
});

// ── MAIN SCREEN ───────────────────────────────────────────────
const CATEGORIES = ['All', 'Fitness', 'Nutrition', 'Wellness', 'Q&A', 'Challenges'];

export default function LiveScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { userTier } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab]     = useState<'Live Now' | 'Scheduled'>('Live Now');
  const [activeCategory, setCategory] = useState('All');

  const liveStreams = MOCK_STREAMS.filter(s => s.isLive);
  const scheduled  = MOCK_STREAMS.filter(s => !s.isLive);

  const handleGoLive = () => Alert.alert(
    'Go Live — Coming Soon',
    'Live streaming activates once the Agora account is connected by BigCut. You will be able to start live workout sessions, meal prep streams and Q&As with your followers.',
    [{ text: 'Got it' }]
  );

  const handleWatch = (stream: LiveStreamData) => {
    if (stream.isLive) {
      Alert.alert('Coming Soon', 'Live stream viewing activates once the Agora account is connected by BigCut.', [{ text: 'OK' }]);
    } else {
      Alert.alert('Reminder Set ✓', `You'll get a notification before "${stream.title}" goes live${stream.scheduledFor ? ` at ${stream.scheduledFor}` : ''}.`, [{ text: 'OK' }]);
    }
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* ── HEADER — red gradient only here, not everywhere ── */}
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

      {/* ── TAB TOGGLE — theme colors, not red ── */}
      <View style={[styles.tabToggle, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {(['Live Now', 'Scheduled'] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, active && { backgroundColor: RED }]}
            >
              <Text style={[styles.tabBtnText, { color: active ? '#fff' : theme.textMuted, fontWeight: active ? '700' : '500' }]}>
                {tab}{tab === 'Live Now' && liveStreams.length > 0 ? ` · ${liveStreams.length}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── SCROLL CONTENT — white/dark cards, no red bleed ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <GoLiveCard theme={theme} onPress={handleGoLive} />

        {/* ── LIVE NOW ── */}
        {activeTab === 'Live Now' && (
          liveStreams.length === 0
            ? <EmptyState theme={theme} icon="radio-outline" title="No one is live right now"
                subtitle="Be the first to go live and share your workout with the CalFit community." />
            : liveStreams.map(s => (
                <LiveStreamCard key={s.id} stream={s} theme={theme} onPress={() => handleWatch(s)} />
              ))
        )}

        {/* ── SCHEDULED ── */}
        {activeTab === 'Scheduled' && (
          scheduled.length === 0
            ? <EmptyState theme={theme} icon="calendar-outline" title="No scheduled streams"
                subtitle="Schedule a live session — your followers will get a reminder." />
            : <>
                <View style={styles.scheduledHint}>
                  <Ionicons name="calendar-outline" size={13} color={theme.textMuted} />
                  <Text style={[styles.scheduledHintText, { color: theme.textMuted }]}>
                    Tap to set a reminder
                  </Text>
                </View>
                {scheduled.map(s => (
                  <LiveStreamCard key={s.id} stream={s} theme={theme} onPress={() => handleWatch(s)} />
                ))}
              </>
        )}

        {/* ── INFO CARD — plain theme card ── */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>About Live Streaming</Text>
          {[
            { icon: 'radio-outline',         color: RED,    text: 'Stream workouts, meal preps and Q&As' },
            { icon: 'eye-outline',            color: BLUE,   text: 'Free users see ads every 5 minutes' },
            { icon: 'star-outline',           color: GOLD,   text: 'Premium — watch with no interruptions' },
            { icon: 'people-circle-outline',  color: GREEN,  text: 'Viewers can react and chat live' },
          ].map(r => (
            <View key={r.text} style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: r.color + '18' }]}>
                <Ionicons name={r.icon as any} size={14} color={r.color} />
              </View>
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
  safe:           { flex: 1 },
  scroll:         { paddingBottom: 40 },

  // Header — ONLY red element
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 4 },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
  headerCenter:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle:    { fontSize: fontSize.xl, fontWeight: '800', color: '#fff' },
  goLiveBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.40)' },
  goLiveDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  goLiveBtnText:  { color: '#fff', fontSize: fontSize.sm, fontWeight: '800' },

  // Tab toggle — theme not red
  tabToggle:      { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, borderWidth: 1, padding: 4, gap: 4 },
  tabBtn:         { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabBtnText:     { fontSize: fontSize.sm },

  scheduledHint:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  scheduledHintText:  { fontSize: fontSize.xs, fontWeight: '600' },

  // Info card — plain
  infoCard:       { marginHorizontal: spacing.lg, marginTop: spacing.sm, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  infoTitle:      { fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.xs },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoIcon:       { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  infoText:       { fontSize: fontSize.sm, flex: 1, lineHeight: 20 },
});