import React from 'react';
import {
  View, Text, StyleSheet, Modal,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize } from '../theme';
import { getExerciseAnimation } from '../services/ExerciseanimationsService';
import {
  SquatAnimation, PushUpAnimation, PullUpAnimation,
  CrunchAnimation, PlankAnimation, RunAnimation,
  JumpingJackAnimation, CurlAnimation, DipsAnimation,
  GluteBridgeAnimation, LungeAnimation, LegRaiseAnimation,
  SupermanAnimation, CalfRaiseAnimation, StretchAnimation,
} from './Exerciseanimations';

// ── CATEGORY COLOURS ──────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  Cardio: '#FF6B35', Chest: '#F0427C', Back: '#4A90E2',
  Core: '#2BBCB0', Legs: '#9B6FE8', Shoulders: '#FFB830',
  Arms: '#34D98A', Flexibility: '#FF8C42', Custom: '#6B7280',
};

// ── MUSCLE MAP ────────────────────────────────────────────────
const MUSCLE_MAP: Record<string, { primary: string[]; secondary: string[] }> = {
  Chest:       { primary: ['Pectorals', 'Anterior Deltoid'],     secondary: ['Triceps', 'Serratus'] },
  Back:        { primary: ['Latissimus Dorsi', 'Rhomboids'],      secondary: ['Biceps', 'Rear Deltoid'] },
  Legs:        { primary: ['Quadriceps', 'Glutes'],               secondary: ['Hamstrings', 'Calves'] },
  Shoulders:   { primary: ['Medial Deltoid', 'Anterior Deltoid'], secondary: ['Trapezius', 'Rotator Cuff'] },
  Arms:        { primary: ['Biceps Brachii', 'Brachialis'],       secondary: ['Triceps', 'Forearms'] },
  Core:        { primary: ['Rectus Abdominis', 'Transverse Abs'], secondary: ['Obliques', 'Hip Flexors'] },
  Cardio:      { primary: ['Cardiovascular System', 'Full Body'], secondary: ['Legs', 'Core'] },
  Flexibility: { primary: ['Target Muscle Group'],                secondary: ['Connective Tissue', 'Joints'] },
  Custom:      { primary: ['Multiple Muscle Groups'],             secondary: ['Core Stabilizers'] },
};

// ── FORM TIPS ─────────────────────────────────────────────────
const FORM_TIPS: Record<string, { tip: string; icon: string }[]> = {
  Chest: [
    { tip: 'Retract shoulder blades before every rep',    icon: '🎯' },
    { tip: 'Lower with full control — 2 seconds down',   icon: '⏱' },
    { tip: 'Drive through the full range of motion',     icon: '💪' },
  ],
  Back: [
    { tip: 'Drive elbows back — not your hands',         icon: '🎯' },
    { tip: 'Keep spine neutral throughout',              icon: '🦴' },
    { tip: 'Squeeze at peak contraction',                icon: '💪' },
  ],
  Legs: [
    { tip: 'Knees track directly over toes',             icon: '🎯' },
    { tip: 'Keep chest up, weight through heels',        icon: '⚖️' },
    { tip: 'Full depth activates more muscle fibres',    icon: '📐' },
  ],
  Shoulders: [
    { tip: 'Avoid shrugging — keep traps down',          icon: '🎯' },
    { tip: 'Control the weight on the way down',         icon: '⏱' },
    { tip: 'Brace core to protect lower back',           icon: '🛡' },
  ],
  Arms: [
    { tip: 'Isolate the muscle — no body swing',         icon: '🎯' },
    { tip: 'Full extension on every rep',                icon: '📏' },
    { tip: 'Squeeze hard at peak for 1 second',          icon: '💪' },
  ],
  Core: [
    { tip: "Don't hold your breath — exhale on effort",  icon: '💨' },
    { tip: 'Slow and controlled beats fast',             icon: '⏱' },
    { tip: 'Quality reps only — stop before form breaks',icon: '✅' },
  ],
  Cardio: [
    { tip: 'Land softly to protect your joints',         icon: '🦵' },
    { tip: 'Breathe rhythmically — nose in, mouth out', icon: '💨' },
    { tip: 'Keep core engaged throughout',              icon: '🎯' },
  ],
  Flexibility: [
    { tip: 'Never stretch into pain',                   icon: '⚠️' },
    { tip: 'Hold each position for 20–30 seconds',      icon: '⏱' },
    { tip: 'Breathe deeply into the stretch',           icon: '💨' },
  ],
};

// ── SETS / REPS ───────────────────────────────────────────────
const SETS_REPS: Record<string, { sets: string; reps: string; rest: string }> = {
  beginner:     { sets: '2–3 sets', reps: '10–12 reps', rest: '90s rest' },
  intermediate: { sets: '3–4 sets', reps: '8–12 reps',  rest: '60s rest' },
  advanced:     { sets: '4–5 sets', reps: '6–10 reps',  rest: '45s rest' },
};

