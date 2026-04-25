import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useEffect, useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, gradients, dayRingColors, spacing, radius, fontSize } from '../../theme';
import Avatar from '../../components/Avatar';
import { getTodayCalories, getTodayWater, logWater } from '../../services/profileService';
import { useSteps } from '../../hooks/useSteps';
import { supabase } from '../../services/supabase';

// ── STREAK ROW ───────────────────────────────────────────────
// CHANGED: Day circles now use dayRingColors (teal/blue/purple/orange/coral/pink/grey)
// matching the client reference image — not all-green any more
function StreakRow({ theme, streakCount }: {
  theme: typeof colors.light;
  streakCount: number;
}) {
  const navigation = useNavigation<any>();

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const todayDow = today.getDay();
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
        <Text style={[styles.streakCardLabel, { color: theme.textPrimary }]}>This Week</Text>
        {/* CHANGED: Streak pill uses gradient colours (orange-yellow) */}
        <View style={[styles.streakPill, { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: theme.gradMid }]}>
          <Text style={styles.streakPillEmoji}>🔥</Text>
          <Text style={[styles.streakPillCount, { color: theme.gradMid }]}>{streakCount}</Text>
        </View>
      </View>

      {/* Day circles row */}
      {/* CHANGED: Each day circle gets its own colour from dayRingColors */}
      <View style={styles.streakDaysRow}>
        {days.map(({ label, date, dow }) => {
          const isToday  = dow === todayDow;
          const isFuture = dow > todayDow;
          const ringColor = dayRingColors[dow];

          // Today: filled with ring colour. Past: ring border only. Future: muted grey ring.
          const bg          = isToday ? ringColor : 'transparent';
          const borderColor = isFuture ? theme.border : ringColor;
          const dateColor   = isToday ? '#FFFFFF' : isFuture ? theme.textMuted : ringColor;

          return (
            <View key={dow} style={styles.streakDayCol}>
              <Text style={[styles.streakDayName, {
                color: isToday ? ringColor : theme.textMuted,
                fontWeight: isToday ? '700' : '500',
              }]}>
                {label}
              </Text>
              <View style={[styles.streakCircle, { backgroundColor: bg, borderColor }]}>
                <Text style={[styles.streakDateNum, {
                  color: dateColor,
                  fontWeight: isToday ? '800' : '600',
                }]}>
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

// ── CALORIE CARD ─────────────────────────────────────────────
// CHANGED: Background is now theme.heroCard (deep indigo #1A1445)
// All text uses textOnHero (white). Progress bar is pink→orange gradient.
// Remaining text is pink (gradStart) to match reference.
function CalorieCard({ theme, consumed, goal }: {
  theme: typeof colors.light;
  consumed: number;
  goal: number;
}) {
  const navigation = useNavigation<any>();
  const remaining = Math.max(goal - consumed, 0);
  const pct = Math.min(consumed / goal, 1);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Main', { screen: 'Calorie' })}
      activeOpacity={0.8}
      style={[styles.calorieCard, { backgroundColor: theme.heroCard }]}
    >
      {/* Subtle radial glow overlay for depth — matches reference */}
      <View style={styles.calorieGlow} />

      <View style={styles.calorieTop}>
        <View>
          {/* CHANGED: Consumed shown large in white, not green */}
          <Text style={[styles.calorieConsumed, { color: theme.textOnHero }]}>
            {consumed.toLocaleString()}
          </Text>
          <Text style={[styles.calorieLabel, { color: 'rgba(255,255,255,0.55)' }]}>
            kcal consumed
          </Text>
        </View>
        <View style={styles.calorieRight}>
          <Text style={[styles.calorieGoal, { color: theme.textOnHero }]}>
            {goal.toLocaleString()}
          </Text>
          <Text style={[styles.calorieGoalLabel, { color: 'rgba(255,255,255,0.55)' }]}>
            daily goal
          </Text>
        </View>
      </View>

      {/* CHANGED: Progress bar is a pink→orange gradient */}
      <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,255,255,0.15)', marginTop: spacing.md }]}>
        <LinearGradient
          colors={pct >= 1
            ? [theme.gradStart, theme.gradMid]
            : [theme.gradStart, theme.gradMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, { width: `${Math.max(pct * 100, 2)}%` as any }]}
        />
      </View>

      {/* CHANGED: Remaining text is pink to match reference image */}
      <Text style={[styles.calorieRemaining, { color: theme.gradStart }]}>
        {remaining > 0 ? `${remaining.toLocaleString()} kcal remaining` : 'Goal reached 🎉'}
      </Text>
    </TouchableOpacity>
  );
}

// ── STAT CARDS ROW (Water, Steps, Sleep) ─────────────────────
// CHANGED: Each card has its own tinted background (blue/sage/lavender)
// matching the reference image — not a generic card colour.
// Hardcoded hex colours replaced with theme tokens.
function StatCards({ theme, waterMl, waterGoalMl, liveSteps, stepGoal, sleepHrs }: {
  theme: typeof colors.light;
  waterMl: number;
  waterGoalMl: number;
  liveSteps: number;
  stepGoal: number;
  sleepHrs: number;
}) {
  const navigation = useNavigation<any>();

  const waterL     = (waterMl / 1000).toFixed(1);
  const waterGoalL = (waterGoalMl / 1000).toFixed(1);
  const stepGoalFormatted = stepGoal >= 1000
    ? `${(stepGoal / 1000).toFixed(0)}k`
    : `${stepGoal}`;

  // CHANGED: color and cardBg now use theme tokens
  const stats = [
    {
      label: 'Water',
      value: waterMl > 0 ? `${waterL}L` : '—',
      sub: waterMl > 0 ? `of ${waterGoalL}L` : 'not logged',
      color: '#2BBCB0',          // teal — matches water ring colour
      cardBg: theme.waterCard,
      pct: waterMl > 0 ? Math.min(waterMl / waterGoalMl, 1) : 0,
      icon: 'water-outline' as const,
      onPress: () => navigation.navigate('Main', { screen: 'Calorie' }),
    },
    {
      label: 'Steps',
      value: liveSteps > 0 ? liveSteps.toLocaleString() : '—',
      sub: liveSteps > 0 ? `of ${stepGoalFormatted}` : 'tracking...',
      color: theme.accent,       // CalFit green — brand colour for steps
      cardBg: theme.stepsCard,
      pct: liveSteps > 0 ? Math.min(liveSteps / stepGoal, 1) : 0,
      icon: 'footsteps-outline' as const,
      onPress: () => navigation.navigate('Main', { screen: 'Activity' }),
    },
    {
      label: 'Sleep',
      value: sleepHrs > 0 ? `${sleepHrs}h` : '—',
      sub: sleepHrs > 0 ? 'of 8h' : 'not logged',
      color: theme.purple,       // purple — matches sleep ring colour
      cardBg: theme.sleepCard,
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
          // CHANGED: backgroundColor now uses per-card tinted bg, no border
          style={[styles.smallCard, { backgroundColor: s.cardBg }]}
          activeOpacity={0.8}
        >
          <Ionicons name={s.icon} size={20} color={s.color} style={{ marginBottom: 6 }} />
          <Text style={[styles.smallCardValue, { color: s.color }]}>{s.value}</Text>
          <View style={[styles.smallCardBar, { backgroundColor: 'rgba(0,0,0,0.10)' }]}>
            {s.pct > 0 && (
              <View style={[styles.smallCardBarFill, {
                backgroundColor: s.color,
                width: `${s.pct * 100}%` as any,
              }]} />
            )}
          </View>
          <Text style={[styles.smallCardLabel, { color: s.color, opacity: 0.85 }]}>{s.label}</Text>
          <Text style={[styles.smallCardSub, { color: s.color, opacity: 0.60 }]}>{s.sub}</Text>
          {/* Arrow badge — matches reference */}
          <View style={[styles.statArrow, { backgroundColor: s.color }]}>
            <Ionicons name="arrow-forward" size={10} color="#fff" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── SCANNER SHORTCUT ─────────────────────────────────────────
// CHANGED: Full pink→orange gradient background matching reference image
function ScannerShortcut({ theme }: { theme: typeof colors.light }) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.getParent()?.navigate('FoodScanner')}
      activeOpacity={0.85}
      style={styles.scannerCardWrapper}
    >
      <LinearGradient
        colors={[theme.gradStart, theme.gradMid] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.scannerCard}
      >
        <View style={styles.scannerLeft}>
          {/* Camera icon in white circle */}
          <View style={styles.scannerIconCircle}>
            <Ionicons name="camera" size={22} color={theme.gradStart} />
          </View>
          <View>
            <Text style={styles.scannerTitle}>Scan Food</Text>
            <Text style={styles.scannerSub}>
              Point camera at any food to log instantly
            </Text>
          </View>
        </View>
        {/* Arrow in white circle */}
        <View style={styles.scannerArrowCircle}>
          <Ionicons name="chevron-forward" size={18} color={theme.gradStart} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── COACH CARD ───────────────────────────────────────────────
// Minimal change — uses theme.card and theme.accent (green) as before
function CoachCard({ theme }: { theme: typeof colors.light }) {
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
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

// ── QUICK LOG ────────────────────────────────────────────────
// CHANGED: Each button has its own colour matching the stat it logs
function QuickLog({ theme, onWaterLog, onSleepLog }: {
  theme: typeof colors.light;
  onWaterLog: () => void;
  onSleepLog: () => void;
}) {
  const navigation = useNavigation<any>();

  const actions = [
    { label: '+ Food',   icon: 'restaurant-outline' as const, color: theme.accent,  onPress: () => navigation.navigate('Main', { screen: 'Calorie' }) },
    { label: '+ Water',  icon: 'water-outline' as const,      color: '#2BBCB0',     onPress: onWaterLog },
    { label: '+ Sleep',  icon: 'moon-outline' as const,       color: theme.purple,  onPress: onSleepLog },
    { label: 'Workout',  icon: 'barbell-outline' as const,    color: theme.gradMid, onPress: () => navigation.navigate('Main', { screen: 'Activity' }) },
  ];

  return (
    <View style={styles.quickLogRow}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.label}
          onPress={a.onPress}
          style={[styles.quickLogBtn, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}
          activeOpacity={0.8}
        >
          <Ionicons name={a.icon} size={16} color={a.color} />
          <Text style={[styles.quickLogText, { color: a.color }]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── QUICK NAV ────────────────────────────────────────────────
function QuickNav({ theme }: { theme: typeof colors.light }) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.quickNav}>
      {[
        { label: 'Leaderboard', icon: 'trophy-outline' as const,   route: 'Leaderboard' },
        { label: 'Partners',    icon: 'people-outline' as const,    route: 'Accountability' },
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
function FriendsTicker({ theme }: { theme: typeof colors.light }) {
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
        <Text style={[styles.emptyFriendsText, { color: theme.textPrimary }]}>
          No friends activity yet.
        </Text>
        <Text style={[styles.emptyFriendsSub, { color: theme.textSecondary }]}>
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
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Friends Activity</Text>
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
      setIsRefreshing(false);
    }
  };

  const handleWaterLog = async () => {
    if (!user?.id) return;
    const success = await logWater(user.id, 250);
    if (success) setWaterMl((prev) => prev + 250);
  };

  const handleSleepLog = () => navigation.getParent()?.navigate('Sleep');

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
              <View style={[styles.badge, { backgroundColor: theme.gradStart }]}>
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
        <StreakRow theme={theme} streakCount={streakCount} />
        <CalorieCard theme={theme} consumed={caloriesConsumed} goal={calorieGoal} />
        <StatCards
          theme={theme}
          waterMl={waterMl}
          waterGoalMl={waterGoalMl}
          liveSteps={liveSteps}
          stepGoal={stepGoal}
          sleepHrs={sleepHrs}
        />
        <ScannerShortcut theme={theme} />
        <CoachCard theme={theme} />

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

        <QuickNav theme={theme} />

        <View style={[styles.card, {
          backgroundColor: theme.card,
          borderColor: theme.border,
          marginHorizontal: spacing.lg,
        }]}>
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
  sectionLabel: {
    fontSize: fontSize.sm, fontWeight: '700',
    marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // ── STREAK CARD ──
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
  streakCardLabel: { fontSize: fontSize.base, fontWeight: '700' },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full, borderWidth: 1,
  },
  streakPillEmoji: { fontSize: 14 },
  streakPillCount: { fontSize: fontSize.base, fontWeight: '800' },
  streakDaysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  streakDayCol: { alignItems: 'center', gap: 5 },
  streakDayName: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  streakCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  streakDateNum: { fontSize: 13 },

  // ── CALORIE CARD ──
  calorieCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  // Subtle radial glow for depth on hero card
  calorieGlow: {
    position: 'absolute', top: -40, right: -20,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(176,148,255,0.12)',
  },
  calorieTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  calorieConsumed: { fontSize: 48, fontWeight: '800', lineHeight: 52 },
  calorieLabel: { fontSize: fontSize.sm, fontWeight: '500', marginTop: 2 },
  calorieRight: { alignItems: 'flex-end' },
  calorieGoal: { fontSize: fontSize.xxl, fontWeight: '700' },
  calorieGoalLabel: { fontSize: fontSize.xs },
  calorieRemaining: { fontSize: fontSize.sm, marginTop: spacing.sm, fontWeight: '600' },
  progressBarBg: { height: 7, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  // ── STAT CARDS ──
  smallCardsRow: {
    flexDirection: 'row', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
  },
  smallCard: {
    flex: 1, padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  smallCardValue: { fontSize: fontSize.xl, fontWeight: '800', marginBottom: 6 },
  smallCardBar: { height: 4, borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 4 },
  smallCardBarFill: { height: '100%', borderRadius: 2 },
  smallCardLabel: { fontSize: 10, fontWeight: '700' },
  smallCardSub: { fontSize: 9, marginTop: 1 },
  // Arrow badge bottom-right
  statArrow: {
    position: 'absolute', bottom: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── SCANNER SHORTCUT ──
  scannerCardWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  scannerCard: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  scannerIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  scannerTitle: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  scannerSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.80)', marginTop: 2 },
  scannerArrowCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── COACH CARD ──
  coachCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
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
  quickLogRow: { flexDirection: 'row', gap: spacing.sm },
  quickLogBtn: {
    flex: 1, paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm, borderWidth: 1,
    alignItems: 'center', gap: 4,
  },
  quickLogText: { fontSize: fontSize.xs, fontWeight: '700' },

  // ── QUICK NAV ──
  quickNav: {
    flexDirection: 'row', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
  },
  quickNavBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.md,
    borderRadius: radius.lg, borderWidth: 1,
  },
  quickNavLabel: { fontSize: fontSize.xs, fontWeight: '600' },

  // ── FRIENDS TICKER ──
  card: { marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  cardLabel: { fontSize: fontSize.sm, fontWeight: '600' },
  tickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: fontSize.xs, fontWeight: '700' },
  emptyFriendsText: { fontSize: fontSize.base, fontWeight: '600', marginBottom: 4 },
  emptyFriendsSub: { fontSize: fontSize.sm, lineHeight: 18, marginBottom: spacing.md },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: radius.lg, borderWidth: 1, alignSelf: 'stretch',
  },
  inviteBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});