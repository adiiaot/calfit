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
//
// ── WHY STEPS DON'T SYNC BETWEEN HOME AND ACTIVITY ───────────
// Both HomeScreen and ActivityScreen called useSteps() independently,
// creating two separate hook instances with separate state. They both
// read from Supabase on init but then diverge as live pedometer
// deltas are tracked per-instance.
//
// FIX: Steps are now written into Zustand (authStore) so any screen
// reading `useAuthStore().liveSteps` gets the same live value.
// useSteps() is the single source of truth — it updates Zustand.
// All other screens just read from Zustand, not the hook directly.

export function useSteps(goalSteps = 10000) {
  const { user, profile, setLiveSteps } = useAuthStore();
  const [steps, setStepsLocal]          = useState(0);
  const [isAvailable, setIsAvailable]   = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading]       = useState(true);

  const unsubscribeRef    = useRef<(() => void) | null>(null);
  const saveTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const pedometerBaseRef  = useRef<number | null>(null);
  const supabaseBaseRef   = useRef<number>(0);
  const goalNotifiedRef   = useRef(false);

  const trackingEnabled =
    (profile as any)?.tracking_preferences?.includes('Steps') ?? false;

  // Sync steps to Zustand whenever local steps value changes.
  // We do this in a useEffect, NOT inside the state setter, because
  // calling setLiveSteps() inside a setState callback triggers a
  // "Cannot update a component while rendering a different component" error.
  useEffect(() => {
    if (setLiveSteps) setLiveSteps(steps);
  }, [steps]);

  // Simple alias — just updates local state
  const setSteps = setStepsLocal;

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

    // Step 1: Load today's baseline from Supabase
    const savedBase = user?.id ? await loadSavedSteps(user.id) : 0;
    supabaseBaseRef.current = savedBase;
    setSteps(savedBase);

    // Step 2: Get current pedometer reading as session base
    const pedometerNow = await getTodaySteps();
    pedometerBaseRef.current = pedometerNow;

    // Step 3: Subscribe to live pedometer updates
    unsubscribeRef.current = subscribeToSteps(async (newPedometerSteps) => {
      if (pedometerBaseRef.current === null) {
        pedometerBaseRef.current = newPedometerSteps;
      }
      const sessionDelta = Math.max(0, newPedometerSteps - pedometerBaseRef.current);
      const totalToday   = supabaseBaseRef.current + sessionDelta;

      setSteps(totalToday);

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

    // Step 4: Save to Supabase every 5 minutes
    if (user?.id) {
      await saveStepsToSupabase(user.id, savedBase, goalSteps);

      saveTimerRef.current = setInterval(async () => {
        const live = await getTodaySteps();
        if (pedometerBaseRef.current === null) return;
        const delta = Math.max(0, live - pedometerBaseRef.current);
        const total = supabaseBaseRef.current + delta;
        await saveStepsToSupabase(user.id, total, goalSteps);
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

// ── Load today's step count from Supabase ─────────────────────
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