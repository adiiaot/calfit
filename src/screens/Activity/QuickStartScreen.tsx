import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useEffect, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import * as Speech from 'expo-speech';

interface QuickExercise {
  name: string;
  duration: number;
  calories_per_minute: number;
  seconds: number;
  calories_burned: number;
  done: boolean;
}

const QUICK_WORKOUTS: Record<string, {
  name: string;
  exercises: { name: string; duration: number; calories_per_minute: number }[];
}> = {
  'Morning Cardio Blast': {
    name: 'Morning Cardio Blast',
    exercises: [
      { name: 'Jumping Jacks', duration: 60, calories_per_minute: 8 },
      { name: 'High Knees', duration: 45, calories_per_minute: 10 },
      { name: 'Mountain Climbers', duration: 45, calories_per_minute: 11 },
      { name: 'Burpees', duration: 30, calories_per_minute: 12 },
      { name: 'Running in Place', duration: 60, calories_per_minute: 9 },
    ],
  },
  'Full Body Strength': {
    name: 'Full Body Strength',
    exercises: [
      { name: 'Push Ups', duration: 45, calories_per_minute: 7 },
      { name: 'Squats', duration: 45, calories_per_minute: 7 },
      { name: 'Lunges', duration: 45, calories_per_minute: 7 },
      { name: 'Plank', duration: 60, calories_per_minute: 5 },
      { name: 'Glute Bridges', duration: 45, calories_per_minute: 5 },
    ],
  },
  'Core Crusher': {
    name: 'Core Crusher',
    exercises: [
      { name: 'Crunches', duration: 45, calories_per_minute: 5 },
      { name: 'Leg Raises', duration: 45, calories_per_minute: 5 },
      { name: 'Russian Twists', duration: 45, calories_per_minute: 6 },
      { name: 'Plank', duration: 60, calories_per_minute: 5 },
      { name: 'Bicycle Crunches', duration: 45, calories_per_minute: 6 },
    ],
  },
  'Leg Day': {
    name: 'Leg Day',
    exercises: [
      { name: 'Squats', duration: 45, calories_per_minute: 7 },
      { name: 'Lunges', duration: 45, calories_per_minute: 7 },
      { name: 'Glute Bridges', duration: 45, calories_per_minute: 5 },
      { name: 'Jump Squats', duration: 30, calories_per_minute: 10 },
      { name: 'Wall Sit', duration: 60, calories_per_minute: 5 },
    ],
  },
};

