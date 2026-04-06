import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── DURATION SELECTOR ────────────────────────────────────────
function DurationSelector({
  theme,
  active,
  onSelect,
}: {
  theme: typeof colors.dark;
  active: string;
  onSelect: (d: string) => void;
}) {
  const durations = ['1 Day', '3 Days', '7 Days', '14 Days', '1 Month'];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.durationRow}
    >
      {durations.map((d) => (
        <TouchableOpacity
          key={d}
          onPress={() => onSelect(d)}
          style={[
            styles.durationTab,
            {
              backgroundColor: active === d ? theme.accent : theme.card,
              borderColor: active === d ? theme.accent : theme.border,
            },
          ]}
        >
          <Text style={[
            styles.durationText,
            { color: active === d ? theme.bg : theme.textSecondary },
            active === d && { fontWeight: '700' },
          ]}>
            {d}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── MODE SWITCH ──────────────────────────────────────────────
function ModeSwitch({
  theme,
  active,
  onSwitch,
}: {
  theme: typeof colors.dark;
  active: 'Manual' | 'AI Generated';
  onSwitch: (m: 'Manual' | 'AI Generated') => void;
}) {
  return (
    <View style={[styles.modeSwitch, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      {(['Manual', 'AI Generated'] as const).map((m) => (
        <TouchableOpacity
          key={m}
          onPress={() => onSwitch(m)}
          style={[
            styles.modeBtn,
            active === m && {
              backgroundColor: theme.bg,
              borderColor: theme.accent,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[
            styles.modeBtnText,
            { color: active === m ? theme.accent : theme.textMuted },
            active === m && { fontWeight: '700' },
          ]}>
            {m}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── AI PREFERENCES CARD ──────────────────────────────────────
function AIPrefsCard({ theme }: { theme: typeof colors.dark }) {
  const questions = [
    'Do you cook, buy food, or both?',
    'Any foods you dislike or are allergic to?',
    'Preferred cuisines? (e.g. African, Asian)',
    'How much time do you have to cook daily?',
    "What's your daily food budget?",
  ];

  return (
    <View style={[styles.aiCard, {
      backgroundColor: theme.card,
      borderColor: theme.accent,
    }]}>
      <Text style={[styles.aiCardTitle, { color: theme.accent }]}>
        CalFit Coach will ask you:
      </Text>
      {questions.map((q) => (
        <View key={q} style={styles.aiQuestion}>
          <View style={[styles.aiDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.aiQuestionText, { color: theme.textPrimary }]}>
            {q}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── DAY SELECTOR ─────────────────────────────────────────────
function DaySelector({
  theme,
  activeDay,
  onSelect,
}: {
  theme: typeof colors.dark;
  activeDay: number;
  onSelect: (i: number) => void;
}) {
  const days = [
    { label: 'Mon', kcal: '1820' },
    { label: 'Tue', kcal: '1950' },
    { label: 'Wed', kcal: '2080' },
    { label: 'Thu', kcal: '1890' },
    { label: 'Fri', kcal: '2010' },
    { label: 'Sat', kcal: '1750' },
    { label: 'Sun', kcal: '2100' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.daySelectorRow}
    >
      {days.map((d, i) => (
        <TouchableOpacity
          key={d.label}
          onPress={() => onSelect(i)}
          style={[
            styles.dayPill,
            {
              backgroundColor: activeDay === i ? theme.accent : theme.card,
              borderColor: activeDay === i ? theme.accent : theme.border,
            },
          ]}
        >
          <Text style={[
            styles.dayLabel,
            { color: activeDay === i ? theme.bg : theme.textSecondary },
          ]}>
            {d.label}
          </Text>
          <Text style={[
            styles.dayKcal,
            { color: activeDay === i ? theme.bg : theme.accent },
            activeDay === i && { opacity: 0.8 },
          ]}>
            {d.kcal}
          </Text>
          <Text style={[
            styles.dayKcalLabel,
            { color: activeDay === i ? theme.bg : theme.textMuted },
            activeDay === i && { opacity: 0.6 },
          ]}>
            kcal
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── MEAL PLAN ROWS ───────────────────────────────────────────
function MealPlanRows({ theme }: { theme: typeof colors.dark }) {
  const meals = [
    { type: 'Breakfast', food: 'Oats + banana + protein', kcal: '420' },
    { type: 'Lunch', food: 'Grilled chicken + quinoa', kcal: '580' },
    { type: 'Dinner', food: 'Salmon + sweet potato', kcal: '640' },
    { type: 'Snack', food: 'Greek yogurt + berries', kcal: '180' },
  ];

  return (
    <>
      {meals.map((m) => (
        <View key={m.type} style={[styles.mealRow, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <Text style={[styles.mealType, { color: theme.textSecondary }]}>
            {m.type}
          </Text>
          <Text style={[styles.mealFood, { color: theme.textPrimary }]}>
            {m.food}
          </Text>
          <Text style={[styles.mealKcal, { color: theme.accent }]}>
            {m.kcal}
          </Text>
        </View>
      ))}
    </>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function MealsScreen() {
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const [duration, setDuration] = useState('7 Days');
  const [mode, setMode] = useState<'Manual' | 'AI Generated'>('AI Generated');
  const [activeDay, setActiveDay] = useState(2);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          Meal Planner
        </Text>
        <Text style={[styles.pageSub, { color: theme.textSecondary }]}>
          Plan your nutrition your way
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Plan Duration
        </Text>
        <DurationSelector theme={theme} active={duration} onSelect={setDuration} />

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Plan Method
        </Text>
        <ModeSwitch theme={theme} active={mode} onSwitch={setMode} />

        {mode === 'AI Generated' && <AIPrefsCard theme={theme} />}

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {duration} Preview
        </Text>
        <DaySelector theme={theme} activeDay={activeDay} onSelect={setActiveDay} />

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][activeDay]}'s Meals
        </Text>
        <MealPlanRows theme={theme} />

        <TouchableOpacity style={[styles.generateBtn, { backgroundColor: theme.accent }]}>
          <Text style={styles.generateBtnText}>
            {mode === 'AI Generated' ? '✨  Generate AI Meal Plan' : '+ Create Manual Plan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },
  pageSub: { fontSize: fontSize.md, marginTop: 2 },

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Duration
  durationRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  durationTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  durationText: { fontSize: fontSize.sm },

  // Mode switch
  modeSwitch: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  modeBtnText: { fontSize: fontSize.base },

  // AI card
  aiCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  aiCardTitle: { fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.md },
  aiQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  aiDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  aiQuestionText: { fontSize: fontSize.sm, flex: 1 },

  // Day selector
  daySelectorRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dayPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 58,
  },
  dayLabel: { fontSize: fontSize.xs, fontWeight: '600' },
  dayKcal: { fontSize: fontSize.sm, fontWeight: '700', marginTop: 2 },
  dayKcalLabel: { fontSize: 8 },

  // Meal rows
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  mealType: { fontSize: fontSize.xs, fontWeight: '600', width: 70 },
  mealFood: { fontSize: fontSize.sm, flex: 1 },
  mealKcal: { fontSize: fontSize.sm, fontWeight: '700' },

  // Generate button
  generateBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  generateBtnText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#0C0D10',
  },
});