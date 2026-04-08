import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import {
  getTodayCalories,
  getTodayWater,
  getTodaySteps,
  logWater,
} from '../../services/profileService';

// ── READINESS CARD ───────────────────────────────────────────
function ReadinessCard({ theme, score }: {
  theme: typeof colors.dark;
  score: number;
}) {
  const pct = score / 100;
  const label =
    score >= 80 ? 'Great recovery' :
    score >= 60 ? 'Good recovery' : 'Rest recommended';

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
        Daily Readiness
      </Text>
      <View style={styles.readinessRow}>
        <View>
          <Text style={[styles.readinessScore, { color: theme.accent }]}>
            {score}
            <Text style={[styles.readinessDenom, { color: theme.textSecondary }]}>
              {' '}/100
            </Text>
          </Text>
          <Text style={[styles.readinessSub, { color: theme.textMuted }]}>
            {label}
          </Text>
        </View>
        <View style={styles.readinessBarWrap}>
          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <View style={[styles.progressBarFill, {
              backgroundColor: theme.accent,
              width: `${pct * 100}%` as any,
            }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ── CALORIE DONUT CARD ───────────────────────────────────────
function CalorieCard({ theme, consumed, goal }: {
  theme: typeof colors.dark;
  consumed: number;
  goal: number;
}) {
  const burned = 0;
  const remaining = Math.max(goal - consumed + burned, 0);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
        Today's Calories
      </Text>
      <View style={styles.donutRow}>
        <View style={styles.donutContainer}>
          <View style={[styles.donutRingOuter, { borderColor: theme.border }]} />
          <View style={[styles.donutRingProgress, { borderColor: theme.accent }]} />
          <View style={styles.donutCenterText}>
            <Text style={[styles.donutValue, { color: theme.textPrimary }]}>
              {remaining}
            </Text>
            <Text style={[styles.donutSub, { color: theme.textMuted }]}>left</Text>
          </View>
        </View>
        <View style={styles.donutStats}>
          {[
            { dot: theme.textMuted, label: 'Goal', value: `${goal} kcal` },
            { dot: theme.orange, label: 'Consumed', value: `${consumed} kcal` },
            { dot: theme.accent, label: 'Burned', value: `${burned} kcal` },
          ].map((s) => (
            <View key={s.label} style={styles.donutStatRow}>
              <View style={[styles.donutDot, { backgroundColor: s.dot }]} />
              <Text style={[styles.donutLabel, { color: theme.textSecondary }]}>
                {s.label}
              </Text>
              <Text style={[styles.donutVal, { color: theme.textPrimary }]}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── SMALL STAT CARDS ─────────────────────────────────────────
function SmallStatCards({ theme, waterMl, waterGoalMl, steps, stepGoal, sleepHrs }: {
  theme: typeof colors.dark;
  waterMl: number;
  waterGoalMl: number;
  steps: number;
  stepGoal: number;
  sleepHrs: number;
}) {
  const waterL = (waterMl / 1000).toFixed(1);
  const waterGoalL = (waterGoalMl / 1000).toFixed(1);
  const stepsFormatted = steps >= 1000
    ? `${(steps / 1000).toFixed(1)}K`
    : steps.toString();
  const stepGoalFormatted = stepGoal >= 1000
    ? `${stepGoal / 1000}K`
    : stepGoal.toString();

  const stats = [
    {
      label: 'Water',
      value: `${waterL}L`,
      sub: `of ${waterGoalL}L`,
      color: theme.accentSecond,
    },
    {
      label: 'Steps',
      value: stepsFormatted === '0' ? '—' : stepsFormatted,
      sub: `of ${stepGoalFormatted}`,
      color: theme.accent,
    },
    {
      label: 'Sleep',
      value: sleepHrs > 0 ? `${sleepHrs}h` : '—',
      sub: sleepHrs > 0 ? 'of 8h' : 'not logged',
      color: theme.purple,
    },
  ];

  return (
    <View style={styles.smallCardsRow}>
      {stats.map((s) => (
        <View key={s.label} style={[
          styles.smallCard,
          { backgroundColor: theme.card, borderColor: theme.border }
        ]}>
          <Text style={[styles.smallCardLabel, { color: theme.textSecondary }]}>
            {s.label}
          </Text>
          <Text style={[styles.smallCardValue, { color: s.color }]}>
            {s.value}
          </Text>
          <Text style={[styles.smallCardSub, { color: theme.textMuted }]}>
            {s.sub}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── STREAK CARD ──────────────────────────────────────────────
function StreakCard({ theme, streakCount }: {
  theme: typeof colors.dark;
  streakCount: number;
}) {
  const navigation = useNavigation<any>();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1;

  const badgeLabel =
    streakCount >= 30 ? 'Gold' :
    streakCount >= 7 ? 'Silver' : 'Bronze';

  return (
    <TouchableOpacity
      onPress={() => navigation.getParent()?.navigate('Streaks')}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={styles.streakHeader}>
        <Text style={[styles.streakTitle, { color: theme.textPrimary }]}>
          {streakCount > 0 ? `${streakCount}-Day Streak 🔥` : 'Start Your Streak 🔥'}
        </Text>
        <View style={[styles.goldBadge, { borderColor: theme.gold }]}>
          <Text style={[styles.goldBadgeText, { color: theme.gold }]}>
            {badgeLabel}
          </Text>
        </View>
      </View>
      <View style={styles.streakDots}>
        {days.map((day, i) => (
          <View key={`${day}-${i}`} style={[
            styles.streakDot,
            {
              backgroundColor: i <= adjustedToday ? theme.accent : theme.card,
              borderColor: i <= adjustedToday ? theme.accent : theme.border,
            }
          ]}>
            <Text style={[
              styles.streakDotText,
              { color: i <= adjustedToday ? theme.bg : theme.textMuted }
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.streakHint, { color: theme.textMuted }]}>
        Tap to check in today →
      </Text>
    </TouchableOpacity>
  );
}

// ── QUICK LOG ────────────────────────────────────────────────
function QuickLog({ theme, onWaterLog, onSleepLog, onStepsLog }: {
  theme: typeof colors.dark;
  onWaterLog: () => void;
  onSleepLog: () => void;
  onStepsLog: () => void;
}) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.quickLogRow}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Calorie')}
        style={[styles.quickLogBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Text style={[styles.quickLogText, { color: theme.accent }]}>+ Food</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onWaterLog}
        style={[styles.quickLogBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Text style={[styles.quickLogText, { color: theme.accent }]}>+ Water</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSleepLog}
        style={[styles.quickLogBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Text style={[styles.quickLogText, { color: theme.accent }]}>+ Sleep</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Activity')}
        style={[styles.quickLogBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Text style={[styles.quickLogText, { color: theme.accent }]}>Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── SLEEP LOG MODAL ───────────────────────────────────────────
function SleepLogModal({ theme, onLog }: {
  theme: typeof colors.dark;
  onLog: (hrs: number) => void;
}) {
  const options = [5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

  return (
    <View style={[styles.sleepModal, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      <Text style={[styles.sleepModalTitle, { color: theme.textPrimary }]}>
        How many hours did you sleep?
      </Text>
      <View style={styles.sleepOptions}>
        {options.map((hrs) => (
          <TouchableOpacity
            key={hrs}
            onPress={() => onLog(hrs)}
            style={[styles.sleepOption, {
              backgroundColor: theme.accentDim as string,
              borderColor: theme.accent,
            }]}
          >
            <Text style={[styles.sleepOptionText, { color: theme.accent }]}>
              {hrs}h
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── MOOD CARD ────────────────────────────────────────────────
function MoodCard({ theme }: { theme: typeof colors.dark }) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Coach')}
      style={[styles.moodCard, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={styles.moodText}>
        <Text style={[styles.moodTitle, { color: theme.textPrimary }]}>
          How are you feeling today?
        </Text>
        <Text style={[styles.moodSub, { color: theme.textSecondary }]}>
          Tap to check in · feeds your Coach
        </Text>
      </View>
      <Text style={[styles.moodArrow, { color: theme.accent }]}>→</Text>
    </TouchableOpacity>
  );
}

// ── FRIENDS TICKER ───────────────────────────────────────────
function FriendsTicker({ theme }: { theme: typeof colors.dark }) {
  const navigation = useNavigation<any>();

  // Will be populated with real friends data in Phase 4
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
          onPress={() => navigation.navigate('Credits')}
          style={[styles.inviteBtn, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}
        >
          <Text style={[styles.inviteBtnText, { color: theme.accent }]}>
            📨 Copy Invite Link
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

  const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  if (!user?.id) return;
  const loadUnread = async () => {
    const { getUnreadCount } = await import('../../services/notificationService');
    const count = await getUnreadCount(user.id);
    setUnreadCount(count);
  };
  loadUnread();
}, [user?.id]);

  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [waterMl, setWaterMl] = useState(0);
  const [steps, setSteps] = useState(0);
  const [sleepHrs, setSleepHrs] = useState(0);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const calorieGoal = profile?.daily_calorie_goal ?? 2000;
  const waterGoalMl = profile?.water_goal_ml ?? 2500;
  const stepGoal = profile?.step_goal ?? 10000;
  const streakCount = profile?.streak_count ?? 0;
  const firstName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'there';

  // Readiness score calculated from real data
  const waterScore = Math.min((waterMl / waterGoalMl) * 30, 30);
  const stepScore = Math.min((steps / stepGoal) * 30, 30);
  const sleepScore = sleepHrs >= 7 ? 40 : sleepHrs >= 5 ? 20 : 10;
  const readinessScore = Math.round(waterScore + stepScore + sleepScore);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    if (!user?.id) return;
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [calories, water, stepCount] = await Promise.all([
        getTodayCalories(user.id),
        getTodayWater(user.id),
        getTodaySteps(user.id),
      ]);
      setCaloriesConsumed(calories);
      setWaterMl(water);
      setSteps(stepCount);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickWater = async () => {
    if (!user?.id) return;
    const success = await logWater(user.id, 250);
    if (success) {
      setWaterMl((prev) => prev + 250);
    }
  };

  const handleSleepLog = (hrs: number) => {
    setSleepHrs(hrs);
    setShowSleepModal(false);
    // Will write to sleep_logs table in Phase 2
    Alert.alert(
      'Sleep Logged ✓',
      `${hrs} hours logged for last night.`,
      [{ text: 'OK' }]
    );
  };

  const handleStepsLog = () => {
    // Will connect to Expo Sensors in Phase 2
    Alert.alert(
      'Steps',
      'Step tracking via your phone sensors will be connected in the next update. Your steps will count automatically.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* TOP BAR */}
      <View style={[styles.topBar, { backgroundColor: theme.bg }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.textPrimary }]}>
            {greeting}, {firstName} 👋
          </Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </Text>
        </View>
        <View style={styles.topBarRight}>
         <TouchableOpacity
  onPress={() => navigation.getParent()?.navigate('Notifications')}
  style={[styles.bellBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
>
  <Text style={styles.bellIcon}>🔔</Text>
  {unreadCount > 0 && (
    <View style={[styles.bellDot, { backgroundColor: theme.orange }]} />
  )}
</TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('Settings')}
            style={[styles.avatarBtn, { backgroundColor: theme.accentDim, borderColor: theme.accent }]}
          >
            <Text style={[styles.avatarText, { color: theme.accent }]}>
              {firstName[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadDashboardData}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        <ReadinessCard theme={theme} score={readinessScore} />
        <CalorieCard theme={theme} consumed={caloriesConsumed} goal={calorieGoal} />
        <SmallStatCards
          theme={theme}
          waterMl={waterMl}
          waterGoalMl={waterGoalMl}
          steps={steps}
          stepGoal={stepGoal}
          sleepHrs={sleepHrs}
        />

        {/* Sleep log inline modal */}
        {showSleepModal && (
          <SleepLogModal theme={theme} onLog={handleSleepLog} />
        )}

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Personal Streak
        </Text>
        <StreakCard theme={theme} streakCount={streakCount} />

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Quick Log
        </Text>
        <QuickLog
          theme={theme}
          onWaterLog={handleQuickWater}
          onSleepLog={() => setShowSleepModal(!showSleepModal)}
          onStepsLog={handleStepsLog}
        />

        <MoodCard theme={theme} />
        <FriendsTicker theme={theme} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.massive },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: { fontSize: fontSize.xl, fontWeight: '700' },
  date: { fontSize: fontSize.md, marginTop: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bellBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, position: 'relative',
  },
  bellIcon: { fontSize: 16 },
  bellDot: {
    position: 'absolute', top: 4, right: 4,
    width: 9, height: 9, borderRadius: 5,
  },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: '700' },

  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  readinessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readinessScore: { fontSize: 32, fontWeight: '800' },
  readinessDenom: { fontSize: fontSize.lg, fontWeight: '400' },
  readinessSub: { fontSize: fontSize.xs, marginTop: 4 },
  readinessBarWrap: { flex: 1, marginLeft: spacing.lg },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  donutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  donutContainer: {
    width: 90, height: 90,
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  donutRingOuter: {
    position: 'absolute',
    width: 84, height: 84,
    borderRadius: 42, borderWidth: 8,
  },
  donutRingProgress: {
    position: 'absolute',
    width: 84, height: 84,
    borderRadius: 42, borderWidth: 8,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
  donutCenterText: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  donutValue: { fontSize: fontSize.lg, fontWeight: '800', lineHeight: 20 },
  donutSub: { fontSize: fontSize.xs, lineHeight: 14 },
  donutStats: { flex: 1, gap: spacing.sm },
  donutStatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  donutDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  donutLabel: { fontSize: fontSize.sm, flex: 1 },
  donutVal: { fontSize: fontSize.sm, fontWeight: '700' },

  smallCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  smallCard: {
    flex: 1, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1,
  },
  smallCardLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: 4 },
  smallCardValue: { fontSize: fontSize.xxl, fontWeight: '800', marginBottom: 2 },
  smallCardSub: { fontSize: fontSize.xs },

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  streakTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  goldBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  goldBadgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  streakDots: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  streakDot: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  streakDotText: { fontSize: fontSize.xs, fontWeight: '700' },
  streakHint: { fontSize: fontSize.xs, marginTop: 4 },

  quickLogRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  quickLogBtn: {
    flex: 1, paddingVertical: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1,
    alignItems: 'center',
  },
  quickLogText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Sleep modal
  sleepModal: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  sleepModalTitle: { fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.md },
  sleepOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sleepOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  sleepOptionText: { fontSize: fontSize.base, fontWeight: '700' },

  moodCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodText: { flex: 1 },
  moodTitle: { fontSize: fontSize.base, fontWeight: '600' },
  moodSub: { fontSize: fontSize.xs, marginTop: 2 },
  moodArrow: { fontSize: fontSize.xl, fontWeight: '700' },

  // Friends ticker
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
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  inviteBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});