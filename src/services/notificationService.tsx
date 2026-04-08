import { supabase } from './supabase';

export interface AppNotification {
  id: string;
  type:
    | 'achievement'
    | 'social'
    | 'streak'
    | 'upgrade'
    | 'coach'
    | 'community'
    | 'goal'
    | 'referral'
    | 'system'
    | 'welcome';
  title: string;
  body: string;
  action_label?: string;
  read: boolean;
  created_at: string;
}

// Fetch all notifications for the user
export const getNotifications = async (userId: string): Promise<AppNotification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch notifications:', error.message);
    return [];
  }
  return data ?? [];
};

// Get unread count
export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) return 0;
  return count ?? 0;
};

// Mark a single notification as read
export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
};

// Mark all notifications as read
export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
};

// Delete a single notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
};

// Send a notification (called from within the app after user actions)
export const sendNotification = async (
  userId: string,
  type: AppNotification['type'],
  title: string,
  body: string,
  actionLabel?: string
): Promise<void> => {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    action_label: actionLabel ?? null,
    read: false,
  });
};

// ── TRIGGER FUNCTIONS ──────────────────────────────────────────
// Call these from within the app after specific user actions

export const notifyFoodLogged = async (userId: string, foodName: string, calories: number) => {
  await sendNotification(
    userId,
    'goal',
    'Food Logged ✓',
    `${foodName} (${calories} kcal) has been added to your meals today.`,
  );
};

export const notifyWaterGoalReached = async (userId: string) => {
  await sendNotification(
    userId,
    'goal',
    'Water Goal Hit! 💧',
    "You've hit your daily water goal. Great job staying hydrated!",
    'View Progress'
  );
};

export const notifyCalorieGoalReached = async (userId: string) => {
  await sendNotification(
    userId,
    'goal',
    'Daily Calorie Goal Reached! 🎯',
    "You've hit your calorie target for today. Finish strong!",
    'View Calories'
  );
};

export const notifyWorkoutComplete = async (
  userId: string,
  workoutName: string,
  calories: number,
  duration: number
) => {
  const mins = Math.floor(duration / 60);
  await sendNotification(
    userId,
    'achievement',
    'Workout Complete! 💪',
    `${workoutName} done — ${mins} min · ${calories} kcal burned. Excellent work!`,
    'View History'
  );
};

export const notifyStreakCheckIn = async (userId: string, streakCount: number) => {
  await sendNotification(
    userId,
    'streak',
    `${streakCount}-Day Streak! 🔥`,
    `You checked in for day ${streakCount}. Keep it going to unlock your next milestone badge.`,
    'View Streaks'
  );
};

export const notifyStreakReminder = async (userId: string) => {
  await sendNotification(
    userId,
    'streak',
    "Don't lose your streak! ⚠️",
    "You haven't checked in today. Log anything or check in now to keep your streak alive.",
    'Check In'
  );
};

export const notifyMealPlanGenerated = async (userId: string, planTitle: string) => {
  await sendNotification(
    userId,
    'coach',
    'Meal Plan Ready 🍽️',
    `Your AI meal plan "${planTitle}" has been generated and saved. Tap to view it.`,
    'View Plan'
  );
};

export const notifyProfileComplete = async (userId: string) => {
  await sendNotification(
    userId,
    'system',
    'Profile Complete ✓',
    'Your profile is fully set up. CalFit is now personalised to your goals and body stats.',
  );
};

export const notifyReferralSignup = async (userId: string) => {
  await sendNotification(
    userId,
    'referral',
    'Someone Joined via Your Link! 🎉',
    'A friend just signed up using your referral link. You will earn commission when they upgrade.',
    'View Earnings'
  );
};

export const notifyUpgradePrompt = async (userId: string) => {
  await sendNotification(
    userId,
    'upgrade',
    'Unlock the Full CalFit Experience ⭐',
    'Upgrade to Pro or Premium to access the AI food scanner, unlimited Coach prompts, live streaming and more.',
    'View Plans'
  );
};

// Call this on app open to remind user to check in
export const checkAndSendStreakReminder = async (
  userId: string,
  lastActiveDate: string | null
): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];

  // Already checked in today — no reminder needed
  if (lastActiveDate === today) return;

  // Check if we already sent a reminder today
  const { supabase } = await import('./supabase');
  const { data } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'streak')
    .gte('created_at', `${today}T00:00:00`)
    .limit(1);

  // Already sent a reminder today
  if (data && data.length > 0) return;

  // Send the daily reminder
  await sendNotification(
    userId,
    'streak',
    "Don't lose your streak! ⚠️",
    "You haven't checked in today. Tap to check in now and keep your streak alive.",
    'Check In'
  );
};