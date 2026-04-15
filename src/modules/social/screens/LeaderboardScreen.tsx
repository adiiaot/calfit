import {
  View, Text, StyleSheet,
  ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { AndroidSafeView } from '../../shared/AndriodSafeView';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';
import {
  getGlobalLeaderboard,
  getFriendsLeaderboard,
  LeaderboardEntry,
} from '../services/leaderboardService';

const MEDALS = ['🥇', '🥈', '🥉'];

function RankBadge({ rank, theme }: { rank: number; theme: typeof colors.dark }) {
  if (rank <= 3) {
    return <Text style={styles.medal}>{MEDALS[rank - 1]}</Text>;
  }
  return (
    <View style={[styles.rankBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.rankBadgeText, { color: theme.textMuted }]}>{rank}</Text>
    </View>
  );
}

function LeaderboardRow({
  entry,
  theme,
  onPress,
}: {
  entry: LeaderboardEntry;
  theme: typeof colors.dark;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, {
        backgroundColor: entry.isCurrentUser
          ? theme.accentDim as string
          : theme.card,
        borderColor: entry.isCurrentUser ? theme.accent : theme.border,
        borderWidth: entry.isCurrentUser ? 2 : 1,
      }]}
    >
      <RankBadge rank={entry.rank} theme={theme} />
      <UserAvatar
        uri={entry.avatar_url}
        name={entry.full_name}
        size={40}
        theme={theme}
      />
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowName, { color: theme.textPrimary }]}>
            {entry.full_name}
            {entry.isCurrentUser && (
              <Text style={[styles.youTag, { color: theme.accent }]}> · You</Text>
            )}
          </Text>
        </View>
        <Text style={[styles.rowHandle, { color: theme.textMuted }]}>
          @{entry.calfit_id}
        </Text>
        <Text style={[styles.rowGoal, { color: theme.textMuted }]}>
          🎯 {entry.goal}
        </Text>
      </View>
      <View style={[styles.scoreWrap, { backgroundColor: theme.orange + '18' }]}>
        <Text style={[styles.scoreValue, { color: theme.orange }]}>
          {entry.streak_count}🔥
        </Text>
        <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>streak</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function LeaderboardScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'Global' | 'Friends'>('Global');
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [friendsEntries, setFriendsEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [user?.id])
  );

  const load = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const [global, friends] = await Promise.all([
      getGlobalLeaderboard(user.id),
      getFriendsLeaderboard(user.id),
    ]);
    setGlobalEntries(global);
    setFriendsEntries(friends);
    setIsLoading(false);
  };

  const entries = activeTab === 'Global' ? globalEntries : friendsEntries;

  return (



      <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
                <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Leaderboard</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Tab toggle */}
      <View style={[styles.tabToggle, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        {(['Global', 'Friends'] as const).map((tab) => (
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
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resets weekly notice */}
      <View style={[styles.resetNotice, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}>
        <Ionicons name="refresh-outline" size={12} color={theme.accent} />
        <Text style={[styles.resetText, { color: theme.accent }]}>
          Ranked by current streak · Resets every Monday
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="trophy-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {activeTab === 'Friends'
              ? 'No friends on the board yet'
              : 'No rankings yet'}
          </Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            {activeTab === 'Friends'
              ? 'Follow other members to see how you compare.'
              : 'Start logging workouts to appear on the leaderboard.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {entries.map((entry) => (
            <LeaderboardRow
              key={entry.user_id}
              entry={entry}
              theme={theme}
              onPress={() =>
                navigation.navigate('Profile', { userId: entry.user_id })
              }
            />
          ))}
        </ScrollView>
      )}
      </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: { fontSize: fontSize.lg, fontWeight: '700' },
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
  resetNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  resetText: { fontSize: fontSize.xs, fontWeight: '600' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  medal: { fontSize: 28, width: 36, textAlign: 'center' },
  rankBadge: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rankBadgeText: { fontSize: fontSize.base, fontWeight: '700' },
  rowInfo: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  rowName: { fontSize: fontSize.base, fontWeight: '700' },
  youTag: { fontSize: fontSize.sm, fontWeight: '600' },
  rowHandle: { fontSize: fontSize.xs, marginTop: 1 },
  rowGoal: { fontSize: fontSize.xs, marginTop: 2 },
  scoreWrap: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    minWidth: 60,
  },
  scoreValue: { fontSize: fontSize.base, fontWeight: '800' },
  scoreLabel: { fontSize: 9, marginTop: 1 },
});