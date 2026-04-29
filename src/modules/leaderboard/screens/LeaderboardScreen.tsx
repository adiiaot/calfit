import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { MyRankCard } from '../components/MyRankCard';
import { EmptyState } from '../../shared/EmptyState';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { LeaderboardCategory } from '../services/LeaderboardService';
import { AndroidSafeView } from '../../shared/AndriodSafeView';
import { UserAvatar } from '../../shared/UserAvatar';
import { LinearGradient } from 'expo-linear-gradient';
import { checkAndNotifyRankUp } from '../../../services/Leaderboardnotificationservice';

const GOLD   = '#FFD133';
const PURPLE = '#B280FF';
const PINK   = '#FF6B9D';

type Tab = 'Global' | 'Friends';

const CATEGORIES: { value: LeaderboardCategory; label: string; icon: string; description: string }[] = [
  { value: 'overall',            label: 'Overall Activity', icon: 'trophy-outline',    description: 'Streaks + meals + water + fasting + referrals' },
  { value: 'streaks',            label: 'Streaks',          icon: 'flame-outline',     description: 'Longest active streaks' },
  { value: 'workouts',           label: 'Workouts',         icon: 'barbell-outline',   description: 'Most workouts logged' },
  { value: 'referrals',          label: 'Referrals',        icon: 'people-outline',    description: 'Most friends invited' },
  { value: 'steps',              label: 'Steps',            icon: 'footsteps-outline', description: 'Most steps in 30 days' },
  { value: 'calorie_consistency',label: 'Calorie Goals',    icon: 'checkmark-circle-outline', description: 'Most consistent calorie goal hitters (top 10)' },
];

