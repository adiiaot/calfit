// src/components/ExerciseDemoModal.tsx
// ─────────────────────────────────────────────────────────────
// Shows a GIF demonstration of an exercise when a user taps
// the info icon on an exercise card in the Activity screen.
//
// HOW TO USE IN ActivityScreen.tsx:
//
// 1. Import at the top:
//    import ExerciseDemoModal from '../../components/ExerciseDemoModal';
//
// 2. Add state in WorkoutScreen():
//    const [demoExercise, setDemoExercise] = useState<Exercise | null>(null);
//
// 3. Add modal to JSX (before closing </AndroidSafeView>):
//    <ExerciseDemoModal
//      visible={!!demoExercise}
//      exercise={demoExercise}
//      theme={theme}
//      onClose={() => setDemoExercise(null)}
//    />
//
// 4. In ExerciseCard, add an info button that calls setDemoExercise:
//    Pass onDemo prop to ExerciseCard and add a ⓘ button
// ─────────────────────────────────────────────────────────────

import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Image, ScrollView, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, fontSize } from '../theme';

// ── DIFFICULTY COLOURS ────────────────────────────────────────
const DIFF_COLORS: Record<string, string> = {
  beginner:     '#2DDC8C',
  intermediate: '#FFB830',
  advanced:     '#FF5959',
};

// ── CATEGORY COLOURS ──────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  Cardio: '#FF6B35', Chest: '#F0427C', Back: '#4A90E2',
  Core: '#2BBCB0', Legs: '#9B6FE8', Shoulders: '#FFB830',
  Arms: '#34D98A', Flexibility: '#FF8C42', Custom: '#6B7280',
};

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
}

export default function ExerciseDemoModal({ visible, exercise, theme, onClose }: Props) {
  const [gifLoading, setGifLoading] = useState(true);
  const [gifError, setGifError]     = useState(false);

  if (!exercise) return null;

  const catColor  = CAT_COLORS[exercise.category] ?? theme.accent;
  const diffColor = DIFF_COLORS[exercise.difficulty] ?? theme.accent;

  const tips: Record<string, string[]> = {
    Cardio:      ['Keep your core tight throughout', 'Breathe rhythmically', 'Land softly to protect joints'],
    Chest:       ['Control the weight on the way down', 'Keep shoulder blades retracted', 'Full range of motion'],
    Back:        ['Drive elbows back, not arms', 'Squeeze at the top', 'Keep spine neutral'],
    Core:        ['Don\'t hold your breath', 'Slow and controlled beats fast', 'Quality over quantity'],
    Legs:        ['Knees track over toes', 'Keep chest up throughout', 'Drive through the heels'],
    Shoulders:   ['Avoid shrugging', 'Control at the top of the movement', 'Keep core braced'],
    Arms:        ['Isolate the muscle — no swinging', 'Full extension on every rep', 'Squeeze at peak contraction'],
    Flexibility: ['Never stretch into pain', 'Hold each position for 20–30s', 'Breathe into the stretch'],
  };

  const exerciseTips = tips[exercise.category] ?? ['Focus on form over weight', 'Breathe steadily', 'Rest when needed'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>

          {/* Header */}
          <LinearGradient
            colors={[catColor + 'EE', catColor + '99'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerCategory}>{exercise.category}</Text>
                <Text style={styles.headerName}>{exercise.name}</Text>
                <Text style={styles.headerMuscle}>{exercise.muscle_group}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Stat badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.20)' }]}>
                <Ionicons name="flame-outline" size={12} color="#fff" />
                <Text style={styles.badgeText}>{exercise.calories_per_minute} kcal/min</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: diffColor + '44' }]}>
                <Text style={[styles.badgeText, { color: diffColor }]}>{exercise.difficulty}</Text>
              </View>
              {exercise.equipment && exercise.equipment !== 'none' && (
                <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.20)' }]}>
                  <Ionicons name="barbell-outline" size={12} color="#fff" />
                  <Text style={styles.badgeText}>{exercise.equipment}</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

            {/* GIF Demo */}
            <View style={[styles.gifWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                How to do it
              </Text>
              {exercise.gif_url ? (
                <View style={styles.gifContainer}>
                  {gifLoading && !gifError && (
                    <View style={styles.gifPlaceholder}>
                      <ActivityIndicator color={catColor} size="large" />
                      <Text style={[styles.gifLoadingText, { color: theme.textMuted }]}>
                        Loading demo...
                      </Text>
                    </View>
                  )}
                  {gifError ? (
                    // Fallback when GIF fails to load
                    <View style={[styles.gifPlaceholder, { backgroundColor: catColor + '18' }]}>
                      <Ionicons name="body-outline" size={48} color={catColor} />
                      <Text style={[styles.gifLoadingText, { color: catColor }]}>
                        Demo unavailable
                      </Text>
                      <Text style={[styles.gifErrorSub, { color: theme.textMuted }]}>
                        Check form instructions below
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: exercise.gif_url }}
                      style={[styles.gif, gifLoading ? { opacity: 0 } : { opacity: 1 }]}
                      resizeMode="contain"
                      onLoad={() => setGifLoading(false)}
                      onError={() => { setGifError(true); setGifLoading(false); }}
                    />
                  )}
                </View>
              ) : (
                // No GIF — show illustration placeholder
                <View style={[styles.gifPlaceholder, { backgroundColor: catColor + '18' }]}>
                  <Ionicons name="body-outline" size={48} color={catColor} />
                  <Text style={[styles.gifLoadingText, { color: catColor }]}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.gifErrorSub, { color: theme.textMuted }]}>
                    Follow the form tips below
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            {exercise.description ? (
              <View style={[styles.descCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>About</Text>
                <Text style={[styles.descText, { color: theme.textPrimary }]}>
                  {exercise.description}
                </Text>
              </View>
            ) : null}

            {/* Form tips */}
            <View style={[styles.tipsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Form Tips</Text>
              {exerciseTips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: catColor }]} />
                  <Text style={[styles.tipText, { color: theme.textPrimary }]}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          {/* Add to workout CTA */}
          <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.footerBtnWrap}>
              <LinearGradient
                colors={[catColor, catColor + 'BB'] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.footerBtn}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.footerBtnText}>Got it — add to workout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', overflow: 'hidden' },
  header:      { padding: spacing.lg, paddingBottom: spacing.md },
  headerTop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  headerCategory: { fontSize: fontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  headerName:  { fontSize: fontSize.xxl, fontWeight: '900', color: '#fff', lineHeight: 30 },
  headerMuscle:{ fontSize: fontSize.sm, color: 'rgba(255,255,255,0.70)', marginTop: 2 },
  closeBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.20)', alignItems: 'center', justifyContent: 'center' },
  badgeRow:    { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 99 },
  badgeText:   { fontSize: fontSize.xs, fontWeight: '700', color: '#fff' },
  body:        { padding: spacing.lg, gap: spacing.md },
  sectionLabel:{ fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  gifWrap:     { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  gifContainer:{ borderRadius: radius.md, overflow: 'hidden', minHeight: 220 },
  gif:         { width: '100%', height: 220, borderRadius: radius.md },
  gifPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md },
  gifLoadingText: { fontSize: fontSize.base, fontWeight: '700' },
  gifErrorSub: { fontSize: fontSize.xs },
  descCard:    { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  descText:    { fontSize: fontSize.sm, lineHeight: 22 },
  tipsCard:    { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  tipRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  tipDot:      { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  tipText:     { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  footer:      { padding: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  footerBtnWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  footerBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  footerBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
});