import {
  View, Text, StyleSheet,
  ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { MyRankCard } from '../components/MyRankCard';
import { EmptyState } from '../../shared/EmptyState';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { LeaderboardCategory } from '../services/LeaderboardService';
import { AndroidSafeView } from '../../shared/AndriodSafeView';

type Tab = 'Global' | 'Friends';

const CATEGORIES: { value: LeaderboardCategory; label: string; icon: string }[] = [
  { value: 'overall',   label: 'Overall',   icon: 'trophy-outline' },
  { value: 'streaks',   label: 'Streaks',   icon: 'flame-outline' },
  { value: 'workouts',  label: 'Workouts',  icon: 'barbell-outline' },
  { value: 'referrals', label: 'Referrals', icon: 'people-outline' },
];

export default function LeaderboardScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<Tab>('Global');

  const {
    globalEntries,
    friendsEntries,
    myRank,
    isLoading,
    isRefreshing,
    activeCategory,
    refresh,
    changeCategory,
  } = useLeaderboard(user?.id ?? '');

  const entries = activeTab === 'Global' ? globalEntries : friendsEntries;
  const myEntry = entries.find((e) => e.isCurrentUser);

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* Header */}
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

      {/* Global / Friends tab toggle */}
      <View style={[styles.tabToggle, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        {(['Global', 'Friends'] as Tab[]).map((tab) => (
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

      {/* Category selector — fixed height pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            onPress={() => changeCategory(cat.value)}
            style={[styles.catBtn, {
              backgroundColor: activeCategory === cat.value
                ? theme.accent
                : theme.card,
              borderColor: activeCategory === cat.value
                ? theme.accent
                : theme.border,
            }]}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={activeCategory === cat.value ? theme.bg : theme.textMuted}
            />
            <Text style={[styles.catBtnText, {
              color: activeCategory === cat.value ? theme.bg : theme.textMuted,
              fontWeight: activeCategory === cat.value ? '700' : '400',
            }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reset notice */}
      <View style={[styles.resetNotice, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}>
        <Ionicons name="refresh-outline" size={12} color={theme.accent} />
        <Text style={[styles.resetText, { color: theme.accent }]}>
          Resets every Monday · Score = Streaks ×10 + Workouts ×5 + Referrals ×20
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
        >
          {myEntry && (
            <MyRankCard
              theme={theme}
              rank={myRank}
              totalScore={myEntry.total_score}
              streakCount={myEntry.streak_count}
              totalWorkouts={myEntry.total_workouts}
              referralCount={myEntry.referral_count}
              activeCategory={activeCategory}
              onRefresh={refresh}
            />
          )}

          {entries.length === 0 ? (
            <EmptyState
              theme={theme}
              icon="trophy-outline"
              title={activeTab === 'Friends'
                ? 'No friends on the board yet'
                : 'No rankings yet'}
              subtitle={activeTab === 'Friends'
                ? 'Follow other members to see how you compare.'
                : 'Log workouts and build your streak to appear here.'}
            />
          ) : (
            entries.map((entry) => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                theme={theme}
                activeCategory={activeCategory}
                onPress={() =>
                  navigation.navigate('Profile', { userId: entry.user_id })
                }
              />
            ))
          )}
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

  // Global / Friends toggle
  tabToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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

  // Category pills — fixed height so they never go cylinder-shaped
  categoryRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    height: 34,           // fixed height — kills the cylinder issue
    borderRadius: radius.md, // md not full — proper pill shape not oval
    borderWidth: 1,
  },
  catBtnText: { fontSize: fontSize.sm },

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
  resetText: { fontSize: fontSize.xs, fontWeight: '600', flex: 1, lineHeight: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});