export default function QuickStartScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colorScheme } = useThemeStore();
  const { user } = useAuthStore();
  const theme = colors[colorScheme];

  const workoutName = route.params?.name ?? 'Morning Cardio Blast';
  const workoutData = QUICK_WORKOUTS[workoutName] ?? QUICK_WORKOUTS['Morning Cardio Blast'];

  const [exercises, setExercises] = useState<QuickExercise[]>(
    workoutData.exercises.map((e) => ({
      ...e,
      seconds: 0,
      calories_burned: 0,
      done: false,
    }))
  );
  const [activeIndex, setActiveIndex] = useState(-1);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [exerciseSecondsLeft, setExerciseSecondsLeft] = useState(0);

  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exerciseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
      if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  };

  const totalWorkoutTime = () => {
    const hrs = Math.floor(workoutSeconds / 3600);
    const mins = Math.floor((workoutSeconds % 3600) / 60);
    const secs = workoutSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins} min ${secs}s`;
    return `${secs}s`;
  };

  const handleStartExercise = (index: number) => {
    if (!workoutStarted) {
      setWorkoutStarted(true);
      workoutTimerRef.current = setInterval(() => {
        setWorkoutSeconds((prev) => prev + 1);
      }, 1000);
    }

    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    setActiveIndex(index);

    const duration = exercises[index].duration;
    setExerciseSecondsLeft(duration);

    exerciseTimerRef.current = setInterval(() => {
      setExerciseSecondsLeft((prev) => {
        if (prev <= 1) {
          // Auto complete when timer runs out
          clearInterval(exerciseTimerRef.current!);
          handleCompleteExercise(index);
          return 0;
        }
        return prev - 1;
      });

      setExercises((prev) =>
        prev.map((ex, i) => {
          if (i !== index) return ex;
          const newSeconds = ex.seconds + 1;
          const newCal = Math.round((ex.calories_per_minute / 60) * newSeconds);
          return { ...ex, seconds: newSeconds, calories_burned: newCal };
        })
      );
    }, 1000);
  };

  const handleCompleteExercise = (index: number) => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    setExercises((prev) =>
      prev.map((ex, i) => i === index ? { ...ex, done: true } : ex)
    );
    setActiveIndex(-1);
    setExerciseSecondsLeft(0);

    // Auto start next exercise after 2 seconds
    const nextIndex = index + 1;
    if (nextIndex < exercises.length) {
      setTimeout(() => handleStartExercise(nextIndex), 2000);
    }
  };

  const handleCompleteWorkout = async () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);

    const totalCal = exercises.reduce((sum, ex) => sum + ex.calories_burned, 0);
    const timeStr = totalWorkoutTime();

    try {
      if (user?.id) {
        const { supabase } = await import('../../services/supabase');
       await supabase.from('workout_sessions').insert({
  user_id: user.id,
  name: workoutData.name,
  status: 'completed',
  duration_seconds: workoutSeconds,
  calories_burned: totalCal,
  completed_at: new Date().toISOString(),
  exercises: exercises.map((ex) => ({
    name: ex.name,
    seconds: ex.seconds,
    calories: ex.calories_burned,
  })),
});
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }

    Alert.alert(
      '🎉 Workout Complete!',
      `Great work!\n\nWorkout: ${workoutData.name}\nTime: ${timeStr}\nCalories burned: ${totalCal} kcal\nExercises: ${exercises.length}`,
      [{
        text: 'Awesome!',
        onPress: () => navigation.goBack(),
      }]
    );
  };

  const totalCalories = exercises.reduce((sum, ex) => sum + ex.calories_burned, 0);
  const completedCount = exercises.filter((e) => e.done).length;

  return (
    

    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (workoutStarted) {
              Alert.alert(
                'Leave workout?',
                'Your progress will not be saved.',
                [
                  { text: 'Keep going', style: 'cancel' },
                  { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Activity</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          {workoutData.name}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Timer bar */}
      <View style={[styles.timerBar, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        <View style={styles.timerItem}>
          <Text style={[styles.timerLabel, { color: theme.textMuted }]}>TIME</Text>
          <Text style={[styles.timerValue, { color: theme.textPrimary }]}>
            {formatTime(workoutSeconds)}
          </Text>
        </View>
        <View style={[styles.timerDivider, { backgroundColor: theme.border }]} />
        <View style={styles.timerItem}>
          <Text style={[styles.timerLabel, { color: theme.textMuted }]}>CALORIES</Text>
          <Text style={[styles.timerValue, { color: theme.accent }]}>
            {totalCalories} kcal
          </Text>
        </View>
        <View style={[styles.timerDivider, { backgroundColor: theme.border }]} />
        <View style={styles.timerItem}>
          <Text style={[styles.timerLabel, { color: theme.textMuted }]}>DONE</Text>
          <Text style={[styles.timerValue, { color: theme.accent }]}>
            {completedCount}/{exercises.length}
          </Text>
        </View>
      </View>

      {/* Active exercise banner */}
      {activeIndex >= 0 && (
        <View style={[styles.activeBanner, { backgroundColor: theme.accent }]}>
          <View>
            <Text style={styles.activeBannerLabel}>NOW DOING</Text>
            <Text style={styles.activeBannerName}>{exercises[activeIndex].name}</Text>
          </View>
          <View style={styles.activeBannerRight}>
            <Text style={styles.activeBannerTimer}>
              {formatTime(exerciseSecondsLeft)}
            </Text>
            <Text style={styles.activeBannerLeft}>remaining</Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {exercises.map((ex, i) => (
          <View
            key={ex.name}
            style={[styles.exerciseRow, {
              backgroundColor: ex.done
                ? theme.accent + '15'
                : i === activeIndex
                ? theme.card
                : theme.card,
              borderColor: ex.done
                ? theme.accent
                : i === activeIndex
                ? theme.orange
                : theme.border,
              borderWidth: i === activeIndex ? 2 : 1,
            }]}
          >
            {/* Exercise number */}
            <View style={[styles.exNumber, {
              backgroundColor: ex.done
                ? theme.accent
                : i === activeIndex
                ? theme.orange
                : theme.border + '88',
            }]}>
              {ex.done ? (
                <Ionicons name="checkmark" size={16} color={theme.bg} />
              ) : (
                <Text style={[styles.exNumberText, {
                  color: i === activeIndex ? theme.bg : theme.textMuted,
                }]}>
                  {i + 1}
                </Text>
              )}
            </View>

            {/* Exercise info */}
            <View style={styles.exInfo}>
              <Text style={[styles.exName, {
                color: ex.done ? theme.accent : theme.textPrimary,
              }]}>
                {ex.name}
              </Text>
              <Text style={[styles.exMeta, { color: theme.textMuted }]}>
                {formatDuration(ex.duration)} · {ex.calories_per_minute} kcal/min
              </Text>
              {ex.seconds > 0 && (
                <Text style={[styles.exProgress, { color: theme.accent }]}>
                  {formatTime(ex.seconds)} done · {ex.calories_burned} kcal burned
                </Text>
              )}
            </View>

            {/* Action button */}
            {ex.done ? (
              <Text style={[styles.exDoneText, { color: theme.accent }]}>✓ Done</Text>
            ) : i === activeIndex ? (
              <TouchableOpacity
                onPress={() => handleCompleteExercise(i)}
                style={[styles.doneBtn, { backgroundColor: theme.orange }]}
              >
                <Text style={[styles.doneBtnText, { color: theme.bg }]}>Done</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleStartExercise(i)}
                style={[styles.startBtn, { borderColor: theme.accent }]}
              >
                <Ionicons name="play" size={14} color={theme.accent} />
                <Text style={[styles.startBtnText, { color: theme.accent }]}>Start</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Complete workout button */}
        <TouchableOpacity
          onPress={handleCompleteWorkout}
          style={[styles.completeBtn, { backgroundColor: theme.accent }]}
        >
          <Ionicons name="checkmark-circle" size={20} color={theme.bg} />
          <Text style={[styles.completeBtnText, { color: theme.bg }]}>
            Complete Workout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </AndroidSafeView>

  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: spacing.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },
  pageTitle: { fontSize: fontSize.base, fontWeight: '700', textAlign: 'center', flex: 1 },

  // Timer bar
  timerBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  timerItem: { flex: 1, alignItems: 'center' },
  timerDivider: { width: 1, marginHorizontal: spacing.sm },
  timerLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  timerValue: { fontSize: fontSize.lg, fontWeight: '800' },

  // Active banner
  activeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  activeBannerLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(0,0,0,0.6)', letterSpacing: 0.5 },
  activeBannerName: { fontSize: fontSize.lg, fontWeight: '800', color: '#0C0D10' },
  activeBannerRight: { alignItems: 'flex-end' },
  activeBannerTimer: { fontSize: 22, fontWeight: '800', color: '#0C0D10' },
  activeBannerLeft: { fontSize: 9, color: 'rgba(0,0,0,0.6)', fontWeight: '600' },

  // Exercise rows
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  exNumber: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  exNumberText: { fontSize: fontSize.sm, fontWeight: '700' },
  exInfo: { flex: 1 },
  exName: { fontSize: fontSize.base, fontWeight: '700' },
  exMeta: { fontSize: fontSize.xs, marginTop: 2 },
  exProgress: { fontSize: fontSize.xs, marginTop: 4, fontWeight: '600' },
  exDoneText: { fontSize: fontSize.sm, fontWeight: '700', flexShrink: 0 },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexShrink: 0,
  },
  startBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  doneBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  doneBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  completeBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});