// ── ANIMATION RENDERER ────────────────────────────────────────
function ExerciseFigure({ exerciseName, color }: { exerciseName: string; color: string }) {
  const type = getExerciseAnimation(exerciseName);
  const props = { color };
  switch (type) {
    case 'squat':       return <SquatAnimation {...props} />;
    case 'pushup':      return <PushUpAnimation {...props} />;
    case 'pullup':      return <PullUpAnimation {...props} />;
    case 'crunch':      return <CrunchAnimation {...props} />;
    case 'plank':       return <PlankAnimation {...props} />;
    case 'run':         return <RunAnimation {...props} />;
    case 'jumpingjack': return <JumpingJackAnimation {...props} />;
    case 'curl':        return <CurlAnimation {...props} />;
    case 'dips':        return <DipsAnimation {...props} />;
    case 'glutebridge': return <GluteBridgeAnimation {...props} />;
    case 'lunge':       return <LungeAnimation {...props} />;
    case 'legraise':    return <LegRaiseAnimation {...props} />;
    case 'superman':    return <SupermanAnimation {...props} />;
    case 'calfraise':   return <CalfRaiseAnimation {...props} />;
    case 'stretch':     return <StretchAnimation {...props} />;
    default:            return <SquatAnimation {...props} />;
  }
}

// ── TYPES ─────────────────────────────────────────────────────
interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_group: string;
  difficulty: string;
  calories_per_minute: number;
  equipment: string;
  description: string;
  gif_url?: string | null;
}

interface Props {
  visible: boolean;
  exercise: Exercise | null;
  theme: typeof colors.light;
  onClose: () => void;
  onAddToWorkout?: (exercise: Exercise) => void;
}

