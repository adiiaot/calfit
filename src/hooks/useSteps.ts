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

export function useSteps(goalSteps = 10000) {
  const { user, profile } = useAuthStore();
  const [steps, setSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goalNotifiedRef = useRef(false);

// Inside subscribeToSteps callback:
unsubscribeRef.current = subscribeToSteps(async (newSteps) => {
  setSteps(newSteps);
  
  // Notify once when goal is crossed
  if (
    user?.id &&
    !goalNotifiedRef.current &&
    newSteps >= goalSteps
  ) {
    goalNotifiedRef.current = true;
    const { sendNotification } = await import('../services/notificationService');
    await sendNotification(
      user.id,
      'goal',
      `Step goal reached! 🎉`,
      `You've hit ${goalSteps.toLocaleString()} steps today. Amazing work!`,
      'View History'
    );
  }
});

  const trackingEnabled =
    (profile as any)?.tracking_preferences?.includes('Steps') ?? false;

  useEffect(() => {
    init();
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [trackingEnabled]);

  const init = async () => {
    setIsLoading(true);
    const available = await isPedometerAvailable();
    setIsAvailable(available);

    if (!available || !trackingEnabled) {
      setIsLoading(false);
      return;
    }

    const granted = await requestStepsPermission();
    setHasPermission(granted);

    if (!granted) {
      setIsLoading(false);
      return;
    }

    // Load today's steps first
    const todaySteps = await getTodaySteps();
    setSteps(todaySteps);

    // Subscribe to live updates
    unsubscribeRef.current = subscribeToSteps((newSteps) => {
      setSteps(newSteps);
    });

    // Save to Supabase every 5 minutes
    if (user?.id) {
      saveTimerRef.current = setInterval(async () => {
        const current = await getTodaySteps();
        await saveStepsToSupabase(user.id, current, goalSteps);
      }, 5 * 60 * 1000);
    }

    setIsLoading(false);
  };

  const calories = stepsToCalories(steps);
  const progress = Math.min(steps / goalSteps, 1);
  const percentage = Math.round(progress * 100);

  return {
    steps,
    calories,
    progress,
    percentage,
    isAvailable,
    hasPermission,
    isLoading,
    goalSteps,
  };
}