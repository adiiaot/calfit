import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

export default function GoalsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile, updateProfile } = useAuthStore();
  const theme = colors[colorScheme];

  const [calories, setCalories] = useState(
    profile?.daily_calorie_goal?.toString() ?? '2000'
  );
  const [water, setWater] = useState(
    profile?.water_goal_ml
      ? (profile.water_goal_ml / 1000).toString()
      : '2.5'
  );
  const [steps, setSteps] = useState(
    profile?.step_goal?.toString() ?? '10000'
  );
  const [sleep, setSleep] = useState(
    profile?.sleep_goal_hrs?.toString() ?? '8'
  );
  const [isSaving, setIsSaving] = useState(false);

  const goals = [
    {
      label: 'Daily Calorie Goal',
      value: calories,
      onChange: setCalories,
      icon: 'flame-outline',
      color: theme.orange,
      suffix: 'kcal',
      placeholder: '2000',
      keyboardType: 'number-pad',
      hint: 'Recommended: 1,800–2,500 kcal based on your activity level',
    },
    {
      label: 'Daily Water Goal',
      value: water,
      onChange: setWater,
      icon: 'water-outline',
      color: theme.accentSecond,
      suffix: 'L',
      placeholder: '2.5',
      keyboardType: 'decimal-pad',
      hint: 'Recommended: 2–3 litres per day',
    },
    {
      label: 'Daily Step Goal',
      value: steps,
      onChange: setSteps,
      icon: 'footsteps-outline',
      color: theme.accent,
      suffix: 'steps',
      placeholder: '10000',
      keyboardType: 'number-pad',
      hint: 'Recommended: 8,000–12,000 steps per day',
    },
    {
      label: 'Daily Sleep Goal',
      value: sleep,
      onChange: setSleep,
      icon: 'moon-outline',
      color: theme.purple,
      suffix: 'hrs',
      placeholder: '8',
      keyboardType: 'decimal-pad',
      hint: 'Recommended: 7–9 hours per night',
    },
  ];

  const handleSave = async () => {
    const calorieNum = parseInt(calories);
    const waterNum = parseFloat(water);
    const stepNum = parseInt(steps);
    const sleepNum = parseFloat(sleep);

    if (!calorieNum || !waterNum || !stepNum || !sleepNum) {
      Alert.alert('Missing values', 'Please fill in all goals before saving.');
      return;
    }

    if (calorieNum < 1000 || calorieNum > 5000) {
      Alert.alert('Invalid calories', 'Calorie goal should be between 1,000 and 5,000 kcal.');
      return;
    }

    setIsSaving(true);
    try {
      const { updateProfile: updateDB } = await import('../../services/profileService');
      const userId = user?.id;
      if (!userId) throw new Error('Not logged in');

      const updates = {
        daily_calorie_goal: calorieNum,
        water_goal_ml: Math.round(waterNum * 1000),
        step_goal: stepNum,
        sleep_goal_hrs: sleepNum,
      };

      const success = await updateDB(userId, updates);
      if (success) {
        updateProfile(updates);
        Alert.alert('Goals Saved ✓', 'Your daily goals have been updated.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error('Save failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not save goals.');
    } finally {
      setIsSaving(false);
    }
  };

  return (

            <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
                  {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>
            Settings
          </Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          Daily Goals
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Text style={[styles.saveBtn, { color: theme.accent }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
          These targets are used to measure your daily progress across the app.
        </Text>

        {goals.map((g) => (
          <View key={g.label} style={[styles.goalCard, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <View style={styles.goalHeader}>
              <View style={[styles.goalIcon, {
                backgroundColor: g.color + '22',
              }]}>
                <Ionicons name={g.icon as any} size={20} color={g.color} />
              </View>
              <Text style={[styles.goalLabel, { color: theme.textPrimary }]}>
                {g.label}
              </Text>
            </View>
            <View style={[styles.inputRow, {
              backgroundColor: theme.bg,
              borderColor: theme.border,
            }]}>
              <TextInput
                value={g.value}
                onChangeText={g.onChange}
                placeholder={g.placeholder}
                placeholderTextColor={theme.textMuted}
                keyboardType={g.keyboardType as any}
                style={[styles.input, { color: g.color }]}
              />
              <Text style={[styles.suffix, { color: theme.textMuted }]}>
                {g.suffix}
              </Text>
            </View>
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              {g.hint}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveFullBtn, { backgroundColor: theme.accent }]}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.bg} />
          ) : (
            <Text style={[styles.saveFullBtnText, { color: theme.bg }]}>
              Save Goals
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
            </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: spacing.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },
  pageTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  saveBtn: { fontSize: fontSize.lg, fontWeight: '700' },

  pageSubtitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  goalCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  goalIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  goalLabel: { fontSize: fontSize.lg, fontWeight: '700' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  input: { flex: 1, fontSize: 28, fontWeight: '800' },
  suffix: { fontSize: fontSize.lg, fontWeight: '600' },
  hint: { fontSize: fontSize.xs, lineHeight: 16 },

  saveFullBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  saveFullBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});