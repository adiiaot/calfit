import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── TYPES ─────────────────────────────────────────────────────
interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_group: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  calories_per_minute: number;
  equipment: string;
  description: string;
}

interface ActiveExercise extends Exercise {
  seconds: number;
  calories_burned: number;
  done: boolean;
}

interface WorkoutSession {
  id: string;
  name: string;
  completed_at: string;
  duration_seconds: number;
  calories_burned: number;
  exercises: { name: string; seconds: number; calories: number }[];
}

// ── DIFFICULTY BADGE ──────────────────────────────────────────
function DifficultyBadge({ level, theme }: { level: string; theme: typeof colors.dark }) {
  const colorMap: Record<string, string> = {
    beginner: theme.accent,
    intermediate: theme.orange,
    advanced: theme.red,
  };
  return (
    <View style={[styles.diffBadge, { backgroundColor: (colorMap[level] ?? theme.accent) + '22' }]}>
      <Text style={[styles.diffBadgeText, { color: colorMap[level] ?? theme.accent }]}>
        {level}
      </Text>
    </View>
  );
}

// ── EXERCISE CARD (catalogue) ─────────────────────────────────
function ExerciseCard({
  exercise, theme, isSelected, onToggle,
}: {
  exercise: Exercise;
  theme: typeof colors.dark;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const equipmentIcon: Record<string, any> = {
    none: 'body-outline',
    dumbbells: 'barbell-outline',
    'pull up bar': 'git-commit-outline',
    chair: 'cafe-outline',
    'jump rope': 'infinite-outline',
    box: 'cube-outline',
    table: 'grid-outline',
    'dip bar': 'remove-outline',
  };

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.exerciseCard, {
        backgroundColor: isSelected ? theme.accent + '15' : theme.card,
        borderColor: isSelected ? theme.accent : theme.border,
      }]}
    >
      <View style={styles.exerciseCardLeft}>
        <View style={[styles.exerciseIconWrap, {
          backgroundColor: isSelected ? theme.accent + '22' : theme.border + '44',
        }]}>
          <Ionicons
  name={(equipmentIcon[exercise.equipment] ?? 'body-outline') as any}
  size={20}
  color={isSelected ? theme.accent : theme.textMuted}
