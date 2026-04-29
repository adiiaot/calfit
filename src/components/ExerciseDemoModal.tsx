// src/components/ExerciseDemoModal.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize } from '../theme';

const CAT_COLORS: Record<string, string> = {
  Cardio: '#FF6B35', Chest: '#F0427C', Back: '#4A90E2', Core: '#2BBCB0',
  Legs: '#9B6FE8', Shoulders: '#FFB830', Arms: '#34D98A', Flexibility: '#FF8C42', Custom: '#6B7280',
};
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
const FORM_TIPS: Record<string, { tip: string; icon: string }[]> = {
  Chest:       [{ tip: 'Retract shoulder blades before every rep', icon: '🎯' }, { tip: 'Lower with full control — 2 seconds down', icon: '⏱' }, { tip: 'Drive through the full range of motion', icon: '💪' }],
  Back:        [{ tip: 'Drive elbows back — not your hands', icon: '🎯' }, { tip: 'Keep spine neutral throughout', icon: '🦴' }, { tip: 'Squeeze at peak contraction', icon: '💪' }],
  Legs:        [{ tip: 'Knees track directly over toes', icon: '🎯' }, { tip: 'Keep chest up, weight through heels', icon: '⚖️' }, { tip: 'Full depth activates more muscle fibres', icon: '📐' }],
  Shoulders:   [{ tip: 'Avoid shrugging — keep traps down', icon: '🎯' }, { tip: 'Control the weight on the way down', icon: '⏱' }, { tip: 'Brace core to protect lower back', icon: '🛡' }],
  Arms:        [{ tip: 'Isolate the muscle — no body swing', icon: '🎯' }, { tip: 'Full extension on every rep', icon: '📏' }, { tip: 'Squeeze hard at peak for 1 second', icon: '💪' }],
  Core:        [{ tip: "Don't hold your breath — exhale on effort", icon: '💨' }, { tip: 'Slow and controlled beats fast', icon: '⏱' }, { tip: 'Quality reps only — stop before form breaks', icon: '✅' }],
  Cardio:      [{ tip: 'Land softly to protect your joints', icon: '🦵' }, { tip: 'Breathe rhythmically — nose in, mouth out', icon: '💨' }, { tip: 'Keep core engaged throughout', icon: '🎯' }],
  Flexibility: [{ tip: 'Never stretch into pain', icon: '⚠️' }, { tip: 'Hold each position for 20–30 seconds', icon: '⏱' }, { tip: 'Breathe deeply into the stretch', icon: '💨' }],
};
const SETS_REPS: Record<string, { sets: string; reps: string; rest: string }> = {
  beginner:     { sets: '2–3 sets', reps: '10–12 reps', rest: '90s rest' },
  intermediate: { sets: '3–4 sets', reps: '8–12 reps',  rest: '60s rest' },
  advanced:     { sets: '4–5 sets', reps: '6–10 reps',  rest: '45s rest' },
};

interface Exercise {
  id: string; name: string; category: string; muscle_group: string;
  difficulty: string; calories_per_minute: number; equipment: string;
  description: string; gif_url?: string | null;
}
interface Props {
  visible: boolean; exercise: Exercise | null; theme: typeof colors.light;
  onClose: () => void; onAddToWorkout?: (exercise: Exercise) => void;
}

