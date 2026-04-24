import { supabase } from '../../../services/supabase';

// CHANGED: Added 'steps' and 'calorie_consistency' categories per client correction
export type LeaderboardCategory =
  | 'overall'
  | 'streaks'
  | 'workouts'
  | 'referrals'
  | 'steps'
  | 'calorie_consistency';

export type LeaderboardPeriod = 'weekly' | 'alltime';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  calfit_id: string;
  avatar_url: string | null;
  goal: string;
  streak_count: number;
  total_workouts: number;
  referral_count: number;
  total_score: number;
  // New fields for new categories
  step_count?: number;
  calorie_consistency_days?: number;
  isCurrentUser: boolean;
}

// ── OVERALL ACTIVITY SCORE ────────────────────────────────────
// CHANGED: Old formula was streak×10 + workout×5 + referral×20
// New formula tracks ALL app activity — fair for non-gym users:
//   streak_count      × 10  (shows up consistently)
//   food_log_days     × 4   (meal logging activity)
//   water_log_days    × 3   (water logging)
//   fasting_sessions  × 5   (intermittent fasting)
//   referral_count    × 20  (bringing people in)
//   step_goal_hits    × 4   (step-based users)
// Workouts still count but via food/step activity instead of raw count
const computeActivityScore = (u: {
  streak_count: number;
  food_log_days: number;
  water_log_days: number;
  fasting_sessions: number;
  referral_count: number;
  step_goal_hits: number;
}): number =>
  (u.streak_count      ?? 0) * 10 +
  (u.food_log_days     ?? 0) * 4  +
  (u.water_log_days    ?? 0) * 3  +
  (u.fasting_sessions  ?? 0) * 5  +
  (u.referral_count    ?? 0) * 20 +
  (u.step_goal_hits    ?? 0) * 4;