/>
        </View>
        <View style={styles.exerciseCardInfo}>
          <Text style={[styles.exerciseCardName, {
            color: isSelected ? theme.accent : theme.textPrimary,
          }]}>
            {exercise.name}
          </Text>
          <Text style={[styles.exerciseCardMeta, { color: theme.textMuted }]}>
            {exercise.muscle_group} · {exercise.calories_per_minute} kcal/min
          </Text>
          <Text style={[styles.exerciseCardDesc, { color: theme.textMuted }]}>
            {exercise.description}
          </Text>
        </View>
      </View>
      <View style={styles.exerciseCardRight}>
        <DifficultyBadge level={exercise.difficulty} theme={theme} />
        <View style={[styles.selectCircle, {
          backgroundColor: isSelected ? theme.accent : 'transparent',
          borderColor: isSelected ? theme.accent : theme.border,
        }]}>
          {isSelected && <Ionicons name="checkmark" size={14} color={theme.bg} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── ACTIVE EXERCISE ROW ───────────────────────────────────────
function ActiveExerciseRow({
  exercise, theme, isActive, onStart, onComplete,
}: {
  exercise: ActiveExercise;
  theme: typeof colors.dark;
  isActive: boolean;
  onStart: () => void;
  onComplete: () => void;
}) {
  const mins = Math.floor(exercise.seconds / 60);
  const secs = exercise.seconds % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={[styles.activeRow, {
      backgroundColor: exercise.done ? theme.accent + '15' : theme.card,
      borderColor: exercise.done ? theme.accent : isActive ? theme.orange : theme.border,
      borderWidth: isActive ? 2 : 1,
    }]}>
      <View style={styles.activeRowLeft}>
        <Text style={[styles.activeRowName, {
          color: exercise.done ? theme.accent : theme.textPrimary,
        }]}>
          {exercise.name}
        </Text>
        <Text style={[styles.activeRowMeta, { color: theme.textMuted }]}>
          {exercise.calories_per_minute} kcal/min
        </Text>
        {exercise.seconds > 0 && (
          <Text style={[styles.activeRowTime, { color: theme.accent }]}>
            ⏱ {timeStr} · {exercise.calories_burned} kcal burned
          </Text>
        )}
      </View>
      {exercise.done ? (
        <View style={[styles.doneCheck, { backgroundColor: theme.accent }]}>
          <Ionicons name="checkmark" size={18} color={theme.bg} />
        </View>
      ) : isActive ? (
        <TouchableOpacity
          onPress={onComplete}
          style={[styles.completeExBtn, { backgroundColor: theme.orange }]}
        >
          <Text style={[styles.completeExBtnText, { color: theme.bg }]}>Done</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onStart}
          style={[styles.startExBtn, { borderColor: theme.accent }]}
        >
          <Text style={[styles.startExBtnText, { color: theme.accent }]}>Start</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── WORKOUT TIMER ─────────────────────────────────────────────
function WorkoutTimer({ theme, seconds, calories }: {
  theme: typeof colors.dark;
  seconds: number;
  calories: number;
}) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const timeStr = hrs > 0
    ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={[styles.timerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.timerLeft}>
        <Text style={[styles.timerLabel, { color: theme.textMuted }]}>WORKOUT TIME</Text>
        <Text style={[styles.timerValue, { color: theme.textPrimary }]}>{timeStr}</Text>
      </View>
      <View style={[styles.timerDivider, { backgroundColor: theme.border }]} />
      <View style={styles.timerRight}>
        <Text style={[styles.timerLabel, { color: theme.textMuted }]}>CALORIES BURNED</Text>
        <Text style={[styles.timerValue, { color: theme.accent }]}>{calories} kcal</Text>
      </View>
    </View>
  );
}

// ── TODAY TAB ─────────────────────────────────────────────────
function TodayTab({
  theme, exercises, activeIndex, workoutSeconds, totalCalories,
  workoutStarted, onStart, onComplete, onCompleteWorkout, onOpenCatalogue, onQuickStart,
}: {
  theme: typeof colors.dark;
  exercises: ActiveExercise[];
  activeIndex: number;
  workoutSeconds: number;
  totalCalories: number;
  workoutStarted: boolean;
  onStart: (index: number) => void;
  onComplete: (index: number) => void;
  onCompleteWorkout: () => void;
  onOpenCatalogue: () => void;
  onQuickStart: (name: string) => void;
}) {
  const quickWorkouts = [
    { name: 'Morning Cardio Blast', meta: 'Jumping Jacks, High Knees +3', duration: '20 min', cal: '200 kcal' },
    { name: 'Full Body Strength', meta: 'Push Ups, Squats +3', duration: '30 min', cal: '250 kcal' },
    { name: 'Core Crusher', meta: 'Crunches, Leg Raises +3', duration: '15 min', cal: '120 kcal' },
    { name: 'Leg Day', meta: 'Squats, Lunges +3', duration: '25 min', cal: '220 kcal' },
  ];

  if (exercises.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <View style={[styles.emptyWorkout, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="barbell-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyWorkoutTitle, { color: theme.textPrimary }]}>
            No exercises yet
          </Text>
          <Text style={[styles.emptyWorkoutSub, { color: theme.textMuted }]}>
            Browse the exercise catalogue or pick a quick start workout below
          </Text>
          <TouchableOpacity
            onPress={onOpenCatalogue}
            style={[styles.browseCatalogueBtn, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="search" size={18} color={theme.bg} />
            <Text style={[styles.browseCatalogueBtnText, { color: theme.bg }]}>
              Browse Exercises
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Quick Start
        </Text>

        {quickWorkouts.map((q) => (
          <TouchableOpacity
            key={q.name}
            onPress={() => onQuickStart(q.name)}
            style={[styles.quickStartCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={[styles.quickStartIcon, { backgroundColor: theme.accentDim as string }]}>
              <Ionicons name="flash" size={20} color={theme.accent} />
            </View>
            <View style={styles.quickStartInfo}>
              <Text style={[styles.quickStartName, { color: theme.textPrimary }]}>{q.name}</Text>
              <Text style={[styles.quickStartMeta, { color: theme.textMuted }]}>{q.meta}</Text>
              <Text style={[styles.quickStartStats, { color: theme.accent }]}>
                ~{q.duration} · ~{q.cal}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {workoutStarted && (
        <WorkoutTimer theme={theme} seconds={workoutSeconds} calories={totalCalories} />
      )}
      <View style={styles.todayHeader}>
        <Text style={[styles.todayTitle, { color: theme.textPrimary }]}>Today's Workout</Text>
        <TouchableOpacity onPress={onOpenCatalogue}>
          <Text style={[styles.addMoreText, { color: theme.accent }]}>+ Add More</Text>
        </TouchableOpacity>
      </View>
      {exercises.map((ex, i) => (
        <ActiveExerciseRow
          key={ex.id}
          exercise={ex}
          theme={theme}
          isActive={i === activeIndex && workoutStarted}
          onStart={() => onStart(i)}
          onComplete={() => onComplete(i)}
        />
      ))}
      <TouchableOpacity
        onPress={onCompleteWorkout}
        style={[styles.completeWorkoutBtn, { backgroundColor: theme.accent }]}
      >
        <Ionicons name="checkmark-circle" size={20} color={theme.bg} />
        <Text style={[styles.completeWorkoutBtnText, { color: theme.bg }]}>
          Complete Workout
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── CATALOGUE TAB ─────────────────────────────────────────────
function CatalogueTab({
  theme, exercises, selectedIds, onToggle, onAddToWorkout,
}: {
  theme: typeof colors.dark;
  exercises: Exercise[];
  selectedIds: Set<string>;
  onToggle: (ex: Exercise) => void;
  onAddToWorkout: () => void;
}) {
  const categories = ['All', 'Cardio', 'Chest', 'Back', 'Core', 'Legs', 'Shoulders', 'Arms', 'Flexibility'];
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? exercises
    : exercises.filter((e) => e.category === activeCategory);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[styles.categoryPill, {
              backgroundColor: activeCategory === cat ? theme.accent : theme.card,
              borderColor: activeCategory === cat ? theme.accent : theme.border,
            }]}
          >
            <Text style={[styles.categoryPillText, {
              color: activeCategory === cat ? theme.bg : theme.textSecondary,
              fontWeight: activeCategory === cat ? '700' : '400',
            }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedIds.size > 0 && (
        <TouchableOpacity
          onPress={onAddToWorkout}
          style={[styles.addSelectedBar, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.addSelectedText, { color: theme.bg }]}>
            Add {selectedIds.size} exercise{selectedIds.size > 1 ? 's' : ''} to workout →
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.tabContent}>
        {filtered.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            theme={theme}
            isSelected={selectedIds.has(ex.id)}
            onToggle={() => onToggle(ex)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ── CALORIES TAB ──────────────────────────────────────────────
function CaloriesTab({ theme, totalCalories, weeklyData }: {
  theme: typeof colors.dark;
  totalCalories: number;
  weeklyData: number[];
}) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const max = Math.max(...weeklyData, 1);
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Calories Burned Today</Text>
        <Text style={[styles.bigStat, { color: theme.accent }]}>{totalCalories} kcal</Text>
        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
          <View style={[styles.progressBarFill, {
            backgroundColor: theme.accent,
            width: `${Math.min((totalCalories / 500) * 100, 100)}%` as any,
          }]} />
        </View>
        <Text style={[styles.progressSub, { color: theme.textMuted }]}>
          {Math.round((totalCalories / 500) * 100)}% of 500 kcal daily burn goal
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>This Week</Text>

      <View style={[styles.barChartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.barChart}>
          {weeklyData.map((val, i) => (
            <View key={i} style={styles.barWrap}>
              <View style={styles.barInner}>
                <View style={[styles.bar, {
                  height: `${(val / max) * 100}%` as any,
                  backgroundColor: i === todayIndex ? theme.accent : theme.border,
                  opacity: i === todayIndex ? 1 : 0.6,
                }]} />
              </View>
              <Text style={[styles.barLabel, {
                color: i === todayIndex ? theme.accent : theme.textMuted,
                fontWeight: i === todayIndex ? '700' : '400',
              }]}>
                {days[i]}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.weeklyAvg, { color: theme.textMuted }]}>
          Weekly total: {weeklyData.reduce((a, b) => a + b, 0)} kcal burned
        </Text>
      </View>
    </ScrollView>
  );
}

// ── STEPS TAB ─────────────────────────────────────────────────
function StepsTab({ theme }: { theme: typeof colors.dark }) {
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Steps Today</Text>
        <Text style={[styles.bigStat, { color: theme.accent }]}>0</Text>
        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
          <View style={[styles.progressBarFill, { backgroundColor: theme.accent, width: '0%' as any }]} />
        </View>
        <Text style={[styles.progressSub, { color: theme.textMuted }]}>0 of 10,000 daily goal</Text>
        <View style={[styles.stepsSensorCard, {
          backgroundColor: theme.accentDim as string,
          borderColor: theme.accent,
        }]}>
          <Ionicons name="footsteps-outline" size={20} color={theme.accent} />
          <Text style={[styles.stepsSensorText, { color: theme.textPrimary }]}>
            Automatic step tracking via phone sensors will be activated in the next update. Steps will count in the background automatically.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ── HISTORY TAB ───────────────────────────────────────────────
function HistoryTab({ theme, sessions }: {
  theme: typeof colors.dark;
  sessions: WorkoutSession[];
}) {
  if (sessions.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <View style={[styles.emptyWorkout, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="time-outline" size={44} color={theme.textMuted} />
          <Text style={[styles.emptyWorkoutTitle, { color: theme.textPrimary }]}>
            No workout history yet
          </Text>
          <Text style={[styles.emptyWorkoutSub, { color: theme.textMuted }]}>
            Complete your first workout and it will appear here with a full breakdown.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {sessions.map((session) => {
        const date = new Date(session.completed_at);
        const hrs = Math.floor(session.duration_seconds / 3600);
        const mins = Math.floor((session.duration_seconds % 3600) / 60);
        const secs = session.duration_seconds % 60;
        const timeDisplay = hrs > 0
          ? `${hrs}h ${mins}m`
          : mins > 0
          ? `${mins} min ${secs}s`
          : `${secs}s`;

        return (
          <View key={session.id} style={[styles.historyCard, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <View style={styles.historyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyName, { color: theme.textPrimary }]}>
                  {session.name}
                </Text>
                <Text style={[styles.historyDate, { color: theme.textMuted }]}>
                  {date.toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={[styles.historyCalBadge, { backgroundColor: theme.accentDim as string }]}>
                <Text style={[styles.historyCalNum, { color: theme.accent }]}>
                  {session.calories_burned}
                </Text>
                <Text style={[styles.historyCalUnit, { color: theme.accent }]}>kcal</Text>
              </View>
            </View>

            <View style={styles.historyStats}>
              {[
                { icon: 'time-outline', label: timeDisplay },
                { icon: 'barbell-outline', label: `${session.exercises.length} exercises` },
              ].map((s) => (
                <View key={s.label} style={styles.historyStat}>
                  <Ionicons name={s.icon as any} size={14} color={theme.textMuted} />
                  <Text style={[styles.historyStatText, { color: theme.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.historyExercises}>
              {session.exercises.map((ex, i) => {
                const exMins = Math.floor(ex.seconds / 60);
                const exSecs = ex.seconds % 60;
                const exTime = exMins > 0
                  ? `${exMins}m ${exSecs}s`
                  : `${exSecs}s`;
                return (
                  <Text key={i} style={[styles.historyExName, { color: theme.textSecondary }]}>
                    {ex.name} · {exTime} · {ex.calories} kcal
                  </Text>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── INNER TAB BAR ─────────────────────────────────────────────
function InnerTabs({ tabs, active, onPress, theme }: {
  tabs: string[];
  active: string;
  onPress: (tab: string) => void;
  theme: typeof colors.dark;
}) {
  return (
    <View style={[styles.innerTabBar, { borderBottomColor: theme.border }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onPress(tab)}
          style={[styles.innerTab, active === tab && { borderBottomColor: theme.accent }]}
        >
          <Text style={[
            styles.innerTabText,
            { color: active === tab ? theme.textPrimary : theme.textMuted },
            active === tab && { fontWeight: '700' },
          ]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function WorkoutScreen() {
  const { colorScheme } = useThemeStore();
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const theme = colors[colorScheme];

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) loadHistory();
    }, [user?.id])
  );

  const [activeTab, setActiveTab] = useState('Today');
  const tabs = ['Today', 'Catalogue', 'Calories', 'Steps', 'History'];

  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [workoutExercises, setWorkoutExercises] = useState<ActiveExercise[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(-1);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [weeklyCalories, setWeeklyCalories] = useState([0, 0, 0, 0, 0, 0, 0]);

  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exerciseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadCatalogue();
    if (user?.id) loadHistory();
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
      if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    };
  }, [user?.id]);

  const loadCatalogue = async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase.from('exercises').select('*').order('category');
      if (data) setCatalogue(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  };

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(20);

      if (data) {
        setSessions(data.map((s: any) => ({
          id: s.id,
          name: s.name,
          completed_at: s.completed_at,
          duration_seconds: s.duration_seconds,
          calories_burned: s.calories_burned,
          exercises: s.exercises ?? [],
        })));

        const weekly = [0, 0, 0, 0, 0, 0, 0];
        const now = new Date();
        data.forEach((s: any) => {
          const d = new Date(s.completed_at);
          const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
          if (diffDays < 7) {
            const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
            weekly[dayIndex] += s.calories_burned ?? 0;
          }
        });
        setWeeklyCalories(weekly);

        const today = new Date().toDateString();
        const todayTotal = data
          .filter((s: any) => new Date(s.completed_at).toDateString() === today)
          .reduce((sum: number, s: any) => sum + (s.calories_burned ?? 0), 0);
        setTotalCaloriesBurned(todayTotal);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleToggleExercise = (exercise: Exercise) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exercise.id)) next.delete(exercise.id);
      else next.add(exercise.id);
      return next;
    });
  };

  const handleAddToWorkout = () => {
    const toAdd = catalogue
      .filter((e) => selectedIds.has(e.id))
      .filter((e) => !workoutExercises.some((we) => we.id === e.id))
      .map((e) => ({ ...e, seconds: 0, calories_burned: 0, done: false }));
    setWorkoutExercises((prev) => [...prev, ...toAdd]);
    setSelectedIds(new Set());
    setActiveTab('Today');
  };

  const handleStartExercise = (index: number) => {
    if (!workoutStarted) {
      setWorkoutStarted(true);
      workoutTimerRef.current = setInterval(() => {
        setWorkoutSeconds((prev) => prev + 1);
      }, 1000);
    }
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    setActiveExerciseIndex(index);
    exerciseTimerRef.current = setInterval(() => {
      setWorkoutExercises((prev) =>
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
    setWorkoutExercises((prev) =>
      prev.map((ex, i) => i === index ? { ...ex, done: true } : ex)
    );
    setActiveExerciseIndex(-1);
  };

  const handleCompleteWorkout = async () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);

    const totalCal = workoutExercises.reduce((sum, ex) => sum + ex.calories_burned, 0);
    const sessionName = workoutExercises.length > 0
      ? `${workoutExercises[0].category} Workout`
      : 'Workout Session';

    // Format time properly
    const hrs = Math.floor(workoutSeconds / 3600);
    const mins = Math.floor((workoutSeconds % 3600) / 60);
    const secs = workoutSeconds % 60;
    const timeStr = hrs > 0
      ? `${hrs}h ${mins}m ${secs}s`
      : mins > 0
      ? `${mins} min ${secs}s`
      : `${secs}s`;

    const sessionData = {
      name: sessionName,
      completed_at: new Date().toISOString(),
      duration_seconds: workoutSeconds,
      calories_burned: totalCal,
      exercises: workoutExercises.map((ex) => ({
        name: ex.name,
        seconds: ex.seconds,
        calories: ex.calories_burned,
      })),
    };

    try {
      if (user?.id) {
        const { supabase } = await import('../../services/supabase');
        await supabase.from('workout_sessions').insert({
          user_id: user.id,
          ...sessionData,
          status: 'completed',
        });
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }

    Alert.alert(
      '🎉 Workout Complete!',
      `Great work!\n\nWorkout: ${sessionName}\nTime: ${timeStr}\nCalories burned: ${totalCal} kcal\nExercises: ${workoutExercises.length}`,
      [{
        text: 'Awesome!',
        onPress: () => {
          setSessions((prev) => [{ id: Date.now().toString(), ...sessionData }, ...prev]);
          setTotalCaloriesBurned((prev) => prev + totalCal);
          setWorkoutExercises([]);
          setWorkoutSeconds(0);
          setWorkoutStarted(false);
          setActiveExerciseIndex(-1);
          setActiveTab('History');
        },
      }]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Activity</Text>
      </View>

      <InnerTabs tabs={tabs} active={activeTab} onPress={setActiveTab} theme={theme} />

      {activeTab === 'Today' && (
        <TodayTab
          theme={theme}
          exercises={workoutExercises}
          activeIndex={activeExerciseIndex}
          workoutSeconds={workoutSeconds}
          totalCalories={workoutExercises.reduce((sum, ex) => sum + ex.calories_burned, 0)}
          workoutStarted={workoutStarted}
          onStart={handleStartExercise}
          onComplete={handleCompleteExercise}
          onCompleteWorkout={handleCompleteWorkout}
          onOpenCatalogue={() => setActiveTab('Catalogue')}
          onQuickStart={(name) => navigation.getParent()?.navigate('QuickStart', { name })}
        />
      )}

      {activeTab === 'Catalogue' && (
        <CatalogueTab
          theme={theme}
          exercises={catalogue}
          selectedIds={selectedIds}
          onToggle={handleToggleExercise}
          onAddToWorkout={handleAddToWorkout}
        />
      )}

      {activeTab === 'Calories' && (
        <CaloriesTab
          theme={theme}
          totalCalories={totalCaloriesBurned}
          weeklyData={weeklyCalories}
        />
      )}

      {activeTab === 'Steps' && <StepsTab theme={theme} />}

      {activeTab === 'History' && (
        <HistoryTab theme={theme} sessions={sessions} />
      )}
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },

  innerTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  innerTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
    flex: 1,
    alignItems: 'center',
  },
  innerTabText: { fontSize: fontSize.sm },

  tabContent: { paddingBottom: 100, paddingTop: spacing.sm },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bigStat: { fontSize: 28, fontWeight: '800', marginBottom: spacing.sm },
  progressBarBg: { height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressSub: { fontSize: fontSize.xs },

  barChartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: spacing.xs },
  barWrap: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barInner: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9 },
  weeklyAvg: { fontSize: fontSize.xs, textAlign: 'right', marginTop: spacing.sm },

  emptyWorkout: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.xxl,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyWorkoutTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  emptyWorkoutSub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
  browseCatalogueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  browseCatalogueBtnText: { fontSize: fontSize.lg, fontWeight: '700' },

  quickStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  quickStartIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  quickStartInfo: { flex: 1 },
  quickStartName: { fontSize: fontSize.base, fontWeight: '700' },
  quickStartMeta: { fontSize: fontSize.xs, marginTop: 2 },
  quickStartStats: { fontSize: fontSize.xs, marginTop: 2, fontWeight: '600' },

  timerCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  timerLeft: { flex: 1, alignItems: 'center' },
  timerRight: { flex: 1, alignItems: 'center' },
  timerDivider: { width: 1, marginHorizontal: spacing.md },
  timerLabel: { fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  timerValue: { fontSize: 22, fontWeight: '800' },

  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  todayTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  addMoreText: { fontSize: fontSize.sm, fontWeight: '600' },

  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  activeRowLeft: { flex: 1 },
  activeRowName: { fontSize: fontSize.base, fontWeight: '700' },
  activeRowMeta: { fontSize: fontSize.xs, marginTop: 2 },
  activeRowTime: { fontSize: fontSize.xs, marginTop: 4, fontWeight: '600' },
  doneCheck: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  completeExBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  completeExBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  startExBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  startExBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  completeWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  completeWorkoutBtnText: { fontSize: fontSize.lg, fontWeight: '700' },

  categoryRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
  },
  categoryPillText: { fontSize: fontSize.sm },
  addSelectedBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  addSelectedText: { fontSize: fontSize.base, fontWeight: '700' },

  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  exerciseCardLeft: { flexDirection: 'row', flex: 1, gap: spacing.md, alignItems: 'flex-start' },
  exerciseIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  exerciseCardInfo: { flex: 1 },
  exerciseCardName: { fontSize: fontSize.base, fontWeight: '700' },
  exerciseCardMeta: { fontSize: fontSize.xs, marginTop: 2 },
  exerciseCardDesc: { fontSize: fontSize.xs, marginTop: 2 },
  exerciseCardRight: { alignItems: 'flex-end', gap: spacing.sm, flexShrink: 0 },
  diffBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  diffBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  selectCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },

  stepsSensorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  stepsSensorText: { fontSize: fontSize.sm, flex: 1, lineHeight: 18 },

  historyCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  historyName: { fontSize: fontSize.lg, fontWeight: '700' },
  historyDate: { fontSize: fontSize.xs, marginTop: 2 },
  historyCalBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  historyCalNum: { fontSize: fontSize.xl, fontWeight: '800' },
  historyCalUnit: { fontSize: 9, fontWeight: '600' },
  historyStats: { flexDirection: 'row', gap: spacing.lg },
  historyStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyStatText: { fontSize: fontSize.xs },
  historyExercises: { gap: 4 },
  historyExName: { fontSize: fontSize.xs },
});