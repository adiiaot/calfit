import { supabase } from './supabase';

export interface Profile {
  id: string;
  calfit_id: string | null;
  full_name: string | null;
  goal: string | null;
  activity_level: string | null;
  age: number | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  daily_calorie_goal: number;
  protein_goal_g: number;
  carb_goal_g: number;
  fat_goal_g: number;
  water_goal_ml: number;
  sleep_goal_hrs: number;
  step_goal: number;
  theme: string;
  units: string;
  dietary_preference: string[] | null;
  tracking_preferences: string[] | null;
  referral_code: string | null;
  streak_count: number;
  last_active_date: string;
  created_at: string;
  updated_at: string;
}

// Fetch the current user's profile
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }
  return data;
};

// Update the current user's profile
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error.message);
    return false;
  }
  return true;
};

// Fetch today's calorie total
export const getTodayCalories = async (userId: string): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('food_logs')
    .select('calories')
    .eq('user_id', userId)
    .eq('date', today);

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + (row.calories || 0), 0);
};

// Fetch today's water total
export const getTodayWater = async (userId: string): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const start = `${today}T00:00:00`;
  const end = `${today}T23:59:59`;

  const { data, error } = await supabase
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', userId)
    .gte('logged_at', start)
    .lte('logged_at', end);

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + (row.amount_ml || 0), 0);
};

// Log water intake
export const logWater = async (
  userId: string,
  amount_ml: number
): Promise<boolean> => {
  const { error } = await supabase
    .from('water_logs')
    .insert({ user_id: userId, amount_ml });

  if (error) {
    console.error('Error logging water:', error.message);
    return false;
  }
  return true;
};

// Log food
export const logFood = async (
  userId: string,
  entry: {
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
    food_name: string;
    calories: number;
    protein_g?: number;
    carbs_g?: number;
    fats_g?: number;
  }
): Promise<boolean> => {
  const { error } = await supabase
    .from('food_logs')
    .insert({ user_id: userId, ...entry });

  if (error) {
    console.error('Error logging food:', error.message);
    return false;
  }
  return true;
};

// Fetch today's steps
export const getTodaySteps = async (userId: string): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('step_logs')
    .select('steps')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error || !data) return 0;
  return data.steps || 0;
};