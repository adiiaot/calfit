// src/services/leaderboardNotificationService.ts
// ─────────────────────────────────────────────────────────────
// Leaderboard Rank-Up Notification
//
// HOW IT WORKS:
//   Call checkAndNotifyRankUp() after any leaderboard data refresh.
//   It compares the user's current rank to their stored previous rank.
//   If rank improved, sends an in-app notification and updates stored rank.
//
// Store last rank in Supabase profiles column (leaderboard_rank)
// so it persists across sessions.
// ─────────────────────────────────────────────────────────────

import { supabase } from './supabase';
import { sendNotification } from './notificationService';

interface RankCheckResult {
  improved: boolean;
  oldRank: number;
  newRank: number;
  category: string;
}

export const checkAndNotifyRankUp = async (
  userId: string,
  currentRank: number,
  category: string = 'Overall'
): Promise<RankCheckResult | null> => {
  if (!userId || currentRank <= 0) return null;

  try {
    // Get stored rank from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('leaderboard_rank')
      .eq('id', userId)
      .single();

    const previousRank = profile?.leaderboard_rank ?? 0;

    // No previous rank stored yet — just save current and return
    if (previousRank === 0) {
      await supabase
        .from('profiles')
        .update({ leaderboard_rank: currentRank })
        .eq('id', userId);
      return null;
    }

    // Check if rank improved (lower number = better rank)
    const improved = currentRank < previousRank;

    if (improved) {
      // Update stored rank
      await supabase
        .from('profiles')
        .update({ leaderboard_rank: currentRank })
        .eq('id', userId);

      // Send in-app notification
      const rankDiff = previousRank - currentRank;
      await sendNotification(
        userId,
        'goal',
        `🏆 You moved up ${rankDiff} spot${rankDiff > 1 ? 's' : ''} on the leaderboard!`,
        `You're now ranked #${currentRank} in ${category}. Keep pushing!`,
        'View Leaderboard'
      );

      return { improved: true, oldRank: previousRank, newRank: currentRank, category };
    }

    // Rank didn't improve — update stored rank if it changed (dropped)
    if (currentRank !== previousRank) {
      await supabase
        .from('profiles')
        .update({ leaderboard_rank: currentRank })
        .eq('id', userId);
    }

    return { improved: false, oldRank: previousRank, newRank: currentRank, category };
  } catch (e) {
    console.error('[leaderboardNotificationService] checkAndNotifyRankUp error:', e);
    return null;
  }
};


// ─────────────────────────────────────────────────────────────
// FILE 2: src/components/WithdrawalHistory.tsx
// Withdrawal history component for the Credits/Earnings screen
// ─────────────────────────────────────────────────────────────