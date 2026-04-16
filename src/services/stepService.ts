import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// ── CHECK AVAILABILITY ────────────────────────────────────────
export const isPedometerAvailable = async (): Promise<boolean> => {
  try {
    const available = await Pedometer.isAvailableAsync();
    return available;
  } catch {
    return false;
  }
};

// ── REQUEST PERMISSIONS ───────────────────────────────────────
export const requestStepsPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS requires motion permission
      const { status } = await Pedometer.requestPermissionsAsync();
      return status === 'granted';
    }
    // Android pedometer works without explicit permission on most devices
    return true;
  } catch {
    return false;
  }
};

// ── GET TODAY'S STEPS ─────────────────────────────────────────
export const getTodaySteps = async (): Promise<number> => {
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return 0;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    const result = await Pedometer.getStepCountAsync(start, end);
    return result.steps ?? 0;
  } catch {
    return 0;
  }
};

// ── LIVE STEP SUBSCRIPTION ────────────────────────────────────
export const subscribeToSteps = (
  onStepUpdate: (steps: number) => void
): (() => void) => {
  let baseSteps = 0;
  let initialized = false;

  const subscription = Pedometer.watchStepCount((result) => {
    if (!initialized) {
      baseSteps = result.steps;
      initialized = true;
    }
    onStepUpdate(result.steps);
  });

  return () => subscription.remove();
};

// ── SAVE STEPS TO SUPABASE ────────────────────────────────────
export const saveStepsToSupabase = async (
  userId: string,
  steps: number,
  goalSteps: number
): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];

  await supabase
    .from('step_logs')
    .upsert({
      user_id: userId,
      steps,
      goal_steps: goalSteps,
      date: today,
    }, { onConflict: 'user_id,date' });
};

// ── STEPS TO CALORIES CONVERSION ─────────────────────────────
// Average: 1 step burns ~0.04 calories
export const stepsToCalories = (steps: number): number => {
  return Math.round(steps * 0.04);
};

// ── STEPS PROGRESS PERCENTAGE ─────────────────────────────────
export const stepsProgress = (steps: number, goal: number): number => {
  return Math.min(steps / goal, 1);
};