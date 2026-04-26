import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import * as Speech from 'expo-speech';
import { useSteps } from '../../hooks/useSteps';

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

interface SavedRoutine {
  id: string;
  name: string;
  description?: string;
  exercises: { name: string; calories_per_minute: number; category: string }[];
  duration_est?: number;
  calories_est?: number;
  created_at: string;
}

// ── VOICE COACH ───────────────────────────────────────────────
const speak = (text: string) => {
  Speech.stop();
  Speech.speak(text, { language: 'en-US', pitch: 1.05, rate: 0.92 });
};

// ── DIFFICULTY BADGE ──────────────────────────────────────────
function DifficultyBadge({ level, theme }: { level: string; theme: typeof colors.light }) {
  const colorMap: Record<string, string> = {
    beginner: theme.accent,
    intermediate: theme.amber,  // FIXED: was theme.orange
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

// ── EXERCISE CARD ─────────────────────────────────────────────
function ExerciseCard({ exercise, theme, isSelected, onToggle }: {
  exercise: Exercise; theme: typeof colors.light; isSelected: boolean; onToggle: () => void;
}) {
  const equipmentIcon: Record<string, any> = {
    none: 'body-outline', dumbbells: 'barbell-outline', 'pull up bar': 'git-commit-outline',
    chair: 'cafe-outline', 'jump rope': 'infinite-outline', box: 'cube-outline',
    table: 'grid-outline', 'dip bar': 'remove-outline',
  };
  return (
    <TouchableOpacity onPress={onToggle}
      style={[styles.exerciseCard, {
        backgroundColor: isSelected ? theme.accent + '15' : theme.card,
        borderColor: isSelected ? theme.accent : theme.border,
      }]}>
      <View style={styles.exerciseCardLeft}>
        <View style={[styles.exerciseIconWrap, { backgroundColor: isSelected ? theme.accent + '22' : theme.border + '44' }]}>
          <Ionicons name={(equipmentIcon[exercise.equipment] ?? 'body-outline') as any} size={20} color={isSelected ? theme.accent : theme.textMuted} />
        </View>
        <View style={styles.exerciseCardInfo}>
          <Text style={[styles.exerciseCardName, { color: isSelected ? theme.accent : theme.textPrimary }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseCardMeta, { color: theme.textMuted }]}>{exercise.muscle_group} · {exercise.calories_per_minute} kcal/min</Text>
          <Text style={[styles.exerciseCardDesc, { color: theme.textMuted }]}>{exercise.description}</Text>
        </View>
      </View>
      <View style={styles.exerciseCardRight}>
        <DifficultyBadge level={exercise.difficulty} theme={theme} />
        <View style={[styles.selectCircle, { backgroundColor: isSelected ? theme.accent : 'transparent', borderColor: isSelected ? theme.accent : theme.border }]}>
          {isSelected && <Ionicons name="checkmark" size={14} color={theme.bg} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── ACTIVE EXERCISE ROW ───────────────────────────────────────
function ActiveExerciseRow({ exercise, theme, isActive, onStart, onComplete }: {
  exercise: ActiveExercise; theme: typeof colors.light; isActive: boolean; onStart: () => void; onComplete: () => void;
}) {
  const mins = Math.floor(exercise.seconds / 60);
  const secs = exercise.seconds % 60;
  return (
    <View style={[styles.activeRow, {
      backgroundColor: exercise.done ? theme.accent + '15' : theme.card,
      borderColor: exercise.done ? theme.accent : isActive ? theme.amber : theme.border, // FIXED
      borderWidth: isActive ? 2 : 1,
    }]}>
      <View style={styles.activeRowLeft}>
        <Text style={[styles.activeRowName, { color: exercise.done ? theme.accent : theme.textPrimary }]}>{exercise.name}</Text>
        <Text style={[styles.activeRowMeta, { color: theme.textMuted }]}>{exercise.calories_per_minute} kcal/min</Text>
        {exercise.seconds > 0 && (
          <Text style={[styles.activeRowTime, { color: theme.accent }]}>
            ⏱ {mins}:{secs.toString().padStart(2, '0')} · {exercise.calories_burned} kcal burned
          </Text>
        )}
      </View>
      {exercise.done ? (
        <View style={[styles.doneCheck, { backgroundColor: theme.accent }]}>
          <Ionicons name="checkmark" size={18} color={theme.bg} />
        </View>
      ) : isActive ? (
        <TouchableOpacity onPress={onComplete} style={[styles.completeExBtn, { backgroundColor: theme.amber }]}>
          <Text style={[styles.completeExBtnText, { color: '#fff' }]}>Done</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onStart} style={[styles.startExBtn, { borderColor: theme.accent }]}>
          <Text style={[styles.startExBtnText, { color: theme.accent }]}>Start</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── WORKOUT TIMER ─────────────────────────────────────────────
function WorkoutTimer({ theme, seconds, calories }: { theme: typeof colors.light; seconds: number; calories: number }) {
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

// ── MY ROUTINES TAB ───────────────────────────────────────────
// CHANGED: Replaces "Today" tab per corrections doc
// Shows saved workout sets. Empty state → Create Workout Set CTA.
// Create options: Build Manually (→ Catalogue) or CalFit Coach.
function MyRoutinesTab({ theme, routines, onCreateManual, onCreateWithCoach, onStartRoutine, onDeleteRoutine }: {
  theme: typeof colors.light;
  routines: SavedRoutine[];
  onCreateManual: () => void;
  onCreateWithCoach: () => void;
  onStartRoutine: (routine: SavedRoutine) => void;
  onDeleteRoutine: (id: string) => void;
}) {
  if (routines.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <View style={[styles.emptyRoutines, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="barbell-outline" size={52} color={theme.textMuted} />
          <Text style={[styles.emptyRoutinesTitle, { color: theme.textPrimary }]}>No routines yet</Text>
          <Text style={[styles.emptyRoutinesSub, { color: theme.textMuted }]}>
            Create a workout set to quickly access your saved workouts anytime.
          </Text>
          <TouchableOpacity
            onPress={onCreateManual}
            style={[styles.createRoutineBtn, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createRoutineBtnText}>Create Workout Set</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCreateWithCoach}
            style={[styles.createWithCoachBtn, { borderColor: theme.accent }]}
          >
            <Ionicons name="sparkles-outline" size={18} color={theme.accent} />
            <Text style={[styles.createWithCoachText, { color: theme.accent }]}>Let CalFit Coach Create It</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Create New Routine button — always visible */}
      <View style={styles.routinesTopRow}>
        <Text style={[styles.routinesCount, { color: theme.textSecondary }]}>
          {routines.length} routine{routines.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          onPress={onCreateManual}
          style={[styles.addRoutineBtn, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}
        >
          <Ionicons name="add" size={16} color={theme.accent} />
          <Text style={[styles.addRoutineBtnText, { color: theme.accent }]}>New Routine</Text>
        </TouchableOpacity>
      </View>

      {routines.map((routine) => (
        <View key={routine.id} style={[styles.routineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.routineCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.routineCardName, { color: theme.textPrimary }]}>{routine.name}</Text>
              {routine.description ? (
                <Text style={[styles.routineCardDesc, { color: theme.textSecondary }]}>{routine.description}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert('Delete routine?', `Remove "${routine.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDeleteRoutine(routine.id) },
              ])}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Exercise preview */}
          <View style={styles.routineExerciseList}>
            {routine.exercises.slice(0, 3).map((ex, i) => (
              <View key={i} style={styles.routineExerciseRow}>
                <View style={[styles.routineExDot, { backgroundColor: theme.accent }]} />
                <Text style={[styles.routineExName, { color: theme.textSecondary }]}>{ex.name}</Text>
              </View>
            ))}
            {routine.exercises.length > 3 && (
              <Text style={[styles.routineMoreText, { color: theme.textMuted }]}>
                +{routine.exercises.length - 3} more exercises
              </Text>
            )}
          </View>

          {/* Stats row */}
          <View style={styles.routineStatsRow}>
            {routine.duration_est ? (
              <View style={styles.routineStat}>
                <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.routineStatText, { color: theme.textMuted }]}>~{routine.duration_est} min</Text>
              </View>
            ) : null}
            {routine.calories_est ? (
              <View style={styles.routineStat}>
                <Ionicons name="flame-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.routineStatText, { color: theme.textMuted }]}>~{routine.calories_est} kcal</Text>
              </View>
            ) : null}
            <View style={styles.routineStat}>
              <Ionicons name="barbell-outline" size={14} color={theme.textMuted} />
              <Text style={[styles.routineStatText, { color: theme.textMuted }]}>{routine.exercises.length} exercises</Text>
            </View>
          </View>

          {/* Start button */}
          <TouchableOpacity
            onPress={() => onStartRoutine(routine)}
            style={[styles.startRoutineBtn, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="play-circle" size={18} color="#fff" />
            <Text style={styles.startRoutineBtnText}>Start Routine</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Coach option */}
      <TouchableOpacity
        onPress={onCreateWithCoach}
        style={[styles.coachCreateCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={[styles.coachCreateIcon, { backgroundColor: theme.accentDim as string }]}>
          <Ionicons name="sparkles" size={22} color={theme.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.coachCreateTitle, { color: theme.textPrimary }]}>Let CalFit Coach Create It</Text>
          <Text style={[styles.coachCreateSub, { color: theme.textSecondary }]}>Answer a few questions and get a custom routine built for you</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── CREATE ROUTINE MODAL ──────────────────────────────────────
// Shown when user taps "Create Manually" — name input + goes to Catalogue
function CreateRoutineModal({ visible, theme, onClose, onConfirm }: {
  visible: boolean; theme: typeof colors.light;
  onClose: () => void; onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Name your routine</Text>
          <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
            e.g. Leg Day, Cardio Blast, Full Body
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Routine name"
            placeholderTextColor={theme.textMuted}
            style={[styles.modalInput, { color: theme.textPrimary, borderColor: name ? theme.accent : theme.border, backgroundColor: theme.bg }]}
            autoFocus
          />
          <View style={styles.modalBtnRow}>
            <TouchableOpacity onPress={onClose} style={[styles.modalCancelBtn, { borderColor: theme.border }]}>
              <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (name.trim()) { onConfirm(name.trim()); setName(''); } }}
              style={[styles.modalConfirmBtn, { backgroundColor: theme.accent }]}
              disabled={!name.trim()}
            >
              <Text style={styles.modalConfirmText}>Pick Exercises →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── COACH ROUTINE MODAL ───────────────────────────────────────
// Asks 8 questions → generates routine via Claude
function CoachRoutineModal({ visible, theme, onClose, onSave }: {
  visible: boolean; theme: typeof colors.light;
  onClose: () => void; onSave: (routine: Partial<SavedRoutine>) => void;
}) {
  const questions = [
    { key: 'goal',      label: 'What is your fitness goal?',       options: ['Lose weight', 'Build muscle', 'Get fit', 'Endurance'] },
    { key: 'style',     label: 'Preferred activity style?',        options: ['Strength training', 'Cardio', 'HIIT', 'Flexibility'] },
    { key: 'location',  label: 'Home or gym?',                     options: ['Home', 'Gym', 'Both'] },
    { key: 'level',     label: 'Your experience level?',           options: ['Beginner', 'Intermediate', 'Advanced'] },
    { key: 'area',      label: 'Target body area?',                options: ['Full body', 'Upper body', 'Lower body', 'Core'] },
    { key: 'duration',  label: 'Workout duration?',                options: ['15 min', '30 min', '45 min', '60 min'] },
    { key: 'equipment', label: 'Equipment available?',             options: ['None', 'Dumbbells', 'Full gym', 'Resistance bands'] },
    { key: 'count',     label: 'How many exercises?',              options: ['4–5', '6–8', '8–10', '10+'] },
  ];

  const [qIndex, setQIndex]   = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any>(null);

  const handleAnswer = async (answer: string) => {
    const newAnswers = { ...answers, [questions[qIndex].key]: answer };
    setAnswers(newAnswers);

    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
      return;
    }

    // All questions answered — generate routine
    setLoading(true);
    try {
      const { supabase } = await import('../../services/supabase');
      const prompt = `Generate a workout routine based on these preferences:
Goal: ${newAnswers.goal}
Style: ${newAnswers.style}
Location: ${newAnswers.location}
Level: ${newAnswers.level}
Target area: ${newAnswers.area}
Duration: ${newAnswers.duration}
Equipment: ${newAnswers.equipment}
Exercise count: ${newAnswers.count}

Respond ONLY with a JSON object like:
{
  "name": "routine name",
  "description": "brief description",
  "exercises": [{"name": "Exercise Name", "calories_per_minute": 8, "category": "Legs"}],
  "duration_est": 30,
  "calories_est": 250
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setGenerated(parsed);
    } catch (e) {
      Alert.alert('Error', 'Could not generate routine. Please try again.');
      resetModal();
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setQIndex(0);
    setAnswers({});
    setGenerated(null);
    setLoading(false);
  };

  const handleEdit = () => {
    resetModal(); // go back to questions
  };

  const handlePerfect = () => {
    if (generated) {
      onSave(generated);
      resetModal();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          {loading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator color={theme.accent} size="large" />
              <Text style={[styles.modalLoadingText, { color: theme.textPrimary }]}>Building your routine...</Text>
            </View>
          ) : generated ? (
            // Edit / Perfect screen
            <ScrollView>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>🎉 Your Routine is Ready</Text>
              <Text style={[styles.generatedName, { color: theme.accent }]}>{generated.name}</Text>
              <Text style={[styles.modalSub, { color: theme.textSecondary }]}>{generated.description}</Text>
              {generated.exercises?.map((ex: any, i: number) => (
                <View key={i} style={styles.routineExerciseRow}>
                  <View style={[styles.routineExDot, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.routineExName, { color: theme.textSecondary }]}>{ex.name}</Text>
                </View>
              ))}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity onPress={handleEdit} style={[styles.modalCancelBtn, { borderColor: theme.border }]}>
                  <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePerfect} style={[styles.modalConfirmBtn, { backgroundColor: theme.accent }]}>
                  <Text style={styles.modalConfirmText}>Perfect ✓</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            // Question flow
            <>
              <View style={styles.coachQProgress}>
                {questions.map((_, i) => (
                  <View key={i} style={[styles.coachQDot, {
                    backgroundColor: i <= qIndex ? theme.accent : theme.border,
                    width: i === qIndex ? 20 : 6,
                  }]} />
                ))}
              </View>
              <Text style={[styles.coachQLabel, { color: theme.textMuted }]}>
                {qIndex + 1} of {questions.length}
              </Text>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {questions[qIndex].label}
              </Text>
              <View style={styles.coachQOptions}>
                {questions[qIndex].options.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => handleAnswer(opt)}
                    style={[styles.coachQOption, {
                      backgroundColor: answers[questions[qIndex].key] === opt ? theme.accent : theme.bg,
                      borderColor: answers[questions[qIndex].key] === opt ? theme.accent : theme.border,
                    }]}
                  >
                    <Text style={[styles.coachQOptionText, {
                      color: answers[questions[qIndex].key] === opt ? '#fff' : theme.textPrimary,
                    }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => { resetModal(); onClose(); }} style={styles.modalCancelLink}>
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── ACTIVE WORKOUT TAB ────────────────────────────────────────
// Shown when user starts a routine from My Routines
function ActiveWorkoutTab({ theme, exercises, activeIndex, workoutSeconds, workoutStarted, onStart, onComplete, onCompleteWorkout, onOpenCatalogue }: {
  theme: typeof colors.light; exercises: ActiveExercise[]; activeIndex: number;
  workoutSeconds: number; workoutStarted: boolean;
  onStart: (i: number) => void; onComplete: (i: number) => void;
  onCompleteWorkout: () => void; onOpenCatalogue: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {workoutStarted && (
        <WorkoutTimer theme={theme} seconds={workoutSeconds} calories={exercises.reduce((sum, ex) => sum + ex.calories_burned, 0)} />
      )}
      <View style={styles.todayHeader}>
        <Text style={[styles.todayTitle, { color: theme.textPrimary }]}>Active Workout</Text>
        <TouchableOpacity onPress={onOpenCatalogue}>
          <Text style={[styles.addMoreText, { color: theme.accent }]}>+ Add Exercise</Text>
        </TouchableOpacity>
      </View>
      {exercises.map((ex, i) => (
        <ActiveExerciseRow key={ex.id} exercise={ex} theme={theme}
          isActive={i === activeIndex && workoutStarted}
          onStart={() => onStart(i)} onComplete={() => onComplete(i)} />
      ))}
      <TouchableOpacity onPress={onCompleteWorkout} style={[styles.completeWorkoutBtn, { backgroundColor: theme.accent }]}>
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <Text style={[styles.completeWorkoutBtnText, { color: '#fff' }]}>Complete Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── CATALOGUE TAB ─────────────────────────────────────────────
function CatalogueTab({ theme, exercises, selectedIds, onToggle, onAddToWorkout, routineName }: {
  theme: typeof colors.light; exercises: Exercise[]; selectedIds: Set<string>;
  onToggle: (ex: Exercise) => void; onAddToWorkout: () => void; routineName?: string;
}) {
  const categories = ['All', 'Cardio', 'Chest', 'Back', 'Core', 'Legs', 'Shoulders', 'Arms', 'Flexibility'];
  const [activeCategory, setActiveCategory] = useState('All');
  const [customName, setCustomName] = useState('');

  const filtered = activeCategory === 'All' ? exercises : exercises.filter((e) => e.category === activeCategory);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
            style={[styles.categoryPill, {
              backgroundColor: activeCategory === cat ? theme.accent : theme.card,
              borderColor: activeCategory === cat ? theme.accent : theme.border,
            }]}>
            <Text style={[styles.categoryPillText, {
              color: activeCategory === cat ? '#fff' : theme.textSecondary,
              fontWeight: activeCategory === cat ? '700' : '400',
            }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedIds.size > 0 && (
        <TouchableOpacity onPress={onAddToWorkout} style={[styles.addSelectedBar, { backgroundColor: theme.accent }]}>
          <Text style={[styles.addSelectedText, { color: '#fff' }]}>
            Add {selectedIds.size} exercise{selectedIds.size > 1 ? 's' : ''} {routineName ? `to "${routineName}"` : 'to workout'} →
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.tabContent}>
        {filtered.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} theme={theme}
            isSelected={selectedIds.has(ex.id)} onToggle={() => onToggle(ex)} />
        ))}
        {/* Add manually option */}
        <View style={[styles.addManuallyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.addManuallyLabel, { color: theme.textSecondary }]}>Can't find an exercise? Add it manually:</Text>
          <View style={styles.addManuallyRow}>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="Exercise name"
              placeholderTextColor={theme.textMuted}
              style={[styles.addManuallyInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bg }]}
            />
            <TouchableOpacity
              onPress={() => {
                if (customName.trim()) {
                  const custom: Exercise = {
                    id: `custom_${Date.now()}`, name: customName.trim(),
                    category: 'Custom', muscle_group: 'Custom',
                    difficulty: 'beginner', calories_per_minute: 6,
                    equipment: 'none', description: 'Custom exercise',
                  };
                  onToggle(custom);
                  setCustomName('');
                }
              }}
              style={[styles.addManuallyBtn, { backgroundColor: theme.accent }]}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── CALORIES TAB ──────────────────────────────────────────────
function CaloriesTab({ theme, totalCalories, weeklyData }: { theme: typeof colors.light; totalCalories: number; weeklyData: number[] }) {
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
          <View style={[styles.progressBarFill, { backgroundColor: theme.accent, width: `${Math.min((totalCalories / 500) * 100, 100)}%` as any }]} />
        </View>
        <Text style={[styles.progressSub, { color: theme.textMuted }]}>{Math.round((totalCalories / 500) * 100)}% of 500 kcal daily burn goal</Text>
      </View>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>This Week</Text>
      <View style={[styles.barChartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.barChart}>
          {weeklyData.map((val, i) => (
            <View key={i} style={styles.barWrap}>
              <View style={styles.barInner}>
                <View style={[styles.bar, { height: `${(val / max) * 100}%` as any, backgroundColor: i === todayIndex ? theme.accent : theme.border, opacity: i === todayIndex ? 1 : 0.6 }]} />
              </View>
              <Text style={[styles.barLabel, { color: i === todayIndex ? theme.accent : theme.textMuted, fontWeight: i === todayIndex ? '700' : '400' }]}>{days[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.weeklyAvg, { color: theme.textMuted }]}>Weekly total: {weeklyData.reduce((a, b) => a + b, 0)} kcal burned</Text>
      </View>
    </ScrollView>
  );
}

// ── STEPS TAB ─────────────────────────────────────────────────
function StepsTab({ theme, userId, goalSteps }: { theme: typeof colors.light; userId: string; goalSteps: number }) {
  const { steps, calories, percentage, isAvailable, hasPermission, isLoading } = useSteps(goalSteps);
  const stepsFormatted = steps >= 1000 ? `${(steps / 1000).toFixed(1)}K` : steps.toString();

  useEffect(() => {
    if (!userId || steps === 0) return;
    const save = async () => {
      const { saveStepsToSupabase } = await import('../../services/stepService');
      await saveStepsToSupabase(userId, steps, goalSteps);
    };
    save();
  }, [steps]);

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Steps Today</Text>
        <Text style={[styles.bigStat, { color: theme.accent }]}>{isLoading ? '...' : stepsFormatted}</Text>
        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
          <View style={[styles.progressBarFill, { backgroundColor: theme.accent, width: `${Math.min(percentage, 100)}%` as any }]} />
        </View>
        <Text style={[styles.progressSub, { color: theme.textMuted }]}>{steps.toLocaleString()} of {goalSteps.toLocaleString()} daily goal · {percentage}%</Text>
        <View style={[styles.stepsCalRow, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
          <Ionicons name="flame-outline" size={16} color={theme.accent} />
          <Text style={[styles.stepsCalText, { color: theme.accent }]}>{calories} kcal burned from steps today</Text>
        </View>
        {!isAvailable ? (
          <View style={[styles.stepsSensorCard, { backgroundColor: theme.amber + '18', borderColor: theme.amber }]}>
            <Ionicons name="warning-outline" size={20} color={theme.amber} />
            <Text style={[styles.stepsSensorText, { color: theme.textPrimary }]}>Step counting is not available on this device.</Text>
          </View>
        ) : !hasPermission ? (
          <View style={[styles.stepsSensorCard, { backgroundColor: theme.amber + '18', borderColor: theme.amber }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.amber} />
            <Text style={[styles.stepsSensorText, { color: theme.textPrimary }]}>Motion permission required. Enable in Settings → CalFit → Motion & Fitness.</Text>
          </View>
        ) : (
          <View style={[styles.stepsSensorCard, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
            <Ionicons name="footsteps-outline" size={20} color={theme.accent} />
            <Text style={[styles.stepsSensorText, { color: theme.textPrimary }]}>Steps tracked automatically in the background.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── HISTORY TAB ───────────────────────────────────────────────
function HistoryTab({ theme, sessions }: { theme: typeof colors.light; sessions: WorkoutSession[] }) {
  if (sessions.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <View style={[styles.emptyRoutines, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="time-outline" size={44} color={theme.textMuted} />
          <Text style={[styles.emptyRoutinesTitle, { color: theme.textPrimary }]}>No workout history yet</Text>
          <Text style={[styles.emptyRoutinesSub, { color: theme.textMuted }]}>Complete your first workout and it will appear here.</Text>
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
        const timeDisplay = hrs > 0 ? `${hrs}h ${mins}m` : mins > 0 ? `${mins} min ${secs}s` : `${secs}s`;
        return (
          <View key={session.id} style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.historyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyName, { color: theme.textPrimary }]}>{session.name}</Text>
                <Text style={[styles.historyDate, { color: theme.textMuted }]}>
                  {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={[styles.historyCalBadge, { backgroundColor: theme.accentDim as string }]}>
                <Text style={[styles.historyCalNum, { color: theme.accent }]}>{session.calories_burned}</Text>
                <Text style={[styles.historyCalUnit, { color: theme.accent }]}>kcal</Text>
              </View>
            </View>
            <View style={styles.historyStats}>
              {[{ icon: 'time-outline', label: timeDisplay }, { icon: 'barbell-outline', label: `${session.exercises.length} exercises` }].map((s) => (
                <View key={s.label} style={styles.historyStat}>
                  <Ionicons name={s.icon as any} size={14} color={theme.textMuted} />
                  <Text style={[styles.historyStatText, { color: theme.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── INNER TAB BAR ─────────────────────────────────────────────
function InnerTabs({ tabs, active, onPress, theme }: { tabs: string[]; active: string; onPress: (tab: string) => void; theme: typeof colors.light }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.innerTabBar, { borderBottomColor: theme.border }]}>
      {tabs.map((tab) => (
        <TouchableOpacity key={tab} onPress={() => onPress(tab)}
          style={[styles.innerTab, active === tab && { borderBottomColor: theme.accent }]}>
          <Text style={[styles.innerTabText, { color: active === tab ? theme.textPrimary : theme.textMuted }, active === tab && { fontWeight: '700' }]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function WorkoutScreen() {
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const navigation = useNavigation<any>();
  const theme = colors[colorScheme];

  const goalSteps = (profile as any)?.step_goal ?? 10000;

  // CHANGED: "My Routines" replaces "Today" as first tab
  const tabs = ['My Routines', 'Catalogue', 'Calories', 'Steps', 'History'];
  const [activeTab, setActiveTab]         = useState('My Routines');
  const [catalogue, setCatalogue]         = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());

  // Active workout state (when user starts a routine)
  const [workoutExercises, setWorkoutExercises]     = useState<ActiveExercise[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(-1);
  const [workoutStarted, setWorkoutStarted]           = useState(false);
  const [workoutSeconds, setWorkoutSeconds]           = useState(0);
  const [sessions, setSessions]                       = useState<WorkoutSession[]>([]);
  const [weeklyCalories, setWeeklyCalories]           = useState([0, 0, 0, 0, 0, 0, 0]);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);

  // Routine state
  const [savedRoutines, setSavedRoutines]         = useState<SavedRoutine[]>([]);
  const [pendingRoutineName, setPendingRoutineName] = useState('');
  const [showCreateModal, setShowCreateModal]     = useState(false);
  const [showCoachModal, setShowCoachModal]       = useState(false);
  const [isInActiveWorkout, setIsInActiveWorkout] = useState(false);

  const workoutTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const exerciseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(useCallback(() => { if (user?.id) { loadHistory(); loadRoutines(); } }, [user?.id]));

  useEffect(() => {
    loadCatalogue();
    if (user?.id) { loadHistory(); loadRoutines(); }
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
      if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
      Speech.stop();
    };
  }, []);

  const loadCatalogue = async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase.from('exercises').select('*').order('category');
      if (data) setCatalogue(data);
    } catch (e) { console.error('Failed to load exercises:', e); }
  };

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase.from('workout_sessions').select('*').eq('user_id', user.id).eq('status', 'completed').order('completed_at', { ascending: false }).limit(20);
      if (data) {
        setSessions(data.map((s: any) => ({ id: s.id, name: s.name, completed_at: s.completed_at, duration_seconds: s.duration_seconds, calories_burned: s.calories_burned, exercises: s.exercises ?? [] })));
        const weekly = [0, 0, 0, 0, 0, 0, 0];
        const now = new Date();
        data.forEach((s: any) => {
          const d = new Date(s.completed_at);
          const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
          if (diffDays < 7) { const di = d.getDay() === 0 ? 6 : d.getDay() - 1; weekly[di] += s.calories_burned ?? 0; }
        });
        setWeeklyCalories(weekly);
        const today = new Date().toDateString();
        setTotalCaloriesBurned(data.filter((s: any) => new Date(s.completed_at).toDateString() === today).reduce((sum: number, s: any) => sum + (s.calories_burned ?? 0), 0));
      }
    } catch (e) { console.error('Failed to load history:', e); }
  };

  const loadRoutines = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase.from('workout_routines').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setSavedRoutines(data.map((r: any) => ({ ...r, exercises: r.exercises ?? [] })));
    } catch (e) { console.error('Failed to load routines:', e); }
  };

  const saveRoutine = async (routine: Partial<SavedRoutine>) => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase.from('workout_routines').insert({
        user_id: user.id,
        name: routine.name ?? 'My Routine',
        description: routine.description ?? '',
        exercises: routine.exercises ?? [],
        duration_est: routine.duration_est ?? null,
        calories_est: routine.calories_est ?? null,
      }).select().single();
      if (data) setSavedRoutines((prev) => [data, ...prev]);
      setShowCoachModal(false);
      setShowCreateModal(false);
      Alert.alert('Routine saved! 💪', `"${routine.name}" has been added to My Routines.`);
    } catch (e) { console.error('Failed to save routine:', e); }
  };

  const deleteRoutine = async (id: string) => {
    try {
      const { supabase } = await import('../../services/supabase');
      await supabase.from('workout_routines').delete().eq('id', id);
      setSavedRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch (e) { console.error('Failed to delete routine:', e); }
  };

  const handleStartRoutine = (routine: SavedRoutine) => {
    const exercises = routine.exercises.map((ex: any) => ({
      ...ex, id: ex.id ?? `${ex.name}_${Date.now()}`,
      muscle_group: ex.muscle_group ?? '', difficulty: ex.difficulty ?? 'beginner',
      equipment: ex.equipment ?? 'none', description: ex.description ?? '',
      seconds: 0, calories_burned: 0, done: false,
    }));
    setWorkoutExercises(exercises);
    setIsInActiveWorkout(true);
    setActiveTab('My Routines'); // stay on My Routines but now shows active workout view
    speak(`Starting ${routine.name}! Let's go!`);
  };

  const handleToggleExercise = (exercise: Exercise) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(exercise.id) ? next.delete(exercise.id) : next.add(exercise.id); return next; });
  };

  const handleAddToWorkout = () => {
    if (pendingRoutineName) {
      // Saving to a new routine
      const exercises = catalogue.filter((e) => selectedIds.has(e.id));
      const customExercises = Array.from(selectedIds).filter(id => id.startsWith('custom_')).map(id => {
        const name = id.replace('custom_', '').replace(/_\d+$/, '');
        return { name, calories_per_minute: 6, category: 'Custom' };
      });
      saveRoutine({
        name: pendingRoutineName,
        exercises: [...exercises.map(e => ({ name: e.name, calories_per_minute: e.calories_per_minute, category: e.category })), ...customExercises],
        duration_est: exercises.length * 5,
        calories_est: exercises.reduce((sum, e) => sum + e.calories_per_minute * 5, 0),
      });
      setPendingRoutineName('');
    } else {
      // Adding to active workout
      const toAdd = catalogue.filter((e) => selectedIds.has(e.id))
        .filter((e) => !workoutExercises.some((we) => we.id === e.id))
        .map((e) => ({ ...e, seconds: 0, calories_burned: 0, done: false }));
      setWorkoutExercises((prev) => [...prev, ...toAdd]);
    }
    setSelectedIds(new Set());
    setActiveTab('My Routines');
  };

  const handleStartExercise = (index: number) => {
    const exercise = workoutExercises[index];
    if (!workoutStarted) {
      setWorkoutStarted(true);
      speak(`Workout started! First up — ${exercise.name}. Give it everything!`);
      workoutTimerRef.current = setInterval(() => setWorkoutSeconds((p) => p + 1), 1000);
    } else {
      speak(`Starting ${exercise.name}. You've got this!`);
    }
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    setActiveExerciseIndex(index);
    exerciseTimerRef.current = setInterval(() => {
      setWorkoutExercises((prev) => prev.map((ex, i) => {
        if (i !== index) return ex;
        const newSeconds = ex.seconds + 1;
        return { ...ex, seconds: newSeconds, calories_burned: Math.round((ex.calories_per_minute / 60) * newSeconds) };
      }));
    }, 1000);
  };

  const handleCompleteExercise = (index: number) => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    const hasNext = index + 1 < workoutExercises.length;
    speak(hasNext ? `Done! Rest 30 seconds, then ${workoutExercises[index + 1].name}.` : `${workoutExercises[index].name} complete! Finish when ready!`);
    setWorkoutExercises((prev) => prev.map((ex, i) => i === index ? { ...ex, done: true } : ex));
    setActiveExerciseIndex(-1);
  };

  const handleCompleteWorkout = async () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    const totalCal = workoutExercises.reduce((sum, ex) => sum + ex.calories_burned, 0);
    const sessionName = workoutExercises[0]?.category ? `${workoutExercises[0].category} Workout` : 'Workout Session';
    const hrs = Math.floor(workoutSeconds / 3600);
    const mins = Math.floor((workoutSeconds % 3600) / 60);
    const secs = workoutSeconds % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : mins > 0 ? `${mins} min ${secs}s` : `${secs}s`;
    speak(`Workout complete! ${workoutExercises.length} exercises done, ${totalCal} calories burned. Be proud!`);
    try {
      if (user?.id) {
        const { supabase } = await import('../../services/supabase');
        await supabase.from('workout_sessions').insert({ user_id: user.id, name: sessionName, completed_at: new Date().toISOString(), duration_seconds: workoutSeconds, calories_burned: totalCal, exercises: workoutExercises.map((ex) => ({ name: ex.name, seconds: ex.seconds, calories: ex.calories_burned })), status: 'completed' });
      }
    } catch (e) { console.error('Failed to save session:', e); }
    setIsInActiveWorkout(false);
    setWorkoutExercises([]);
    setWorkoutStarted(false);
    setWorkoutSeconds(0);
    setActiveExerciseIndex(-1);
    Alert.alert('🎉 Workout Complete!', `Time: ${timeStr}\nCalories burned: ${totalCal} kcal\nExercises: ${workoutExercises.length}`, [{ text: 'Awesome!' }]);
    loadHistory();
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Activity</Text>
      </View>

      <InnerTabs tabs={tabs} active={activeTab} onPress={(tab) => { setActiveTab(tab); setIsInActiveWorkout(false); }} theme={theme} />

      {/* CHANGED: My Routines replaces Today tab */}
      {activeTab === 'My Routines' && !isInActiveWorkout && (
        <MyRoutinesTab
          theme={theme}
          routines={savedRoutines}
          onCreateManual={() => setShowCreateModal(true)}
          onCreateWithCoach={() => setShowCoachModal(true)}
          onStartRoutine={handleStartRoutine}
          onDeleteRoutine={deleteRoutine}
        />
      )}

      {activeTab === 'My Routines' && isInActiveWorkout && (
        <ActiveWorkoutTab
          theme={theme}
          exercises={workoutExercises}
          activeIndex={activeExerciseIndex}
          workoutSeconds={workoutSeconds}
          workoutStarted={workoutStarted}
          onStart={handleStartExercise}
          onComplete={handleCompleteExercise}
          onCompleteWorkout={handleCompleteWorkout}
          onOpenCatalogue={() => setActiveTab('Catalogue')}
        />
      )}

      {activeTab === 'Catalogue' && (
        <CatalogueTab theme={theme} exercises={catalogue} selectedIds={selectedIds}
          onToggle={handleToggleExercise} onAddToWorkout={handleAddToWorkout}
          routineName={pendingRoutineName} />
      )}

      {activeTab === 'Calories' && <CaloriesTab theme={theme} totalCalories={totalCaloriesBurned} weeklyData={weeklyCalories} />}
      {activeTab === 'Steps' && <StepsTab theme={theme} userId={user?.id ?? ''} goalSteps={goalSteps} />}
      {activeTab === 'History' && <HistoryTab theme={theme} sessions={sessions} />}

      {/* Create routine name modal */}
      <CreateRoutineModal
        visible={showCreateModal}
        theme={theme}
        onClose={() => setShowCreateModal(false)}
        onConfirm={(name) => { setPendingRoutineName(name); setShowCreateModal(false); setActiveTab('Catalogue'); }}
      />

      {/* Coach routine modal */}
      <CoachRoutineModal
        visible={showCoachModal}
        theme={theme}
        onClose={() => setShowCoachModal(false)}
        onSave={saveRoutine}
      />
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },

  innerTabBar: { borderBottomWidth: 1 },
  innerTab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  innerTabText: { fontSize: fontSize.sm },

  tabContent: { paddingBottom: 100, paddingTop: spacing.sm },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },

  // My Routines
  emptyRoutines: { margin: spacing.lg, padding: spacing.xxl, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center', gap: spacing.sm },
  emptyRoutinesTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  emptyRoutinesSub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
  createRoutineBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg, marginTop: spacing.sm },
  createRoutineBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },
  createWithCoachBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, marginTop: spacing.sm },
  createWithCoachText: { fontSize: fontSize.base, fontWeight: '700' },
  routinesTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm },
  routinesCount: { fontSize: fontSize.sm, fontWeight: '600' },
  addRoutineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  addRoutineBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  routineCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, gap: spacing.sm },
  routineCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  routineCardName: { fontSize: fontSize.lg, fontWeight: '800' },
  routineCardDesc: { fontSize: fontSize.sm, marginTop: 2 },
  routineExerciseList: { gap: 6 },
  routineExerciseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  routineExDot: { width: 6, height: 6, borderRadius: 3 },
  routineExName: { fontSize: fontSize.sm },
  routineMoreText: { fontSize: fontSize.xs, marginTop: 2 },
  routineStatsRow: { flexDirection: 'row', gap: spacing.md },
  routineStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routineStatText: { fontSize: fontSize.xs },
  startRoutineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
  startRoutineBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  coachCreateCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  coachCreateIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  coachCreateTitle: { fontSize: fontSize.base, fontWeight: '700' },
  coachCreateSub: { fontSize: fontSize.sm, marginTop: 2 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40, gap: spacing.md },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800' },
  modalSub: { fontSize: fontSize.base, lineHeight: 20 },
  modalInput: { borderWidth: 1.5, borderRadius: 12, padding: spacing.md, fontSize: fontSize.lg },
  modalBtnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  modalCancelBtn: { flex: 1, padding: spacing.md, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  modalCancelText: { fontSize: fontSize.base, fontWeight: '600' },
  modalConfirmBtn: { flex: 2, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  modalConfirmText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  modalLoading: { alignItems: 'center', gap: spacing.md, paddingVertical: 40 },
  modalLoadingText: { fontSize: fontSize.lg, fontWeight: '600' },
  modalCancelLink: { alignItems: 'center', paddingTop: spacing.sm },
  generatedName: { fontSize: fontSize.xl, fontWeight: '800' },

  // Coach Q flow
  coachQProgress: { flexDirection: 'row', gap: 4, marginBottom: spacing.sm },
  coachQDot: { height: 6, borderRadius: 3 },
  coachQLabel: { fontSize: fontSize.xs, fontWeight: '600' },
  coachQOptions: { gap: spacing.sm },
  coachQOption: { padding: spacing.md, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  coachQOptionText: { fontSize: fontSize.base, fontWeight: '600' },

  // Add manually
  addManuallyCard: { marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', gap: spacing.sm },
  addManuallyLabel: { fontSize: fontSize.sm },
  addManuallyRow: { flexDirection: 'row', gap: spacing.sm },
  addManuallyInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: spacing.sm, fontSize: fontSize.base },
  addManuallyBtn: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  // Active workout
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.sm },
  todayTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  addMoreText: { fontSize: fontSize.sm, fontWeight: '600' },
  activeRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.md, gap: spacing.md },
  activeRowLeft: { flex: 1 },
  activeRowName: { fontSize: fontSize.base, fontWeight: '700' },
  activeRowMeta: { fontSize: fontSize.xs, marginTop: 2 },
  activeRowTime: { fontSize: fontSize.xs, marginTop: 4, fontWeight: '600' },
  doneCheck: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  completeExBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  completeExBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  startExBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1 },
  startExBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  completeWorkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  completeWorkoutBtnText: { fontSize: fontSize.lg, fontWeight: '700' },

  // Catalogue
  categoryRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  categoryPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, height: 32, justifyContent: 'center' },
  categoryPillText: { fontSize: fontSize.sm },
  addSelectedBar: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  addSelectedText: { fontSize: fontSize.base, fontWeight: '700' },
  exerciseCard: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md },
  exerciseCardLeft: { flexDirection: 'row', flex: 1, gap: spacing.md, alignItems: 'flex-start' },
  exerciseIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  exerciseCardInfo: { flex: 1 },
  exerciseCardName: { fontSize: fontSize.base, fontWeight: '700' },
  exerciseCardMeta: { fontSize: fontSize.xs, marginTop: 2 },
  exerciseCardDesc: { fontSize: fontSize.xs, marginTop: 2 },
  exerciseCardRight: { alignItems: 'flex-end', gap: spacing.sm, flexShrink: 0 },
  diffBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  diffBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  selectCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  // Calories
  card: { marginHorizontal: spacing.lg, marginBottom: spacing.md, marginTop: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  cardLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  bigStat: { fontSize: 28, fontWeight: '800', marginBottom: spacing.sm },
  progressBarBg: { height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressSub: { fontSize: fontSize.xs },
  barChartCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: spacing.xs },
  barWrap: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barInner: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9 },
  weeklyAvg: { fontSize: fontSize.xs, textAlign: 'right', marginTop: spacing.sm },

  // Steps
  stepsCalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1 },
  stepsCalText: { fontSize: fontSize.sm, fontWeight: '600' },
  stepsSensorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  stepsSensorText: { fontSize: fontSize.sm, flex: 1, lineHeight: 18 },

  // History
  historyCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  historyName: { fontSize: fontSize.lg, fontWeight: '700' },
  historyDate: { fontSize: fontSize.xs, marginTop: 2 },
  historyCalBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, alignItems: 'center' },
  historyCalNum: { fontSize: fontSize.xl, fontWeight: '800' },
  historyCalUnit: { fontSize: 9, fontWeight: '600' },
  historyStats: { flexDirection: 'row', gap: spacing.lg },
  historyStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyStatText: { fontSize: fontSize.xs },

  // Timer
  timerCard: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  timerLeft: { flex: 1, alignItems: 'center' },
  timerRight: { flex: 1, alignItems: 'center' },
  timerDivider: { width: 1, marginHorizontal: spacing.md },
  timerLabel: { fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  timerValue: { fontSize: 22, fontWeight: '800' },
});