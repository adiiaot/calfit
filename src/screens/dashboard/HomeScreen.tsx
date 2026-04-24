import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useEffect, useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import Avatar from '../../components/Avatar';
import { getTodayCalories, getTodayWater, logWater } from '../../services/profileService';
import { useSteps } from '../../hooks/useSteps';
import { supabase } from '../../services/supabase';

// ── STREAK ROW — Cal AI style ────────────────────────────────
// Layout: [Sun/10] [Mon/11] ... in a row with streak pill top-right
// Today's circle is accent-filled, past days bordered, future days muted
function StreakRow({ theme, streakCount }: {
  theme: typeof colors.dark;
  streakCount: number;
}) {
  const navigation = useNavigation<any>();

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Build 7 dates: start from this week's Sunday
  const today = new Date();
  const todayDow = today.getDay(); // 0=Sun
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - todayDow);

  const days = dayLabels.map((label, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { label, date: d.getDate(), dow: i };
  });

  return (
    <TouchableOpacity
      onPress={() => navigation.getParent()?.navigate('Streaks')}
      activeOpacity={0.85}
      style={[styles.streakCard, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      {/* Top row: label + streak pill */}
      <View style={styles.streakTopRow}>
        <Text style={[styles.streakCardLabel, { color: theme.textSecondary }]}>This Week</Text>
        <View style={[styles.streakPill, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
          <Text style={styles.streakPillEmoji}>🔥</Text>
          <Text style={[styles.streakPillCount, { color: theme.accent }]}>{streakCount}</Text>
        </View>
      </View>

      {/* Day circles row */}
      <View style={styles.streakDaysRow}>
        {days.map(({ label, date, dow }) => {
          const isPast    = dow < todayDow;
          const isToday   = dow === todayDow;
          const isFuture  = dow > todayDow;

          const bg     = isToday ? theme.accent : 'transparent';
          const border = isToday ? theme.accent : isPast ? theme.accent : theme.border;
          const dayColor = isToday ? theme.bg : isPast ? theme.accent : theme.textMuted;
          const dateColor = isToday ? theme.bg : isPast ? theme.textSecondary : theme.textMuted;

          return (
            <View key={dow} style={styles.streakDayCol}>
              <Text style={[styles.streakDayName, { color: isToday ? theme.accent : theme.textMuted }]}>
                {label}
              </Text>
              <View style={[styles.streakCircle, { backgroundColor: bg, borderColor: border }]}>
                <Text style={[styles.streakDateNum, { color: dateColor, fontWeight: isToday ? '800' : '500' }]}>
                  {date}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

// ── CALORIE CARD (bigger, bolder) ────────────────────────────
function CalorieCard({ theme, consumed, goal }: {
  theme: typeof colors.dark;
  consumed: number;
  goal: number;
}) {
  const navigation = useNavigation<any>();
  const remaining = Math.max(goal - consumed, 0);
  const pct = Math.min(consumed / goal, 1);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Main', { screen: 'Calorie' })}
      style={[styles.calorieCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      activeOpacity={0.8}
    >
      <View style={styles.calorieTop}>
        <View>
          <Text style={[styles.calorieConsumed, { color: theme.accent }]}>
            {consumed.toLocaleString()}
          </Text>
          <Text style={[styles.calorieLabel, { color: theme.textSecondary }]}>
            kcal consumed
          </Text>
        </View>
        <View style={styles.calorieRight}>
          <Text style={[styles.calorieGoal, { color: theme.textPrimary }]}>
            {goal.toLocaleString()}
          </Text>
          <Text style={[styles.calorieGoalLabel, { color: theme.textMuted }]}>
            daily goal
          </Text>
        </View>
      </View>
      <View style={[styles.progressBarBg, { backgroundColor: theme.border, marginTop: spacing.md }]}>
        <View style={[styles.progressBarFill, {
          backgroundColor: pct >= 1 ? (theme as any).red : theme.accent,
          width: `${pct * 100}%` as any,
        }]} />
      </View>
      <Text style={[styles.calorieRemaining, { color: theme.textSecondary }]}>
        {remaining > 0 ? `${remaining.toLocaleString()} kcal remaining` : 'Goal reached 🎉'}
      </Text>
    </TouchableOpacity>
  );
}

// ── STAT CARDS ROW (Water, Steps, Sleep) ─────────────────────
function StatCards({ theme, waterMl, waterGoalMl, liveSteps, stepGoal, sleepHrs }: {
  theme: typeof colors.dark;
  waterMl: number;
  waterGoalMl: number;
  liveSteps: number;
  stepGoal: number;
  sleepHrs: number;
}) {
  const navigation = useNavigation<any>();

  const waterL = (waterMl / 1000).toFixed(1);
  const waterGoalL = (waterGoalMl / 1000).toFixed(1);
  const stepGoalFormatted = stepGoal >= 1000 ? `${(stepGoal / 1000).toFixed(0)}k` : `${stepGoal}`;

  const stats = [
    {
      label: 'Water',
      value: waterMl > 0 ? `${waterL}L` : '—',
      sub: waterMl > 0 ? `of ${waterGoalL}L` : 'not logged',
      color: '#4FC3F7',
      pct: waterMl > 0 ? Math.min(waterMl / waterGoalMl, 1) : 0,
      icon: 'water-outline' as const,
      onPress: () => navigation.navigate('Main', { screen: 'Calorie' }),
    },
    {
      label: 'Steps',
      value: liveSteps > 0 ? liveSteps.toLocaleString() : '—',
      sub: liveSteps > 0 ? `of ${stepGoalFormatted}` : 'tracking...',
      color: theme.accent,
      pct: liveSteps > 0 ? Math.min(liveSteps / stepGoal, 1) : 0,
      icon: 'footsteps-outline' as const,
      onPress: () => navigation.navigate('Main', { screen: 'Activity' }),
    },
    {
      label: 'Sleep',
      value: sleepHrs > 0 ? `${sleepHrs}h` : '—',
      sub: sleepHrs > 0 ? 'of 8h' : 'not logged',
      color: '#9C88FF',
      pct: sleepHrs > 0 ? Math.min(sleepHrs / 8, 1) : 0,
      icon: 'moon-outline' as const,
      onPress: () => navigation.getParent()?.navigate('Sleep'),
    },
  ];

  return (
    <View style={styles.smallCardsRow}>
      {stats.map((s) => (
        <TouchableOpacity
          key={s.label}
          onPress={s.onPress}
          style={[styles.smallCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <Ionicons name={s.icon} size={18} color={s.color} style={{ marginBottom: 4 }} />
          <Text style={[styles.smallCardValue, { color: s.color }]}>{s.value}</Text>
          <View style={[styles.smallCardBar, { backgroundColor: theme.border }]}>
            {s.pct > 0 && (
              <View style={[styles.smallCardBarFill, {
                backgroundColor: s.color,
                width: `${s.pct * 100}%` as any,
              }]} />
            )}
          </View>
          <Text style={[styles.smallCardLabel, { color: theme.textSecondary }]}>{s.label}</Text>
          <Text style={[styles.smallCardSub, { color: theme.textMuted }]}>{s.sub}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── QUICK LOG ────────────────────────────────────────────────
function QuickLog({ theme, onWaterLog, onSleepLog }: {
  theme: typeof colors.dark;
  onWaterLog: () => void;
  onSleepLog: () => void;
}) {
  const navigation = useNavigation<any>();

  const actions = [
    { label: '+ Food', onPress: () => navigation.navigate('Main', { screen: 'Calorie' }) },
    { label: '+ Water', onPress: onWaterLog },
    { label: '+ Sleep', onPress: onSleepLog },
    { label: 'Workout', onPress: () => navigation.navigate('Main', { screen: 'Activity' }) },
  ];

  return (
    <View style={styles.quickLogRow}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.label}
          onPress={a.onPress}
          style={[styles.quickLogBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.quickLogText, { color: theme.accent }]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── SCANNER SHORTCUT (new — correction #home-scanner) ────────
// CHANGED: Added scanner shortcut on Home as requested
function ScannerShortcut({ theme }: { theme: typeof colors.dark }) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.getParent()?.navigate('FoodScanner')}
      style={[styles.scannerCard, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}
      activeOpacity={0.8}
    >
      <View style={styles.scannerLeft}>
        <Ionicons name="camera" size={24} color={theme.accent} />
        <View>
          <Text style={[styles.scannerTitle, { color: theme.accent }]}>Scan Food</Text>
          <Text style={[styles.scannerSub, { color: theme.textSecondary }]}>
            Point camera at any food to log instantly
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.accent} />
    </TouchableOpacity>
  );
}

// ── COACH CARD (embedded on Home — correction: remove Coach tab) ──
// CHANGED: Coach is no longer a main tab. Tap to open full CoachScreen.
function CoachCard({ theme }: { theme: typeof colors.dark }) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.getParent()?.navigate('Coach')}
      style={[styles.coachCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      activeOpacity={0.8}
    >
      <View style={styles.coachLeft}>
        <View style={[styles.coachIcon, { backgroundColor: theme.accentDim as string }]}>
          <Ionicons name="chatbubble-ellipses" size={22} color={theme.accent} />
        </View>
        <View style={styles.coachText}>
          <Text style={[styles.coachTitle, { color: theme.textPrimary }]}>CalFit Coach</Text>
          <Text style={[styles.coachSub, { color: theme.textSecondary }]}>
            How are you feeling today? Tap to chat
          </Text>
        </View>
      </View>
      <View style={[styles.coachChevron, { backgroundColor: theme.accent }]}>
        <Ionicons name="arrow-forward" size={16} color={theme.bg} />
      </View>
    </TouchableOpacity>
  );
}

// ── QUICK NAV ROW ────────────────────────────────────────────
function QuickNav({ theme }: { theme: typeof colors.dark }) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.quickNav}>
      {[
        { label: 'Leaderboard', icon: 'trophy-outline' as const, route: 'Leaderboard' },
        { label: 'Partners',    icon: 'people-outline' as const,  route: 'Accountability' },
        { label: 'Community',   icon: 'megaphone-outline' as const, route: 'Community' },
      ].map((item) => (
        <TouchableOpacity
          key={item.route}
          onPress={() => navigation.getParent()?.navigate(item.route as never)}
          style={[styles.quickNavBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <Ionicons name={item.icon} size={20} color={theme.accent} />
          <Text style={[styles.quickNavLabel, { color: theme.textSecondary }]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── FRIENDS TICKER ───────────────────────────────────────────
function FriendsTicker({ theme }: { theme: typeof colors.dark }) {
  const navigation = useNavigation<any>();
  const hasFriends = false;

  if (!hasFriends) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.tickerHeader}>
          <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
            Friends Activity
          </Text>
          <View style={styles.liveBadge}>
            <View style={[styles.liveDot, { backgroundColor: theme.border }]} />
            <Text style={[styles.liveText, { color: theme.textMuted }]}>LIVE</Text>
          </View>
        </View>
        <Text style={[styles.emptyFriendsText, { color: theme.textSecondary }]}>
          No friends activity yet.
        </Text>
        <Text style={[styles.emptyFriendsSub, { color: theme.textMuted }]}>
          Invite friends to join CalFit and see their activity here in real time.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('Credits')}
          style={[styles.inviteBtn, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}
        >
          <Ionicons name="mail-outline" size={16} color={theme.accent} />
          <Text style={[styles.inviteBtnText, { color: theme.accent }]}>
            Copy Invite Link
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.tickerHeader}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
          Friends Activity
        </Text>
        <View style={styles.liveBadge}>
          <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.liveText, { color: theme.accent }]}>LIVE</Text>
        </View>
      </View>
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const stepGoal = (profile as any)?.step_goal ?? 10000;
  const { steps: liveSteps } = useSteps(stepGoal);

  const [unreadCount, setUnreadCount]           = useState(0);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [waterMl, setWaterMl]                   = useState(0);
  const [sleepHrs, setSleepHrs]                 = useState(0);
  const [isLoading, setIsLoading]               = useState(true);
  const [isRefreshing, setIsRefreshing]         = useState(false);

  const calorieGoal = (profile as any)?.daily_calorie_goal ?? 2000;
  const waterGoalMl = (profile as any)?.water_goal_ml ?? 2500;
  const streakCount = (profile as any)?.streak_count ?? 0;
  const firstName   = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' : 'Good evening';

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const [cal, water, sleepRes, notifRes] = await Promise.all([
        getTodayCalories(user.id),
        getTodayWater(user.id),
        supabase
          .from('sleep_logs')
          .select('hours')
          .eq('user_id', user.id)
          .eq('date', new Date().toISOString().split('T')[0])
          .maybeSingle(),
        supabase
          .from('notifications')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('read', false),
      ]);

      setCaloriesConsumed(cal);
      setWaterMl(water);
      setSleepHrs(sleepRes.data?.hours ?? 0);
      setUnreadCount(notifRes.count ?? 0);
    } catch (e) {
      console.error('HomeScreen loadData error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleWaterLog = async () => {
    if (!user?.id) return;
    const ml = 250;
    const success = await logWater(user.id, ml);
    if (success) setWaterMl((prev) => prev + ml);
  };

  const handleSleepLog = () => {
    navigation.getParent()?.navigate('Sleep');
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            {greeting} 👋
          </Text>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {firstName}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('Notifications')}
            style={[styles.headerIconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.textPrimary} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Settings')}>
            <Avatar size={38} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* ── STREAK ROW — very top, no box (CORRECTION) ── */}
        <StreakRow theme={theme} streakCount={streakCount} />

        {/* ── CALORIE CARD ── */}
        <CalorieCard theme={theme} consumed={caloriesConsumed} goal={calorieGoal} />

        {/* ── STAT CARDS (Water / Steps / Sleep) ── */}
        <StatCards
          theme={theme}
          waterMl={waterMl}
          waterGoalMl={waterGoalMl}
          liveSteps={liveSteps}
          stepGoal={stepGoal}
          sleepHrs={sleepHrs}
        />

        {/* NOTE: Daily Readiness bar REMOVED per client correction */}

        {/* ── SCANNER SHORTCUT (new — client correction) ── */}
        <ScannerShortcut theme={theme} />

        {/* ── COACH CARD (replaces Coach tab — client correction) ── */}
        <CoachCard theme={theme} />

        {/* ── QUICK LOG ── */}
        <View style={styles.sectionPad}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Quick Log
          </Text>
          <QuickLog
            theme={theme}
            onWaterLog={handleWaterLog}
            onSleepLog={handleSleepLog}
          />
        </View>

        {/* ── QUICK NAV ── */}
        <QuickNav theme={theme} />

        {/* ── FRIENDS TICKER ── */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginHorizontal: spacing.lg }]}>
          <FriendsTicker theme={theme} />
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </AndroidSafeView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
  },
  greeting: { fontSize: fontSize.sm, fontWeight: '500' },
  // CHANGED: Name is larger/bolder per client "bigger elements" correction
  name: { fontSize: fontSize.xxl + 2, fontWeight: '800', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, position: 'relative',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 8, color: '#fff', fontWeight: '700' },

  scrollContent: { paddingBottom: 120 },
  sectionPad: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── STREAK CARD (Cal AI style) ──
  streakCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  streakTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakCardLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  streakPillEmoji: { fontSize: 14 },
  streakPillCount: { fontSize: fontSize.base, fontWeight: '800' },

  streakDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakDayCol: {
    alignItems: 'center',
    gap: 5,
  },
  streakDayName: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  streakCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDateNum: {
    fontSize: 13,
    fontWeight: '600',
  },
  // kept for safety — no longer used but harmless
  streakDotNew: { width: 0, height: 0 },
  streakDotHalf: { width: 0, height: 0 },
  streakDayLabel: { fontSize: 0 },
  streakRow: { flexDirection: 'row' },
  streakFireEmoji: { fontSize: 0 },

  // ── CALORIE CARD (bigger/bolder) ──
  calorieCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  calorieTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  // CHANGED: Much larger calorie number
  calorieConsumed: { fontSize: 42, fontWeight: '800', lineHeight: 48 },
  calorieLabel: { fontSize: fontSize.sm, fontWeight: '500', marginTop: 2 },
  calorieRight: { alignItems: 'flex-end' },
  calorieGoal: { fontSize: fontSize.xl, fontWeight: '700' },
  calorieGoalLabel: { fontSize: fontSize.xs },
  calorieRemaining: { fontSize: fontSize.sm, marginTop: spacing.sm },

  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  // ── STAT CARDS ──
  smallCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  smallCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  // CHANGED: Bigger value text
  smallCardValue: { fontSize: fontSize.xl, fontWeight: '800', marginBottom: 4 },
  smallCardBar: { height: 4, borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 4 },
  smallCardBarFill: { height: '100%', borderRadius: 2 },
  smallCardLabel: { fontSize: 10, fontWeight: '700' },
  smallCardSub: { fontSize: 9, marginTop: 1 },

  // ── SCANNER SHORTCUT ──
  scannerCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  scannerTitle: { fontSize: fontSize.base, fontWeight: '700' },
  scannerSub: { fontSize: fontSize.xs, marginTop: 1 },

  // ── COACH CARD ──
  coachCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coachLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  coachIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  coachText: { flex: 1 },
  coachTitle: { fontSize: fontSize.base, fontWeight: '700' },
  coachSub: { fontSize: fontSize.xs, marginTop: 2 },
  coachChevron: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── QUICK LOG ──
  quickLogRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickLogBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  // CHANGED: Bigger quick log text
  quickLogText: { fontSize: fontSize.sm, fontWeight: '700' },

  // ── QUICK NAV ──
  quickNav: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  quickNavBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  quickNavLabel: { fontSize: fontSize.xs, fontWeight: '600' },

  // ── FRIENDS TICKER ──
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  cardLabel: { fontSize: fontSize.sm, fontWeight: '600' },
  tickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: fontSize.xs, fontWeight: '700' },
  emptyFriendsText: { fontSize: fontSize.base, fontWeight: '600', marginBottom: 4 },
  emptyFriendsSub: { fontSize: fontSize.sm, lineHeight: 18, marginBottom: spacing.md },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  inviteBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});