// ── COMPONENT ─────────────────────────────────────────────────
export default function ExerciseDemoModal({
  visible, exercise, theme, onClose, onAddToWorkout,
}: Props) {
  if (!exercise) return null;

  const catColor = CAT_COLORS[exercise.category] ?? theme.accent;
  const muscles  = MUSCLE_MAP[exercise.category]  ?? MUSCLE_MAP.Custom;
  const tips     = FORM_TIPS[exercise.category]   ?? FORM_TIPS.Cardio;
  const setsReps = SETS_REPS[exercise.difficulty] ?? SETS_REPS.beginner;

  const diffColors: Record<string, string> = {
    beginner: '#2DDC8C', intermediate: '#FFB830', advanced: '#FF5959',
  };
  const diffLabels: Record<string, string> = {
    beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced',
  };
  const diffColor = diffColors[exercise.difficulty] ?? '#2DDC8C';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={[styles.sheet, { backgroundColor: '#0D0A1E' }]}>

          {/* ── HERO HEADER ── */}
          <LinearGradient
            colors={[catColor + 'DD', catColor + '22', 'transparent'] as any}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>

            <View style={[styles.catChip, { backgroundColor: catColor + '33', borderColor: catColor + '66' }]}>
              <Text style={[styles.catChipText, { color: catColor }]}>
                {exercise.category.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.heroName}>{exercise.name}</Text>
            <Text style={styles.heroMuscle}>{exercise.muscle_group}</Text>

            <View style={styles.heroPills}>
              <View style={[styles.pill, { backgroundColor: diffColor + '22', borderColor: diffColor + '55' }]}>
                <Text style={[styles.pillText, { color: diffColor }]}>
                  {diffLabels[exercise.difficulty] ?? exercise.difficulty}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)' }]}>
                <Ionicons name="flame-outline" size={11} color="#FF6B35" />
                <Text style={[styles.pillText, { color: '#FF6B35' }]}>
                  {exercise.calories_per_minute} kcal/min
                </Text>
              </View>
              {exercise.equipment && exercise.equipment !== 'none' && (
                <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)' }]}>
                  <Ionicons name="barbell-outline" size={11} color="rgba(255,255,255,0.70)" />
                  <Text style={[styles.pillText, { color: 'rgba(255,255,255,0.70)' }]}>
                    {exercise.equipment}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            bounces={false}
          >

            {/* ── ANIMATED FIGURE ── */}
            <View style={[styles.figureCard, { backgroundColor: catColor + '0E', borderColor: catColor + '33' }]}>
              <View style={styles.figureLabelRow}>
                <View style={[styles.liveDot, { backgroundColor: catColor }]} />
                <Text style={[styles.figureLabel, { color: catColor }]}>LIVE DEMO</Text>
              </View>
              <View style={styles.figureWrap}>
                <ExerciseFigure exerciseName={exercise.name} color={catColor} />
              </View>
              <Text style={[styles.figureHint, { color: 'rgba(255,255,255,0.30)' }]}>
                Animated · Follow the movement pattern
              </Text>
            </View>

            {/* ── SETS / REPS ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommended</Text>
              <View style={styles.setsGrid}>
                {[
                  { label: 'Sets', value: setsReps.sets, icon: 'layers-outline',  color: catColor  },
                  { label: 'Reps', value: setsReps.reps, icon: 'repeat-outline',  color: '#FFB830' },
                  { label: 'Rest', value: setsReps.rest, icon: 'timer-outline',   color: '#4A90E2' },
                ].map((s) => (
                  <View key={s.label} style={[styles.setsCell, { borderColor: s.color + '30', backgroundColor: s.color + '10' }]}>
                    <View style={[styles.setsCellIcon, { backgroundColor: s.color + '20' }]}>
                      <Ionicons name={s.icon as any} size={16} color={s.color} />
                    </View>
                    <Text style={styles.setsCellVal}>{s.value}</Text>
                    <Text style={styles.setsCellLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── MUSCLES WORKED ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Muscles Worked</Text>
              <View style={styles.muscleBlock}>
                <Text style={styles.muscleSub}>PRIMARY</Text>
                <View style={styles.muscleTags}>
                  {muscles.primary.map((m) => (
                    <View key={m} style={[styles.muscleTag, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
                      <Text style={[styles.muscleTagText, { color: catColor }]}>{m}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.muscleSub, { marginTop: 10 }]}>SECONDARY</Text>
                <View style={styles.muscleTags}>
                  {muscles.secondary.map((m) => (
                    <View key={m} style={[styles.muscleTag, { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.muscleTagText, { color: 'rgba(255,255,255,0.55)' }]}>{m}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ── FORM TIPS ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Form Cues</Text>
              {tips.map((t, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={[styles.tipNum, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
                    <Text style={[styles.tipNumText, { color: catColor }]}>{i + 1}</Text>
                  </View>
                  <Text style={styles.tipEmoji}>{t.icon}</Text>
                  <Text style={styles.tipText}>{t.tip}</Text>
                </View>
              ))}
            </View>

            {/* ── DESCRIPTION ── */}
            {!!exercise.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.descText}>{exercise.description}</Text>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* ── FOOTER ── */}
          <View style={styles.footer}>
            {onAddToWorkout && (
              <TouchableOpacity
                onPress={() => { onAddToWorkout(exercise); onClose(); }}
                activeOpacity={0.85}
                style={styles.addBtnWrap}
              >
                <LinearGradient
                  colors={[catColor, catColor + 'BB'] as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.addBtn}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Add to Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeTextBtn}>
              <Text style={styles.closeTextBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay:          { flex: 1, justifyContent: 'flex-end' },
  backdrop:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.80)' },
  sheet:            { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '93%', overflow: 'hidden' },

  // Hero
  hero:             { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg + 4 },
  closeBtn:         { position: 'absolute', top: spacing.md, right: spacing.md, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.40)', alignItems: 'center', justifyContent: 'center' },
  catChip:          { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 6, borderWidth: 1, marginBottom: spacing.sm },
  catChipText:      { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  heroName:         { fontSize: 28, fontWeight: '900', color: '#fff', lineHeight: 32, marginBottom: 4 },
  heroMuscle:       { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.55)', marginBottom: spacing.md },
  heroPills:        { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill:             { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  pillText:         { fontSize: fontSize.xs, fontWeight: '700' },

  scrollBody:       { paddingHorizontal: spacing.lg, paddingBottom: 20 },

  // Animated figure card
  figureCard:       { borderRadius: 20, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  figureLabelRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.md, paddingBottom: 0 },
  liveDot:          { width: 7, height: 7, borderRadius: 4 },
  figureLabel:      { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  figureWrap:       { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  figureHint:       { fontSize: 10, textAlign: 'center', paddingBottom: spacing.md, letterSpacing: 0.5 },

  // Sections
  section:          { marginBottom: spacing.lg },
  sectionTitle:     { fontSize: fontSize.xs, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.md },

  // Sets grid
  setsGrid:         { flexDirection: 'row', gap: spacing.sm },
  setsCell:         { flex: 1, padding: spacing.md, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  setsCellIcon:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  setsCellVal:      { fontSize: fontSize.sm, fontWeight: '800', color: '#fff', textAlign: 'center' },
  setsCellLabel:    { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },

  // Muscles
  muscleBlock:      { gap: 8 },
  muscleSub:        { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.28)', letterSpacing: 1 },
  muscleTags:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  muscleTag:        { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  muscleTagText:    { fontSize: fontSize.xs, fontWeight: '600' },

  // Form tips
  tipRow:           { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  tipNum:           { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0, marginTop: 1 },
  tipNumText:       { fontSize: 10, fontWeight: '900' },
  tipEmoji:         { fontSize: 14, flexShrink: 0, marginTop: 2 },
  tipText:          { flex: 1, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.72)', lineHeight: 20 },

  // Description
  descText:         { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.50)', lineHeight: 22 },

  // Footer
  footer:           { padding: spacing.lg, paddingTop: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  addBtnWrap:       { borderRadius: 14, overflow: 'hidden' },
  addBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md + 2 },
  addBtnText:       { fontSize: fontSize.base, fontWeight: '800', color: '#fff' },
  closeTextBtn:     { alignItems: 'center', paddingVertical: spacing.sm },
  closeTextBtnText: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.30)', fontWeight: '600' },
});