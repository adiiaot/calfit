import { supabase } from '../../../services/supabase';

export interface ChallengeEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  participants: number;
  days_left: number;
  reward: string;
  emoji: string;
  joined: boolean;
}

// ── AUTO-GENERATED CHALLENGES ─────────────────────────────────
// Participants start at 0 — real counts come from challenge_joins table
export const AUTO_CHALLENGES: Omit<ChallengeEntry, 'joined'>[] = [
  {
    id: 'ch_steps_30',
    title: '30-Day Step Challenge',
    description: 'Walk 8,000 steps every day for 30 days. Tracked automatically with CalFit.',
    category: 'Steps',
    participants: 0,
    days_left: 30,
    reward: '500 CalFit Points + Badge',
    emoji: '👟',
  },
  {
    id: 'ch_water_7',
    title: 'Water Goal Week',
    description: 'Hit your daily water goal every day for 7 days straight.',
    category: 'Hydration',
    participants: 0,
    days_left: 7,
    reward: '100 CalFit Points',
    emoji: '💧',
  },
  {
    id: 'ch_workout_5',
    title: '5-Workout Week',
    description: 'Complete 5 workouts in 7 days. Any workout type counts.',
    category: 'Fitness',
    participants: 0,
    days_left: 7,
    reward: '200 CalFit Points',
    emoji: '🏋️',
  },
  {
    id: 'ch_calorie_14',
    title: 'Calorie Consistency',
    description: 'Hit your calorie goal within 100kcal for 14 days straight.',
    category: 'Nutrition',
    participants: 0,
    days_left: 14,
    reward: '300 CalFit Points + Badge',
    emoji: '🎯',
  },
  {
    id: 'ch_streak_21',
    title: 'Streak Builder',
    description: 'Check in every day for 21 days to build your longest streak.',
    category: 'Streaks',
    participants: 0,
    days_left: 21,
    reward: '400 CalFit Points + Silver Badge',
    emoji: '🔥',
  },
  {
    id: 'ch_morning_14',
    title: 'Morning Workout Club',
    description: 'Complete a workout before 10am every day for 2 weeks.',
    category: 'Fitness',
    participants: 0,
    days_left: 14,
    reward: '250 CalFit Points',
    emoji: '🌅',
  },
  {
    id: 'ch_sleep_7',
    title: 'Sleep Consistency Week',
    description: 'Log 7+ hours of sleep every night for 7 days.',
    category: 'Sleep',
    participants: 0,
    days_left: 7,
    reward: '150 CalFit Points',
    emoji: '😴',
  },
  {
    id: 'ch_protein_14',
    title: 'Protein Goal Fortnight',
    description: 'Hit your daily protein target every day for 14 days.',
    category: 'Nutrition',
    participants: 0,
    days_left: 14,
    reward: '200 CalFit Points',
    emoji: '🥩',
  },
];

// Points awarded per challenge ID
const CHALLENGE_POINTS: Record<string, number> = {
  ch_steps_30:   500,
  ch_water_7:    100,
  ch_workout_5:  200,
  ch_calorie_14: 300,
  ch_streak_21:  400,
  ch_morning_14: 250,
  ch_sleep_7:    150,
  ch_protein_14: 200,
};

// ── LOAD JOINED CHALLENGE IDS ─────────────────────────────────
export const loadJoinedChallengeIds = async (
  userId: string
): Promise<string[]> => {
  const { data } = await supabase
    .from('challenge_joins')
    .select('challenge_id')
    .eq('user_id', userId);

  return ((data ?? []) as any[]).map((c) => c.challenge_id);
};

// ── LOAD REAL PARTICIPANT COUNTS ──────────────────────────────
// Returns a map of challenge_id -> count of joined users
export const loadParticipantCounts = async (): Promise<Record<string, number>> => {
  const { data } = await supabase
    .from('challenge_joins')
    .select('challenge_id');

  const counts: Record<string, number> = {};
  ((data ?? []) as any[]).forEach((row) => {
    counts[row.challenge_id] = (counts[row.challenge_id] ?? 0) + 1;
  });
  return counts;
};

// ── JOIN CHALLENGE ────────────────────────────────────────────
export const joinChallenge = async (
  userId: string,
  challengeId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('challenge_joins')
    .insert({ user_id: userId, challenge_id: challengeId });

  if (error) {
    console.error('joinChallenge error:', error.message);
    return false;
  }
  return true;
};

// ── LEAVE CHALLENGE ───────────────────────────────────────────
export const leaveChallenge = async (
  userId: string,
  challengeId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('challenge_joins')
    .delete()
    .eq('user_id', userId)
    .eq('challenge_id', challengeId);

  if (error) {
    console.error('leaveChallenge error:', error.message);
    return false;
  }
  return true;
};

// ── COMPLETE CHALLENGE + AWARD POINTS ─────────────────────────
// Call this when a user actually completes the challenge requirements
export const completeChallenge = async (
  userId: string,
  challengeId: string
): Promise<{ success: boolean; pointsAwarded: number }> => {
  const points = CHALLENGE_POINTS[challengeId] ?? 0;

  // Check not already completed
  const { data: existing } = await supabase
    .from('challenge_joins')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .single();

  if (!existing) {
    return { success: false, pointsAwarded: 0 };
  }

  if ((existing as any).completed_at) {
    // Already completed — don't award again
    return { success: false, pointsAwarded: 0 };
  }

  // Mark as completed
  await supabase
    .from('challenge_joins')
    .update({ completed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('challenge_id', challengeId);

  // Award points to calfit_points table
  if (points > 0) {
    const { data: currentPoints } = await supabase
      .from('calfit_points')
      .select('balance, lifetime_earned')
      .eq('user_id', userId)
      .single();

    if (currentPoints) {
      await supabase
        .from('calfit_points')
        .update({
          balance:         (currentPoints as any).balance         + points,
          lifetime_earned: (currentPoints as any).lifetime_earned + points,
        })
        .eq('user_id', userId);

      // Log the transaction
      await supabase
        .from('points_transactions')
        .insert({
          user_id:     userId,
          amount:      points,
          type:        'challenge_complete',
          description: `Completed challenge: ${challengeId}`,
        });
    }
  }

  return { success: true, pointsAwarded: points };
};