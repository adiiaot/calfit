import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── DESIGN STYLES ─────────────────────────────────────────────
const DESIGNS = [
  { id: 'minimal',  label: 'Minimal',  bg: '#FFFFFF', text: '#111111', accent: '#0DAE6C' },
  { id: 'bold',     label: 'Bold',     bg: '#0DAE6C', text: '#FFFFFF', accent: '#FFFFFF' },
  { id: 'gradient', label: 'Gradient', bg: '#0DAE6C', text: '#FFFFFF', accent: '#FFD700' },
  { id: 'dark',     label: 'Dark',     bg: '#111111', text: '#FFFFFF', accent: '#0DAE6C' },
];

// ── RECAP TYPES ───────────────────────────────────────────────
type RecapType = 'daily' | 'weekly' | 'monthly';

interface RecapData {
  caloriesConsumed: number;
  calorieGoal: number;
  waterMl: number;
  waterGoalMl: number;
  workoutsDone: number;
  caloriesBurned: number;
  streakCount: number;
  daysTracked: number;
  foodLogs: number;
  topWorkout: string | null;
  periodLabel: string;
}

// ── RECAP CARD VISUAL ─────────────────────────────────────────
function RecapCard({
  data,
  design,
  recapType,
  userName,
}: {
  data: RecapData;
  design: typeof DESIGNS[0];
  recapType: RecapType;
  userName: string;
}) {
  const isGradient = design.id === 'gradient';

  const waterLitres = (data.waterMl / 1000).toFixed(1);
  const waterGoalLitres = (data.waterGoalMl / 1000).toFixed(1);
  const caloriesPct = data.calorieGoal > 0
    ? Math.round((data.caloriesConsumed / data.calorieGoal) * 100)
    : 0;

  const getMessage = () => {
    if (recapType === 'daily') {
      if (caloriesPct >= 90 && data.workoutsDone > 0) return 'Crushed it today! 💪';
      if (caloriesPct >= 80) return 'Great nutrition day! 🥗';
      if (data.workoutsDone > 0) return 'Workout done! Keep going 🔥';
      return 'Every day counts. Keep going! 🎯';
    }
    if (recapType === 'weekly') {
      if (data.workoutsDone >= 5) return 'Elite week! You showed up 💪';
      if (data.workoutsDone >= 3) return 'Solid week of consistency 🔥';
      return 'Every step counts. Build the habit! 🎯';
    }
    if (data.daysTracked >= 25) return 'Incredible month of consistency 🏆';
    if (data.workoutsDone >= 12) return 'Strong month. Keep building! 💪';
    return 'Progress over perfection! 🎯';
  };

  return (
    <View style={[
      styles.recapCard,
      { backgroundColor: design.bg },
      isGradient && styles.gradientCard,
    ]}>
      {/* CalFit branding */}
      <View style={styles.cardBrand}>
        <View style={[styles.brandDot, { backgroundColor: design.accent }]} />
        <Text style={[styles.brandText, { color: design.accent }]}>
          CalFit
        </Text>
      </View>

      {/* Period label */}
      <Text style={[styles.cardPeriod, { color: design.text + '99' }]}>
        {data.periodLabel}
      </Text>

      {/* Main message */}
      <Text style={[styles.cardMessage, { color: design.text }]}>
        {getMessage()}
      </Text>

      {/* User name */}
      <Text style={[styles.cardUser, { color: design.text + 'BB' }]}>
        {userName}
      </Text>

      {/* Stats grid */}
      <View style={styles.cardStatsGrid}>
        <View style={[styles.cardStat, { borderColor: design.text + '22' }]}>
          <Text style={[styles.cardStatValue, { color: design.accent }]}>
            {data.caloriesConsumed}
          </Text>
          <Text style={[styles.cardStatLabel, { color: design.text + '99' }]}>
            kcal eaten
          </Text>
        </View>

        <View style={[styles.cardStat, { borderColor: design.text + '22' }]}>
          <Text style={[styles.cardStatValue, { color: design.accent }]}>
            {data.caloriesBurned}
          </Text>
          <Text style={[styles.cardStatLabel, { color: design.text + '99' }]}>
            kcal burned
          </Text>
        </View>

        <View style={[styles.cardStat, { borderColor: design.text + '22' }]}>
          <Text style={[styles.cardStatValue, { color: design.accent }]}>
            {data.workoutsDone}
          </Text>
          <Text style={[styles.cardStatLabel, { color: design.text + '99' }]}>
            {recapType === 'daily' ? 'workouts' : 'workouts done'}
          </Text>
        </View>

        <View style={[styles.cardStat, { borderColor: design.text + '22' }]}>
          <Text style={[styles.cardStatValue, { color: design.accent }]}>
            {waterLitres}L
          </Text>
          <Text style={[styles.cardStatLabel, { color: design.text + '99' }]}>
            water
          </Text>
        </View>

        <View style={[styles.cardStat, { borderColor: design.text + '22' }]}>
          <Text style={[styles.cardStatValue, { color: design.accent }]}>
            {data.streakCount}🔥
          </Text>
          <Text style={[styles.cardStatLabel, { color: design.text + '99' }]}>
            day streak
          </Text>
        </View>

        <View style={[styles.cardStat, { borderColor: design.text + '22' }]}>
          <Text style={[styles.cardStatValue, { color: design.accent }]}>
            {recapType === 'daily' ? `${caloriesPct}%` : `${data.daysTracked}d`}
          </Text>
          <Text style={[styles.cardStatLabel, { color: design.text + '99' }]}>
            {recapType === 'daily' ? 'of goal' : 'tracked'}
          </Text>
        </View>
      </View>

      {/* Progress bar — daily only */}
      {recapType === 'daily' && data.calorieGoal > 0 && (
        <View style={styles.cardProgressSection}>
          <View style={[styles.cardProgressBg, { backgroundColor: design.text + '22' }]}>
            <View style={[
              styles.cardProgressFill,
              {
                backgroundColor: design.accent,
                width: `${Math.min(caloriesPct, 100)}%` as any,
              },
            ]} />
          </View>
          <Text style={[styles.cardProgressText, { color: design.text + '99' }]}>
            {data.caloriesConsumed} / {data.calorieGoal} kcal daily goal
          </Text>
        </View>
      )}

      {/* Footer */}
      <Text style={[styles.cardFooter, { color: design.text + '55' }]}>
        Track. Train. Thrive.
      </Text>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function RecapScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [recapType, setRecapType] = useState<RecapType>('daily');
  const [activeDesign, setActiveDesign] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [data, setData] = useState<RecapData>({
    caloriesConsumed: 0,
    calorieGoal: (profile as any)?.daily_calorie_goal ?? 2000,
    waterMl: 0,
    waterGoalMl: 2500,
    workoutsDone: 0,
    caloriesBurned: 0,
    streakCount: (profile as any)?.streak_count ?? 0,
    daysTracked: 0,
    foodLogs: 0,
    topWorkout: null,
    periodLabel: "Today's Recap",
  });

  const userName = profile?.full_name
    ?? user?.email?.split('@')[0]
    ?? 'CalFit User';

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadRecapData(recapType);
    }, [user?.id, recapType])
  );

  const getDaysBack = (type: RecapType) => {
    if (type === 'daily') return 1;
    if (type === 'weekly') return 7;
    return 30;
  };

  const getPeriodLabel = (type: RecapType) => {
    if (type === 'daily') {
      const today = new Date();
      return `${today.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long',
      })} Recap`;
    }
    if (type === 'weekly') return 'Weekly Recap';
    return 'Monthly Recap';
  };

  const loadRecapData = async (type: RecapType) => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const { supabase } = await import('../../services/supabase');
      const daysBack = getDaysBack(type);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysBack);
      const fromISO = fromDate.toISOString();
      const todayStr = new Date().toISOString().split('T')[0];

      const [workoutsRes, foodRes, waterRes] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('name, calories_burned')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', fromISO),

        supabase
          .from('food_logs')
          .select('calories, date')
          .eq('user_id', user.id)
          .gte(type === 'daily' ? 'date' : 'logged_at', type === 'daily' ? todayStr : fromISO),

        supabase
          .from('water_logs')
          .select('amount_ml')
          .eq('user_id', user.id)
          .gte('logged_at', fromISO),
      ]);

      const workouts = workoutsRes.data ?? [];
      const foods = foodRes.data ?? [];
      const waters = waterRes.data ?? [];

      const caloriesConsumed = foods.reduce(
        (sum: number, f: any) => sum + (f.calories ?? 0), 0
      );
      const caloriesBurned = workouts.reduce(
        (sum: number, w: any) => sum + (w.calories_burned ?? 0), 0
      );
      const waterMl = waters.reduce(
        (sum: number, w: any) => sum + (w.amount_ml ?? 0), 0
      );

      // Unique days with food logs
      const foodDates = new Set(foods.map((f: any) => f.date));

      // Top workout this period
      const topWorkout = workouts.length > 0
        ? workouts.reduce((best: any, w: any) =>
            (w.calories_burned ?? 0) > (best.calories_burned ?? 0) ? w : best
          ).name
        : null;

      setData({
        caloriesConsumed: Math.round(caloriesConsumed),
        calorieGoal: (profile as any)?.daily_calorie_goal ?? 2000,
        waterMl,
        waterGoalMl: 2500,
        workoutsDone: workouts.length,
        caloriesBurned: Math.round(caloriesBurned),
        streakCount: (profile as any)?.streak_count ?? 0,
        daysTracked: foodDates.size,
        foodLogs: foods.length,
        topWorkout,
        periodLabel: getPeriodLabel(type),
      });
    } catch (error) {
      console.error('loadRecapData error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const design = DESIGNS[activeDesign];
      const userName2 = profile?.full_name ?? 'A CalFit member';
      const waterLitres = (data.waterMl / 1000).toFixed(1);

      let message = `${data.periodLabel} — ${userName2} on CalFit\n\n`;
      message += `🔥 Streak: ${data.streakCount} days\n`;
      message += `🍽️ Calories: ${data.caloriesConsumed} kcal eaten\n`;
      message += `💧 Water: ${waterLitres}L\n`;
      message += `💪 Workouts: ${data.workoutsDone}\n`;
      message += `🔥 Burned: ${data.caloriesBurned} kcal\n`;
      if (data.topWorkout) message += `⭐ Best workout: ${data.topWorkout}\n`;
      message += `\nTrack yours on CalFit 👉 https://calfit.tech`;

      await Share.share({
        message,
        title: `My CalFit ${data.periodLabel}`,
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('share error:', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const design = DESIGNS[activeDesign];

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>My Recap</Text>
        <TouchableOpacity
          onPress={handleShare}
          disabled={isSharing || isLoading}
          style={[styles.shareHeaderBtn, { backgroundColor: theme.accent }]}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="share-social-outline" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recap type selector */}
        <View style={[styles.typeToggle, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          {(['daily', 'weekly', 'monthly'] as RecapType[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setRecapType(t)}
              style={[styles.typeBtn, recapType === t && {
                backgroundColor: theme.accent,
              }]}
            >
              <Text style={[styles.typeBtnText, {
                color: recapType === t ? theme.bg : theme.textMuted,
                fontWeight: recapType === t ? '700' : '400',
              }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Design style selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.designRow}
        >
          {DESIGNS.map((d, i) => (
            <TouchableOpacity
              key={d.id}
              onPress={() => setActiveDesign(i)}
              style={[styles.designPill, {
                backgroundColor: d.bg,
                borderColor: i === activeDesign ? theme.accent : theme.border,
                borderWidth: i === activeDesign ? 2 : 1,
              }]}
            >
              <Text style={[styles.designPillText, { color: d.text }]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recap card */}
        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={theme.accent} size="large" />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>
              Building your recap...
            </Text>
          </View>
        ) : (
          <RecapCard
            data={data}
            design={design}
            recapType={recapType}
            userName={userName}
          />
        )}

        {/* Share button */}
        <TouchableOpacity
          onPress={handleShare}
          disabled={isSharing || isLoading}
          style={[styles.shareBtn, { backgroundColor: theme.accent }]}
        >
          {isSharing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>
                Share
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Stats breakdown */}
        {!isLoading && (
          <View style={[styles.breakdownCard, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <Text style={[styles.breakdownTitle, { color: theme.textPrimary }]}>
              {data.periodLabel} breakdown
            </Text>

            {[
              {
                icon: 'restaurant-outline',
                label: 'Calories consumed',
                value: `${data.caloriesConsumed} kcal`,
                sub: `Goal: ${data.calorieGoal} kcal`,
                color: theme.accent,
              },
              {
                icon: 'water-outline',
                label: 'Water intake',
                value: `${(data.waterMl / 1000).toFixed(1)}L`,
                sub: `Goal: ${(data.waterGoalMl / 1000).toFixed(1)}L`,
                color: theme.accentSecond,
              },
              {
                icon: 'barbell-outline',
                label: 'Workouts completed',
                value: `${data.workoutsDone}`,
                sub: data.topWorkout ? `Best: ${data.topWorkout}` : 'No workouts yet',
                color: (theme as any).orange,
              },
              {
                icon: 'flame-outline',
                label: 'Calories burned',
                value: `${data.caloriesBurned} kcal`,
                sub: 'From workouts',
                color: (theme as any).orange,
              },
              {
                icon: 'calendar-outline',
                label: 'Days tracked',
                value: `${data.daysTracked}`,
                sub: recapType === 'daily' ? 'Today' : `In this ${recapType}`,
                color: theme.accent,
              },
              {
                icon: 'bonfire-outline',
                label: 'Current streak',
                value: `${data.streakCount} days 🔥`,
                sub: 'Keep it going!',
                color: (theme as any).gold,
              },
            ].map((item) => (
              <View key={item.label} style={[styles.breakdownRow, {
                borderBottomColor: theme.border,
              }]}>
                <View style={[styles.breakdownIcon, {
                  backgroundColor: item.color + '22',
                }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={styles.breakdownInfo}>
                  <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.breakdownValue, { color: theme.textPrimary }]}>
                    {item.value}
                  </Text>
                </View>
                <Text style={[styles.breakdownSub, { color: theme.textMuted }]}>
                  {item.sub}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
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
  pageTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  shareHeaderBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  typeToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  typeBtnText: { fontSize: fontSize.base },

  designRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  designPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  designPillText: { fontSize: fontSize.sm, fontWeight: '600' },

  loadingCard: {
    marginHorizontal: spacing.lg,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: { fontSize: fontSize.base },

  // Recap card
  recapCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  brandDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  brandText: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  cardPeriod: { fontSize: fontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardMessage: { fontSize: fontSize.xxl, fontWeight: '800', lineHeight: 28 },
  cardUser: { fontSize: fontSize.sm, marginBottom: spacing.sm },

  cardStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  cardStat: {
    width: '30.5%',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardStatValue: { fontSize: fontSize.lg, fontWeight: '800' },
  cardStatLabel: { fontSize: 9, marginTop: 2, textAlign: 'center' },

  cardProgressSection: { marginTop: spacing.sm, gap: 4 },
  cardProgressBg: {
    height: 5, borderRadius: 3, overflow: 'hidden',
  },
  cardProgressFill: { height: '100%', borderRadius: 3 },
  cardProgressText: { fontSize: fontSize.xs, textAlign: 'right' },

  cardFooter: { fontSize: 9, marginTop: spacing.sm, textAlign: 'center' },

  // Share button
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '700',
  },

  // Breakdown card
  breakdownCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  breakdownTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  breakdownIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  breakdownInfo: { flex: 1 },
  breakdownLabel: { fontSize: fontSize.xs },
  breakdownValue: { fontSize: fontSize.base, fontWeight: '700', marginTop: 2 },
  breakdownSub: { fontSize: fontSize.xs, textAlign: 'right', flexShrink: 0, maxWidth: 90 },
});