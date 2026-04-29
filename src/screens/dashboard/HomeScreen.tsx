import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, dayRingColors, spacing, radius, fontSize } from '../../theme';
import Avatar from '../../components/Avatar';
import FoodIllustration from '../../components/FoodIllustration';
import { getTodayCalories, getTodayWater, logWater } from '../../services/profileService';
import { useSteps } from '../../hooks/useSteps';
import { supabase } from '../../services/supabase';

// ── NEW: Comeback Banner ──────────────────────────────────────
import { ComebackBanner } from '../../components/ComebackBanner';

const { width: SCREEN_W } = Dimensions.get('window');
const SLIDE_GAP = 12;
const SLIDE_W = SCREEN_W - spacing.lg * 2;

// ── STREAK ROW — fixed at top, not in carousel ────────────────
function StreakRow({ theme, streakCount }: {
  theme: typeof colors.light; streakCount: number;
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
      <View style={styles.streakTopRow}>
        <Text style={[styles.streakCardLabel, { color: theme.textPrimary }]}>This Week</Text>
        <View style={[styles.streakPill, { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: theme.gradMid }]}>
          <Text style={styles.streakPillEmoji}>🔥</Text>
          <Text style={[styles.streakPillCount, { color: theme.gradMid }]}>{streakCount}</Text>
        </View>
      </View>
      <View style={styles.streakDaysRow}>
        {days.map(({ label, date, dow }) => {
          const isToday  = dow === todayDow;
          const isFuture = dow > todayDow;
          const ringColor = dayRingColors[dow];
          return (
            <View key={dow} style={styles.streakDayCol}>
              <Text style={[styles.streakDayName, {
                color: isToday ? ringColor : theme.textMuted,
                fontWeight: isToday ? '700' : '500',
              }]}>{label}</Text>
              <View style={[styles.streakCircle, {
                backgroundColor: isToday ? ringColor : 'transparent',
                borderColor: isFuture ? theme.border : ringColor,
              }]}>
                <Text style={[styles.streakDateNum, {
                  color: isToday ? '#fff' : isFuture ? theme.textMuted : ringColor,
                  fontWeight: isToday ? '800' : '600',
                }]}>{date}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

// ── SLIDE 1 — CALORIES ────────────────────────────────────────
function CalorieSlide({ theme, consumed, goal }: {
  theme: typeof colors.light; consumed: number; goal: number;
}) {
  const navigation = useNavigation<any>();
  const remaining = Math.max(goal - consumed, 0);
  const pct = Math.min(consumed / goal, 1);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Main', { screen: 'Calorie' })}
      activeOpacity={0.92}
      style={[styles.slide, { backgroundColor: theme.heroCard, width: SLIDE_W }]}
    >
      {/* Food illustration */}
      <View style={styles.foodIllustrationWrap}>
        <FoodIllustration size={210} />
      </View>
      <Text style={styles.slideChip}>🔥 Calories Today</Text>
      <Text style={styles.calorieBig}>{consumed.toLocaleString()}</Text>
      <Text style={styles.calorieSubLabel}>kcal consumed</Text>
      <View style={styles.progressBg}>
        <LinearGradient
          colors={[theme.gradStart, theme.gradMid] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.max(pct * 100, 2)}%` as any }]}
        />
      </View>
      <View style={styles.calorieFootRow}>
        <Text style={styles.calorieRemaining}>
          {remaining > 0 ? `${remaining.toLocaleString()} kcal remaining` : 'Goal reached 🎉'}
        </Text>
        <Text style={styles.calorieGoalText}>Goal: {goal.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── SLIDE 2 — MACROS ──────────────────────────────────────────
function MacrosSlide({ theme, consumed, goal }: {
  theme: typeof colors.light; consumed: number; goal: number;
}) {
  // Estimated macro splits from calories
  const protein = Math.round((consumed * 0.30) / 4);
  const carbs   = Math.round((consumed * 0.45) / 4);
  const fat     = Math.round((consumed * 0.25) / 9);

  const goalProtein = Math.round((goal * 0.30) / 4);
  const goalCarbs   = Math.round((goal * 0.45) / 4);
  const goalFat     = Math.round((goal * 0.25) / 9);

  const macros = [
    { label: 'Protein', val: protein, goalVal: goalProtein, unit: 'g', color: '#FF6B35', icon: 'barbell-outline' as const },
    { label: 'Carbs',   val: carbs,   goalVal: goalCarbs,   unit: 'g', color: '#FFB830', icon: 'leaf-outline' as const },
    { label: 'Fat',     val: fat,     goalVal: goalFat,     unit: 'g', color: '#4A90E2', icon: 'water-outline' as const },
  ];

  return (
    <View style={[styles.slide, { backgroundColor: theme.heroCard, width: SLIDE_W, paddingVertical: spacing.lg }]}>
      <Text style={styles.slideChip}>📊 Macros Today</Text>
      <View style={styles.macroGrid}>
        {macros.map((m) => {
          const pct = Math.min(m.val / m.goalVal, 1);
          return (
            <View key={m.label} style={styles.macroItem}>
              <View style={[styles.macroIconWrap, { backgroundColor: m.color + '25' }]}>
                <Ionicons name={m.icon} size={16} color={m.color} />
              </View>
              <Text style={styles.macroVal}>{m.val}<Text style={styles.macroUnit}>{m.unit}</Text></Text>
              <Text style={styles.macroLabel}>{m.label}</Text>
              <View style={[styles.macroBarBg, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <View style={[styles.macroBarFill, { width: `${pct * 100}%` as any, backgroundColor: m.color }]} />
              </View>
              <Text style={[styles.macroGoalText, { color: m.color }]}>of {m.goalVal}g</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── SLIDE 3 — WATER + STEPS + SLEEP ──────────────────────────
function StatsSlide({ theme, waterMl, waterGoalMl, liveSteps, stepGoal, sleepHrs }: {
  theme: typeof colors.light;
  waterMl: number; waterGoalMl: number;
  liveSteps: number; stepGoal: number; sleepHrs: number;
}) {
  const navigation = useNavigation<any>();
  const waterPct = Math.min(waterMl / waterGoalMl, 1);
  const stepsPct = Math.min(liveSteps / stepGoal, 1);
  const sleepPct = Math.min(sleepHrs / 8, 1);

  const rows = [
    {
      label: 'Water', icon: 'water-outline' as const, color: '#2BBCB0',
      value: waterMl > 0 ? `${(waterMl / 1000).toFixed(1)}L` : '—',
      sub: `/ ${(waterGoalMl / 1000).toFixed(1)}L`, pct: waterPct,
      gradColors: ['#2BBCB0', '#4A90E2'] as [string, string],
      onPress: () => navigation.navigate('Main', { screen: 'Calorie' }),
    },
    {
      label: 'Steps', icon: 'footsteps-outline' as const, color: theme.accent,
      value: liveSteps > 0 ? liveSteps.toLocaleString() : '—',
      sub: `/ ${stepGoal >= 1000 ? `${stepGoal / 1000}k` : stepGoal}`, pct: stepsPct,
      gradColors: [theme.accent, '#0A9A5E'] as [string, string],
      onPress: () => navigation.navigate('Main', { screen: 'Activity' }),
    },
    {
      label: 'Sleep', icon: 'moon-outline' as const, color: theme.purple,
      value: sleepHrs > 0 ? `${sleepHrs}h` : '—',
      sub: '/ 8h', pct: sleepPct,
      gradColors: [theme.purple, '#7B3FE4'] as [string, string],
      onPress: () => navigation.getParent()?.navigate('Sleep'),
    },
  ];

  return (
    <View style={[styles.slide, { backgroundColor: theme.heroCard, width: SLIDE_W, paddingVertical: spacing.lg }]}>
      <Text style={styles.slideChip}>💧 Today's Stats</Text>
      {rows.map((r, i) => (
        <TouchableOpacity key={r.label} onPress={r.onPress} activeOpacity={0.75}>
          <View style={styles.statRow}>
            <View style={[styles.statIconCircle, { backgroundColor: r.color + '30' }]}>
              <Ionicons name={r.icon} size={16} color={r.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.statLabelRow}>
                <Text style={styles.statLabel}>{r.label}</Text>
                <Text style={[styles.statValue, { color: r.color }]}>
                  {r.value} <Text style={styles.statSub}>{r.sub}</Text>
                </Text>
              </View>
              <View style={[styles.statBarBg, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <LinearGradient colors={r.gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.statBarFill, { width: `${Math.max(r.pct * 100, r.pct > 0 ? 4 : 0)}%` as any }]} />
              </View>
            </View>
          </View>
          {i < rows.length - 1 && <View style={styles.statDivider} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── HERO CAROUSEL ─────────────────────────────────────────────
function HeroCarousel({ theme, consumed, goal, waterMl, waterGoalMl, liveSteps, stepGoal, sleepHrs }: {
  theme: typeof colors.light;
  consumed: number; goal: number;
  waterMl: number; waterGoalMl: number;
  liveSteps: number; stepGoal: number; sleepHrs: number;
}) {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SLIDES = ['calories', 'macros', 'stats'];

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % SLIDES.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 10000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleMomentumEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (SLIDE_W + SLIDE_GAP));
    setActiveIndex(index);
    startTimer();
  };

  const renderSlide = ({ item }: { item: string }) => {
    if (item === 'calories') return <CalorieSlide theme={theme} consumed={consumed} goal={goal} />;
    if (item === 'macros')   return <MacrosSlide  theme={theme} consumed={consumed} goal={goal} />;
    return <StatsSlide theme={theme} waterMl={waterMl} waterGoalMl={waterGoalMl} liveSteps={liveSteps} stepGoal={stepGoal} sleepHrs={sleepHrs} />;
  };

  return (
    <View style={styles.carouselWrap}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item}
        renderItem={renderSlide}
        horizontal
        pagingEnabled={false}
        snapToInterval={SLIDE_W + SLIDE_GAP}
        snapToAlignment="start"
        decelerationRate={0.92}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: SLIDE_GAP }}
        getItemLayout={(_, index) => ({ length: SLIDE_W + SLIDE_GAP, offset: (SLIDE_W + SLIDE_GAP) * index, index })}
      />
      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => {
            flatListRef.current?.scrollToIndex({ index: i, animated: true });
            setActiveIndex(i);
            startTimer();
          }}>
            <View style={[styles.dot, {
              backgroundColor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.30)',
              width: i === activeIndex ? 22 : 7,
            }]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── STAT CARDS — static below carousel ───────────────────────
function StatCards({ theme, waterMl, waterGoalMl, liveSteps, stepGoal, sleepHrs }: {
  theme: typeof colors.light;
  waterMl: number; waterGoalMl: number;
  liveSteps: number; stepGoal: number; sleepHrs: number;
}) {
  const navigation = useNavigation<any>();
  const waterL = (waterMl / 1000).toFixed(1);
  const waterGoalL = (waterGoalMl / 1000).toFixed(1);
  const stepGoalFormatted = stepGoal >= 1000 ? `${(stepGoal / 1000).toFixed(0)}k` : `${stepGoal}`;

  const stats = [
    { label: 'Water', value: waterMl > 0 ? `${waterL}L` : '—', sub: waterMl > 0 ? `of ${waterGoalL}L` : 'not logged', color: '#2BBCB0', cardBg: theme.waterCard, pct: waterMl > 0 ? Math.min(waterMl / waterGoalMl, 1) : 0, icon: 'water-outline' as const, onPress: () => navigation.navigate('Main', { screen: 'Calorie' }) },
    { label: 'Steps', value: liveSteps > 0 ? liveSteps.toLocaleString() : '—', sub: liveSteps > 0 ? `of ${stepGoalFormatted}` : 'tracking...', color: theme.accent, cardBg: theme.stepsCard, pct: liveSteps > 0 ? Math.min(liveSteps / stepGoal, 1) : 0, icon: 'footsteps-outline' as const, onPress: () => navigation.navigate('Main', { screen: 'Activity' }) },
    { label: 'Sleep', value: sleepHrs > 0 ? `${sleepHrs}h` : '—', sub: sleepHrs > 0 ? 'of 8h' : 'not logged', color: theme.purple, cardBg: theme.sleepCard, pct: sleepHrs > 0 ? Math.min(sleepHrs / 8, 1) : 0, icon: 'moon-outline' as const, onPress: () => navigation.getParent()?.navigate('Sleep') },
  ];

  return (
    <View style={styles.smallCardsRow}>
      {stats.map((s) => (
        <TouchableOpacity key={s.label} onPress={s.onPress}
          style={[styles.smallCard, { backgroundColor: s.cardBg }]} activeOpacity={0.8}>
          <Ionicons name={s.icon} size={20} color={s.color} style={{ marginBottom: 6 }} />
          <Text style={[styles.smallCardValue, { color: s.color }]}>{s.value}</Text>
          <View style={[styles.smallCardBar, { backgroundColor: 'rgba(0,0,0,0.10)' }]}>
            {s.pct > 0 && <View style={[styles.smallCardBarFill, { backgroundColor: s.color, width: `${s.pct * 100}%` as any }]} />}
          </View>
          <Text style={[styles.smallCardLabel, { color: s.color, opacity: 0.85 }]}>{s.label}</Text>
          <Text style={[styles.smallCardSub, { color: s.color, opacity: 0.60 }]}>{s.sub}</Text>
          <View style={[styles.statArrow, { backgroundColor: s.color }]}>
            <Ionicons name="arrow-forward" size={10} color="#fff" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── SCANNER SHORTCUT ──────────────────────────────────────────
function ScannerShortcut({ theme }: { theme: typeof colors.light }) {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity onPress={() => navigation.getParent()?.navigate('FoodScanner')} activeOpacity={0.85} style={styles.scannerCardWrapper}>
      <LinearGradient colors={[theme.gradStart, theme.gradMid] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scannerCard}>
        <View style={styles.scannerLeft}>
          <View style={styles.scannerIconCircle}><Ionicons name="camera" size={22} color={theme.gradStart} /></View>
          <View>
            <Text style={styles.scannerTitle}>Scan Food</Text>
            <Text style={styles.scannerSub}>Point camera at any food to log instantly</Text>
          </View>
        </View>
        <View style={styles.scannerArrowCircle}><Ionicons name="chevron-forward" size={18} color={theme.gradStart} /></View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── COACH CARD ────────────────────────────────────────────────
function CoachCard({ theme }: { theme: typeof colors.light }) {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Coach')}
      style={[styles.coachCard, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.8}>
      <View style={styles.coachLeft}>
        <View style={[styles.coachIcon, { backgroundColor: theme.accentDim as string }]}>
          <Ionicons name="chatbubble-ellipses" size={22} color={theme.accent} />
        </View>
        <View style={styles.coachText}>
          <Text style={[styles.coachTitle, { color: theme.textPrimary }]}>CalFit Coach</Text>
          <Text style={[styles.coachSub, { color: theme.textSecondary }]}>How are you feeling today? Tap to chat</Text>
        </View>
      </View>
      <View style={[styles.coachChevron, { backgroundColor: theme.accent }]}>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

// ── QUICK LOG ─────────────────────────────────────────────────
function QuickLog({ theme, onWaterLog, onSleepLog }: {
  theme: typeof colors.light; onWaterLog: () => void; onSleepLog: () => void;
}) {
  const navigation = useNavigation<any>();
  const actions = [
    { label: '+ Food',  icon: 'restaurant-outline' as const, color: theme.accent,  onPress: () => navigation.navigate('Main', { screen: 'Calorie' }) },
    { label: '+ Water', icon: 'water-outline' as const,      color: '#2BBCB0',     onPress: onWaterLog },
    { label: '+ Sleep', icon: 'moon-outline' as const,       color: theme.purple,  onPress: onSleepLog },
    { label: 'Workout', icon: 'barbell-outline' as const,    color: theme.gradMid, onPress: () => navigation.navigate('Main', { screen: 'Activity' }) },
  ];
  return (
    <View style={styles.quickLogRow}>
      {actions.map((a) => (
        <TouchableOpacity key={a.label} onPress={a.onPress}
          style={[styles.quickLogBtn, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.8}>
          <Ionicons name={a.icon} size={16} color={a.color} />
          <Text style={[styles.quickLogText, { color: a.color }]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── QUICK NAV ─────────────────────────────────────────────────
function QuickNav({ theme }: { theme: typeof colors.light }) {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.quickNav}>
      {[
        { label: 'Leaderboard', icon: 'trophy-outline' as const,   route: 'Leaderboard' },
        { label: 'Partners',    icon: 'people-outline' as const,    route: 'Accountability' },
        { label: 'Community',   icon: 'megaphone-outline' as const, route: 'Community' },
      ].map((item) => (
        <TouchableOpacity key={item.route}
          onPress={() => navigation.getParent()?.navigate(item.route as never)}
          style={[styles.quickNavBtn, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.8}>
          <Ionicons name={item.icon} size={20} color={theme.accent} />
          <Text style={[styles.quickNavLabel, { color: theme.textSecondary }]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── FRIENDS TICKER ────────────────────────────────────────────
function FriendsTicker({ theme }: { theme: typeof colors.light }) {
  const navigation = useNavigation<any>();
  const hasFriends = false;
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginHorizontal: spacing.lg }]}>
      <View style={styles.tickerHeader}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Friends Activity</Text>
        <View style={styles.liveBadge}>
          <View style={[styles.liveDot, { backgroundColor: hasFriends ? theme.accent : theme.border }]} />
          <Text style={[styles.liveText, { color: hasFriends ? theme.accent : theme.textMuted }]}>LIVE</Text>
        </View>
      </View>
      {!hasFriends && (
        <>
          <Text style={[styles.emptyFriendsText, { color: theme.textPrimary }]}>No friends activity yet.</Text>
          <Text style={[styles.emptyFriendsSub, { color: theme.textSecondary }]}>Invite friends to join CalFit and see their activity here in real time.</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Credits')}
            style={[styles.inviteBtn, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
            <Ionicons name="mail-outline" size={16} color={theme.accent} />
            <Text style={[styles.inviteBtnText, { color: theme.accent }]}>Copy Invite Link</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
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
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useFocusEffect(useCallback(() => { loadData(); }, [user?.id]));

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const [cal, water, sleepRes, notifRes] = await Promise.all([
        getTodayCalories(user.id),
        getTodayWater(user.id),
        supabase.from('sleep_logs').select('hours').eq('user_id', user.id)
          .eq('date', new Date().toISOString().split('T')[0]).maybeSingle(),
        supabase.from('notifications').select('id', { count: 'exact' })
          .eq('user_id', user.id).eq('read', false),
      ]);
      setCaloriesConsumed(cal);
      setWaterMl(water);
      setSleepHrs(sleepRes.data?.hours ?? 0);
      setUnreadCount(notifRes.count ?? 0);
    } catch (e) { console.error('HomeScreen loadData error:', e); }
    finally { setIsRefreshing(false); }
  };

  const handleWaterLog = async () => {
    if (!user?.id) return;
    const success = await logWater(user.id, 250);
    if (success) setWaterMl((prev) => prev + 250);
  };

  const onRefresh = () => { setIsRefreshing(true); loadData(); };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting} 👋</Text>
          <Text style={[styles.name, { color: theme.textPrimary }]}>{firstName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('Notifications')}
            style={[styles.headerIconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
      >
        {/* ── COMEBACK BANNER — only shows if inactive 2+ days ── */}
        {user?.id && <ComebackBanner userId={user.id} theme={theme} />}

        {/* 1. Streak — fixed, always visible */}
        <StreakRow theme={theme} streakCount={streakCount} />

        {/* 2. Carousel — slides: Calories → Macros → Water/Steps/Sleep */}
        <HeroCarousel
          theme={theme}
          consumed={caloriesConsumed} goal={calorieGoal}
          waterMl={waterMl} waterGoalMl={waterGoalMl}
          liveSteps={liveSteps} stepGoal={stepGoal} sleepHrs={sleepHrs}
        />

        {/* 3. Stat cards — static quick-glance below carousel */}
        <StatCards
          theme={theme} waterMl={waterMl} waterGoalMl={waterGoalMl}
          liveSteps={liveSteps} stepGoal={stepGoal} sleepHrs={sleepHrs}
        />

        <ScannerShortcut theme={theme} />
        <CoachCard theme={theme} />

        <View style={styles.sectionPad}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Quick Log</Text>
          <QuickLog theme={theme} onWaterLog={handleWaterLog} onSleepLog={() => navigation.getParent()?.navigate('Sleep')} />
        </View>

        <QuickNav theme={theme} />
        <FriendsTicker theme={theme} />
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5 },
  greeting: { fontSize: fontSize.sm, fontWeight: '500' },
  name: { fontSize: fontSize.xxl + 2, fontWeight: '800', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, position: 'relative' },
  badge: { position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 8, color: '#fff', fontWeight: '700' },
  scrollContent: { paddingBottom: 120 },
  sectionPad: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── STREAK ──
  streakCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, paddingBottom: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  streakTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  streakCardLabel: { fontSize: fontSize.base, fontWeight: '700' },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1 },
  streakPillEmoji: { fontSize: 14 },
  streakPillCount: { fontSize: fontSize.base, fontWeight: '800' },
  streakDaysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  streakDayCol: { alignItems: 'center', gap: 5 },
  streakDayName: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  streakCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  streakDateNum: { fontSize: 13 },

  // ── CAROUSEL ──
  carouselWrap: { marginBottom: spacing.md },
  slide: { borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden', minHeight: 175 },
  foodIllustrationWrap: { position: 'absolute', right: -40, top: -20, opacity: 0.85 },
  slideChip: { fontSize: fontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.55)', marginBottom: 6, letterSpacing: 0.5 },

  // Calorie slide
  calorieBig: { fontSize: 52, fontWeight: '900', color: '#fff', lineHeight: 56 },
  calorieSubLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.55)', marginBottom: spacing.md },
  progressBg: { height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)' },
  progressFill: { height: '100%', borderRadius: 4 },
  calorieFootRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  calorieRemaining: { fontSize: fontSize.sm, color: '#F0427C', fontWeight: '600' },
  calorieGoalText: { fontSize: 14, color: 'rgb(255, 255, 255)' },

  // Macros slide
  macroGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.sm },
  macroItem: { flex: 1, alignItems: 'center', gap: 4 },
  macroIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  macroVal: { fontSize: 22, fontWeight: '900', color: '#fff' },
  macroUnit: { fontSize: fontSize.xs, fontWeight: '600', color: 'rgba(255,255,255,0.60)' },
  macroLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  macroBarBg: { height: 4, borderRadius: 2, width: '100%', overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 2 },
  macroGoalText: { fontSize: 10, fontWeight: '600' },

  // Stats slide
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statIconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  statLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.60)', fontWeight: '600' },
  statValue: { fontSize: fontSize.base, fontWeight: '800' },
  statSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.40)', fontWeight: '400' },
  statBarBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: 3 },
  statDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: spacing.sm },

  // Dots
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  dot: { height: 7, borderRadius: 3.5 },

  // ── STAT CARDS (static) ──
  smallCardsRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  smallCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', overflow: 'hidden' },
  smallCardValue: { fontSize: fontSize.xl, fontWeight: '800', marginBottom: 6 },
  smallCardBar: { height: 4, borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 4 },
  smallCardBarFill: { height: '100%', borderRadius: 2 },
  smallCardLabel: { fontSize: 10, fontWeight: '700' },
  smallCardSub: { fontSize: 9, marginTop: 1 },
  statArrow: { position: 'absolute', bottom: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  // ── SCANNER ──
  scannerCardWrapper: { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: radius.lg, overflow: 'hidden' },
  scannerCard: { padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  scannerIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  scannerTitle: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  scannerSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.80)', marginTop: 2 },
  scannerArrowCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  // ── COACH ──
  coachCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coachLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  coachIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  coachText: { flex: 1 },
  coachTitle: { fontSize: fontSize.base, fontWeight: '700' },
  coachSub: { fontSize: fontSize.xs, marginTop: 2 },
  coachChevron: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // ── QUICK LOG ──
  quickLogRow: { flexDirection: 'row', gap: spacing.sm },
  quickLogBtn: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', gap: 4 },
  quickLogText: { fontSize: fontSize.xs, fontWeight: '700' },

  // ── QUICK NAV ──
  quickNav: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  quickNavBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  quickNavLabel: { fontSize: fontSize.xs, fontWeight: '600' },

  // ── FRIENDS ──
  card: { marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  cardLabel: { fontSize: fontSize.sm, fontWeight: '600' },
  tickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: fontSize.xs, fontWeight: '700' },
  emptyFriendsText: { fontSize: fontSize.base, fontWeight: '600', marginBottom: 4 },
  emptyFriendsSub: { fontSize: fontSize.sm, lineHeight: 18, marginBottom: spacing.md },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.lg, borderWidth: 1, alignSelf: 'stretch' },
  inviteBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});