export default function ExerciseDemoModal({ visible, exercise, theme, onClose, onAddToWorkout }: Props) {
  const [gifLoading, setGifLoading] = useState(true);
  const [gifError,   setGifError]   = useState(false);
  if (!exercise) return null;

  const catColor = CAT_COLORS[exercise.category] ?? theme.accent;
  const muscles  = MUSCLE_MAP[exercise.category]  ?? MUSCLE_MAP.Custom;
  const tips     = FORM_TIPS[exercise.category]   ?? FORM_TIPS.Cardio;
  const setsReps = SETS_REPS[exercise.difficulty] ?? SETS_REPS.beginner;
  const hasGif   = !!exercise.gif_url;
  const diffColors: Record<string, string> = { beginner: '#2DDC8C', intermediate: '#FFB830', advanced: '#FF5959' };
  const diffLabels: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  const diffColor = diffColors[exercise.difficulty] ?? '#2DDC8C';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[s.sheet, { backgroundColor: '#0D0A1E' }]}>
          <LinearGradient colors={[catColor + 'DD', catColor + '22', 'transparent'] as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={[s.catChip, { backgroundColor: catColor + '33', borderColor: catColor + '66' }]}>
              <Text style={[s.catChipText, { color: catColor }]}>{exercise.category.toUpperCase()}</Text>
            </View>
            <Text style={s.heroName}>{exercise.name}</Text>
            <Text style={s.heroMuscle}>{exercise.muscle_group}</Text>
            <View style={s.heroPills}>
              <View style={[s.pill, { backgroundColor: diffColor + '22', borderColor: diffColor + '55' }]}>
                <Text style={[s.pillText, { color: diffColor }]}>{diffLabels[exercise.difficulty] ?? exercise.difficulty}</Text>
              </View>
              <View style={[s.pill, { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)' }]}>
                <Ionicons name="flame-outline" size={11} color="#FF6B35" />
                <Text style={[s.pillText, { color: '#FF6B35' }]}>{exercise.calories_per_minute} kcal/min</Text>
              </View>
              {!!exercise.equipment && exercise.equipment !== 'none' && (
                <View style={[s.pill, { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)' }]}>
                  <Ionicons name="barbell-outline" size={11} color="rgba(255,255,255,0.70)" />
                  <Text style={[s.pillText, { color: 'rgba(255,255,255,0.70)' }]}>{exercise.equipment}</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollBody} bounces={false}>
            {/* GIF demo / placeholder */}
            <View style={[s.gifCard, { backgroundColor: catColor + '0E', borderColor: catColor + '33' }]}>
              {hasGif ? (
                <>
                  <View style={s.gifLabelRow}>
                    <View style={[s.liveDot, { backgroundColor: catColor }]} />
                    <Text style={[s.gifLabel, { color: catColor }]}>EXERCISE DEMO</Text>
                  </View>
                  {gifLoading && !gifError && <View style={s.gifBox}><ActivityIndicator color={catColor} size="large" /></View>}
                  {gifError ? (
                    <View style={s.gifBox}><Ionicons name="image-outline" size={40} color={catColor} opacity={0.4} /></View>
                  ) : (
                    <Image
                      source={{ uri: exercise.gif_url! }}
                      style={[s.gif, gifLoading && { height: 0 }]}
                      resizeMode="contain"
                      onLoad={() => setGifLoading(false)}
                      onError={() => { setGifError(true); setGifLoading(false); }}
                    />
                  )}
                  <Text style={s.gifHint}>Follow the movement · Match the form</Text>
                </>
              ) : (
                <View style={s.gifBox}>
                  <View style={[s.placeholderIcon, { backgroundColor: catColor + '22' }]}>
                    <Ionicons name="videocam-outline" size={28} color={catColor} />
                  </View>
                  <Text style={[s.placeholderTitle, { color: catColor }]}>Demo Coming Soon</Text>
                  <Text style={s.placeholderSub}>Video demos will be available in the next update</Text>
                </View>
              )}
            </View>

            {/* Sets / Reps */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Recommended</Text>
              <View style={s.setsGrid}>
                {[
                  { label: 'Sets', value: setsReps.sets, icon: 'layers-outline', color: catColor },
                  { label: 'Reps', value: setsReps.reps, icon: 'repeat-outline', color: '#FFB830' },
                  { label: 'Rest', value: setsReps.rest, icon: 'timer-outline',  color: '#4A90E2' },
                ].map((item) => (
                  <View key={item.label} style={[s.setsCell, { borderColor: item.color + '30', backgroundColor: item.color + '10' }]}>
                    <View style={[s.setsCellIcon, { backgroundColor: item.color + '20' }]}>
                      <Ionicons name={item.icon as any} size={16} color={item.color} />
                    </View>
                    <Text style={s.setsCellVal}>{item.value}</Text>
                    <Text style={s.setsCellLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Muscles */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Muscles Worked</Text>
              <Text style={s.muscleSub}>PRIMARY</Text>
              <View style={[s.muscleTags, { marginBottom: 10 }]}>
                {muscles.primary.map((m) => (
                  <View key={m} style={[s.muscleTag, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
                    <Text style={[s.muscleTagText, { color: catColor }]}>{m}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.muscleSub}>SECONDARY</Text>
              <View style={s.muscleTags}>
                {muscles.secondary.map((m) => (
                  <View key={m} style={[s.muscleTag, { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                    <Text style={[s.muscleTagText, { color: 'rgba(255,255,255,0.55)' }]}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Form tips */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Form Cues</Text>
              {tips.map((t, i) => (
                <View key={i} style={s.tipRow}>
                  <View style={[s.tipNum, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
                    <Text style={[s.tipNumText, { color: catColor }]}>{i + 1}</Text>
                  </View>
                  <Text style={s.tipEmoji}>{t.icon}</Text>
                  <Text style={s.tipText}>{t.tip}</Text>
                </View>
              ))}
            </View>

            {!!exercise.description && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>About</Text>
                <Text style={s.descText}>{exercise.description}</Text>
              </View>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={s.footer}>
            {onAddToWorkout && (
              <TouchableOpacity onPress={() => { onAddToWorkout(exercise); onClose(); }} activeOpacity={0.85} style={s.addBtnWrap}>
                <LinearGradient colors={[catColor, catColor + 'BB'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.addBtn}>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={s.addBtnText}>Add to Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={s.closeTextBtn}>
              <Text style={s.closeTextBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:          { flex: 1, justifyContent: 'flex-end' },
  backdrop:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.80)' },
  sheet:            { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '93%', overflow: 'hidden' },
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
  gifCard:          { borderRadius: 20, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  gifLabelRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.md, paddingBottom: spacing.sm },
  liveDot:          { width: 7, height: 7, borderRadius: 4 },
  gifLabel:         { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  gif:              { width: '100%', height: 240 },
  gifBox:           { height: 180, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  gifHint:          { fontSize: 10, textAlign: 'center', color: 'rgba(255,255,255,0.25)', paddingVertical: spacing.sm, letterSpacing: 0.5 },
  placeholderIcon:  { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  placeholderTitle: { fontSize: fontSize.base, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  placeholderSub:   { fontSize: fontSize.sm, textAlign: 'center', color: 'rgba(255,255,255,0.25)', lineHeight: 20 },
  section:          { marginBottom: spacing.lg },
  sectionTitle:     { fontSize: fontSize.xs, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.md },
  setsGrid:         { flexDirection: 'row', gap: spacing.sm },
  setsCell:         { flex: 1, padding: spacing.md, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  setsCellIcon:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  setsCellVal:      { fontSize: fontSize.sm, fontWeight: '800', color: '#fff', textAlign: 'center' },
  setsCellLabel:    { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  muscleSub:        { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.28)', letterSpacing: 1, marginBottom: 6 },
  muscleTags:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  muscleTag:        { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  muscleTagText:    { fontSize: fontSize.xs, fontWeight: '600' },
  tipRow:           { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  tipNum:           { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0, marginTop: 1 },
  tipNumText:       { fontSize: 10, fontWeight: '900' },
  tipEmoji:         { fontSize: 14, flexShrink: 0, marginTop: 2 },
  tipText:          { flex: 1, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.72)', lineHeight: 20 },
  descText:         { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.50)', lineHeight: 22 },
  footer:           { padding: spacing.lg, paddingTop: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  addBtnWrap:       { borderRadius: 14, overflow: 'hidden' },
  addBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md + 2 },
  addBtnText:       { fontSize: fontSize.base, fontWeight: '800', color: '#fff' },
  closeTextBtn:     { alignItems: 'center', paddingVertical: spacing.sm },
  closeTextBtnText: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.30)', fontWeight: '600' },
});