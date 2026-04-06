import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── PROGRESS BAR ─────────────────────────────────────────────
function ProgressBar({
  step,
  total,
  theme,
}: {
  step: number;
  total: number;
  theme: typeof colors.dark;
}) {
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, {
          backgroundColor: theme.accent,
          width: `${(step / total) * 100}%` as any,
        }]} />
      </View>
      <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
        STEP {step} OF {total}
      </Text>
    </View>
  );
}

// ── STEP 1 — PRIMARY GOAL ────────────────────────────────────
function Step1({
  theme,
  selected,
  onSelect,
}: {
  theme: typeof colors.dark;
  selected: string;
  onSelect: (g: string) => void;
}) {
  const goals = [
    { label: 'Lose Weight', icon: 'trending-down-outline' },
    { label: 'Build Muscle', icon: 'barbell-outline' },
    { label: 'Get Fit', icon: 'flash-outline' },
    { label: 'Maintain Weight', icon: 'remove-outline' },
    { label: 'Gain Weight', icon: 'trending-up-outline' },
    { label: 'Improve Diet', icon: 'leaf-outline' },
  ];

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        What's your{'\n'}primary goal?
      </Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        We build your calorie, macro and workout plan around this.
      </Text>
      <View style={styles.goalGrid}>
        {goals.map((g) => (
          <TouchableOpacity
            key={g.label}
            onPress={() => onSelect(g.label)}
            style={[styles.goalCard, {
              backgroundColor: selected === g.label ? theme.accent : theme.card,
              borderColor: selected === g.label ? theme.accent : theme.border,
            }]}
          >
            <Ionicons
              name={g.icon as any}
              size={22}
              color={selected === g.label ? theme.bg : theme.accent}
            />
            <Text style={[styles.goalLabel, {
              color: selected === g.label ? theme.bg : theme.textPrimary,
            }]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── STEP 2 — BODY STATS ──────────────────────────────────────
function Step2({ theme }: { theme: typeof colors.dark }) {
  const fields = [
    { label: 'Age', placeholder: '25 years', icon: 'calendar-outline' },
    { label: 'Height', placeholder: '175 cm', icon: 'resize-outline' },
    { label: 'Current Weight', placeholder: '75 kg', icon: 'scale-outline' },
    { label: 'Target Weight', placeholder: '70 kg', icon: 'flag-outline' },
  ];

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Tell us about{'\n'}your body
      </Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        This calculates your daily calorie target and macro split.
      </Text>
      <View style={styles.fieldsWrap}>
        {fields.map((f, i) => (
          <View key={f.label}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              {f.label}
            </Text>
            <View style={[styles.fieldInput, {
              backgroundColor: theme.card,
              borderColor: i === 0 ? theme.accent : theme.border,
              borderWidth: i === 0 ? 2 : 1,
            }]}>
              <Ionicons name={f.icon as any} size={18} color={theme.textMuted} />
              <Text style={[styles.fieldPlaceholder, { color: theme.textMuted }]}>
                {f.placeholder}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── STEP 3 — ACTIVITY LEVEL ──────────────────────────────────
function Step3({
  theme,
  selected,
  onSelect,
}: {
  theme: typeof colors.dark;
  selected: string;
  onSelect: (a: string) => void;
}) {
  const levels = [
    { label: 'Sedentary', sub: 'Little or no exercise', icon: 'bed-outline' },
    { label: 'Lightly Active', sub: '1–3 days a week', icon: 'walk-outline' },
    { label: 'Moderately Active', sub: '3–5 days a week', icon: 'bicycle-outline' },
    { label: 'Very Active', sub: '6–7 days a week', icon: 'barbell-outline' },
  ];

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Your activity{'\n'}level?
      </Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Helps us calculate how many calories you burn daily.
      </Text>
      <View style={styles.levelList}>
        {levels.map((l) => (
          <TouchableOpacity
            key={l.label}
            onPress={() => onSelect(l.label)}
            style={[styles.levelCard, {
              backgroundColor: selected === l.label ? theme.accent : theme.card,
              borderColor: selected === l.label ? theme.accent : theme.border,
            }]}
          >
            <View style={[styles.levelIconWrap, {
              backgroundColor: selected === l.label
                ? 'rgba(0,0,0,0.15)'
                : theme.accentDim as string,
            }]}>
              <Ionicons
                name={l.icon as any}
                size={20}
                color={selected === l.label ? theme.bg : theme.accent}
              />
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelLabel, {
                color: selected === l.label ? theme.bg : theme.textPrimary,
              }]}>
                {l.label}
              </Text>
              <Text style={[styles.levelSub, {
                color: selected === l.label
                  ? 'rgba(0,0,0,0.6)'
                  : theme.textSecondary,
              }]}>
                {l.sub}
              </Text>
            </View>
            {selected === l.label && (
              <Ionicons name="checkmark-circle" size={22} color={theme.bg} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── STEP 4 — WHAT TO TRACK ───────────────────────────────────
function Step4({
  theme,
  selected,
  onToggle,
}: {
  theme: typeof colors.dark;
  selected: string[];
  onToggle: (item: string) => void;
}) {
  const options = [
    { label: 'Calories', icon: 'flame-outline' },
    { label: 'Water Intake', icon: 'water-outline' },
    { label: 'Workouts', icon: 'barbell-outline' },
    { label: 'Steps', icon: 'footsteps-outline' },
    { label: 'Sleep', icon: 'moon-outline' },
    { label: 'Macros', icon: 'nutrition-outline' },
    { label: 'Accountability', icon: 'people-outline' },
  ];

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        What do you{'\n'}want to track?
      </Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Choose as many as you like. You can change this any time.
      </Text>
      <View style={styles.goalGrid}>
        {options.map((o) => {
          const isSelected = selected.includes(o.label);
          return (
            <TouchableOpacity
              key={o.label}
              onPress={() => onToggle(o.label)}
              style={[styles.goalCard, {
                backgroundColor: isSelected ? theme.accent : theme.card,
                borderColor: isSelected ? theme.accent : theme.border,
              }]}
            >
              <Ionicons
                name={o.icon as any}
                size={22}
                color={isSelected ? theme.bg : theme.accent}
              />
              <Text style={[styles.goalLabel, {
                color: isSelected ? theme.bg : theme.textPrimary,
              }]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── STEP 5 — DIETARY PREFERENCES ─────────────────────────────
function Step5({
  theme,
  selected,
  onToggle,
}: {
  theme: typeof colors.dark;
  selected: string[];
  onToggle: (item: string) => void;
}) {
  const diets = [
    'No Preference', 'Vegan', 'Vegetarian',
    'Keto', 'Halal', 'Paleo',
    'Gluten Free', 'Pescatarian',
  ];

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Dietary{'\n'}preferences?
      </Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        We'll filter food suggestions and meal plans around this.
      </Text>
      <View style={styles.goalGrid}>
        {diets.map((d) => {
          const isSelected = selected.includes(d);
          return (
            <TouchableOpacity
              key={d}
              onPress={() => onToggle(d)}
              style={[styles.goalCard, {
                backgroundColor: isSelected ? theme.accent : theme.card,
                borderColor: isSelected ? theme.accent : theme.border,
              }]}
            >
              <Text style={[styles.goalLabel, {
                color: isSelected ? theme.bg : theme.textPrimary,
              }]}>
                {d}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── STEP 6 — CALFIT ID ───────────────────────────────────────
function Step6({ theme }: { theme: typeof colors.dark }) {
  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Choose your{'\n'}CalFit ID
      </Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Your unique username. Others can find you and add you as a partner.
      </Text>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
        Username
      </Text>
      <View style={[styles.fieldInput, {
        backgroundColor: theme.card,
        borderColor: theme.accent,
        borderWidth: 2,
      }]}>
        <Text style={[styles.atSign, { color: theme.accent }]}>@</Text>
        <Text style={[styles.fieldPlaceholder, { color: theme.textPrimary }]}>
          favour
        </Text>
      </View>
      <View style={styles.availableRow}>
        <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
        <Text style={[styles.availableText, { color: theme.accent }]}>
          calfit.app/@favour is available
        </Text>
      </View>
      <Text style={[styles.idNote, { color: theme.textMuted }]}>
        This is how friends will find you on CalFit.
      </Text>
    </View>
  );
}

// ── STEP 7 — PERSONALIZATION ─────────────────────────────────
function Step7({ theme }: { theme: typeof colors.dark }) {
  const settings = [
    { label: 'Appearance', value: 'Dark Mode', icon: 'moon-outline', toggle: true },
    { label: 'Units', value: 'Metric (kg, cm)', icon: 'scale-outline', toggle: false },
    { label: 'Instagram', value: 'Link account', icon: 'logo-instagram', toggle: false },
    { label: 'Step Tracking', value: 'Use phone sensors', icon: 'footsteps-outline', toggle: true },
    { label: 'Smartwatch', value: 'Connect device', icon: 'watch-outline', toggle: false },
  ];

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Last step!{'\n'}Personalise your app
      </Text>
      <View style={styles.personalList}>
        {settings.map((s) => (
          <View key={s.label} style={[styles.personalRow, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <View style={[styles.personalIcon, {
              backgroundColor: theme.accentDim as string,
            }]}>
              <Ionicons name={s.icon as any} size={18} color={theme.accent} />
            </View>
            <View style={styles.personalInfo}>
              <Text style={[styles.personalLabel, { color: theme.textPrimary }]}>
                {s.label}
              </Text>
              <Text style={[styles.personalValue, { color: theme.textMuted }]}>
                {s.value}
              </Text>
            </View>
            {s.toggle ? (
              <View style={[styles.toggleOn, { backgroundColor: theme.accent }]}>
                <View style={styles.toggleKnob} />
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            )}
          </View>
        ))}
      </View>
      <Text style={[styles.idNote, { color: theme.textMuted }]}>
        You can change all of this later in Settings.
      </Text>
    </View>
  );
}

// ── MAIN ONBOARDING SCREEN ────────────────────────────────────
export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [activity, setActivity] = useState('');
  const [tracking, setTracking] = useState<string[]>(['Calories', 'Water Intake', 'Workouts']);
  const [diet, setDiet] = useState<string[]>(['No Preference']);
  const totalSteps = 7;

  const toggleTracking = (item: string) => {
    setTracking((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleDiet = (item: string) => {
    setDiet((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Onboarding complete — go to main app
      navigation.navigate('Main');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.logo, { color: theme.accent }]}>CalFit</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Progress */}
      <ProgressBar step={step} total={totalSteps} theme={theme} />

      {/* Step content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {step === 1 && <Step1 theme={theme} selected={goal} onSelect={setGoal} />}
        {step === 2 && <Step2 theme={theme} />}
        {step === 3 && <Step3 theme={theme} selected={activity} onSelect={setActivity} />}
        {step === 4 && <Step4 theme={theme} selected={tracking} onToggle={toggleTracking} />}
        {step === 5 && <Step5 theme={theme} selected={diet} onToggle={toggleDiet} />}
        {step === 6 && <Step6 theme={theme} />}
        {step === 7 && <Step7 theme={theme} />}
      </ScrollView>

      {/* Bottom buttons */}
      <View style={[styles.bottomBar, { backgroundColor: theme.bg }]}>
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.continueBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.continueBtnText, { color: theme.bg }]}>
            {step === totalSteps ? "Let's Go! 🚀" : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  logo: { fontSize: fontSize.xl, fontWeight: '800' },

  // Progress
  progressWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { fontSize: fontSize.xs, fontWeight: '600' },

  // Step content
  stepContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  stepTitle: { fontSize: 30, fontWeight: '800', marginBottom: spacing.sm, lineHeight: 36 },
  stepSub: { fontSize: fontSize.base, marginBottom: spacing.xl, lineHeight: 22 },

  // Goal grid
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalCard: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  goalLabel: { fontSize: fontSize.base, fontWeight: '600' },

  // Fields
  fieldsWrap: { gap: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  fieldPlaceholder: { fontSize: fontSize.lg },
  atSign: { fontSize: fontSize.xl, fontWeight: '700' },
  availableRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  availableText: { fontSize: fontSize.sm, fontWeight: '600' },
  idNote: { fontSize: fontSize.sm, marginTop: spacing.sm },

  // Levels
  levelList: { gap: spacing.sm },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  levelIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  levelInfo: { flex: 1 },
  levelLabel: { fontSize: fontSize.lg, fontWeight: '700' },
  levelSub: { fontSize: fontSize.sm, marginTop: 2 },

  // Personalization
  personalList: { gap: spacing.sm },
  personalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  personalIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  personalInfo: { flex: 1 },
  personalLabel: { fontSize: fontSize.base, fontWeight: '600' },
  personalValue: { fontSize: fontSize.sm, marginTop: 2 },
  toggleOn: {
    width: 38, height: 22, borderRadius: 11,
    paddingLeft: 18, justifyContent: 'center',
  },
  toggleKnob: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'white',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  continueBtn: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  continueBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});