// ── GLOBAL LEADERBOARD ────────────────────────────────────────
export const getGlobalLeaderboard = async (
  currentUserId: string,
  category: LeaderboardCategory = 'overall'
): Promise<LeaderboardEntry[]> => {

  // Calorie consistency is a special query — handled separately
  if (category === 'calorie_consistency') {
    return getCalorieConsistencyLeaderboard(currentUserId);
  }

  // Steps category — order by step_count column if it exists, else fallback
  if (category === 'steps') {
    return getStepsLeaderboard(currentUserId);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, calfit_id, avatar_url, goal, streak_count, total_workouts')
    .order('streak_count', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  const entries = data as any[];

  // Fetch referral counts
  let referralMap: Record<string, number> = {};
  const { data: refs } = await supabase
    .from('referrals')
    .select('referrer_id')
    .eq('status', 'active');
  if (refs) {
    (refs as any[]).forEach((r) => {
      referralMap[r.referrer_id] = (referralMap[r.referrer_id] ?? 0) + 1;
    });
  }

  // Fetch 30-day food log activity counts per user (activity score input)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  // Get food log day counts grouped by user
  const { data: foodLogs } = await supabase
    .from('food_logs')
    .select('user_id, logged_at')
    .gte('logged_at', since);

  const foodLogDayMap: Record<string, Set<string>> = {};
  ((foodLogs ?? []) as any[]).forEach((fl) => {
    const day = fl.logged_at?.slice(0, 10);
    if (!foodLogDayMap[fl.user_id]) foodLogDayMap[fl.user_id] = new Set();
    if (day) foodLogDayMap[fl.user_id].add(day);
  });

  // Get water log day counts
  const { data: waterLogs } = await supabase
    .from('water_logs')
    .select('user_id, logged_at')
    .gte('logged_at', since);

  const waterLogDayMap: Record<string, Set<string>> = {};
  ((waterLogs ?? []) as any[]).forEach((wl) => {
    const day = wl.logged_at?.slice(0, 10);
    if (!waterLogDayMap[wl.user_id]) waterLogDayMap[wl.user_id] = new Set();
    if (day) waterLogDayMap[wl.user_id].add(day);
  });

  // Get fasting sessions
  const { data: fastingSessions } = await supabase
    .from('fasting_logs')
    .select('user_id')
    .eq('status', 'completed')
    .gte('created_at', since);

  const fastingMap: Record<string, number> = {};
  ((fastingSessions ?? []) as any[]).forEach((f) => {
    fastingMap[f.user_id] = (fastingMap[f.user_id] ?? 0) + 1;
  });

  const mapped = entries.map((u) => {
    const refCount      = referralMap[u.id] ?? 0;
    const foodLogDays   = foodLogDayMap[u.id]?.size ?? 0;
    const waterLogDays  = waterLogDayMap[u.id]?.size ?? 0;
    const fastingSess   = fastingMap[u.id] ?? 0;

    const totalScore = computeActivityScore({
      streak_count:     u.streak_count   ?? 0,
      food_log_days:    foodLogDays,
      water_log_days:   waterLogDays,
      fasting_sessions: fastingSess,
      referral_count:   refCount,
      step_goal_hits:   0, // step hits not tracked per-user in profiles yet
    });

    return {
      rank: 0,
      user_id:        u.id,
      full_name:      u.full_name   ?? 'CalFit User',
      calfit_id:      u.calfit_id   ?? u.id.slice(0, 8),
      avatar_url:     u.avatar_url  ?? null,
      goal:           u.goal        ?? 'Get Fit',
      streak_count:   u.streak_count   ?? 0,
      total_workouts: u.total_workouts ?? 0,
      referral_count: refCount,
      total_score:    totalScore,
      isCurrentUser:  u.id === currentUserId,
    };
  });

  // Sort by selected category
  if (category === 'referrals') {
    mapped.sort((a, b) => b.referral_count - a.referral_count);
  } else if (category === 'workouts') {
    mapped.sort((a, b) => b.total_workouts - a.total_workouts);
  } else if (category === 'streaks') {
    mapped.sort((a, b) => b.streak_count - a.streak_count);
  } else {
    // overall — sort by full activity score
    mapped.sort((a, b) => b.total_score - a.total_score);
  }

  return mapped.map((e, i) => ({ ...e, rank: i + 1 }));
};

// ── STEPS LEADERBOARD ─────────────────────────────────────────
const getStepsLeaderboard = async (currentUserId: string): Promise<LeaderboardEntry[]> => {
  // Sum steps from step_logs over last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  const { data: stepData } = await supabase
    .from('step_logs')
    .select('user_id, steps')
    .gte('logged_at', since);

  const stepMap: Record<string, number> = {};
  ((stepData ?? []) as any[]).forEach((s) => {
    stepMap[s.user_id] = (stepMap[s.user_id] ?? 0) + (s.steps ?? 0);
  });

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, calfit_id, avatar_url, goal, streak_count, total_workouts')
    .limit(50);

  if (!profiles) return [];

  const mapped = (profiles as any[]).map((u) => ({
    rank: 0,
    user_id:        u.id,
    full_name:      u.full_name  ?? 'CalFit User',
    calfit_id:      u.calfit_id  ?? u.id.slice(0, 8),
    avatar_url:     u.avatar_url ?? null,
    goal:           u.goal       ?? 'Get Fit',
    streak_count:   u.streak_count   ?? 0,
    total_workouts: u.total_workouts ?? 0,
    referral_count: 0,
    total_score:    stepMap[u.id] ?? 0,
    step_count:     stepMap[u.id] ?? 0,
    isCurrentUser:  u.id === currentUserId,
  }));

  mapped.sort((a, b) => b.total_score - a.total_score);
  return mapped.map((e, i) => ({ ...e, rank: i + 1 }));
};

// ── CALORIE CONSISTENCY LEADERBOARD ──────────────────────────
// CHANGED: Top 10 most consistent calorie goal hitters — no numbers shown (per client)
// Ranks by number of days in last 30 that user hit their calorie goal (within 100kcal)
const getCalorieConsistencyLeaderboard = async (currentUserId: string): Promise<LeaderboardEntry[]> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  // Get food logs with daily totals per user
  const { data: foodLogs } = await supabase
    .from('food_logs')
    .select('user_id, calories, logged_at')
    .gte('logged_at', since);

  // Get calorie goals per user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, calfit_id, avatar_url, goal, streak_count, total_workouts, daily_calorie_goal')
    .limit(100);

  if (!profiles) return [];

  const goalMap: Record<string, number> = {};
  (profiles as any[]).forEach((p) => {
    goalMap[p.id] = p.daily_calorie_goal ?? 2000;
  });

  // Sum calories per user per day
  const dailyTotals: Record<string, Record<string, number>> = {};
  ((foodLogs ?? []) as any[]).forEach((fl) => {
    const day = fl.logged_at?.slice(0, 10);
    if (!day) return;
    if (!dailyTotals[fl.user_id]) dailyTotals[fl.user_id] = {};
    dailyTotals[fl.user_id][day] = (dailyTotals[fl.user_id][day] ?? 0) + (fl.calories ?? 0);
  });

  // Count days where user hit goal within ±100 kcal
  const consistencyMap: Record<string, number> = {};
  Object.entries(dailyTotals).forEach(([userId, dayMap]) => {
    const goal = goalMap[userId] ?? 2000;
    let hitDays = 0;
    Object.values(dayMap).forEach((cal) => {
      if (Math.abs(cal - goal) <= 100) hitDays++;
    });
    consistencyMap[userId] = hitDays;
  });

  const mapped = (profiles as any[]).map((u) => ({
    rank: 0,
    user_id:                  u.id,
    full_name:                u.full_name  ?? 'CalFit User',
    calfit_id:                u.calfit_id  ?? u.id.slice(0, 8),
    avatar_url:               u.avatar_url ?? null,
    goal:                     u.goal       ?? 'Get Fit',
    streak_count:             u.streak_count   ?? 0,
    total_workouts:           u.total_workouts ?? 0,
    referral_count:           0,
    total_score:              consistencyMap[u.id] ?? 0,
    calorie_consistency_days: consistencyMap[u.id] ?? 0,
    isCurrentUser:            u.id === currentUserId,
  }));

  // Sort by consistency days, top 10 only
  mapped.sort((a, b) => b.total_score - a.total_score);
  return mapped.slice(0, 10).map((e, i) => ({ ...e, rank: i + 1 }));
};

// ── FRIENDS LEADERBOARD ───────────────────────────────────────
export const getFriendsLeaderboard = async (
  currentUserId: string,
  category: LeaderboardCategory = 'overall'
): Promise<LeaderboardEntry[]> => {
  const { data: followData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId);

  const followingIds = (((followData ?? []) as any[]).map((f) => f.following_id));
  if (followingIds.length === 0) return [];

  // Include self
  const ids = [...followingIds, currentUserId];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, calfit_id, avatar_url, goal, streak_count, total_workouts')
    .in('id', ids);

  if (error || !data) return [];

  const mapped = (data as any[]).map((u) => ({
    rank: 0,
    user_id:        u.id,
    full_name:      u.full_name  ?? 'CalFit User',
    calfit_id:      u.calfit_id  ?? u.id.slice(0, 8),
    avatar_url:     u.avatar_url ?? null,
    goal:           u.goal       ?? 'Get Fit',
    streak_count:   u.streak_count   ?? 0,
    total_workouts: u.total_workouts ?? 0,
    referral_count: 0,
    total_score:    (u.streak_count ?? 0) * 10 + (u.total_workouts ?? 0) * 5,
    isCurrentUser:  u.id === currentUserId,
  }));

  if (category === 'workouts') {
    mapped.sort((a, b) => b.total_workouts - a.total_workouts);
  } else if (category === 'streaks') {
    mapped.sort((a, b) => b.streak_count - a.streak_count);
  } else {
    mapped.sort((a, b) => b.total_score - a.total_score);
  }

  return mapped.map((e, i) => ({ ...e, rank: i + 1 }));
};