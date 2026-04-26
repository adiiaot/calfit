import { useState, useEffect, useRef } from 'react';
import {
  isPedometerAvailable,
  requestStepsPermission,
  getTodaySteps,
  subscribeToSteps,
  saveStepsToSupabase,
  stepsToCalories,
} from '../services/stepService';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

// ── WHY STEPS RESET TO 0 ON LOGIN ────────────────────────────
// The old hook called getTodaySteps() which reads from the HARDWARE
// pedometer (Expo Pedometer.getStepCountAsync). The pedometer gives
// steps since midnight on the DEVICE — it does not persist across
// app restarts beyond the OS. More critically, when a user logs
// back in, the hook re-initialises and only adds DELTA steps from
// that point forward, losing any steps already taken today.
//
// FIX: On init, load today's saved steps from Supabase first.
// Then subscribe to the live pedometer. Track the delta between
// where the pedometer starts and where it ends, and add that delta
// to the Supabase baseline. This means steps always accumulate
// correctly across sessions and login/logouts.

export function useSteps(goalSteps = 10000) {
  const { user, profile } = useAuthStore();
  const [steps, setSteps]               = useState(0);
  const [isAvailable, setIsAvailable]   = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading]       = useState(true);

  const unsubscribeRef    = useRef<(() => void) | null>(null);
  const saveTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const pedometerBaseRef  = useRef<number | null>(null); // first reading from pedometer this session
  const supabaseBaseRef   = useRef<number>(0);           // steps already saved in DB today
  const goalNotifiedRef   = useRef(false);

  const trackingEnabled =
    (profile as any)?.tracking_preferences?.includes('Steps') ?? false;

  useEffect(() => {
    init();
    return cleanup;
  }, [trackingEnabled, user?.id]);

  const cleanup = () => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    if (saveTimerRef.current) clearInterval(saveTimerRef.current);
  };

  const init = async () => {
    cleanup();
    setIsLoading(true);

    const available = await isPedometerAvailable();
    setIsAvailable(available);

    if (!available || !trackingEnabled) {
      // Even if pedometer unavailable, load saved steps so the card
      // still shows today's previously-saved value rather than 0
      if (user?.id) {
        const saved = await loadSavedSteps(user.id);
        setSteps(saved);
        supabaseBaseRef.current = saved;
      }
      setIsLoading(false);
      return;
    }

    const granted = await requestStepsPermission();
    setHasPermission(granted);

    if (!granted) {
      setIsLoading(false);
      return;
    }

    // ── Step 1: Load today's baseline from Supabase ───────────
    // This is how many steps were already logged today before this
    // session started. It persists across logins.
    const savedBase = user?.id ? await loadSavedSteps(user.id) : 0;
    supabaseBaseRef.current = savedBase;
    setSteps(savedBase); // Show saved value immediately (no flash to 0)

    // ── Step 2: Get current pedometer reading as our session base ─
    // We don't use this directly — we use it to track deltas only.
    const pedometerNow = await getTodaySteps();
    pedometerBaseRef.current = pedometerNow;

    // ── Step 3: Subscribe to live pedometer updates ───────────
    unsubscribeRef.current = subscribeToSteps(async (newPedometerSteps) => {
      if (pedometerBaseRef.current === null) {
        pedometerBaseRef.current = newPedometerSteps;
      }
      // Delta = steps taken THIS SESSION only
      const sessionDelta = Math.max(0, newPedometerSteps - pedometerBaseRef.current);
      const totalToday   = supabaseBaseRef.current + sessionDelta;

      setSteps(totalToday);

      // Notify once when goal is crossed
      if (user?.id && !goalNotifiedRef.current && totalToday >= goalSteps) {
        goalNotifiedRef.current = true;
        try {
          const { sendNotification } = await import('../services/notificationService');
          await sendNotification(
            user.id, 'goal',
            'Step goal reached! 🎉',
            `You've hit ${goalSteps.toLocaleString()} steps today. Amazing work!`,
            'View History'
          );
        } catch {}
      }
    });

    // ── Step 4: Save to Supabase every 5 minutes ─────────────
    // Also save immediately so the value is fresh for other screens
    if (user?.id) {
      const currentTotal = supabaseBaseRef.current + Math.max(0, pedometerNow - pedometerNow);
      await saveStepsToSupabase(user.id, currentTotal, goalSteps);

      saveTimerRef.current = setInterval(async () => {
        const live = await getTodaySteps();
        if (pedometerBaseRef.current === null) return;
        const delta = Math.max(0, live - pedometerBaseRef.current);
        const total = supabaseBaseRef.current + delta;
        await saveStepsToSupabase(user.id, total, goalSteps);
        // Update our in-memory base so future deltas are correct
        supabaseBaseRef.current = total;
        pedometerBaseRef.current = live;
      }, 5 * 60 * 1000);
    }

    setIsLoading(false);
  };

  const calories   = stepsToCalories(steps);
  const progress   = Math.min(steps / goalSteps, 1);
  const percentage = Math.round(progress * 100);

  return { steps, calories, progress, percentage, isAvailable, hasPermission, isLoading, goalSteps };
}

// ── Load today's step count from Supabase ────────────────────
// Uses maybeSingle() — safe when no row exists yet (returns null)
async function loadSavedSteps(userId: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('step_logs')
      .select('steps')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    return data?.steps ?? 0;
  } catch {
    return 0;
  }
}