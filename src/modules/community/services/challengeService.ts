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

// Static auto-generated challenges — pushed from app
export const AUTO_CHALLENGES: Omit<ChallengeEntry, 'joined'>[] = [
  {
    id: 'ch_steps_30',
    title: '30-Day Step Challenge',
    description: 'Walk 8,000 steps every day for 30 days. Tracked automatically with CalFit.',
    category: 'Steps',
    participants: 4200,
    days_left: 18,
    reward: '500 CalFit Points + Badge',
    emoji: '👟',
  },
  {
    id: 'ch_water_7',
    title: 'Water Goal Week',
    description: 'Hit your daily water goal every day for 7 days straight.',
    category: 'Hydration',
    participants: 1800,
    days_left: 4,
    reward: '100 CalFit Points',
    emoji: '💧',
  },
  {
    id: 'ch_workout_5',
    title: '5-Workout Week',
    description: 'Complete 5 workouts in 7 days. Any workout type counts.',
    category: 'Fitness',
    participants: 3100,
    days_left: 6,
    reward: '200 CalFit Points',
    emoji: '🏋️',
  },
  {
    id: 'ch_calorie_14',
    title: 'Calorie Consistency',
    description: 'Hit your calorie goal within 100kcal for 14 days straight.',
    category: 'Nutrition',
    participants: 2400,
    days_left: 11,
    reward: '300 CalFit Points + Badge',
    emoji: '🎯',
  },
  {
    id: 'ch_streak_21',
    title: 'Streak Builder',
    description: 'Check in every day for 21 days to build your longest streak.',
    category: 'Streaks',
    participants: 5600,
    days_left: 14,
    reward: '400 CalFit Points + Silver Badge',
    emoji: '🔥',
  },
  {
    id: 'ch_morning_14',
    title: 'Morning Workout Club',
    description: 'Complete a workout before 10am every day for 2 weeks.',
    category: 'Fitness',
    participants: 980,
    days_left: 9,
    reward: '250 CalFit Points',
    emoji: '🌅',
  },
  {
    id: 'ch_sleep_7',
    title: 'Sleep Consistency Week',
    description: 'Log 7+ hours of sleep every night for 7 days.',
    category: 'Sleep',
    participants: 1200,
    days_left: 5,
    reward: '150 CalFit Points',
    emoji: '😴',
  },
  {
    id: 'ch_protein_14',
    title: 'Protein Goal Fortnight',
    description: 'Hit your daily protein target every day for 14 days.',
    category: 'Nutrition',
    participants: 760,
    days_left: 8,
    reward: '200 CalFit Points',
    emoji: '🥩',
  },
];

export const loadJoinedChallengeIds = async (
  userId: string
): Promise<string[]> => {
  const { data } = await supabase
    .from('challenge_joins')
    .select('challenge_id')
    .eq('user_id', userId);

  return ((data ?? []) as any[]).map((c) => c.challenge_id);
};

export const joinChallenge = async (
  userId: string,
  challengeId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('challenge_joins')
    .insert({ user_id: userId, challenge_id: challengeId });
  return !error;
};

export const leaveChallenge = async (
  userId: string,
  challengeId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('challenge_joins')
    .delete()
    .eq('user_id', userId)
    .eq('challenge_id', challengeId);
  return !error;
};