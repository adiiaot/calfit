import { supabase } from '../../../services/supabase';

export type LeaderboardCategory = 'overall' | 'streaks' | 'workouts' | 'referrals';
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
  isCurrentUser: boolean;
}

// ── GLOBAL LEADERBOARD ────────────────────────────────────────
export const getGlobalLeaderboard = async (
  currentUserId: string,
  category: LeaderboardCategory = 'overall'
): Promise<LeaderboardEntry[]> => {
  const orderCol = {
    overall:   'streak_count',
    streaks:   'streak_count',
    workouts:  'total_workouts',
    referrals: 'streak_count',
  }[category];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, calfit_id, avatar_url, goal, streak_count, total_workouts')
    .order(orderCol, { ascending: false })
    .limit(50);

  if (error || !data) return [];

  const entries = data as any[];

  // Fetch referral counts when that category is selected
  let referralMap: Record<string, number> = {};
  if (category === 'referrals') {
    const { data: refs } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('status', 'active');

    if (refs) {
      (refs as any[]).forEach((r) => {
        referralMap[r.referrer_id] = (referralMap[r.referrer_id] ?? 0) + 1;
      });
    }
  }

  const mapped = entries.map((u) => {
    const refCount = referralMap[u.id] ?? 0;
    const totalScore =
      (u.streak_count   ?? 0) * 10 +
      (u.total_workouts ?? 0) * 5  +
      refCount * 20;

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
    mapped.sort((a, b) => b.referral_count  - a.referral_count);
  } else if (category === 'workouts') {
    mapped.sort((a, b) => b.total_workouts  - a.total_workouts);
  } else {
    mapped.sort((a, b) => b.total_score - a.total_score);
  }

  return mapped.map((e, i) => ({ ...e, rank: i + 1 }));
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

  const followingIds = ((followData ?? []) as any[]).map((f) => f.following_id);
  followingIds.push(currentUserId);

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, calfit_id, avatar_url, goal, streak_count, total_workouts')
    .in('id', followingIds)
    .order('streak_count', { ascending: false });

  if (error || !data) return [];

  const entries = (data as any[]).map((u) => ({
    rank: 0,
    user_id:        u.id,
    full_name:      u.full_name      ?? 'CalFit User',
    calfit_id:      u.calfit_id      ?? u.id.slice(0, 8),
    avatar_url:     u.avatar_url     ?? null,
    goal:           u.goal           ?? 'Get Fit',
    streak_count:   u.streak_count   ?? 0,
    total_workouts: u.total_workouts ?? 0,
    referral_count: 0,
    total_score:
      (u.streak_count   ?? 0) * 10 +
      (u.total_workouts ?? 0) * 5,
    isCurrentUser: u.id === currentUserId,
  }));

  if (category === 'workouts') {
    entries.sort((a, b) => b.total_workouts - a.total_workouts);
  } else if (category === 'streaks') {
    entries.sort((a, b) => b.streak_count   - a.streak_count);
  } else {
    entries.sort((a, b) => b.total_score    - a.total_score);
  }

  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
};

// ── UPDATE SCORE ──────────────────────────────────────────────
export const updateMyScore = async (userId: string): Promise<void> => {
  await supabase.rpc('update_leaderboard_score', { uid: userId });
};

// ── GET MY RANK ───────────────────────────────────────────────
export const getMyRank = async (
  userId: string,
  category: LeaderboardCategory = 'overall'
): Promise<number> => {
  const board = await getGlobalLeaderboard(userId, category);
  const me = board.find((e) => e.user_id === userId);
  return me?.rank ?? 0;
};