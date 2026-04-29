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

export function useSteps(goalSteps = 10000) {
  const { user, setLiveSteps } = useAuthStore();
  const [steps, setStepsLocal]            = useState(0);
  const [isAvailable, setIsAvailable]     = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading]         = useState(true);

  const unsubscribeRef   = useRef<(() => void) | null>(null);
  const saveTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pedometerBaseRef = useRef<number | null>(null);
  const supabaseBaseRef  = useRef<number>(0);
  const goalNotifiedRef  = useRef(false);

  // ── Sync to Zustand AFTER render (not during setState callback) ──
  // Ensures HomeScreen + ActivityScreen always show the same value.
  useEffect(() => {
    if (setLiveSteps) setLiveSteps(steps);
  }, [steps]);

  // Removed trackingEnabled from deps — steps should ALWAYS be tracked.
  // tracking_preferences only controls whether the Steps CARD shows on Home,
  // not whether the pedometer runs.
  useEffect(() => {
    init();
    return cleanup;
  }, [user?.id]);

  const cleanup = () => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    if (saveTimerRef.current) clearInterval(saveTimerRef.current);
  };

  const init = async () => {
    cleanup();
    setIsLoading(true);

    const available = await isPedometerAvailable();
    setIsAvailable(available);

    if (!available) {
      if (user?.id) {
        const saved = await loadSavedSteps(user.id);
        setStepsLocal(saved);
        supabaseBaseRef.current = saved;
      }
      setIsLoading(false);
      return;
    }

    const granted = await requestStepsPermission();
    setHasPermission(granted);

    if (!granted) {
      if (user?.id) {
        const saved = await loadSavedSteps(user.id);
        setStepsLocal(saved);
        supabaseBaseRef.current = saved;
      }
      setIsLoading(false);
      return;
    }

    const savedBase = user?.id ? await loadSavedSteps(user.id) : 0;
    supabaseBaseRef.current = savedBase;
    setStepsLocal(savedBase);

    const pedometerNow = await getTodaySteps();
    pedometerBaseRef.current = pedometerNow;

    unsubscribeRef.current = subscribeToSteps(async (newPedometerSteps) => {
      if (pedometerBaseRef.current === null) {
        pedometerBaseRef.current = newPedometerSteps;
      }
      const sessionDelta = Math.max(0, newPedometerSteps - pedometerBaseRef.current);
      const totalToday   = supabaseBaseRef.current + sessionDelta;

      setStepsLocal(totalToday);

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