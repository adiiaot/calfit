import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
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
function Step2({
  theme,
  age,
  setAge,
  height,
  setHeight,
  weight,
  setWeight,
  targetWeight,
  setTargetWeight,
}: {
  theme: typeof colors.dark;
  age: string;
  setAge: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
  targetWeight: string;
  setTargetWeight: (v: string) => void;
}) {
  const fields = [
    {
      label: 'Age',
      value: age,
      onChange: setAge,
      placeholder: '25',
      icon: 'calendar-outline',
      keyboardType: 'number-pad',
      suffix: 'years',
    },
    {
      label: 'Height',
      value: height,
      onChange: setHeight,
      placeholder: '175',
      icon: 'resize-outline',
      keyboardType: 'decimal-pad',
      suffix: 'cm',
    },
    {
      label: 'Current Weight',
      value: weight,
      onChange: setWeight,
      placeholder: '75',
      icon: 'scale-outline',
      keyboardType: 'decimal-pad',
      suffix: 'kg',
    },
    {
      label: 'Target Weight',
      value: targetWeight,
      onChange: setTargetWeight,
      placeholder: '70',
      icon: 'flag-outline',
      keyboardType: 'decimal-pad',
      suffix: 'kg',
    },
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
        {fields.map((f) => (
          <View key={f.label}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              {f.label}
            </Text>
            <View style={[styles.fieldInput, {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1,
            }]}>
              <Ionicons name={f.icon as any} size={18} color={theme.textMuted} />
              <TextInput
                value={f.value}
                onChangeText={f.onChange}
                placeholder={f.placeholder}
                placeholderTextColor={theme.textMuted}
                keyboardType={f.keyboardType as any}
                style={[styles.stepTextInput, { color: theme.textPrimary }]}
              />
              <Text style={[styles.fieldSuffix, { color: theme.textMuted }]}>
                {f.suffix}
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
function Step6({
  theme,
  calfitId,
  setCalfitId,
}: {
  theme: typeof colors.dark;
  calfitId: string;
  setCalfitId: (v: string) => void;
}) {
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
        <TextInput
          value={calfitId}
          onChangeText={setCalfitId}
          placeholder="your_username"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          style={[styles.stepTextInput, { color: theme.textPrimary }]}
        />
      </View>
      {calfitId.length > 0 && (
        <View style={styles.availableRow}>
          <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
          <Text style={[styles.availableText, { color: theme.accent }]}>
            calfit.app/@{calfitId} is available
          </Text>
        </View>
      )}
      <Text style={[styles.idNote, { color: theme.textMuted }]}>
        This is how friends will find you on CalFit.
      </Text>
    </View>
  );
}

// ── STEP 7 — CREATE ACCOUNT ───────────────────────────────────
function Step7({
  theme,
  email,
  setEmail,
  password,
  setPassword,
}: {
  theme: typeof colors.dark;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Last step!{'\n'}Create your account
      </Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Your CalFit account is ready. Just set your email and password.
      </Text>

      {/* Email */}
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
        Email
      </Text>
      <View style={[styles.fieldInput, {
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderWidth: 1,
        marginBottom: spacing.lg,
      }]}>
        <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={theme.textMuted}
          style={[styles.stepTextInput, { color: theme.textPrimary }]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Password */}
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
        Password
      </Text>
      <View style={[styles.fieldInput, {
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderWidth: 1,
        marginBottom: spacing.md,
      }]}>
        <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Min. 8 characters"
          placeholderTextColor={theme.textMuted}
          style={[styles.stepTextInput, { color: theme.textPrimary }]}
          secureTextEntry={!showPassword}
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={theme.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Privacy note */}
      <View style={[styles.privacyCard, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={theme.accent} />
        <Text style={[styles.privacyText, { color: theme.textPrimary }]}>
          Your data is encrypted and never sold. You can delete your account at any time from Settings.
        </Text>
      </View>

      <Text style={[styles.idNote, { color: theme.textMuted, marginTop: spacing.md }]}>
        You can set your appearance, units, and connected apps in Settings after signing up.
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
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [activity, setActivity] = useState('');
  const [tracking, setTracking] = useState<string[]>(['Calories', 'Water Intake', 'Workouts']);
  const [diet, setDiet] = useState<string[]>(['No Preference']);
  const [calfitId, setCalfitId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }

    // Step 7 — create account and save profile
    if (!email || !password) {
      Alert.alert('Almost there!', 'Please enter your email and password.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    try {
      setIsLoading(true);
      const { supabase } = await import('../../services/supabase');

      // Create the auth account
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Save profile details to the profiles table
      if (data.user) {
        await supabase.from('profiles').update({
          calfit_id: calfitId || null,
          goal: goal || null,
          activity_level: activity || null,
          dietary_preference: diet,
          tracking_preferences: tracking,
          age: parseInt(age) || null,
          height_cm: parseFloat(height) || null,
          current_weight_kg: parseFloat(weight) || null,
          target_weight_kg: parseFloat(targetWeight) || null,
        }).eq('id', data.user.id);
      }

      // Auth listener in App.tsx detects session and redirects automatically

    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setIsLoading(false);
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
        {step === 1 && (
          <Step1 theme={theme} selected={goal} onSelect={setGoal} />
        )}
        {step === 2 && (
          <Step2
            theme={theme}
            age={age} setAge={setAge}
            height={height} setHeight={setHeight}
            weight={weight} setWeight={setWeight}
            targetWeight={targetWeight} setTargetWeight={setTargetWeight}
          />
        )}
        {step === 3 && (
          <Step3 theme={theme} selected={activity} onSelect={setActivity} />
        )}
        {step === 4 && (
          <Step4 theme={theme} selected={tracking} onToggle={toggleTracking} />
        )}
        {step === 5 && (
          <Step5 theme={theme} selected={diet} onToggle={toggleDiet} />
        )}
        {step === 6 && (
          <Step6 theme={theme} calfitId={calfitId} setCalfitId={setCalfitId} />
        )}
        {step === 7 && (
          <Step7
            theme={theme}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
          />
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.bg }]}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={isLoading}
          style={[styles.continueBtn, { backgroundColor: theme.accent }]}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.bg} />
          ) : (
            <Text style={[styles.continueBtnText, { color: theme.bg }]}>
              {step === totalSteps ? "Let's Go! 🚀" : 'Continue'}
            </Text>
          )}
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

  //Privacy card style on step 7
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  privacyText: {
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 18,
  },

  progressWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { fontSize: fontSize.xs, fontWeight: '600' },

  stepContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  stepTitle: { fontSize: 30, fontWeight: '800', marginBottom: spacing.sm, lineHeight: 36 },
  stepSub: { fontSize: fontSize.base, marginBottom: spacing.xl, lineHeight: 22 },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  goalCard: {
    width: '47%', padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1, gap: spacing.sm,
  },
  goalLabel: { fontSize: fontSize.base, fontWeight: '600' },

  fieldsWrap: { gap: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  stepTextInput: { flex: 1, fontSize: fontSize.lg, paddingVertical: 2 },
  fieldSuffix: { fontSize: fontSize.base, fontWeight: '600' },
  fieldPlaceholder: { fontSize: fontSize.lg },
  atSign: { fontSize: fontSize.xl, fontWeight: '700' },
  availableRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  availableText: { fontSize: fontSize.sm, fontWeight: '600' },
  idNote: { fontSize: fontSize.sm, marginTop: spacing.sm },

  levelList: { gap: spacing.sm },
  levelCard: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1,
  },
  levelIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  levelInfo: { flex: 1 },
  levelLabel: { fontSize: fontSize.lg, fontWeight: '700' },
  levelSub: { fontSize: fontSize.sm, marginTop: 2 },

  personalList: { gap: spacing.sm },
  personalRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1,
  },
  personalIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  personalInfo: { flex: 1 },
  personalLabel: { fontSize: fontSize.base, fontWeight: '600' },
  personalValue: { fontSize: fontSize.sm, marginTop: 2 },
  toggleOn: { width: 38, height: 22, borderRadius: 11, paddingLeft: 18, justifyContent: 'center' },
  toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'white' },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  continueBtn: { padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  continueBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});