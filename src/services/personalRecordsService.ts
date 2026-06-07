// src/services/personalRecordsService.ts
// ─────────────────────────────────────────────────────────────
// Detects and stores Personal Records (PRs) for workout sessions.
//
// PR types we track:
//   longest_duration — longest time on a single exercise (seconds)
//   most_calories    — most calories burned in a single session
//   most_exercises   — most exercises completed in one session
//
// Called from handleCompleteWorkout in ActivityScreen + QuickStartScreen.
// Writes to the `personal_records` Supabase table.
// ─────────────────────────────────────────────────────────────

import { supabase } from './supabase';

export interface PersonalRecord {
  id: string;
  user_id: string;
  record_type: 'longest_duration' | 'most_calories' | 'most_exercises' | 'longest_exercise';
  exercise_name: string | null;   // null for session-level PRs
  value: number;                  // seconds | calories | count
  achieved_at: string;
  session_name: string;
}

export interface PRResult {
  isNewPR: boolean;
  newRecords: {
    type: string;
    label: string;       // human-readable e.g. "Longest Workout"
    value: string;       // human-readable e.g. "42 min 30 sec"
    improvement: string; // e.g. "+5 min vs your best"
  }[];
}

// ── HELPERS ───────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── MAIN FUNCTION ─────────────────────────────────────────────
// Call after a workout session is saved to Supabase.
// Returns which PRs (if any) were beaten so you can show a celebration.
export async function checkAndSavePRs(
  userId: string,
  sessionName: string,
  workoutSeconds: number,
  totalCalories: number,
  exercises: { name: string; seconds: number; calories: number }[]
): Promise<PRResult> {
  const newRecords: PRResult['newRecords'] = [];

  try {
    // ── 1. Load existing PRs for this user ────────────────────
    const { data: existing } = await supabase
      .from('personal_records')
      .select('id, user_id, record_type, exercise_name, value, achieved_at, session_name')
      .eq('user_id', userId);

    const prMap: Record<string, PersonalRecord> = {};
    (existing ?? []).forEach((pr: PersonalRecord) => {
      const key = pr.exercise_name ? `${pr.record_type}::${pr.exercise_name}` : pr.record_type;
      prMap[key] = pr;
    });

    const upserts: Omit<PersonalRecord, 'id'>[] = [];
    const now = new Date().toISOString();

    // ── 2. Check: longest overall session ─────────────────────
    const prevDuration = prMap['longest_duration']?.value ?? 0;
    if (workoutSeconds > prevDuration) {
      const improvement = prevDuration > 0
        ? `+${formatDuration(workoutSeconds - prevDuration)} vs your best`
        : 'First recorded workout!';
      newRecords.push({
        type: 'longest_duration',
        label: '⏱ Longest Workout',
        value: formatDuration(workoutSeconds),
        improvement,
      });
      upserts.push({
        user_id: userId,
        record_type: 'longest_duration',
        exercise_name: null,
        value: workoutSeconds,
        achieved_at: now,
        session_name: sessionName,
      });
    }

    // ── 3. Check: most calories in a session ──────────────────
    const prevCal = prMap['most_calories']?.value ?? 0;
    if (totalCalories > prevCal) {
      const improvement = prevCal > 0
        ? `+${totalCalories - prevCal} kcal vs your best`
        : 'First calorie record!';
      newRecords.push({
        type: 'most_calories',
        label: '🔥 Most Calories Burned',
        value: `${totalCalories} kcal`,
        improvement,
      });
      upserts.push({
        user_id: userId,
        record_type: 'most_calories',
        exercise_name: null,
        value: totalCalories,
        achieved_at: now,
        session_name: sessionName,
      });
    }

    // ── 4. Check: most exercises in one session ───────────────
    const prevCount = prMap['most_exercises']?.value ?? 0;
    if (exercises.length > prevCount) {
      const improvement = prevCount > 0
        ? `+${exercises.length - prevCount} vs your best`
        : 'First session record!';
      newRecords.push({
        type: 'most_exercises',
        label: '💪 Most Exercises',
        value: `${exercises.length} exercises`,
        improvement,
      });
      upserts.push({
        user_id: userId,
        record_type: 'most_exercises',
        exercise_name: null,
        value: exercises.length,
        achieved_at: now,
        session_name: sessionName,
      });
    }

    // ── 5. Check: longest time on each individual exercise ────
    for (const ex of exercises) {
      if (!ex.name || ex.seconds < 10) continue; // skip trivial
      const key = `longest_exercise::${ex.name}`;
      const prevEx = prMap[key]?.value ?? 0;
      if (ex.seconds > prevEx) {
        const improvement = prevEx > 0
          ? `+${formatDuration(ex.seconds - prevEx)} vs your best`
          : `First time tracking ${ex.name}`;
        newRecords.push({
          type: 'longest_exercise',
          label: `🏅 ${ex.name} PR`,
          value: formatDuration(ex.seconds),
          improvement,
        });
        upserts.push({
          user_id: userId,
          record_type: 'longest_exercise',
          exercise_name: ex.name,
          value: ex.seconds,
          achieved_at: now,
          session_name: sessionName,
        });
      }
    }

    // ── 6. Save all new PRs to Supabase ───────────────────────
    // Use upsert with conflict on (user_id, record_type, exercise_name)
    // so we always keep the highest value
    if (upserts.length > 0) {
      await supabase
        .from('personal_records')
        .upsert(
          upserts.map((u) => ({
            ...u,
            // Supabase upsert conflict target set in table definition
          })),
          { onConflict: 'user_id,record_type,exercise_name' }
        );
    }

    return { isNewPR: newRecords.length > 0, newRecords };

  } catch (e) {
    if (__DEV__) console.error('checkAndSavePRs error:', e);
    return { isNewPR: false, newRecords: [] };
  }
}

// ── FETCH ALL PRs FOR A USER ──────────────────────────────────
// Used by ProfileScreen and PRShowcaseCard
export async function fetchPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  try {
    const { data } = await supabase
      .from('personal_records')
      .select('id, user_id, record_type, exercise_name, value, achieved_at, session_name')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}