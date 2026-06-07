import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput, ActivityIndicator, Dimensions,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import * as Speech from 'expo-speech';
import { checkAndSavePRs } from '../../services/personalRecordsService';
import ExerciseDemoModal from '../../components/ExerciseDemoModal';

const { width: SW } = Dimensions.get('window');

interface Exercise {
  id: string; name: string; category: string; muscle_group: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  calories_per_minute: number; equipment: string; description: string;
}
interface ActiveExercise extends Exercise { seconds: number; calories_burned: number; done: boolean; }
interface WorkoutSession {
  id: string; name: string; completed_at: string;
  duration_seconds: number; calories_burned: number;
  exercises: { name: string; seconds: number; calories: number }[];
}
interface SavedRoutine {
  id: string; name: string; description?: string;
  exercises: { name: string; calories_per_minute: number; category: string }[];
  duration_est?: number; calories_est?: number; created_at: string;
}
interface PRResult {
  isNewPR: boolean;
  newRecords: { type: string; label: string; value: string; improvement: string }[];
}

const speak = (text: string) => { Speech.stop(); Speech.speak(text, { language: 'en-US', pitch: 1.05, rate: 0.92 }); };

const CAT_COLORS: Record<string, string> = {
  Cardio: '#FF6B35', Chest: '#F0427C', Back: '#4A90E2',
  Core: '#2BBCB0', Legs: '#9B6FE8', Shoulders: '#FFB830',
  Arms: '#34D98A', Flexibility: '#FF8C42', Custom: '#6B7280', All: '#2DDC8C',
};

const EQUIPMENT_OPTIONS = ['All', 'none', 'dumbbells', 'barbell', 'resistance band', 'machine'];
const WORKOUT_CATEGORIES = [
  { key: 'Chest',      icon: 'body-outline',          color: '#F0427C', label: 'Chest',      exercises: 24 },
  { key: 'Back',       icon: 'arrow-back-outline',    color: '#4A90E2', label: 'Back',       exercises: 18 },
  { key: 'Legs',       icon: 'footsteps-outline',     color: '#9B6FE8', label: 'Legs',       exercises: 22 },
  { key: 'Shoulders',  icon: 'fitness-outline',       color: '#FFB830', label: 'Shoulders',  exercises: 16 },
  { key: 'Arms',       icon: 'barbell-outline',       color: '#34D98A', label: 'Arms',       exercises: 20 },
  { key: 'Core',       icon: 'radio-button-on-outline', color: '#2BBCB0', label: 'Core',     exercises: 14 },
  { key: 'Cardio',     icon: 'pulse-outline',         color: '#FF6B35', label: 'Cardio',     exercises: 12 },
  { key: 'Full Body',  icon: 'fitness-outline',       color: '#FF6B9D', label: 'Full Body',  exercises: 30 },
];
const CATEGORIES_FILTER = ['All', 'Cardio', 'Chest', 'Back', 'Core', 'Legs', 'Shoulders', 'Arms', 'Flexibility'];

function FlameSvg({ color }: { color: string }) {
  return (
    <Svg width={60} height={80} viewBox="0 0 60 80">
      <Path d="M30 4 C30 4 44 20 44 36 C44 48 36 56 30 60 C24 56 16 48 16 36 C16 20 30 4 30 4Z" fill={color} opacity={0.90} />
      <Path d="M30 24 C30 24 38 34 38 42 C38 50 34 54 30 58 C26 54 22 50 22 42 C22 34 30 24 30 24Z" fill="#FFB830" opacity={0.80} />
      <Path d="M30 38 C30 38 34 42 34 46 C34 50 32 52 30 54 C28 52 26 50 26 46 C26 42 30 38 30 38Z" fill="#fff" opacity={0.60} />
    </Svg>
  );
}
function FootprintSvg({ color }: { color: string }) {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Ellipse cx="25" cy="55" rx="10" ry="16" fill={color} opacity={0.70} />
      <Circle cx="18" cy="36" r="4" fill={color} opacity={0.60} /><Circle cx="25" cy="33" r="4.5" fill={color} opacity={0.60} />
      <Circle cx="32" cy="35" r="3.5" fill={color} opacity={0.60} /><Circle cx="37" cy="40" r="3" fill={color} opacity={0.55} />
      <Ellipse cx="55" cy="28" rx="10" ry="16" fill={color} opacity={0.40} />
      <Circle cx="48" cy="10" r="3.5" fill={color} opacity={0.35} /><Circle cx="55" cy="7" r="4" fill={color} opacity={0.35} />
      <Circle cx="62" cy="9" r="3" fill={color} opacity={0.35} /><Circle cx="67" cy="14" r="2.5" fill={color} opacity={0.30} />
    </Svg>
  );
}
function HistorySvg({ color }: { color: string }) {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="32" stroke={color} strokeWidth="4" fill="none" opacity={0.5} />
      <Circle cx="40" cy="40" r="4" fill={color} opacity={0.8} />
      <Line x1="40" y1="40" x2="40" y2="18" stroke={color} strokeWidth="3.5" strokeLinecap="round" opacity={0.8} />
      <Line x1="40" y1="40" x2="58" y2="48" stroke={color} strokeWidth="3" strokeLinecap="round" opacity={0.7} />
    </Svg>
  );
}

function catIconName(cat: string): any {
  const m: Record<string, string> = {
    Cardio: 'pulse-outline', Chest: 'body-outline', Back: 'arrow-back-outline',
    Core: 'radio-button-on-outline', Legs: 'footsteps-outline',
    Shoulders: 'fitness-outline', Arms: 'barbell-outline', Flexibility: 'leaf-outline',
  };
  return m[cat] ?? 'barbell-outline';
}