function CategoryDropdown({
  theme,
  activeCategory,
  onSelect,
}: {
  theme: typeof colors.dark;
  activeCategory: LeaderboardCategory;
  onSelect: (cat: LeaderboardCategory) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = CATEGORIES.find((c) => c.value === activeCategory) ?? CATEGORIES[0];

  return (
    <View style={styles.dropdownWrap}>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.dropdownTrigger, { backgroundColor: theme.card, borderColor: PURPLE }]}
        activeOpacity={0.8}
      >
        <Ionicons name={active.icon as any} size={16} color={PURPLE} />
        <Text style={[styles.dropdownTriggerText, { color: PURPLE }]}>
          {active.label}
        </Text>
        <Ionicons name="chevron-down" size={16} color={PURPLE} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.dropdownMenuTitle, { color: theme.textSecondary }]}>Select Leaderboard</Text>
            {CATEGORIES.map((cat) => {
              const isActive = cat.value === activeCategory;
              return (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => { onSelect(cat.value); setOpen(false); }}
                  style={[styles.dropdownItem, { borderBottomColor: theme.border }, isActive && { backgroundColor: PURPLE + '15' }]}
                >
                  <View style={[styles.dropdownItemIcon, { backgroundColor: isActive ? PURPLE : theme.border + '40' }]}>
                    <Ionicons name={cat.icon as any} size={16} color={isActive ? '#fff' : theme.textMuted} />
                  </View>
                  <View style={styles.dropdownItemText}>
                    <Text style={[styles.dropdownItemLabel, { color: isActive ? PURPLE : theme.textPrimary, fontWeight: isActive ? '700' : '500' }]}>
                      {cat.label}
                    </Text>
                    <Text style={[styles.dropdownItemDesc, { color: theme.textMuted }]}>{cat.description}</Text>
                  </View>
                  {isActive && <Ionicons name="checkmark" size={18} color={PURPLE} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function CalorieConsistencyRow({ entry, theme, onPress }: { entry: any; theme: typeof colors.dark; onPress: () => void; }) {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, {
        backgroundColor: entry.isCurrentUser ? theme.accentDim as string : theme.card,
        borderColor: entry.isCurrentUser ? theme.accent : theme.border,
        borderWidth: entry.isCurrentUser ? 2 : 1,
      }]}
    >
      {medals[entry.rank] ? (
        <Text style={styles.medal}>{medals[entry.rank]}</Text>
      ) : (
        <View style={[styles.rankBadge, { borderColor: theme.border }]}>
          <Text style={[styles.rankBadgeText, { color: theme.textSecondary }]}>{entry.rank}</Text>
        </View>
      )}
      <UserAvatar uri={entry.avatar_url} name={entry.full_name} size={40} theme={theme} />
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: theme.textPrimary }]}>
          {entry.full_name}
          {entry.isCurrentUser && <Text style={[styles.youTag, { color: theme.accent }]}> · You</Text>}
        </Text>
        <Text style={[styles.rowHandle, { color: theme.textMuted }]}>@{entry.calfit_id}</Text>
      </View>
      <View style={[styles.scoreWrap, { backgroundColor: theme.accent + '18' }]}>
        <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
        <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>consistent</Text>
      </View>
    </TouchableOpacity>
  );
}

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
  const isCalorieConsistency = activeCategory === 'calorie_consistency';

  // ── Rank-up notification — fires when rank data loads ──
  useFocusEffect(useCallback(() => {
    if (myRank && user?.id) {
      checkAndNotifyRankUp(user.id, myRank, activeCategory).catch(() => {});
    }
  }, [myRank, user?.id, activeCategory]));

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* ── GRADIENT HEADER ── */}
      <LinearGradient
        colors={[PURPLE + 'EE', PINK + 'CC'] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Text style={styles.headerSub}>See how you rank this week</Text>
        </View>
        <View style={[styles.rankPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Text style={styles.rankPillText}>#{myRank > 0 ? myRank : '—'}</Text>
          <Text style={styles.rankPillSub}>Your rank</Text>
        </View>
      </LinearGradient>

      {/* ── GLOBAL / FRIENDS TOGGLE ── */}
      <View style={[styles.tabToggle, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {(['Global', 'Friends'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && { backgroundColor: PURPLE }]}
          >
            <Text style={[styles.tabBtnText, {
              color: activeTab === tab ? '#fff' : theme.textMuted,
              fontWeight: activeTab === tab ? '700' : '400',
            }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <CategoryDropdown theme={theme} activeCategory={activeCategory} onSelect={changeCategory} />

      {isCalorieConsistency && (
        <View style={[styles.noticeBar, { backgroundColor: PURPLE + '18', borderColor: PURPLE + '44' }]}>
          <Ionicons name="information-circle-outline" size={14} color={PURPLE} />
          <Text style={[styles.noticeText, { color: PURPLE }]}>
            Top 10 most consistent calorie goal hitters · Numbers hidden
          </Text>
        </View>
      )}

      {!isCalorieConsistency && (
        <View style={[styles.resetNotice, { backgroundColor: PURPLE + '12', borderColor: PURPLE + '33' }]}>
          <Ionicons name="refresh-outline" size={12} color={PURPLE} />
          <Text style={[styles.resetText, { color: PURPLE }]}>
            Resets every Monday · Overall tracks all app activity
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {myEntry && !isCalorieConsistency && (
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
              title={activeTab === 'Friends' ? 'No friends on the board yet' : 'No rankings yet'}
              subtitle={activeTab === 'Friends'
                ? 'Follow other members to see how you compare.'
                : 'Start logging activity to appear on the leaderboard.'}
            />
          ) : (
            entries.map((entry) =>
              isCalorieConsistency ? (
                <CalorieConsistencyRow
                  key={entry.user_id}
                  entry={entry}
                  theme={theme}
                  onPress={() => navigation.navigate('Profile' as never, { userId: entry.user_id } as never)}
                />
              ) : (
                <LeaderboardRow
                  key={entry.user_id}
                  entry={entry}
                  theme={theme}
                  activeCategory={activeCategory}
                  onPress={() => navigation.navigate('Profile' as never, { userId: entry.user_id } as never)}
                />
              )
            )
          )}
        </ScrollView>
      )}
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // ── GRADIENT HEADER ──
  header:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 4 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  rankPill:    { alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  rankPillText:{ fontSize: fontSize.xl, fontWeight: '900', color: '#fff' },
  rankPillSub: { fontSize: 9, color: 'rgba(255,255,255,0.70)', fontWeight: '600', marginTop: 1 },

  tabToggle: { flexDirection: 'row', marginHorizontal: spacing.lg, marginVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, padding: 4, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabBtnText: { fontSize: fontSize.base },
  dropdownWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderRadius: radius.md, borderWidth: 1.5 },
  dropdownTriggerText: { flex: 1, fontSize: fontSize.base, fontWeight: '700' },
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: spacing.lg },
  dropdownMenu: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  dropdownMenuTitle: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, padding: spacing.md, paddingBottom: spacing.sm },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 0.5 },
  dropdownItemIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dropdownItemText: { flex: 1 },
  dropdownItemLabel: { fontSize: fontSize.base },
  dropdownItemDesc: { fontSize: fontSize.xs, marginTop: 1 },
  noticeBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1 },
  noticeText: { fontSize: fontSize.xs, fontWeight: '600', flex: 1 },
  resetNotice: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1 },
  resetText: { fontSize: fontSize.xs, fontWeight: '600' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 120, paddingTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  medal: { fontSize: 28, width: 36, textAlign: 'center' },
  rankBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  rankBadgeText: { fontSize: fontSize.base, fontWeight: '700' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: fontSize.base, fontWeight: '700' },
  youTag: { fontSize: fontSize.sm, fontWeight: '600' },
  rowHandle: { fontSize: fontSize.xs, marginTop: 1 },
  scoreWrap: { padding: spacing.sm, borderRadius: radius.sm, alignItems: 'center', minWidth: 60 },
  scoreLabel: { fontSize: 9, marginTop: 1 },
});