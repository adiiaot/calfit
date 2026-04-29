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
  Dimensions,
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
import { claudeJSON, hasClaudeKey } from '../../services/ClaudeService';
import { checkAndSavePRs } from '../../services/personalRecordsService';
import ExerciseDemoModal from '../../components/ExerciseDemoModal';

const { width: SW } = Dimensions.get('window');

// ── TYPES ─────────────────────────────────────────────────────
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
interface MealSuggestion { name: string; why: string; calories: number; }

const speak = (text: string) => { Speech.stop(); Speech.speak(text, { language: 'en-US', pitch: 1.05, rate: 0.92 }); };

// ── CATEGORY COLOURS ──────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  Cardio: '#FF6B35', Chest: '#F0427C', Back: '#4A90E2',
  Core: '#2BBCB0', Legs: '#9B6FE8', Shoulders: '#FFB830',
  Arms: '#34D98A', Flexibility: '#FF8C42', Custom: '#6B7280', All: '#2DDC8C',
};

const EQUIPMENT_OPTIONS = ['All', 'none', 'dumbbells', 'barbell', 'resistance band', 'machine'];

// ── DECORATIVE SVGs (used in empty states / tabs) ─────────────
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
      <Circle cx="18" cy="36" r="4" fill={color} opacity={0.60} />
      <Circle cx="25" cy="33" r="4.5" fill={color} opacity={0.60} />
      <Circle cx="32" cy="35" r="3.5" fill={color} opacity={0.60} />
      <Circle cx="37" cy="40" r="3" fill={color} opacity={0.55} />
      <Ellipse cx="55" cy="28" rx="10" ry="16" fill={color} opacity={0.40} />
      <Circle cx="48" cy="10" r="3.5" fill={color} opacity={0.35} />
      <Circle cx="55" cy="7" r="4" fill={color} opacity={0.35} />
      <Circle cx="62" cy="9" r="3" fill={color} opacity={0.35} />
      <Circle cx="67" cy="14" r="2.5" fill={color} opacity={0.30} />
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
function BarbellSvg({ color }: { color: string }) {
  return (
    <Svg width={120} height={80} viewBox="0 0 120 80">
      <Rect x="20" y="37" width="80" height="6" rx="3" fill={color} opacity={0.9} />
      <Rect x="8" y="24" width="16" height="32" rx="5" fill={color} opacity={0.7} />
      <Rect x="4" y="29" width="8" height="22" rx="3" fill={color} opacity={0.5} />
      <Rect x="96" y="24" width="16" height="32" rx="5" fill={color} opacity={0.7} />
      <Rect x="108" y="29" width="8" height="22" rx="3" fill={color} opacity={0.5} />
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

// ── EXERCISE CARD ─────────────────────────────────────────────
// Demo button now shows animated figure icon — no YouTube
function ExerciseCard({ exercise, theme, isSelected, onToggle, onDemo }: {
  exercise: Exercise; theme: typeof colors.light; isSelected: boolean;
  onToggle: () => void; onDemo: () => void;
}) {
  const catColor = CAT_COLORS[exercise.category] ?? theme.accent;
  const diffColors: Record<string, string> = { beginner: '#2DDC8C', intermediate: '#FFB830', advanced: '#FF5959' };
  const diffLabels: Record<string, string> = { beginner: 'Beginner', intermediate: 'Inter.', advanced: 'Advanced' };
  const diffColor = diffColors[exercise.difficulty] ?? '#2DDC8C';

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.75}
      style={[ec.card, {
        backgroundColor: isSelected ? catColor + '15' : theme.card,
        borderColor: isSelected ? catColor : theme.border,
        borderWidth: isSelected ? 1.5 : 1,
      }]}
    >
      <View style={[ec.accentBar, { backgroundColor: catColor }]} />
      <View style={ec.body}>
        <View style={ec.topRow}>
          <Text style={[ec.name, { color: theme.textPrimary }]} numberOfLines={1}>{exercise.name}</Text>
          <View style={[ec.checkbox, { backgroundColor: isSelected ? catColor : 'transparent', borderColor: isSelected ? catColor : theme.border }]}>
            {isSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
        </View>
        <Text style={[ec.muscle, { color: theme.textMuted }]} numberOfLines={1}>{exercise.muscle_group}</Text>
        <View style={ec.bottomRow}>
          <View style={[ec.diffPill, { backgroundColor: diffColor + '18', borderColor: diffColor + '44' }]}>
            <Text style={[ec.diffText, { color: diffColor }]}>{diffLabels[exercise.difficulty]}</Text>
          </View>
          <View style={ec.kcalRow}>
            <Ionicons name="flame-outline" size={11} color="#FF6B35" />
            <Text style={[ec.kcalText, { color: theme.textMuted }]}>{exercise.calories_per_minute} kcal/min</Text>
          </View>
          {exercise.equipment !== 'none' && (
            <View style={[ec.equipPill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Ionicons name="barbell-outline" size={10} color={theme.textMuted} />
              <Text style={[ec.equipText, { color: theme.textMuted }]}>{exercise.equipment}</Text>
            </View>
          )}
          {/* Demo button — triggers animated figure modal */}
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onDemo(); }}
            style={[ec.playBtn, { backgroundColor: catColor + '18', borderColor: catColor + '44' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="play-circle" size={15} color={catColor} />
            <Text style={[ec.playText, { color: catColor }]}>Demo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ec = StyleSheet.create({
  card:      { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: 14, overflow: 'hidden' },
  accentBar: { width: 4, flexShrink: 0 },
  body:      { flex: 1, padding: spacing.md, gap: 5 },
  topRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name:      { flex: 1, fontSize: fontSize.base, fontWeight: '700' },
  checkbox:  { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  muscle:    { fontSize: fontSize.xs },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  diffPill:  { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  diffText:  { fontSize: 10, fontWeight: '700' },
  kcalRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  kcalText:  { fontSize: 10 },
  equipPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  equipText: { fontSize: 10 },
  playBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginLeft: 'auto' },
  playText:  { fontSize: 10, fontWeight: '700' },
});

// ── ACTIVE EXERCISE ROW ───────────────────────────────────────
// Demo button triggers animated figure modal during workout
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
      borderWidth: isActive ? 2 : 1,
      borderLeftWidth: 4,
      borderLeftColor: exercise.done ? theme.accent : catColor,
    }]}>
      <View style={{ flex: 1 }}>
        <View style={aer.nameRow}>
          <Text style={[aer.name, {
            color: exercise.done ? theme.accent : theme.textPrimary,
            textDecorationLine: exercise.done ? 'line-through' : 'none',
          }]}>{exercise.name}</Text>
          {exercise.done && <Ionicons name="checkmark-circle" size={16} color={theme.accent} />}
        </View>
        <Text style={[aer.meta, { color: theme.textMuted }]}>
          {exercise.muscle_group} · {exercise.calories_per_minute} kcal/min
        </Text>
        {exercise.seconds > 0 && (
          <View style={aer.progressRow}>
            <Ionicons name="timer-outline" size={12} color={catColor} />
            <Text style={[aer.timer, { color: catColor }]}>
              {mins}:{secs.toString().padStart(2, '0')} · {exercise.calories_burned} kcal
            </Text>
          </View>
        )}
      </View>
      <View style={aer.actions}>
        {/* How-to demo — animated figure */}
        <TouchableOpacity
          onPress={onDemo}
          style={[aer.howToBtn, { backgroundColor: catColor + '15', borderColor: catColor + '30' }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="play-circle" size={13} color={catColor} />
        </TouchableOpacity>
        {exercise.done ? (
          <View style={[aer.doneChip, { backgroundColor: theme.accent }]}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
        ) : isActive ? (
          <TouchableOpacity onPress={onComplete} activeOpacity={0.85}>
            <LinearGradient colors={[catColor, catColor + 'BB'] as [string, string]} style={aer.doneBtn}>
              <Text style={aer.doneBtnText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onStart} style={[aer.startBtn, { borderColor: catColor }]}>
            <Ionicons name="play" size={11} color={catColor} />
            <Text style={[aer.startBtnText, { color: catColor }]}>Start</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const aer = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: 14, gap: spacing.md, overflow: 'hidden' },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name:        { fontSize: fontSize.base, fontWeight: '700', flex: 1 },
  meta:        { fontSize: fontSize.xs, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timer:       { fontSize: fontSize.xs, fontWeight: '700' },
  actions:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
  howToBtn:    { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  doneChip:    { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  doneBtn:     { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 8 },
  doneBtnText: { fontSize: fontSize.sm, fontWeight: '800', color: '#fff' },
  startBtn:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5 },
  startBtnText:{ fontSize: fontSize.sm, fontWeight: '700' },
});

// ── WORKOUT TIMER ─────────────────────────────────────────────
function WorkoutTimer({ theme, seconds, calories }: { theme: typeof colors.light; seconds: number; calories: number }) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const timeStr = hrs > 0
    ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins.toString().padStart(2, '00')}:${secs.toString().padStart(2, '0')}`;
  return (
    <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.timerCard}>
      <View style={styles.timerSide}>
        <Text style={styles.timerLabel}>ELAPSED TIME</Text>
        <Text style={styles.timerValue}>{timeStr}</Text>
      </View>
      <View style={styles.timerDivider} />
      <View style={styles.timerSide}>
        <Text style={styles.timerLabel}>CALORIES BURNED</Text>
        <Text style={[styles.timerValue, { color: '#FF6B35' }]}>{calories}</Text>
        <Text style={styles.timerUnit}>kcal</Text>
      </View>
    </LinearGradient>
  );
}

// ── POST-WORKOUT MODAL ────────────────────────────────────────
function PostWorkoutModal({ visible, onClose, prResult, meal, loadingMeal, theme }: {
  visible: boolean; onClose: () => void;
  prResult: PRResult | null; meal: MealSuggestion | null;
  loadingMeal: boolean; theme: typeof colors.light;
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
            <View style={[styles.mealSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.postSectionTitle, { color: theme.textPrimary }]}>🍽️ Recovery Meal Suggestion</Text>
              {loadingMeal ? (
                <ActivityIndicator color={theme.accent} style={{ marginVertical: spacing.md }} />
              ) : meal ? (
                <View style={{ gap: spacing.xs }}>
                  <Text style={[styles.mealName, { color: theme.textPrimary }]}>{meal.name}</Text>
                  <Text style={[styles.mealWhy, { color: theme.textSecondary }]}>{meal.why}</Text>
                  <Text style={[styles.mealCal, { color: theme.accent }]}>~{meal.calories} kcal</Text>
                </View>
              ) : (
                <Text style={[styles.mealWhy, { color: theme.textMuted }]}>No suggestion available</Text>
              )}
            </View>
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

// ── MY ROUTINES TAB ───────────────────────────────────────────
function MyRoutinesTab({ theme, routines, onCreateManual, onCreateWithCoach, onStartRoutine, onDeleteRoutine }: {
  theme: typeof colors.light; routines: SavedRoutine[];
  onCreateManual: () => void; onCreateWithCoach: () => void;
  onStartRoutine: (r: SavedRoutine) => void; onDeleteRoutine: (id: string) => void;
}) {
  if (routines.length === 0) {
    return (
      <ScrollView contentContainerStyle={[styles.tabContent, styles.emptyContainer]}>
        <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.emptyHeroCard}>
          <BarbellSvg color={theme.accent} />
          <Text style={styles.emptyHeroTitle}>No routines yet</Text>
          <Text style={styles.emptyHeroSub}>Create a workout set to quickly access your saved workouts anytime</Text>
        </LinearGradient>
        <TouchableOpacity onPress={onCreateManual} activeOpacity={0.85} style={styles.createBtnWrap}>
          <LinearGradient colors={[theme.accent, '#0A9A5E'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtn}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Create Workout Set</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCreateWithCoach} activeOpacity={0.85}
          style={[styles.coachBtnOutline, { borderColor: theme.accent, backgroundColor: theme.accentDim as string }]}>
          <Ionicons name="sparkles-outline" size={18} color={theme.accent} />
          <Text style={[styles.coachBtnOutlineText, { color: theme.accent }]}>Let CalFit Coach Create It</Text>
        </TouchableOpacity>
        <Text style={[styles.inspirationLabel, { color: theme.textSecondary }]}>Popular workout types</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inspirationRow}>
          {[
            { name: 'Leg Day', emoji: '🦵', color: CAT_COLORS.Legs, desc: 'Squats, lunges & more' },
            { name: 'Cardio Blast', emoji: '🏃', color: CAT_COLORS.Cardio, desc: 'High energy burn' },
            { name: 'Upper Body', emoji: '💪', color: CAT_COLORS.Chest, desc: 'Chest, back & arms' },
            { name: 'Core Day', emoji: '🔥', color: CAT_COLORS.Core, desc: 'Abs & stability' },
          ].map((w) => (
            <TouchableOpacity key={w.name} onPress={onCreateManual} activeOpacity={0.8}
              style={[styles.inspirationCard, { backgroundColor: w.color + '18', borderColor: w.color + '44' }]}>
              <Text style={styles.inspirationEmoji}>{w.emoji}</Text>
              <Text style={[styles.inspirationName, { color: w.color }]}>{w.name}</Text>
              <Text style={[styles.inspirationDesc, { color: theme.textMuted }]}>{w.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.routinesTopRow}>
        <Text style={[styles.routinesCount, { color: theme.textSecondary }]}>{routines.length} routine{routines.length !== 1 ? 's' : ''}</Text>
        <TouchableOpacity onPress={onCreateManual} style={[styles.addRoutineBtn, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
          <Ionicons name="add" size={16} color={theme.accent} />
          <Text style={[styles.addRoutineBtnText, { color: theme.accent }]}>New Routine</Text>
        </TouchableOpacity>
      </View>
      {routines.map((routine) => {
        const firstCat = routine.exercises[0]?.category ?? 'All';
        const cardColor = CAT_COLORS[firstCat] ?? theme.accent;
        const gradColors: [string, string] = [cardColor + 'DD', cardColor + '88'];
        return (
          <View key={routine.id} style={[styles.routineCard, { borderColor: cardColor + '44' }]}>
            <LinearGradient colors={gradColors} style={styles.routineCardTop}>
              <View style={styles.routineCardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineCardName}>{routine.name}</Text>
                  {routine.description ? <Text style={styles.routineCardDesc}>{routine.description}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Delete?', `Remove "${routine.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => onDeleteRoutine(routine.id) },
                ])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.60)" />
                </TouchableOpacity>
              </View>
              <View style={styles.routineStatsBadgeRow}>
                {routine.duration_est ? <View style={styles.routineStatBadge}><Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.80)" /><Text style={styles.routineStatBadgeText}>~{routine.duration_est} min</Text></View> : null}
                {routine.calories_est ? <View style={styles.routineStatBadge}><Ionicons name="flame-outline" size={12} color="rgba(255,255,255,0.80)" /><Text style={styles.routineStatBadgeText}>~{routine.calories_est} kcal</Text></View> : null}
                <View style={styles.routineStatBadge}><Ionicons name="barbell-outline" size={12} color="rgba(255,255,255,0.80)" /><Text style={styles.routineStatBadgeText}>{routine.exercises.length} exercises</Text></View>
              </View>
            </LinearGradient>
            <View style={[styles.routineCardBody, { backgroundColor: theme.card }]}>
              {routine.exercises.slice(0, 3).map((ex, i) => (
                <View key={i} style={styles.routineExRow}>
                  <View style={[styles.routineExDot, { backgroundColor: CAT_COLORS[ex.category] ?? cardColor }]} />
                  <Text style={[styles.routineExName, { color: theme.textSecondary }]}>{ex.name}</Text>
                  <Text style={[styles.routineExCal, { color: theme.textMuted }]}>{ex.calories_per_minute} kcal/min</Text>
                </View>
              ))}
              {routine.exercises.length > 3 && <Text style={[styles.routineMoreText, { color: theme.textMuted }]}>+{routine.exercises.length - 3} more exercises</Text>}
              <TouchableOpacity onPress={() => onStartRoutine(routine)} activeOpacity={0.85} style={styles.startRoutineWrap}>
                <LinearGradient colors={[cardColor, cardColor + 'BB'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startRoutineBtn}>
                  <Ionicons name="play-circle" size={18} color="#fff" />
                  <Text style={styles.startRoutineBtnText}>Start Routine</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      <TouchableOpacity onPress={onCreateWithCoach} activeOpacity={0.8}
        style={[styles.coachCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <LinearGradient colors={[theme.accent + '22', theme.gradStart + '22'] as [string, string]} style={styles.coachCardIconWrap}>
          <Ionicons name="sparkles" size={22} color={theme.accent} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[styles.coachCardTitle, { color: theme.textPrimary }]}>Let CalFit Coach Create It</Text>
          <Text style={[styles.coachCardSub, { color: theme.textSecondary }]}>Answer a few questions and get a custom routine</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── MODALS ────────────────────────────────────────────────────
function CreateRoutineModal({ visible, theme, onClose, onConfirm }: {
  visible: boolean; theme: typeof colors.light; onClose: () => void; onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Name your routine</Text>
          <Text style={[styles.modalSub, { color: theme.textSecondary }]}>e.g. Leg Day, Cardio Blast, Full Body</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Routine name"
            placeholderTextColor={theme.textMuted} autoFocus
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
      </View>
    </Modal>
  );
}

function CoachRoutineModal({ visible, theme, onClose, onSave }: {
  visible: boolean; theme: typeof colors.light; onClose: () => void; onSave: (r: Partial<SavedRoutine>) => void;
}) {
  const questions = [
    { key: 'goal',      label: 'Fitness goal?',       options: ['Lose weight', 'Build muscle', 'Get fit', 'Endurance'] },
    { key: 'style',     label: 'Activity style?',     options: ['Strength', 'Cardio', 'HIIT', 'Flexibility'] },
    { key: 'location',  label: 'Home or gym?',         options: ['Home', 'Gym', 'Both'] },
    { key: 'level',     label: 'Experience level?',    options: ['Beginner', 'Intermediate', 'Advanced'] },
    { key: 'area',      label: 'Target area?',         options: ['Full body', 'Upper body', 'Lower body', 'Core'] },
    { key: 'duration',  label: 'Duration?',            options: ['15 min', '30 min', '45 min', '60 min'] },
    { key: 'equipment', label: 'Equipment?',           options: ['None', 'Dumbbells', 'Full gym', 'Bands'] },
    { key: 'count',     label: 'Exercise count?',      options: ['4–5', '6–8', '8–10', '10+'] },
  ];
  const [qIndex, setQIndex]       = useState(0);
  const [answers, setAnswers]     = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const reset = () => { setQIndex(0); setAnswers({}); setGenerated(null); setLoading(false); };

  const handleAnswer = async (answer: string) => {
    const newAnswers = { ...answers, [questions[qIndex].key]: answer };
    setAnswers(newAnswers);
    if (qIndex < questions.length - 1) { setQIndex(qIndex + 1); return; }
    setLoading(true);
    try {
      if (!hasClaudeKey()) { Alert.alert('AI not connected', 'Add your Anthropic API key to generate routines.'); reset(); return; }
      const result = await claudeJSON<any>(
        'You are a fitness coach. Generate workout routines as JSON only. No markdown, no explanation.',
        `Generate a workout routine. Goal:${newAnswers.goal} Style:${newAnswers.style} Location:${newAnswers.location} Level:${newAnswers.level} Area:${newAnswers.area} Duration:${newAnswers.duration} Equipment:${newAnswers.equipment} Count:${newAnswers.count}
JSON only: {"name":"Routine Name","description":"One sentence","exercises":[{"name":"Exercise","calories_per_minute":8,"category":"Cardio"}],"duration_est":30,"calories_est":250}`,
        600
      );
      if (!result) throw new Error('No result');
      setGenerated(result);
    } catch { Alert.alert('Error', 'Could not generate routine. Try again.'); reset(); }
    finally { setLoading(false); }
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
            <ScrollView>
              <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.generatedHero}>
                <Text style={styles.generatedBadge}>🎉 Your Routine is Ready</Text>
                <Text style={styles.generatedName}>{generated.name}</Text>
                <Text style={styles.generatedDesc}>{generated.description}</Text>
              </LinearGradient>
              {generated.exercises?.map((ex: any, i: number) => (
                <View key={i} style={styles.routineExRow}>
                  <View style={[styles.routineExDot, { backgroundColor: CAT_COLORS[ex.category] ?? theme.accent }]} />
                  <Text style={[styles.routineExName, { color: theme.textSecondary }]}>{ex.name}</Text>
                </View>
              ))}
              <View style={[styles.modalBtnRow, { marginTop: spacing.lg }]}>
                <TouchableOpacity onPress={reset} style={[styles.modalCancelBtn, { borderColor: theme.border }]}>
                  <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { onSave(generated); reset(); }} activeOpacity={0.85} style={styles.modalConfirmWrap}>
                  <LinearGradient colors={[theme.accent, '#0A9A5E'] as [string, string]} style={styles.modalConfirmBtn}>
                    <Text style={styles.modalConfirmText}>Perfect ✓</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <>
              <View style={styles.coachQProgress}>
                {questions.map((_, i) => <View key={i} style={[styles.coachQDot, { backgroundColor: i <= qIndex ? theme.accent : theme.border, width: i === qIndex ? 20 : 6 }]} />)}
              </View>
              <Text style={[styles.coachQLabel, { color: theme.textMuted }]}>{qIndex + 1} of {questions.length}</Text>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{questions[qIndex].label}</Text>
              <View style={styles.coachQOptions}>
                {questions[qIndex].options.map((opt) => (
                  <TouchableOpacity key={opt} onPress={() => handleAnswer(opt)} activeOpacity={0.8}
                    style={[styles.coachQOption, { backgroundColor: answers[questions[qIndex].key] === opt ? theme.accent : theme.bg, borderColor: answers[questions[qIndex].key] === opt ? theme.accent : theme.border }]}>
                    <Text style={[styles.coachQOptionText, { color: answers[questions[qIndex].key] === opt ? '#fff' : theme.textPrimary }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => { reset(); onClose(); }} style={styles.modalCancelLink}>
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
function ActiveWorkoutTab({ theme, exercises, activeIndex, workoutSeconds, workoutStarted, onStart, onComplete, onCompleteWorkout, onOpenCatalogue, onShowDemo }: {
  theme: typeof colors.light; exercises: ActiveExercise[]; activeIndex: number;
  workoutSeconds: number; workoutStarted: boolean;
  onStart: (i: number) => void; onComplete: (i: number) => void;
  onCompleteWorkout: () => void; onOpenCatalogue: () => void;
  onShowDemo: (ex: ActiveExercise) => void;
}) {
  const doneCount = exercises.filter(e => e.done).length;
  const progress  = exercises.length > 0 ? doneCount / exercises.length : 0;
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
        <ActiveExerciseRow
          key={ex.id} exercise={ex} theme={theme}
          isActive={i === activeIndex && workoutStarted}
          onStart={() => onStart(i)}
          onComplete={() => onComplete(i)}
          onDemo={() => onShowDemo(ex)}
        />
      ))}
      <TouchableOpacity onPress={onCompleteWorkout} activeOpacity={0.85} style={styles.completeWorkoutWrap}>
        <LinearGradient colors={[theme.gradStart, theme.gradMid] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.completeWorkoutBtn}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.completeWorkoutBtnText}>Complete Workout</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── CATALOGUE TAB ─────────────────────────────────────────────
function CatalogueTab({ theme, exercises, selectedIds, onToggle, onAddToWorkout, routineName, equipmentFilter, onEquipmentChange, onShowDemo }: {
  theme: typeof colors.light; exercises: Exercise[]; selectedIds: Set<string>;
  onToggle: (ex: Exercise) => void; onAddToWorkout: () => void; routineName?: string;
  equipmentFilter: string; onEquipmentChange: (eq: string) => void;
  onShowDemo: (ex: Exercise) => void;
}) {
  const categories = ['All', 'Cardio', 'Chest', 'Back', 'Core', 'Legs', 'Shoulders', 'Arms', 'Flexibility'];
  const [activeCategory, setActiveCategory] = useState('All');
  const [customName, setCustomName] = useState('');

  const filtered = exercises.filter((e) => {
    const catMatch = activeCategory === 'All' || e.category === activeCategory;
    const eqMatch  = equipmentFilter === 'All' || e.equipment === equipmentFilter;
    return catMatch && eqMatch;
  });
  const catColor = CAT_COLORS[activeCategory] ?? theme.accent;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((cat) => {
          const cc = CAT_COLORS[cat] ?? theme.accent;
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
              style={[styles.categoryPill, { backgroundColor: isActive ? cc : theme.card, borderColor: isActive ? cc : theme.border }]}>
              <Text style={[styles.categoryPillText, { color: isActive ? '#fff' : theme.textSecondary, fontWeight: isActive ? '700' : '400' }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.categoryRow, { paddingTop: 0 }]}>
        {EQUIPMENT_OPTIONS.map((eq) => {
          const isActive = equipmentFilter === eq;
          return (
            <TouchableOpacity key={eq} onPress={() => onEquipmentChange(eq)}
              style={[styles.eqPill, { backgroundColor: isActive ? theme.accentSecond : theme.card, borderColor: isActive ? theme.accentSecond : theme.border }]}>
              <Text style={[styles.eqPillText, { color: isActive ? '#fff' : theme.textMuted }]}>
                {eq === 'none' ? 'Bodyweight' : eq.charAt(0).toUpperCase() + eq.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {activeCategory !== 'All' && (
        <View style={[styles.catHeroBar, { backgroundColor: catColor + '15', borderColor: catColor + '44' }]}>
          <Ionicons name={catIconName(activeCategory)} size={16} color={catColor} />
          <Text style={[styles.catHeroText, { color: catColor }]}>{activeCategory} — {filtered.length} exercises</Text>
        </View>
      )}
      {selectedIds.size > 0 && (
        <TouchableOpacity onPress={onAddToWorkout} activeOpacity={0.85} style={styles.addSelectedWrap}>
          <LinearGradient colors={[theme.accent, '#0A9A5E'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addSelectedBar}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.addSelectedText}>
              Add {selectedIds.size} exercise{selectedIds.size > 1 ? 's' : ''} to workout{routineName ? ` — "${routineName}"` : ''} ✓
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      <ScrollView contentContainerStyle={styles.tabContent}>
        {filtered.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} theme={theme}
            isSelected={selectedIds.has(ex.id)}
            onToggle={() => onToggle(ex)}
            onDemo={() => onShowDemo(ex)} />
        ))}
        <View style={[styles.addManuallyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.addManuallyLabel, { color: theme.textSecondary }]}>Can't find it? Add manually:</Text>
          <View style={styles.addManuallyRow}>
            <TextInput value={customName} onChangeText={setCustomName} placeholder="Exercise name"
              placeholderTextColor={theme.textMuted}
              style={[styles.addManuallyInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bg }]} />
            <TouchableOpacity onPress={() => {
              if (customName.trim()) {
                onToggle({ id: `custom_${Date.now()}`, name: customName.trim(), category: 'Custom', muscle_group: 'Custom', difficulty: 'beginner', calories_per_minute: 6, equipment: 'none', description: 'Custom exercise' });
                setCustomName('');
              }
            }} activeOpacity={0.85} style={styles.addManuallyBtnWrap}>
              <LinearGradient colors={[theme.accent, '#0A9A5E'] as [string, string]} style={styles.addManuallyBtn}>
                <Ionicons name="add" size={20} color="#fff" />
              </LinearGradient>
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
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const pct = Math.min((totalCalories / 500) * 100, 100);
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.calorieHero}>
        <FlameSvg color="#FF6B35" />
        <Text style={styles.calorieHeroValue}>{totalCalories}</Text>
        <Text style={styles.calorieHeroLabel}>kcal burned today</Text>
        <View style={styles.calorieBarBg}>
          <LinearGradient colors={['#FF6B35', '#FFB830'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.calorieBarFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={styles.calorieBarSub}>{Math.round(pct)}% of 500 kcal daily burn goal</Text>
      </LinearGradient>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>This Week</Text>
      <View style={[styles.barChartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.barChart}>
          {weeklyData.map((val, i) => (
            <View key={i} style={styles.barWrap}>
              <View style={styles.barInner}>
                {i === todayIndex ? (
                  <LinearGradient colors={['#FF6B35', '#FFB830'] as [string, string]} style={[styles.bar, { height: `${(val / max) * 100}%` as any }]} />
                ) : (
                  <View style={[styles.bar, { height: `${(val / max) * 100}%` as any, backgroundColor: theme.border, opacity: 0.5 }]} />
                )}
              </View>
              <Text style={[styles.barLabel, { color: i === todayIndex ? '#FF6B35' : theme.textMuted, fontWeight: i === todayIndex ? '700' : '400' }]}>{days[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.weeklyTotal, { color: theme.textMuted }]}>Weekly: {weeklyData.reduce((a, b) => a + b, 0)} kcal burned</Text>
      </View>
    </ScrollView>
  );
}

// ── STEPS TAB ─────────────────────────────────────────────────
function StepsTab({ theme, goalSteps }: { theme: typeof colors.light; goalSteps: number }) {
  const { liveSteps: steps } = useAuthStore();
  const calories   = Math.round(steps * 0.04);
  const percentage = Math.round(Math.min(steps / goalSteps, 1) * 100);
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <LinearGradient colors={['#C8E6FF', '#D8F4F4'] as [string, string]} style={styles.stepsHero}>
        <FootprintSvg color="#2BBCB0" />
        <Text style={styles.stepsHeroValue}>{steps >= 1000 ? `${(steps / 1000).toFixed(1)}K` : steps.toString()}</Text>
        <Text style={styles.stepsHeroLabel}>steps today</Text>
        <View style={styles.stepsBarBg}>
          <LinearGradient colors={['#2BBCB0', '#4A90E2'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.stepsBarFill, { width: `${Math.min(percentage, 100)}%` as any }]} />
        </View>
        <Text style={styles.stepsBarSub}>{steps.toLocaleString()} of {goalSteps.toLocaleString()} · {percentage}%</Text>
      </LinearGradient>
      <LinearGradient colors={['#FF6B35' + '18', '#FFB830' + '18'] as [string, string]}
        style={[styles.stepsCalPill, { borderColor: '#FF6B35' + '44' }]}>
        <Ionicons name="flame-outline" size={16} color="#FF6B35" />
        <Text style={[styles.stepsCalText, { color: '#FF6B35' }]}>{calories} kcal burned from steps</Text>
      </LinearGradient>
      <View style={[styles.stepsSensorCard, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
        <Ionicons name="checkmark-circle-outline" size={20} color={theme.accent} />
        <Text style={[styles.stepsSensorText, { color: theme.textPrimary }]}>Steps tracked automatically in the background.</Text>
      </View>
    </ScrollView>
  );
}

// ── HISTORY TAB ───────────────────────────────────────────────
function HistoryTab({ theme, sessions }: { theme: typeof colors.light; sessions: WorkoutSession[] }) {
  if (sessions.length === 0) {
    return (
      <ScrollView contentContainerStyle={[styles.tabContent, styles.emptyContainer]}>
        <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.emptyHeroCard}>
          <HistorySvg color={theme.accent} />
          <Text style={styles.emptyHeroTitle}>No workout history yet</Text>
          <Text style={styles.emptyHeroSub}>Complete your first workout and it will appear here</Text>
        </LinearGradient>
      </ScrollView>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {sessions.map((session) => {
        const date = new Date(session.completed_at);
        const hrs  = Math.floor(session.duration_seconds / 3600);
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
              <View style={styles.historyCalBadge}>
                <Text style={[styles.historyCalNum, { color: '#FF6B35' }]}>{session.calories_burned}</Text>
                <Text style={[styles.historyCalUnit, { color: '#FF6B35' }]}>kcal</Text>
              </View>
            </LinearGradient>
            <View style={[styles.historyCardBottom, { backgroundColor: theme.card }]}>
              <View style={styles.historyStats}>
                <View style={styles.historyStat}>
                  <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                  <Text style={[styles.historyStatText, { color: theme.textMuted }]}>{timeDisplay}</Text>
                </View>
                <View style={styles.historyStat}>
                  <Ionicons name="barbell-outline" size={13} color={theme.textMuted} />
                  <Text style={[styles.historyStatText, { color: theme.textMuted }]}>{session.exercises.length} exercises</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── INNER TAB BAR ─────────────────────────────────────────────
function InnerTabs({ tabs, active, onPress, theme }: {
  tabs: string[]; active: string; onPress: (t: string) => void; theme: typeof colors.light;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={[styles.innerTabBar, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}
      contentContainerStyle={styles.innerTabBarContent}>
      {tabs.map((tab) => {
        const isActive = active === tab;
        return (
          <TouchableOpacity key={tab} onPress={() => onPress(tab)}
            style={[styles.innerTab, isActive && { borderBottomColor: theme.accent }]}>
            <Text style={[styles.innerTabText, { color: isActive ? theme.textPrimary : theme.textMuted }, isActive && { fontWeight: '700' }]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function WorkoutScreen() {
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];
  const goalSteps = (profile as any)?.step_goal ?? 10000;

  const tabs = ['My Routines', 'Catalogue', 'Calories', 'Steps', 'History'];
  const [activeTab, setActiveTab]                       = useState('My Routines');
  const [catalogue, setCatalogue]                       = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds]                   = useState<Set<string>>(new Set());
  const [workoutExercises, setWorkoutExercises]         = useState<ActiveExercise[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex]   = useState(-1);
  const [workoutStarted, setWorkoutStarted]             = useState(false);
  const [workoutSeconds, setWorkoutSeconds]             = useState(0);
  const [sessions, setSessions]                         = useState<WorkoutSession[]>([]);
  const [weeklyCalories, setWeeklyCalories]             = useState([0, 0, 0, 0, 0, 0, 0]);
  const [totalCaloriesBurned, setTotalCaloriesBurned]   = useState(0);
  const [savedRoutines, setSavedRoutines]               = useState<SavedRoutine[]>([]);
  const [pendingRoutineName, setPendingRoutineName]     = useState('');
  const [showCreateModal, setShowCreateModal]           = useState(false);
  const [showCoachModal, setShowCoachModal]             = useState(false);
  const [isInActiveWorkout, setIsInActiveWorkout]       = useState(false);
  const [equipmentFilter, setEquipmentFilter]           = useState('All');
  const [showPostWorkoutModal, setShowPostWorkoutModal] = useState(false);
  const [prResult, setPrResult]                         = useState<PRResult | null>(null);
  const [postWorkoutMeal, setPostWorkoutMeal]           = useState<MealSuggestion | null>(null);
  const [loadingMealSuggestion, setLoadingMealSuggestion] = useState(false);
  const [demoExercise, setDemoExercise]                   = useState<Exercise | null>(null);

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
    } catch {}
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
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase.from('workout_routines').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setSavedRoutines(data.map((r: any) => ({ ...r, exercises: r.exercises ?? [] })));
    } catch {}
  };

  const saveRoutine = async (routine: Partial<SavedRoutine>) => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase.from('workout_routines').insert({
        user_id: user.id, name: routine.name ?? 'My Routine', description: routine.description ?? '',
        exercises: routine.exercises ?? [], duration_est: routine.duration_est ?? null, calories_est: routine.calories_est ?? null,
      }).select().single();
      if (data) setSavedRoutines((prev) => [data, ...prev]);
      setShowCoachModal(false); setShowCreateModal(false);
      Alert.alert('Routine saved! 💪', `"${routine.name}" added to My Routines.`);
    } catch {}
  };

  const deleteRoutine = async (id: string) => {
    try {
      const { supabase } = await import('../../services/supabase');
      await supabase.from('workout_routines').delete().eq('id', id);
      setSavedRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  const handleStartRoutine = (routine: SavedRoutine) => {
    const exercises = routine.exercises.map((ex: any) => ({
      ...ex, id: ex.id ?? `${ex.name}_${Date.now()}`,
      muscle_group: ex.muscle_group ?? '', difficulty: ex.difficulty ?? 'beginner',
      equipment: ex.equipment ?? 'none', description: ex.description ?? '',
      seconds: 0, calories_burned: 0, done: false,
    }));
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
    loadPostWorkoutMeal(workoutExercises, totalCal);
    loadHistory();
  };

  const loadPostWorkoutMeal = async (exercises: ActiveExercise[], totalCal: number) => {
    setLoadingMealSuggestion(true); setPostWorkoutMeal(null);
    try {
      const fallbacks: MealSuggestion[] = [
        { name: 'Grilled Chicken + Rice', why: 'High protein to repair muscles, carbs to replenish glycogen.', calories: 520 },
        { name: 'Egg & Avocado Toast', why: 'Healthy fats + protein for recovery. Quick and easy.', calories: 380 },
        { name: 'Greek Yoghurt + Banana', why: 'Fast carbs + protein — ideal within 30 min of training.', calories: 290 },
        { name: 'Jollof Rice + Grilled Fish', why: 'Great carb and protein balance for Nigerian recovery.', calories: 580 },
      ];
      if (!hasClaudeKey()) { setPostWorkoutMeal(fallbacks[Math.floor(Math.random() * fallbacks.length)]); return; }
      const categories = [...new Set(exercises.map(e => e.category))].join(', ');
      const result = await claudeJSON<MealSuggestion>(
        'You are a sports nutritionist. Suggest a post-workout recovery meal. Return JSON only: { "name": string, "why": string (max 15 words), "calories": number }',
        `Workout: ${categories || 'mixed'} training, ${totalCal} kcal burned. Suggest one recovery meal suitable for Nigeria or globally.`
      );
      setPostWorkoutMeal(result ?? fallbacks[0]);
    } catch { setPostWorkoutMeal({ name: 'Grilled Chicken + Rice', why: 'High protein to repair muscles, carbs to replenish glycogen.', calories: 520 }); }
    finally { setLoadingMealSuggestion(false); }
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      <View style={[styles.header, { backgroundColor: theme.bg }]}>
        <View>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Activity</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            {isInActiveWorkout ? 'Workout in progress 🔥' : `${savedRoutines.length} routine${savedRoutines.length !== 1 ? 's' : ''} saved`}
          </Text>
        </View>
        {isInActiveWorkout && (
          <TouchableOpacity onPress={() => { setIsInActiveWorkout(false); setWorkoutExercises([]); setWorkoutStarted(false); setWorkoutSeconds(0); }}
            style={[styles.cancelWorkoutBtn, { borderColor: theme.red }]}>
            <Text style={[styles.cancelWorkoutText, { color: theme.red }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <InnerTabs tabs={tabs} active={activeTab}
        onPress={(tab) => { setActiveTab(tab); if (tab !== 'My Routines') setIsInActiveWorkout(false); }}
        theme={theme} />

      {activeTab === 'My Routines' && !isInActiveWorkout && (
        <MyRoutinesTab theme={theme} routines={savedRoutines}
          onCreateManual={() => setShowCreateModal(true)} onCreateWithCoach={() => setShowCoachModal(true)}
          onStartRoutine={handleStartRoutine} onDeleteRoutine={deleteRoutine} />
      )}
      {activeTab === 'My Routines' && isInActiveWorkout && (
        <ActiveWorkoutTab
          theme={theme} exercises={workoutExercises} activeIndex={activeExerciseIndex}
          workoutSeconds={workoutSeconds} workoutStarted={workoutStarted}
          onStart={handleStartExercise} onComplete={handleCompleteExercise}
          onCompleteWorkout={handleCompleteWorkout} onOpenCatalogue={() => setActiveTab('Catalogue')}
          onShowDemo={(ex) => setDemoExercise(ex)}
        />
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

      <CreateRoutineModal visible={showCreateModal} theme={theme} onClose={() => setShowCreateModal(false)}
        onConfirm={(name) => { setPendingRoutineName(name); setShowCreateModal(false); setActiveTab('Catalogue'); }} />
      <CoachRoutineModal visible={showCoachModal} theme={theme} onClose={() => setShowCoachModal(false)} onSave={saveRoutine} />

      <PostWorkoutModal
        visible={showPostWorkoutModal}
        onClose={() => { setShowPostWorkoutModal(false); setPrResult(null); setPostWorkoutMeal(null); }}
        prResult={prResult} meal={postWorkoutMeal} loadingMeal={loadingMealSuggestion} theme={theme}
      />

      {/* ── EXERCISE DEMO MODAL — animated human figure ── */}
      <ExerciseDemoModal
        visible={!!demoExercise}
        exercise={demoExercise}
        theme={theme}
        onClose={() => setDemoExercise(null)}
        onAddToWorkout={(ex) => {
          const toAdd = { ...ex, seconds: 0, calories_burned: 0, done: false };
          setWorkoutExercises((prev) => prev.some((e) => e.id === ex.id) ? prev : [...prev, toAdd as ActiveExercise]);
          setDemoExercise(null);
          setIsInActiveWorkout(true);
          setActiveTab('My Routines');
        }}
      />
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },
  pageSubtitle: { fontSize: fontSize.xs, marginTop: 1 },
  cancelWorkoutBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  cancelWorkoutText: { fontSize: fontSize.sm, fontWeight: '700' },
  innerTabBar: { borderBottomWidth: 1, maxHeight: 42 },
  innerTabBarContent: { paddingHorizontal: spacing.sm },
  innerTab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  innerTabText: { fontSize: fontSize.sm },
  tabContent: { paddingBottom: 100, paddingTop: spacing.md },
  emptyContainer: { flexGrow: 1 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyHeroCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: 28, borderRadius: 20, alignItems: 'center', gap: spacing.sm },
  emptyHeroTitle: { fontSize: fontSize.xl, fontWeight: '700', color: '#fff', textAlign: 'center' },
  emptyHeroSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 20 },
  inspirationLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  inspirationRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  inspirationCard: { width: 130, padding: spacing.md, borderRadius: 16, borderWidth: 1, gap: 4 },
  inspirationEmoji: { fontSize: 28 },
  inspirationName: { fontSize: fontSize.sm, fontWeight: '800' },
  inspirationDesc: { fontSize: 11, lineHeight: 15 },
  createBtnWrap: { marginHorizontal: spacing.lg, borderRadius: 16, overflow: 'hidden', marginBottom: spacing.sm },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  createBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },
  coachBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: spacing.md, borderRadius: 16, borderWidth: 1.5 },
  coachBtnOutlineText: { fontSize: fontSize.base, fontWeight: '700' },
  routinesTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  routinesCount: { fontSize: fontSize.sm, fontWeight: '600' },
  addRoutineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  addRoutineBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  routineCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  routineCardTop: { padding: spacing.lg },
  routineCardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  routineCardName: { fontSize: fontSize.lg, fontWeight: '800', color: '#fff' },
  routineCardDesc: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.70)', marginTop: 2 },
  routineStatsBadgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  routineStatBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  routineStatBadgeText: { fontSize: 11, color: 'rgba(255,255,255,0.90)', fontWeight: '600' },
  routineCardBody: { padding: spacing.md, gap: spacing.sm },
  routineExRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  routineExDot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
  routineExName: { flex: 1, fontSize: fontSize.sm },
  routineExCal: { fontSize: 11 },
  routineMoreText: { fontSize: fontSize.xs, marginTop: 2 },
  startRoutineWrap: { borderRadius: 12, overflow: 'hidden', marginTop: spacing.xs },
  startRoutineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  startRoutineBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, borderRadius: 16, borderWidth: 1 },
  coachCardIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  coachCardTitle: { fontSize: fontSize.base, fontWeight: '700' },
  coachCardSub: { fontSize: fontSize.sm, marginTop: 2 },
  workoutProgressWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: 12, borderWidth: 1, gap: 8 },
  workoutProgressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  workoutProgressLabel: { fontSize: fontSize.sm },
  workoutProgressPct: { fontSize: fontSize.sm, fontWeight: '700' },
  workoutProgressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  workoutProgressFill: { height: '100%', borderRadius: 3 },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  todayTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  addMoreText: { fontSize: fontSize.sm, fontWeight: '600' },
  completeWorkoutWrap: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: 16, overflow: 'hidden' },
  completeWorkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  completeWorkoutBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },
  timerCard: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.sm, padding: spacing.lg, borderRadius: 20 },
  timerSide: { flex: 1, alignItems: 'center' },
  timerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: spacing.md },
  timerLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5, marginBottom: 4 },
  timerValue: { fontSize: 24, fontWeight: '900', color: '#fff' },
  timerUnit: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  categoryRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  categoryPill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 99, borderWidth: 1, height: 32, justifyContent: 'center' },
  categoryPillText: { fontSize: fontSize.sm },
  eqPill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 99, borderWidth: 1, height: 28, justifyContent: 'center' },
  eqPillText: { fontSize: 11, fontWeight: '600' },
  catHeroBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: 10, borderRadius: 10, borderWidth: 1 },
  catHeroText: { fontSize: fontSize.sm, fontWeight: '600' },
  addSelectedWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: 12, overflow: 'hidden' },
  addSelectedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  addSelectedText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  addManuallyCard: { marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', gap: spacing.sm },
  addManuallyLabel: { fontSize: fontSize.sm },
  addManuallyRow: { flexDirection: 'row', gap: spacing.sm },
  addManuallyInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: spacing.sm, fontSize: fontSize.base },
  addManuallyBtnWrap: { borderRadius: 8, overflow: 'hidden' },
  addManuallyBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  calorieHero: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.xl, borderRadius: 20, alignItems: 'center', gap: 6 },
  calorieHeroValue: { fontSize: 56, fontWeight: '900', color: '#fff', lineHeight: 60 },
  calorieHeroLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.65)', marginBottom: 12 },
  calorieBarBg: { width: '100%', height: 7, backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  calorieBarFill: { height: '100%', borderRadius: 4 },
  calorieBarSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)' },
  barChartCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderRadius: 16, borderWidth: 1 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: spacing.xs },
  barWrap: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barInner: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9 },
  weeklyTotal: { fontSize: fontSize.xs, textAlign: 'right', marginTop: spacing.sm },
  stepsHero: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.xl, borderRadius: 20, alignItems: 'center', gap: 6 },
  stepsHeroValue: { fontSize: 52, fontWeight: '900', color: '#2BBCB0', lineHeight: 56 },
  stepsHeroLabel: { fontSize: fontSize.sm, color: '#2BBCB0', fontWeight: '600', marginBottom: 8 },
  stepsBarBg: { width: '100%', height: 7, backgroundColor: 'rgba(43,188,176,0.25)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  stepsBarFill: { height: '100%', borderRadius: 4 },
  stepsBarSub: { fontSize: fontSize.xs, color: '#2BBCB0', opacity: 0.70 },
  stepsCalPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  stepsCalText: { fontSize: fontSize.sm, fontWeight: '600' },
  stepsSensorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  stepsSensorText: { fontSize: fontSize.sm, flex: 1, lineHeight: 18 },
  historyCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  historyCardTop: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  historyName: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  historyDate: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.60)', marginTop: 2 },
  historyCalBadge: { alignItems: 'center', paddingHorizontal: 8 },
  historyCalNum: { fontSize: 22, fontWeight: '900' },
  historyCalUnit: { fontSize: 10, fontWeight: '600' },
  historyCardBottom: { flexDirection: 'row', padding: spacing.md },
  historyStats: { flexDirection: 'row', gap: spacing.lg },
  historyStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyStatText: { fontSize: fontSize.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40, gap: spacing.md },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800' },
  modalSub: { fontSize: fontSize.base, lineHeight: 20 },
  modalInput: { borderWidth: 1.5, borderRadius: 12, padding: spacing.md, fontSize: fontSize.lg },
  modalBtnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  modalCancelBtn: { flex: 1, padding: spacing.md, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  modalCancelText: { fontSize: fontSize.base, fontWeight: '600' },
  modalConfirmWrap: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  modalConfirmBtn: { padding: spacing.md, alignItems: 'center' },
  modalConfirmText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  modalLoading: { alignItems: 'center', gap: spacing.md, paddingVertical: 40 },
  modalLoadingText: { fontSize: fontSize.lg, fontWeight: '600' },
  modalCancelLink: { alignItems: 'center', paddingTop: spacing.sm },
  generatedHero: { padding: spacing.lg, borderRadius: 16, marginBottom: spacing.md },
  generatedBadge: { fontSize: fontSize.sm, fontWeight: '700', color: 'rgba(255,255,255,0.80)', marginBottom: 6 },
  generatedName: { fontSize: fontSize.xxl, fontWeight: '900', color: '#fff' },
  generatedDesc: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  coachQProgress: { flexDirection: 'row', gap: 4, marginBottom: spacing.sm },
  coachQDot: { height: 6, borderRadius: 3 },
  coachQLabel: { fontSize: fontSize.xs, fontWeight: '600' },
  coachQOptions: { gap: spacing.sm },
  coachQOption: { padding: spacing.md, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  coachQOptionText: { fontSize: fontSize.base, fontWeight: '600' },
  postWorkoutSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '85%' },
  postWorkoutHeader: { padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  postWorkoutEmoji: { fontSize: 40 },
  postWorkoutTitle: { fontSize: fontSize.xxl, fontWeight: '900', color: '#fff' },
  postWorkoutSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.70)' },
  postWorkoutClose: { padding: spacing.lg, paddingTop: 0 },
  postWorkoutCloseWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  postWorkoutCloseBtn: { padding: spacing.md, alignItems: 'center' },
  postWorkoutCloseBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  prSection: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  mealSection: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  postSectionTitle: { fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.xs },
  prRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  prLabel: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  prValue: { fontSize: fontSize.base, fontWeight: '800', textAlign: 'right' },
  prImprovement: { fontSize: fontSize.xs, textAlign: 'right', marginTop: 2 },
  mealName: { fontSize: fontSize.lg, fontWeight: '800', marginBottom: 4 },
  mealWhy: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.sm },
  mealCal: { fontSize: fontSize.base, fontWeight: '700' },
});