// ── EXERCISE CARD (compact) ───────────────────────────────────
function ExerciseCard({ exercise, theme, isSelected, onToggle, onDemo }: {
  exercise: Exercise; theme: typeof colors.light; isSelected: boolean;
  onToggle: () => void; onDemo: () => void;
}) {
  const catColor = CAT_COLORS[exercise.category] ?? theme.accent;
  const diffColors: Record<string, string> = { beginner: '#2DDC8C', intermediate: '#FFB830', advanced: '#FF5959' };
  const diffLabels: Record<string, string> = { beginner: 'Bgnr', intermediate: 'Int', advanced: 'Adv' };
  const diffColor = diffColors[exercise.difficulty] ?? '#2DDC8C';

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.75}
      style={[ec.card, { backgroundColor: isSelected ? catColor + '15' : theme.card, borderColor: isSelected ? catColor : theme.border, borderWidth: isSelected ? 1.5 : 1 }]}>
      <View style={[ec.accentBar, { backgroundColor: catColor }]} />
      <View style={ec.body}>
        <View style={ec.topRow}>
          <Text style={[ec.name, { color: theme.textPrimary }]} numberOfLines={1}>{exercise.name}</Text>
          <View style={[ec.checkbox, { backgroundColor: isSelected ? catColor : 'transparent', borderColor: isSelected ? catColor : theme.border }]}>
            {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
          </View>
        </View>
        <View style={ec.bottomRow}>
          <View style={[ec.diffPill, { backgroundColor: diffColor + '18', borderColor: diffColor + '44' }]}>
            <Text style={[ec.diffText, { color: diffColor }]}>{diffLabels[exercise.difficulty]}</Text>
          </View>
          <Ionicons name="flame-outline" size={10} color="#FF6B35" />
          <Text style={[ec.kcalText, { color: theme.textMuted }]}>{exercise.calories_per_minute} kcal</Text>
          {exercise.equipment !== 'none' && (
            <Text style={[ec.equipText, { color: theme.textMuted }]}>{exercise.equipment}</Text>
          )}
          <TouchableOpacity onPress={(e) => { e.stopPropagation(); onDemo(); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="play-circle" size={14} color={catColor} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ec = StyleSheet.create({
  card: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: 6, borderRadius: 8, overflow: 'hidden' },
  accentBar: { width: 3, flexShrink: 0 },
  body: { flex: 1, paddingHorizontal: spacing.sm, paddingVertical: 8, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { flex: 1, fontSize: fontSize.sm, fontWeight: '700' },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  diffPill: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 1 },
  diffText: { fontSize: 9, fontWeight: '700' },
  kcalText: { fontSize: 9 },
  equipText: { fontSize: 9 },
});

// ── ACTIVE EXERCISE ROW ─────────────────────────────────────
function ActiveExerciseRow({ exercise, theme, isActive, onStart, onComplete, onDemo }: {
  exercise: ActiveExercise; theme: typeof colors.light; isActive: boolean;
  onStart: () => void; onComplete: () => void; onDemo: () => void;
}) {
  const mins = Math.floor(exercise.seconds / 60);
  const secs = exercise.seconds % 60;
  const catColor = CAT_COLORS[exercise.category] ?? theme.accent;

  return (
    <View style={[aer.row, {
      backgroundColor: exercise.done ? theme.accent + '10' : isActive ? catColor + '15' : theme.card,
      borderColor: exercise.done ? theme.accent : isActive ? catColor : theme.border,
      borderWidth: isActive ? 2 : 1, borderLeftWidth: 4, borderLeftColor: exercise.done ? theme.accent : catColor,
    }]}>
      <View style={{ flex: 1 }}>
        <View style={aer.nameRow}>
          <Text style={[aer.name, { color: exercise.done ? theme.accent : theme.textPrimary, textDecorationLine: exercise.done ? 'line-through' : 'none' }]}>{exercise.name}</Text>
          {exercise.done && <Ionicons name="checkmark-circle" size={14} color={theme.accent} />}
        </View>
        {exercise.seconds > 0 && (
          <Text style={[aer.timer, { color: catColor }]}>{mins}:{secs.toString().padStart(2, '0')} · {exercise.calories_burned} kcal</Text>
        )}
      </View>
      <View style={aer.actions}>
        <TouchableOpacity onPress={onDemo} style={[aer.howToBtn, { backgroundColor: catColor + '15', borderColor: catColor + '30' }]} hitSlop={6}>
          <Ionicons name="play-circle" size={12} color={catColor} />
        </TouchableOpacity>
        {exercise.done ? (
          <View style={[aer.doneChip, { backgroundColor: theme.accent }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>
        ) : isActive ? (
          <TouchableOpacity onPress={onComplete} activeOpacity={0.85}>
            <LinearGradient colors={[catColor, catColor + 'BB'] as [string, string]} style={aer.doneBtn}><Text style={aer.doneBtnText}>Done</Text></LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onStart} style={[aer.startBtn, { borderColor: catColor }]}>
            <Ionicons name="play" size={10} color={catColor} /><Text style={[aer.startBtnText, { color: catColor }]}>Start</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const aer = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: 6, padding: spacing.sm, borderRadius: 10, gap: spacing.sm, overflow: 'hidden' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
  timer: { fontSize: fontSize.xs, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
  howToBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  doneChip: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  doneBtn: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 6 },
  doneBtnText: { fontSize: fontSize.xs, fontWeight: '800', color: '#fff' },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 6, borderWidth: 1.5 },
  startBtnText: { fontSize: fontSize.xs, fontWeight: '700' },
});

// ── WORKOUT TIMER ─────────────────────────────────────────────
function WorkoutTimer({ theme, seconds, calories }: { theme: typeof colors.light; seconds: number; calories: number }) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const timeStr = hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins.toString().padStart(2, '00')}:${secs.toString().padStart(2, '0')}`;
  return (
    <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.timerCard}>
      <View style={styles.timerSide}><Text style={styles.timerLabel}>TIME</Text><Text style={styles.timerValue}>{timeStr}</Text></View>
      <View style={styles.timerDivider} />
      <View style={styles.timerSide}><Text style={styles.timerLabel}>BURNED</Text><Text style={[styles.timerValue, { color: '#FF6B35' }]}>{calories}</Text></View>
    </LinearGradient>
  );
}

// ── POST-WORKOUT MODAL ────────────────────────────────────────
function PostWorkoutModal({ visible, onClose, prResult, theme }: {
  visible: boolean; onClose: () => void; prResult: PRResult | null; theme: typeof colors.light;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.postWorkoutSheet, { backgroundColor: theme.surface }]}>
          <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.postWorkoutHeader}>
            <Text style={styles.postWorkoutEmoji}>🎉</Text>
            <Text style={styles.postWorkoutTitle}>Workout Complete!</Text>
            <Text style={styles.postWorkoutSub}>You crushed it. Time to recover.</Text>
          </LinearGradient>
          <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
            {prResult?.isNewPR && prResult.newRecords.length > 0 && (
              <View style={[styles.prSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.postSectionTitle, { color: theme.textPrimary }]}>🏅 New Personal Records!</Text>
                {prResult.newRecords.slice(0, 3).map((pr, i) => (
                  <View key={i} style={[styles.prRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.prLabel, { color: theme.textPrimary }]}>{pr.label}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.prValue, { color: theme.accent }]}>{pr.value}</Text>
                      <Text style={[styles.prImprovement, { color: theme.textMuted }]}>{pr.improvement}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            <View style={{ height: spacing.lg }} />
          </ScrollView>
          <View style={styles.postWorkoutClose}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.postWorkoutCloseWrap}>
              <LinearGradient colors={[theme.gradStart, theme.gradMid] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.postWorkoutCloseBtn}>
                <Text style={styles.postWorkoutCloseBtnText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── MY ROUTINES TAB ──────────────────────────────────────────
function MyRoutinesTab({ theme, routines, onCreateManual, onStartRoutine, onDeleteRoutine, onSelectCategory, workoutCount }: {
  theme: typeof colors.light; routines: SavedRoutine[];
  onCreateManual: () => void; onStartRoutine: (r: SavedRoutine) => void;
  onDeleteRoutine: (id: string) => void; onSelectCategory?: (cat: string) => void;
  workoutCount?: number;
}) {
  const streakDay = (workoutCount ?? 0) + 1;
  return (
    <ScrollView contentContainerStyle={styles.mrScroll} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.mrHero}>
        <View style={styles.mrHeroTop}>
          <View><Text style={styles.mrHeroTitle}>Today's Workout</Text><Text style={styles.mrHeroSub}>Ready to crush your goals?</Text></View>
          <View style={[styles.mrHeroBadge, { backgroundColor: theme.accent + '30' }]}>
            <Ionicons name="flame" size={14} color={theme.accent} />
            <Text style={styles.mrHeroBadgeText}>Day {streakDay}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onCreateManual} activeOpacity={0.85} style={[styles.mrStartBtn, { backgroundColor: theme.accent }]}>
          <Ionicons name="play-circle" size={20} color="#fff" />
          <Text style={styles.mrStartBtnText}>Quick Start Workout</Text>
        </TouchableOpacity>
      </LinearGradient>

      <Text style={[styles.mrSectionTitle, { color: theme.textPrimary }]}>Workout Categories</Text>
      <View style={styles.mrCategoryGrid}>
        {WORKOUT_CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.key} onPress={() => onSelectCategory?.(cat.key)} activeOpacity={0.85}
            style={[styles.mrCatCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.mrCatIconWrap, { backgroundColor: cat.color + '18' }]}>
              <Ionicons name={cat.icon as any} size={20} color={cat.color} />
            </View>
            <Text style={[styles.mrCatName, { color: theme.textPrimary }]}>{cat.label}</Text>
            <Text style={[styles.mrCatCount, { color: theme.textMuted }]}>{cat.exercises} exercises</Text>
          </TouchableOpacity>
        ))}
      </View>

      {routines.length > 0 && (
        <>
          <View style={styles.mrSectionTopRow}>
            <Text style={[styles.mrSectionTitle, { color: theme.textPrimary }]}>My Routines</Text>
            <TouchableOpacity onPress={onCreateManual}><Text style={[styles.mrSeeAll, { color: theme.accent }]}>+ New</Text></TouchableOpacity>
          </View>
          {routines.map((routine) => {
            const firstCat = routine.exercises[0]?.category ?? 'All';
            const cardColor = CAT_COLORS[firstCat] ?? theme.accent;
            return (
              <TouchableOpacity key={routine.id} onPress={() => onStartRoutine(routine)} activeOpacity={0.85}
                style={[styles.mrRoutineCard, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: cardColor }]}>
                <View style={styles.mrRoutineTop}>
                  <Text style={[styles.mrRoutineName, { color: theme.textPrimary }]}>{routine.name}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Delete?', `Remove "${routine.name}"?`, [
                    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => onDeleteRoutine(routine.id) },
                  ])} hitSlop={8}>
                    <Ionicons name="ellipsis-horizontal" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.mrRoutineMeta}>
                  <View style={[styles.mrRoutineChip, { backgroundColor: cardColor + '15' }]}>
                    <Ionicons name="barbell-outline" size={10} color={cardColor} />
                    <Text style={[styles.mrRoutineChipText, { color: cardColor }]}>{routine.exercises.length} exercises</Text>
                  </View>
                  {routine.duration_est && (
                    <View style={[styles.mrRoutineChip, { backgroundColor: theme.accent + '15' }]}>
                      <Ionicons name="time-outline" size={10} color={theme.accent} />
                      <Text style={[styles.mrRoutineChipText, { color: theme.accent }]}>~{routine.duration_est} min</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ── CREATE ROUTINE MODAL ─────────────────────────────────────
function CreateRoutineModal({ visible, theme, onClose, onConfirm }: {
  visible: boolean; theme: typeof colors.light; onClose: () => void; onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Name your routine</Text>
          <Text style={[styles.modalSub, { color: theme.textSecondary }]}>e.g. Leg Day, Cardio Blast, Full Body</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Routine name" placeholderTextColor={theme.textMuted} autoFocus
            style={[styles.modalInput, { color: theme.textPrimary, borderColor: name ? theme.accent : theme.border, backgroundColor: theme.bg }]} />
          <View style={styles.modalBtnRow}>
            <TouchableOpacity onPress={onClose} style={[styles.modalCancelBtn, { borderColor: theme.border }]}>
              <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (name.trim()) { onConfirm(name.trim()); setName(''); } }}
              disabled={!name.trim()} activeOpacity={0.85} style={styles.modalConfirmWrap}>
              <LinearGradient colors={[theme.accent, '#0A9A5E'] as [string, string]} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>Pick Exercises →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── CATEGORY OPTIONS MODAL ───────────────────────────────────
function CategoryOptionsModal({ visible, category, theme, onClose, onCreateRoutine, onGymWorkouts, onHomeWorkouts }: {
  visible: boolean; category: string; theme: typeof colors.light;
  onClose: () => void; onCreateRoutine: () => void; onGymWorkouts: () => void; onHomeWorkouts: () => void;
}) {
  const catColor = CAT_COLORS[category] ?? theme.accent;
  const catData = WORKOUT_CATEGORIES.find((c) => c.key === category);
  if (!category) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          <View style={styles.catOptHeader}>
            <View style={[styles.catOptIconWrap, { backgroundColor: catColor + '18' }]}>
              <Ionicons name={(catData?.icon ?? 'barbell-outline') as any} size={26} color={catColor} />
            </View>
            <Text style={[styles.catOptTitle, { color: theme.textPrimary }]}>{category}</Text>
            <Text style={[styles.catOptSub, { color: theme.textSecondary }]}>{catData?.exercises ?? 0} exercises</Text>
          </View>
          <TouchableOpacity onPress={() => { onClose(); onCreateRoutine(); }} activeOpacity={0.85}
            style={[styles.catOptBtn, { backgroundColor: catColor + '12', borderColor: catColor + '44' }]}>
            <Ionicons name="create-outline" size={20} color={catColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.catOptBtnTitle, { color: theme.textPrimary }]}>Create Own Routine</Text>
              <Text style={[styles.catOptBtnSub, { color: theme.textMuted }]}>Pick exercises and build your custom workout</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onClose(); onGymWorkouts(); }} activeOpacity={0.85}
            style={[styles.catOptBtn, { backgroundColor: catColor + '12', borderColor: catColor + '44' }]}>
            <Ionicons name="barbell-outline" size={20} color={catColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.catOptBtnTitle, { color: theme.textPrimary }]}>Gym Workouts</Text>
              <Text style={[styles.catOptBtnSub, { color: theme.textMuted }]}>Equipment-based exercises for the gym</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onClose(); onHomeWorkouts(); }} activeOpacity={0.85}
            style={[styles.catOptBtn, { backgroundColor: catColor + '12', borderColor: catColor + '44' }]}>
            <Ionicons name="home-outline" size={20} color={catColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.catOptBtnTitle, { color: theme.textPrimary }]}>Home Workouts</Text>
              <Text style={[styles.catOptBtnSub, { color: theme.textMuted }]}>Bodyweight exercises, no equipment needed</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={[styles.modalCancelBtn, { borderColor: theme.border, marginTop: spacing.sm }]}>
            <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── ACTIVE WORKOUT TAB ───────────────────────────────────────
function ActiveWorkoutTab({ theme, exercises, activeIndex, workoutSeconds, workoutStarted, onStart, onComplete, onCompleteWorkout, onOpenCatalogue, onShowDemo }: {
  theme: typeof colors.light; exercises: ActiveExercise[]; activeIndex: number;
  workoutSeconds: number; workoutStarted: boolean;
  onStart: (i: number) => void; onComplete: (i: number) => void;
  onCompleteWorkout: () => void; onOpenCatalogue: () => void; onShowDemo: (ex: ActiveExercise) => void;
}) {
  const doneCount = exercises.filter(e => e.done).length;
  const progress = exercises.length > 0 ? doneCount / exercises.length : 0;
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {workoutStarted && <WorkoutTimer theme={theme} seconds={workoutSeconds} calories={exercises.reduce((s, e) => s + e.calories_burned, 0)} />}
      {exercises.length > 0 && (
        <View style={[styles.workoutProgressWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.workoutProgressRow}>
            <Text style={[styles.workoutProgressLabel, { color: theme.textSecondary }]}>{doneCount} of {exercises.length} exercises</Text>
            <Text style={[styles.workoutProgressPct, { color: theme.accent }]}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={[styles.workoutProgressBg, { backgroundColor: theme.border }]}>
            <LinearGradient colors={[theme.accent, theme.gradStart] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.workoutProgressFill, { width: `${progress * 100}%` as any }]} />
          </View>
        </View>
      )}
      <View style={styles.todayHeader}>
        <Text style={[styles.todayTitle, { color: theme.textPrimary }]}>Active Workout</Text>
        <TouchableOpacity onPress={onOpenCatalogue}><Text style={[styles.addMoreText, { color: theme.accent }]}>+ Add</Text></TouchableOpacity>
      </View>
      {exercises.map((ex, i) => (
        <ActiveExerciseRow key={ex.id} exercise={ex} theme={theme} isActive={i === activeIndex && workoutStarted}
          onStart={() => onStart(i)} onComplete={() => onComplete(i)} onDemo={() => onShowDemo(ex)} />
      ))}
      <TouchableOpacity onPress={onCompleteWorkout} activeOpacity={0.85} style={styles.completeWorkoutWrap}>
        <LinearGradient colors={[theme.gradStart, theme.gradMid] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.completeWorkoutBtn}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.completeWorkoutBtnText}>Complete Workout</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── CATALOGUE TAB ────────────────────────────────────────────
function CatalogueTab({ theme, exercises, selectedIds, onToggle, onAddToWorkout, routineName, equipmentFilter, onEquipmentChange, onShowDemo }: {
  theme: typeof colors.light; exercises: Exercise[]; selectedIds: Set<string>;
  onToggle: (ex: Exercise) => void; onAddToWorkout: () => void; routineName?: string;
  equipmentFilter: string; onEquipmentChange: (eq: string) => void; onShowDemo: (ex: Exercise) => void;
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [customName, setCustomName] = useState('');

  const filtered = exercises.filter((e) => {
    const catMatch = activeCategory === 'All' || e.category === activeCategory;
    const eqMatch = equipmentFilter === 'All' || e.equipment === equipmentFilter;
    return catMatch && eqMatch;
  });
  const catColor = CAT_COLORS[activeCategory] ?? theme.accent;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catFilterRow}>
        {CATEGORIES_FILTER.map((cat) => {
          const cc = CAT_COLORS[cat] ?? theme.accent;
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
              style={[styles.catFilterPill, { backgroundColor: isActive ? cc : theme.card, borderColor: isActive ? cc : theme.border }]}>
              <Text style={[styles.catFilterPillText, { color: isActive ? '#fff' : theme.textSecondary, fontWeight: isActive ? '700' : '400' }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eqFilterRow}>
        {EQUIPMENT_OPTIONS.map((eq) => {
          const isActive = equipmentFilter === eq;
          return (
            <TouchableOpacity key={eq} onPress={() => onEquipmentChange(eq)}
              style={[styles.eqFilterPill, { backgroundColor: isActive ? theme.accent : 'transparent', borderColor: isActive ? theme.accent : theme.textMuted + '44' }]}>
              <Text style={[styles.eqFilterPillText, { color: isActive ? '#fff' : theme.textMuted }]}>
                {eq === 'none' ? 'Bodyweight' : eq === 'resistance band' ? 'Bands' : eq.charAt(0).toUpperCase() + eq.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {activeCategory !== 'All' && (
        <View style={[styles.catHeroBar, { backgroundColor: catColor + '15', borderColor: catColor + '44' }]}>
          <Ionicons name={catIconName(activeCategory)} size={14} color={catColor} />
          <Text style={[styles.catHeroText, { color: catColor }]}>{activeCategory} — {filtered.length} exercises</Text>
        </View>
      )}
      {selectedIds.size > 0 && (
        <TouchableOpacity onPress={onAddToWorkout} activeOpacity={0.85} style={styles.addSelectedWrap}>
          <LinearGradient colors={[theme.accent, '#0A9A5E'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addSelectedBar}>
            <Ionicons name="add-circle" size={16} color="#fff" />
            <Text style={styles.addSelectedText}>Add {selectedIds.size} exercise{selectedIds.size > 1 ? 's' : ''} {routineName ? `to "${routineName}"` : 'to workout'} ✓</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      <ScrollView contentContainerStyle={styles.catContent}>
        {filtered.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} theme={theme} isSelected={selectedIds.has(ex.id)}
            onToggle={() => onToggle(ex)} onDemo={() => onShowDemo(ex)} />
        ))}
        <View style={[styles.addManuallyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.addManuallyLabel, { color: theme.textSecondary }]}>Can't find it? Add manually:</Text>
          <View style={styles.addManuallyRow}>
            <TextInput value={customName} onChangeText={setCustomName} placeholder="Exercise name" placeholderTextColor={theme.textMuted}
              style={[styles.addManuallyInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bg }]} />
            <TouchableOpacity onPress={() => {
              if (customName.trim()) {
                onToggle({ id: `custom_${Date.now()}`, name: customName.trim(), category: 'Custom', muscle_group: 'Custom', difficulty: 'beginner', calories_per_minute: 6, equipment: 'none', description: 'Custom exercise' });
                setCustomName('');
              }
            }} activeOpacity={0.85} style={styles.addManuallyBtnWrap}>
              <LinearGradient colors={[theme.accent, '#0A9A5E'] as [string, string]} style={styles.addManuallyBtn}>
                <Ionicons name="add" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── CALORIES TAB ────────────────────────────────────────────
function CaloriesTab({ theme, totalCalories, weeklyData }: { theme: typeof colors.light; totalCalories: number; weeklyData: number[] }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const max = Math.max(...weeklyData, 1);
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const pct = Math.min((totalCalories / 500) * 100, 100);
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.calorieHero}>
        <FlameSvg color="#FF6B35" />
        <Text style={styles.calorieHeroValue}>{totalCalories}</Text>
        <Text style={styles.calorieHeroLabel}>kcal burned today</Text>
        <View style={styles.calorieBarBg}><LinearGradient colors={['#FF6B35', '#FFB830'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.calorieBarFill, { width: `${pct}%` as any }]} /></View>
        <Text style={styles.calorieBarSub}>{Math.round(pct)}% of 500 kcal daily burn goal</Text>
      </LinearGradient>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>This Week</Text>
      <View style={[styles.barChartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.barChart}>
          {weeklyData.map((val, i) => (
            <View key={i} style={styles.barWrap}>
              <View style={styles.barInner}>
                {i === todayIndex
                  ? <LinearGradient colors={['#FF6B35', '#FFB830'] as [string, string]} style={[styles.bar, { height: `${(val / max) * 100}%` as any }]} />
                  : <View style={[styles.bar, { height: `${(val / max) * 100}%` as any, backgroundColor: theme.border, opacity: 0.5 }]} />}
              </View>
              <Text style={[styles.barLabel, { color: i === todayIndex ? '#FF6B35' : theme.textMuted, fontWeight: i === todayIndex ? '700' : '400' }]}>{days[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.weeklyTotal, { color: theme.textMuted }]}>Weekly: {weeklyData.reduce((a, b) => a + b, 0)} kcal</Text>
      </View>
    </ScrollView>
  );
}

// ── STEPS TAB ───────────────────────────────────────────────
function StepsTab({ theme, goalSteps }: { theme: typeof colors.light; goalSteps: number }) {
  const { liveSteps: steps } = useAuthStore();
  const calories = Math.round(steps * 0.04);
  const percentage = Math.round(Math.min(steps / goalSteps, 1) * 100);
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <LinearGradient colors={['#C8E6FF', '#D8F4F4'] as [string, string]} style={styles.stepsHero}>
        <FootprintSvg color="#2BBCB0" />
        <Text style={styles.stepsHeroValue}>{steps >= 1000 ? `${(steps / 1000).toFixed(1)}K` : steps.toString()}</Text>
        <Text style={styles.stepsHeroLabel}>steps today</Text>
        <View style={styles.stepsBarBg}><LinearGradient colors={['#2BBCB0', '#4A90E2'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.stepsBarFill, { width: `${Math.min(percentage, 100)}%` as any }]} /></View>
        <Text style={styles.stepsBarSub}>{steps.toLocaleString()} of {goalSteps.toLocaleString()} · {percentage}%</Text>
      </LinearGradient>
      <LinearGradient colors={['#FF6B35' + '18', '#FFB830' + '18'] as [string, string]} style={[styles.stepsCalPill, { borderColor: '#FF6B35' + '44' }]}>
        <Ionicons name="flame-outline" size={14} color="#FF6B35" />
        <Text style={[styles.stepsCalText, { color: '#FF6B35' }]}>{calories} kcal burned from steps</Text>
      </LinearGradient>
      <View style={[styles.stepsSensorCard, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
        <Ionicons name="checkmark-circle-outline" size={18} color={theme.accent} />
        <Text style={[styles.stepsSensorText, { color: theme.textPrimary }]}>Steps tracked automatically in the background.</Text>
      </View>
    </ScrollView>
  );
}

// ── HISTORY TAB ─────────────────────────────────────────────
function HistoryTab({ theme, sessions }: { theme: typeof colors.light; sessions: WorkoutSession[] }) {
  if (sessions.length === 0) {
    return (
      <ScrollView contentContainerStyle={[styles.tabContent, styles.emptyContainer]}>
        <View style={[styles.historyEmptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <HistorySvg color={theme.accent} />
          <Text style={[styles.historyEmptyTitle, { color: theme.textPrimary }]}>No workout history yet</Text>
          <Text style={[styles.historyEmptySub, { color: theme.textMuted }]}>Complete your first workout and it will appear here</Text>
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
        const timeDisplay = hrs > 0 ? `${hrs}h ${mins}m` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        return (
          <View key={session.id} style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <LinearGradient colors={[theme.heroCard + 'CC', theme.heroCard + '66'] as [string, string]} style={styles.historyCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyName}>{session.name}</Text>
                <Text style={styles.historyDate}>{date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
              </View>
              <View style={styles.historyCalBadge}><Text style={[styles.historyCalNum, { color: '#FF6B35' }]}>{session.calories_burned}</Text><Text style={[styles.historyCalUnit, { color: '#FF6B35' }]}>kcal</Text></View>
            </LinearGradient>
            <View style={[styles.historyCardBottom, { backgroundColor: theme.card }]}>
              <View style={styles.historyStats}>
                <View style={styles.historyStat}><Ionicons name="time-outline" size={12} color={theme.textMuted} /><Text style={[styles.historyStatText, { color: theme.textMuted }]}>{timeDisplay}</Text></View>
                <View style={styles.historyStat}><Ionicons name="barbell-outline" size={12} color={theme.textMuted} /><Text style={[styles.historyStatText, { color: theme.textMuted }]}>{session.exercises.length} exercises</Text></View>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── INNER TAB BAR ────────────────────────────────────────────
const TAB_ICONS_MAP: Record<string, string> = {
  'My Routines': 'barbell-outline', 'Catalogue': 'search-outline',
  'Calories': 'flame-outline', 'Steps': 'footsteps-outline', 'History': 'time-outline',
};

function InnerTabs({ tabs, active, onPress, theme }: {
  tabs: string[]; active: string; onPress: (t: string) => void; theme: typeof colors.light;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.innerTabBarContent}>
      {tabs.map((tab) => {
        const isActive = active === tab;
        return (
          <TouchableOpacity key={tab} onPress={() => onPress(tab)}
            style={[styles.innerTab, { backgroundColor: isActive ? theme.accent : theme.card, borderColor: isActive ? theme.accent : theme.border }]}>
            <Ionicons name={TAB_ICONS_MAP[tab] as any} size={12} color={isActive ? '#fff' : theme.textMuted} />
            <Text style={[styles.innerTabText, { color: isActive ? '#fff' : theme.textMuted, fontWeight: isActive ? '700' : '500' }]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function WorkoutScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];
  const goalSteps = (profile as any)?.step_goal ?? 10000;

  const tabs = ['My Routines', 'Catalogue', 'Calories', 'Steps', 'History'];
  const [activeTab, setActiveTab] = useState('My Routines');
  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [workoutExercises, setWorkoutExercises] = useState<ActiveExercise[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(-1);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [weeklyCalories, setWeeklyCalories] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([]);
  const [pendingRoutineName, setPendingRoutineName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isInActiveWorkout, setIsInActiveWorkout] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [showPostWorkoutModal, setShowPostWorkoutModal] = useState(false);
  const [prResult, setPrResult] = useState<PRResult | null>(null);
  const [demoExercise, setDemoExercise] = useState<Exercise | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    try { const { supabase } = await import('../../services/supabase'); const { data } = await supabase.from('exercises').select('*').order('category'); if (data) setCatalogue(data); } catch {}
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
        data.forEach((s: any) => { const d = new Date(s.completed_at); const diff = Math.floor((now.getTime() - d.getTime()) / 86400000); if (diff < 7) { const di = d.getDay() === 0 ? 6 : d.getDay() - 1; weekly[di] += s.calories_burned ?? 0; } });
        setWeeklyCalories(weekly);
        const today = new Date().toDateString();
        setTotalCaloriesBurned(data.filter((s: any) => new Date(s.completed_at).toDateString() === today).reduce((sum: number, s: any) => sum + (s.calories_burned ?? 0), 0));
      }
    } catch {}
  };

  const loadRoutines = async () => {
    if (!user?.id) return;
    try { const { supabase } = await import('../../services/supabase'); const { data } = await supabase.from('workout_routines').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); if (data) setSavedRoutines(data.map((r: any) => ({ ...r, exercises: r.exercises ?? [] }))); } catch {}
  };

  const saveRoutine = async (routine: Partial<SavedRoutine>) => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase.from('workout_routines').insert({ user_id: user.id, name: routine.name ?? 'My Routine', description: routine.description ?? '', exercises: routine.exercises ?? [], duration_est: routine.duration_est ?? null, calories_est: routine.calories_est ?? null }).select().single();
      if (data) setSavedRoutines((prev) => [data, ...prev]);
      setShowCreateModal(false);
      Alert.alert('Routine saved! 💪', `"${routine.name}" added to My Routines.`);
    } catch {}
  };

  const deleteRoutine = async (id: string) => {
    try { const { supabase } = await import('../../services/supabase'); await supabase.from('workout_routines').delete().eq('id', id); setSavedRoutines((prev) => prev.filter((r) => r.id !== id)); } catch {}
  };

  const handleStartRoutine = (routine: SavedRoutine) => {
    const exercises = routine.exercises.map((ex: any) => ({ ...ex, id: ex.id ?? `${ex.name}_${Date.now()}`, muscle_group: ex.muscle_group ?? '', difficulty: ex.difficulty ?? 'beginner', equipment: ex.equipment ?? 'none', description: ex.description ?? '', seconds: 0, calories_burned: 0, done: false }));
    setWorkoutExercises(exercises); setIsInActiveWorkout(true);
    speak(`Starting ${routine.name}! Let's go!`);
  };

  const handleToggleExercise = (exercise: Exercise) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(exercise.id) ? next.delete(exercise.id) : next.add(exercise.id); return next; });
  };

  const handleAddToWorkout = () => {
    if (pendingRoutineName) {
      const exList = catalogue.filter((e) => selectedIds.has(e.id)).map(e => ({ name: e.name, calories_per_minute: e.calories_per_minute, category: e.category }));
      saveRoutine({ name: pendingRoutineName, exercises: exList, duration_est: exList.length * 5, calories_est: exList.reduce((s, e) => s + e.calories_per_minute * 5, 0) });
      setPendingRoutineName('');
    } else {
      const toAdd = catalogue.filter((e) => selectedIds.has(e.id)).filter((e) => !workoutExercises.some((we) => we.id === e.id)).map((e) => ({ ...e, seconds: 0, calories_burned: 0, done: false }));
      setWorkoutExercises((prev) => [...prev, ...toAdd]);
      setIsInActiveWorkout(true);
    }
    setSelectedIds(new Set()); setActiveTab('My Routines');
  };

  const handleStartExercise = (index: number) => {
    const ex = workoutExercises[index];
    if (!workoutStarted) {
      setWorkoutStarted(true);
      speak(`Workout started! First up — ${ex.name}!`);
      workoutTimerRef.current = setInterval(() => setWorkoutSeconds((p) => p + 1), 1000);
    } else { speak(`Starting ${ex.name}.`); }
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    setActiveExerciseIndex(index);
    exerciseTimerRef.current = setInterval(() => {
      setWorkoutExercises((prev) => prev.map((e, i) => {
        if (i !== index) return e;
        const ns = e.seconds + 1;
        return { ...e, seconds: ns, calories_burned: Math.round((e.calories_per_minute / 60) * ns) };
      }));
    }, 1000);
  };

  const handleCompleteExercise = (index: number) => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    const hasNext = index + 1 < workoutExercises.length;
    speak(hasNext ? `Done! Rest 30 seconds, then ${workoutExercises[index + 1].name}.` : `Complete! Finish when ready.`);
    setWorkoutExercises((prev) => prev.map((e, i) => i === index ? { ...e, done: true } : e));
    setActiveExerciseIndex(-1);
  };

  const handleCompleteWorkout = async () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    const totalCal = workoutExercises.reduce((s, e) => s + e.calories_burned, 0);
    const sessionName = workoutExercises[0]?.category ? `${workoutExercises[0].category} Workout` : 'Workout Session';
    speak(`Workout complete! ${workoutExercises.length} exercises, ${totalCal} calories. Be proud!`);
    try {
      if (user?.id) {
        const { supabase } = await import('../../services/supabase');
        await supabase.from('workout_sessions').insert({
          user_id: user.id, name: sessionName, completed_at: new Date().toISOString(),
          duration_seconds: workoutSeconds, calories_burned: totalCal,
          exercises: workoutExercises.map(e => ({ name: e.name, seconds: e.seconds, calories: e.calories_burned })),
          status: 'completed',
        });
        const result = await checkAndSavePRs(user.id, sessionName, workoutSeconds, totalCal, workoutExercises.map(e => ({ name: e.name, seconds: e.seconds, calories: e.calories_burned })));
        setPrResult(result);
      }
    } catch (e) { console.error('handleCompleteWorkout error:', e); }
    setIsInActiveWorkout(false); setWorkoutExercises([]); setWorkoutStarted(false); setWorkoutSeconds(0); setActiveExerciseIndex(-1);
    setShowPostWorkoutModal(true);
    loadHistory();
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      <View style={[styles.header, { backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Workouts</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            {isInActiveWorkout ? '🔥 Workout in progress' : `${savedRoutines.length} routine${savedRoutines.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        {isInActiveWorkout && (
          <TouchableOpacity onPress={() => { setIsInActiveWorkout(false); setWorkoutExercises([]); setWorkoutStarted(false); setWorkoutSeconds(0); }}
            style={[styles.cancelWorkoutBtn, { backgroundColor: theme.red + '18', borderColor: theme.red }]}>
            <Ionicons name="close-outline" size={14} color={theme.red} />
            <Text style={[styles.cancelWorkoutText, { color: theme.red }]}>End</Text>
          </TouchableOpacity>
        )}
      </View>

      <InnerTabs tabs={tabs} active={activeTab} onPress={(tab) => { setActiveTab(tab); if (tab !== 'My Routines') setIsInActiveWorkout(false); }} theme={theme} />

      {activeTab === 'My Routines' && !isInActiveWorkout && (
        <MyRoutinesTab theme={theme} routines={savedRoutines}
          onCreateManual={() => setShowCreateModal(true)}
          onStartRoutine={handleStartRoutine} onDeleteRoutine={deleteRoutine}
          workoutCount={sessions.length}
          onSelectCategory={(cat) => { setSelectedCategory(cat); setShowCategoryModal(true); }} />
      )}
      {activeTab === 'My Routines' && isInActiveWorkout && (
        <ActiveWorkoutTab theme={theme} exercises={workoutExercises} activeIndex={activeExerciseIndex}
          workoutSeconds={workoutSeconds} workoutStarted={workoutStarted}
          onStart={handleStartExercise} onComplete={handleCompleteExercise}
          onCompleteWorkout={handleCompleteWorkout} onOpenCatalogue={() => setActiveTab('Catalogue')}
          onShowDemo={(ex) => setDemoExercise(ex)} />
      )}
      {activeTab === 'Catalogue' && (
        <CatalogueTab theme={theme} exercises={catalogue} selectedIds={selectedIds}
          onToggle={handleToggleExercise} onAddToWorkout={handleAddToWorkout} routineName={pendingRoutineName}
          equipmentFilter={equipmentFilter} onEquipmentChange={setEquipmentFilter}
          onShowDemo={(ex) => setDemoExercise(ex)} />
      )}
      {activeTab === 'Calories' && <CaloriesTab theme={theme} totalCalories={totalCaloriesBurned} weeklyData={weeklyCalories} />}
      {activeTab === 'Steps' && <StepsTab theme={theme} goalSteps={goalSteps} />}
      {activeTab === 'History' && <HistoryTab theme={theme} sessions={sessions} />}

      <CategoryOptionsModal visible={showCategoryModal} category={selectedCategory} theme={theme}
        onClose={() => setShowCategoryModal(false)}
        onCreateRoutine={() => { setShowCreateModal(true); }}
        onGymWorkouts={() => { setEquipmentFilter('All'); setActiveTab('Catalogue'); }}
        onHomeWorkouts={() => { setEquipmentFilter('none'); setActiveTab('Catalogue'); }} />
      <CreateRoutineModal visible={showCreateModal} theme={theme} onClose={() => setShowCreateModal(false)}
        onConfirm={(name) => { setPendingRoutineName(name); setShowCreateModal(false); setActiveTab('Catalogue'); }} />
      <PostWorkoutModal visible={showPostWorkoutModal} onClose={() => { setShowPostWorkoutModal(false); setPrResult(null); }}
        prResult={prResult} theme={theme} />
      <ExerciseDemoModal visible={!!demoExercise} exercise={demoExercise} theme={theme}
        onClose={() => setDemoExercise(null)}
        onAddToWorkout={(ex) => {
          const toAdd = { ...ex, seconds: 0, calories_burned: 0, done: false };
          setWorkoutExercises((prev) => prev.some((e) => e.id === ex.id) ? prev : [...prev, toAdd as ActiveExercise]);
          setDemoExercise(null); setIsInActiveWorkout(true); setActiveTab('My Routines');
        }} />
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs, gap: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: fontSize.xs, marginTop: 1, letterSpacing: 0.2 },
  cancelWorkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  cancelWorkoutText: { fontSize: fontSize.sm, fontWeight: '700' },
  innerTabBarContent: { paddingHorizontal: spacing.lg, gap: 5, paddingVertical: spacing.sm },
  innerTab: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 5, paddingHorizontal: spacing.sm, borderRadius: 7, borderWidth: 1, height: 28 },
  innerTabText: { fontSize: 10, letterSpacing: 0.3 },
  tabContent: { paddingBottom: 120, paddingTop: spacing.sm },
  emptyContainer: { flexGrow: 1 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },

  // My Routines
  mrScroll: { paddingBottom: 120 },
  mrHero: { marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md, padding: spacing.lg, borderRadius: 24, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 }, android: { elevation: 12 } }) },
  mrHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  mrHeroTitle: { fontSize: fontSize.xl, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  mrHeroSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.65)', marginTop: 2, letterSpacing: 0.2 },
  mrHeroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 99 },
  mrHeroBadgeText: { fontSize: fontSize.sm, fontWeight: '700', color: '#fff' },
  mrStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: 14 },
  mrStartBtnText: { color: '#fff', fontSize: fontSize.base, fontWeight: '700', letterSpacing: 0.3 },
  mrSectionTitle: { fontSize: fontSize.base, fontWeight: '700', marginHorizontal: spacing.lg, marginBottom: spacing.sm, letterSpacing: -0.2 },
  mrCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  mrCatCard: { width: '47%', padding: spacing.sm, borderRadius: 16, borderWidth: 1, gap: spacing.xs, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }, android: { elevation: 3 } }) },
  mrCatIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mrCatName: { fontSize: fontSize.sm, fontWeight: '700', letterSpacing: -0.2 },
  mrCatCount: { fontSize: fontSize.xs },
  mrSectionTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  mrSeeAll: { fontSize: fontSize.sm, fontWeight: '600' },
  mrRoutineCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.sm, borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 4 } }) },
  mrRoutineTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  mrRoutineName: { fontSize: fontSize.sm, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
  mrRoutineMeta: { flexDirection: 'row', gap: spacing.sm },
  mrRoutineChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  mrRoutineChipText: { fontSize: 9, fontWeight: '700' },
  workoutProgressWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.sm, borderRadius: 14, borderWidth: 1, gap: 6 },
  workoutProgressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  workoutProgressLabel: { fontSize: fontSize.sm, letterSpacing: 0.2 },
  workoutProgressPct: { fontSize: fontSize.sm, fontWeight: '700' },
  workoutProgressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  workoutProgressFill: { height: '100%', borderRadius: 3 },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  todayTitle: { fontSize: fontSize.lg, fontWeight: '700', letterSpacing: -0.3 },
  addMoreText: { fontSize: fontSize.sm, fontWeight: '600' },
  completeWorkoutWrap: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: 16, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 }, android: { elevation: 6 } }) },
  completeWorkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  completeWorkoutBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  timerCard: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.sm, padding: spacing.md, borderRadius: 24, ...Platform.select({ ios: { shadowColor: '#2A1F6B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 }, android: { elevation: 8 } }) },
  timerSide: { flex: 1, alignItems: 'center' },
  timerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: spacing.md },
  timerLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, marginBottom: 4 },
  timerValue: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },

  // Catalogue
  catFilterRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  catFilterPill: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: 99, borderWidth: 1, height: 28, justifyContent: 'center' },
  catFilterPillText: { fontSize: fontSize.xs, fontWeight: '600' },
  eqFilterRow: { paddingHorizontal: spacing.lg, gap: 4, paddingBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  eqFilterPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, borderWidth: 1, height: 22, justifyContent: 'center' },
  eqFilterPillText: { fontSize: 9, fontWeight: '600' },
  catHeroBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: 6, padding: 6, borderRadius: 8, borderWidth: 1 },
  catHeroText: { fontSize: fontSize.xs, fontWeight: '600' },
  catContent: { paddingBottom: 120, paddingTop: spacing.xs },
  addSelectedWrap: { marginHorizontal: spacing.lg, marginBottom: 6, borderRadius: 12, overflow: 'hidden' },
  addSelectedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.sm },
  addSelectedText: { fontSize: fontSize.sm, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  addManuallyCard: { marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.sm, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', gap: spacing.sm },
  addManuallyLabel: { fontSize: fontSize.xs },
  addManuallyRow: { flexDirection: 'row', gap: spacing.sm },
  addManuallyInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: spacing.sm, fontSize: fontSize.sm },
  addManuallyBtnWrap: { borderRadius: 8, overflow: 'hidden' },
  addManuallyBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Calories
  calorieHero: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.xl, borderRadius: 24, alignItems: 'center', gap: 6, ...Platform.select({ ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 }, android: { elevation: 10 } }) },
  calorieHeroValue: { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 52, letterSpacing: -1 },
  calorieHeroLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.65)', marginBottom: 10, letterSpacing: 0.5 },
  calorieBarBg: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  calorieBarFill: { height: '100%', borderRadius: 3 },
  calorieBarSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.2 },
  barChartCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, borderRadius: 16, borderWidth: 1, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }, android: { elevation: 5 } }) },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: spacing.xs },
  barWrap: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barInner: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 8, fontWeight: '600' },
  weeklyTotal: { fontSize: fontSize.xs, textAlign: 'right', marginTop: spacing.sm, letterSpacing: 0.2 },

  // Steps
  stepsHero: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.xl, borderRadius: 24, alignItems: 'center', gap: 6, ...Platform.select({ ios: { shadowColor: '#2BBCB0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 }, android: { elevation: 10 } }) },
  stepsHeroValue: { fontSize: 44, fontWeight: '900', color: '#2BBCB0', lineHeight: 48, letterSpacing: -1 },
  stepsHeroLabel: { fontSize: fontSize.sm, color: '#2BBCB0', fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  stepsBarBg: { width: '100%', height: 6, backgroundColor: 'rgba(43,188,176,0.25)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  stepsBarFill: { height: '100%', borderRadius: 3 },
  stepsBarSub: { fontSize: fontSize.xs, color: '#2BBCB0', opacity: 0.70, letterSpacing: 0.2 },
  stepsCalPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.sm, borderRadius: 12, borderWidth: 1 },
  stepsCalText: { fontSize: fontSize.sm, fontWeight: '600' },
  stepsSensorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.sm, borderRadius: 12, borderWidth: 1 },
  stepsSensorText: { fontSize: fontSize.sm, flex: 1, lineHeight: 18 },

  // History
  historyEmptyCard: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.xl, borderRadius: 24, alignItems: 'center', gap: spacing.sm, borderWidth: 1 },
  historyEmptyTitle: { fontSize: fontSize.lg, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  historyEmptySub: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 18, letterSpacing: 0.2 },
  historyCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: 16, overflow: 'hidden', borderWidth: 1, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 4 } }) },
  historyCardTop: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  historyName: { fontSize: fontSize.base, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  historyDate: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.60)', marginTop: 2, letterSpacing: 0.2 },
  historyCalBadge: { alignItems: 'center', paddingHorizontal: 8 },
  historyCalNum: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  historyCalUnit: { fontSize: 9, fontWeight: '600' },
  historyCardBottom: { flexDirection: 'row', padding: spacing.sm },
  historyStats: { flexDirection: 'row', gap: spacing.md },
  historyStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyStatText: { fontSize: fontSize.xs },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40, gap: spacing.md },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800', letterSpacing: -0.3 },
  modalSub: { fontSize: fontSize.base, lineHeight: 20 },
  modalInput: { borderWidth: 1.5, borderRadius: 12, padding: spacing.md, fontSize: fontSize.lg },
  modalBtnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  modalCancelBtn: { flex: 1, padding: spacing.md, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  modalCancelText: { fontSize: fontSize.base, fontWeight: '600' },
  modalConfirmWrap: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  modalConfirmBtn: { padding: spacing.md, alignItems: 'center' },
  modalConfirmText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  catOptHeader: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg, paddingTop: spacing.sm },
  catOptIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catOptTitle: { fontSize: fontSize.xl, fontWeight: '800', letterSpacing: -0.3 },
  catOptSub: { fontSize: fontSize.sm },
  catOptBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 16, borderWidth: 1, marginBottom: spacing.sm },
  catOptBtnTitle: { fontSize: fontSize.base, fontWeight: '700', letterSpacing: -0.2 },
  catOptBtnSub: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 16 },

  // Post-workout
  postWorkoutSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '85%' },
  postWorkoutHeader: { padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  postWorkoutEmoji: { fontSize: 36 },
  postWorkoutTitle: { fontSize: fontSize.xl, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  postWorkoutSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.70)' },
  postWorkoutClose: { padding: spacing.lg, paddingTop: 0 },
  postWorkoutCloseWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  postWorkoutCloseBtn: { padding: spacing.md, alignItems: 'center' },
  postWorkoutCloseBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  prSection: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  postSectionTitle: { fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.xs, letterSpacing: -0.2 },
  prRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  prLabel: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  prValue: { fontSize: fontSize.base, fontWeight: '800', textAlign: 'right', letterSpacing: -0.3 },
  prImprovement: { fontSize: fontSize.xs, textAlign: 'right', marginTop: 2 },
});
