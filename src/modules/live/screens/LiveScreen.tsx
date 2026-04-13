import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { LiveStreamCard, LiveStreamData } from '../components/LiveStreamCard';
import { EmptyState } from '../../shared/EmptyState';

// Mock live streams — will be replaced when Agora account is ready
const MOCK_STREAMS: LiveStreamData[] = [
  {
    id: '1',
    hostName: 'Coach Favour',
    hostAvatar: null,
    hostCalfitId: 'coachfavour',
    title: 'Morning HIIT with Coach Favour',
    topic: 'Fitness · HIIT',
    viewerCount: 142,
    isLive: true,
  },
  {
    id: '2',
    hostName: 'Shepherd B.',
    hostAvatar: null,
    hostCalfitId: 'shepherd_b',
    title: 'Meal Prep Sunday — Nigerian Healthy Bowls',
    topic: 'Nutrition · Meal Prep',
    viewerCount: 0,
    isLive: false,
    scheduledFor: 'Sunday 3:00 PM',
  },
];

export default function LiveScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'Live Now' | 'Scheduled'>('Live Now');

  const liveStreams = MOCK_STREAMS.filter((s) => s.isLive);
  const scheduled = MOCK_STREAMS.filter((s) => !s.isLive);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Social</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Live</Text>
        <TouchableOpacity
          style={[styles.goLiveBtn, { backgroundColor: theme.red }]}
          onPress={() =>
            navigation.navigate('ScheduleLive')
          }
        >
          <View style={styles.liveDot} />
          <Text style={styles.goLiveText}>Go Live</Text>
        </TouchableOpacity>
      </View>

      {/* Tab toggle */}
      <View style={[styles.tabToggle, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        {(['Live Now', 'Scheduled'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && {
              backgroundColor: theme.accent,
            }]}
          >
            <Text style={[styles.tabBtnText, {
              color: activeTab === tab ? theme.bg : theme.textMuted,
              fontWeight: activeTab === tab ? '700' : '400',
            }]}>
              {tab}
              {tab === 'Live Now' && liveStreams.length > 0
                ? ` · ${liveStreams.length}`
                : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Agora notice */}
      <View style={[styles.notice, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}>
        <Ionicons name="information-circle-outline" size={14} color={theme.accent} />
        <Text style={[styles.noticeText, { color: theme.accent }]}>
          Live streaming activates once the Agora account is connected by BigCut.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'Live Now' ? (
          liveStreams.length === 0 ? (
            <EmptyState
              theme={theme}
              icon="radio-outline"
              title="No one is live right now"
              subtitle="Be the first to go live and share your workout, meal prep or fitness tips with the CalFit community."
            />
          ) : (
            liveStreams.map((stream) => (
              <LiveStreamCard
                key={stream.id}
                stream={stream}
                theme={theme}
                onPress={() => {}}
              />
            ))
          )
        ) : (
          scheduled.length === 0 ? (
            <EmptyState
              theme={theme}
              icon="calendar-outline"
              title="No scheduled streams"
              subtitle="Schedule a live session and your followers will get a reminder before you go live."
            />
          ) : (
            scheduled.map((stream) => (
              <LiveStreamCard
                key={stream.id}
                stream={stream}
                theme={theme}
                onPress={() => {}}
              />
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },
  title: { fontSize: fontSize.lg, fontWeight: '700' },
  goLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#fff',
  },
  goLiveText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },
  tabToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabBtnText: { fontSize: fontSize.base },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  noticeText: { fontSize: fontSize.xs, flex: 1, lineHeight: 16, fontWeight: '600' },
});