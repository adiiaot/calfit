import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  StyleSheet, TextInput, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, fontSize } from '../../theme';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useMealPlanStore } from '../../store/mealPlanStore';
import { AILoadingSkeleton } from '../../components/AILoadingSkeleton';
import type { GeneratedMealPlan } from '../../types/ai-coach.types';

type Tab = 'generate' | 'saved';

const DIETARY_PRESETS = [
  'balanced', 'high_protein', 'low_carb', 'vegetarian',
  'vegan', 'mediterranean', 'keto', 'gluten_free',
];

const BUDGET_LEVELS = [
  { key: 'low', label: 'Budget', icon: 'wallet-outline' },
  { key: 'moderate', label: 'Moderate', icon: 'card-outline' },
  { key: 'high', label: 'Premium', icon: 'diamond-outline' },
];

const HEALTH_GOALS = [
  'weight_loss', 'muscle_gain', 'maintain', 'heart_health', 'more_energy',
];

const CUISINE_STYLES = [
  'any', 'nigerian', 'italian', 'mexican', 'asian', 'indian', 'american',
];

export default function MealPlanScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const { user } = useAuthStore();
  const store = useMealPlanStore();
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [caloriesTarget, setCaloriesTarget] = useState('2000');
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [excludedFoods, setExcludedFoods] = useState('');
  const [cuisineStyle, setCuisineStyle] = useState('any');
  const [healthGoal, setHealthGoal] = useState('maintain');

  useFocusEffect(
    useCallback(() => {
      if (user) store.loadSavedPlans(user.id);
    }, [user])
  );

  const toggleDietary = (pref: string) => {
    setDietaryPrefs(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleGenerate = async () => {
    if (!user) return;
    if (!caloriesTarget || parseInt(caloriesTarget) < 500) {
      Alert.alert('Invalid', 'Please set a daily calorie target (min 500)');
      return;
    }
    await store.generatePlan(user.id, {
      dietary_preferences: dietaryPrefs,
      budget_level: budgetLevel,
      calories_target: parseInt(caloriesTarget) || 2000,
      meals_per_day: mealsPerDay,
      excluded_foods: excludedFoods.split(',').map(f => f.trim()).filter(Boolean),
      cuisine_style: cuisineStyle,
      health_goal: healthGoal,
    });
  };

  const handleSave = async () => {
    if (!user || !store.currentPlan) return;
    await store.savePlan(user.id, store.currentPlan);
    Alert.alert('Saved!', 'Meal plan saved to your collection');
  };

  const handleDelete = (plan: GeneratedMealPlan) => {
    Alert.alert('Delete Meal Plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { if (user) store.deleteSavedPlan(user.id, plan.id); },
      },
    ]);
  };

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {(['generate', 'saved'] as Tab[]).map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
            style={[styles.tabItem, isActive && { backgroundColor: theme.accent }]}
          >
            <Ionicons
              name={tab === 'generate' ? 'sparkles' : 'bookmark'}
              size={16}
              color={isActive ? '#fff' : theme.textMuted}
            />
            <Text style={[styles.tabLabel, {
              color: isActive ? '#fff' : theme.textMuted,
              fontWeight: isActive ? '700' : '500',
            }]}>
              {tab === 'generate' ? 'Generate' : 'Saved'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderQuestionnaire = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Calories */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Daily Calorie Target</Text>
      <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.bg }]}>
        <Ionicons name="flame-outline" size={18} color={theme.accent} />
        <TextInput
          value={caloriesTarget}
          onChangeText={setCaloriesTarget}
          keyboardType="number-pad"
          placeholder="e.g. 2000"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.textPrimary }]}
        />
        <Text style={[styles.inputSuffix, { color: theme.textMuted }]}>kcal/day</Text>
      </View>

      {/* Meals per day */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Meals per Day</Text>
      <View style={styles.chipRow}>
        {[2, 3, 4, 5].map(n => (
          <TouchableOpacity
            key={n}
            onPress={() => setMealsPerDay(n)}
            activeOpacity={0.7}
            style={[styles.chip, {
              backgroundColor: mealsPerDay === n ? theme.accent : theme.card,
              borderColor: mealsPerDay === n ? theme.accent : theme.border,
            }]}
          >
            <Text style={[styles.chipText, {
              color: mealsPerDay === n ? '#fff' : theme.textSecondary,
            }]}>{n} meals</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dietary Preferences */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Dietary Preferences</Text>
      <View style={styles.chipRow}>
        {DIETARY_PRESETS.map(pref => {
          const selected = dietaryPrefs.includes(pref);
          return (
            <TouchableOpacity
              key={pref}
              onPress={() => toggleDietary(pref)}
              activeOpacity={0.7}
              style={[styles.chip, {
                backgroundColor: selected ? theme.accent : theme.card,
                borderColor: selected ? theme.accent : theme.border,
              }]}
            >
              <Text style={[styles.chipText, {
                color: selected ? '#fff' : theme.textSecondary,
              }]}>{pref.replace(/_/g, ' ')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Budget */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Budget Level</Text>
      <View style={styles.chipRow}>
        {BUDGET_LEVELS.map(b => {
          const selected = budgetLevel === b.key;
          return (
            <TouchableOpacity
              key={b.key}
              onPress={() => setBudgetLevel(b.key as any)}
              activeOpacity={0.7}
              style={[styles.chip, {
                backgroundColor: selected ? theme.accent : theme.card,
                borderColor: selected ? theme.accent : theme.border,
              }]}
            >
              <Ionicons name={b.icon as any} size={14} color={selected ? '#fff' : theme.textSecondary} />
              <Text style={[styles.chipText, {
                color: selected ? '#fff' : theme.textSecondary,
              }]}>{b.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Health Goal */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Health Goal</Text>
      <View style={styles.chipRow}>
        {HEALTH_GOALS.map(g => {
          const selected = healthGoal === g;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => setHealthGoal(g)}
              activeOpacity={0.7}
              style={[styles.chip, {
                backgroundColor: selected ? theme.accent : theme.card,
                borderColor: selected ? theme.accent : theme.border,
              }]}
            >
              <Text style={[styles.chipText, {
                color: selected ? '#fff' : theme.textSecondary,
              }]}>{g.replace(/_/g, ' ')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cuisine Style */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Cuisine Preference</Text>
      <View style={styles.chipRow}>
        {CUISINE_STYLES.map(c => {
          const selected = cuisineStyle === c;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setCuisineStyle(c)}
              activeOpacity={0.7}
              style={[styles.chip, {
                backgroundColor: selected ? theme.accent : theme.card,
                borderColor: selected ? theme.accent : theme.border,
              }]}
            >
              <Text style={[styles.chipText, {
                color: selected ? '#fff' : theme.textSecondary,
              }]}>{c === 'any' ? 'Any Cuisine' : c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Excluded Foods */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Foods to Exclude</Text>
      <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
        Comma-separated (e.g. mushrooms, peanuts, shellfish)
      </Text>
      <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.bg }]}>
        <Ionicons name="close-circle-outline" size={18} color={theme.red} />
        <TextInput
          value={excludedFoods}
          onChangeText={setExcludedFoods}
          placeholder="e.g. mushrooms, peanuts"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.textPrimary }]}
        />
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        onPress={handleGenerate}
        disabled={store.isLoading}
        activeOpacity={0.8}
        style={[styles.generateBtn, {
          backgroundColor: theme.accent,
          opacity: store.isLoading ? 0.7 : 1,
        }]}
      >
        <Ionicons name="sparkles-outline" size={20} color="#fff" />
        <Text style={styles.generateBtnText}>
          {store.isLoading ? 'Generating...' : 'Generate Meal Plan'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <View style={[styles.loadingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <LinearGradient
          colors={['#2DDC8C', '#0A9A5E'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingIconWrap}
        >
          <Ionicons name="restaurant-outline" size={32} color="#fff" />
        </LinearGradient>
        <Text style={[styles.loadingTitle, { color: theme.textPrimary }]}>
          Generating Your Meal Plan
        </Text>
        <Text style={[styles.loadingSub, { color: theme.textMuted }]}>
          AI is crafting a personalized meal plan based on your preferences...
        </Text>
        <AILoadingSkeleton />
      </View>
    </View>
  );

  const renderMealPlanResult = () => {
    if (!store.currentPlan) return null;
    const plan = store.currentPlan;

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.planCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.planTitle, { color: theme.textPrimary }]}>{plan.title}</Text>
          <Text style={[styles.planDesc, { color: theme.textMuted }]}>{plan.description}</Text>
          <View style={styles.planMeta}>
            <View style={[styles.metaChip, { backgroundColor: theme.accent + '15' }]}>
              <Ionicons name="flame-outline" size={14} color={theme.accent} />
              <Text style={[styles.metaChipText, { color: theme.accent }]}>{plan.daily_calories} kcal</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: theme.purple + '15' }]}>
              <Ionicons name="wallet-outline" size={14} color={theme.purple} />
              <Text style={[styles.metaChipText, { color: theme.purple }]}>{plan.budget_level}</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: theme.accentSecond + '25' }]}>
              <Ionicons name="restaurant-outline" size={14} color={theme.accentSecond} />
              <Text style={[styles.metaChipText, { color: theme.accentSecond }]}>{plan.meals.length} meals</Text>
            </View>
          </View>
        </View>

        {plan.ai_notes ? (
          <View style={[styles.notesBox, { backgroundColor: theme.accent + '10', borderLeftColor: theme.accent }]}>
            <Ionicons name="bulb-outline" size={16} color={theme.accent} />
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>{plan.ai_notes}</Text>
          </View>
        ) : null}

        {plan.meals.map((meal, i) => (
          <View key={i} style={[styles.mealCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.mealHeader}>
              <View style={[styles.mealIconWrap, { backgroundColor: theme.accent + '22' }]}>
                <Ionicons
                  name={i === 0 ? 'sunny-outline' : i === plan.meals.length - 1 ? 'moon-outline' : 'restaurant-outline'}
                  size={16}
                  color={theme.accent}
                />
              </View>
              <Text style={[styles.mealName, { color: theme.textPrimary }]}>{meal.name}</Text>
              <Text style={[styles.mealCal, { color: theme.accent }]}>{meal.calories} kcal</Text>
            </View>
            {meal.foods.map((food, j) => (
              <View key={j} style={[styles.foodRow, { borderColor: theme.border }]}>
                <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
                <Text style={[styles.foodName, { color: theme.textSecondary }]}>{food}</Text>
              </View>
            ))}
            {(meal.protein_g != null || meal.carbs_g != null || meal.fats_g != null) && (
              <View style={styles.macroRow}>
                {meal.protein_g != null && (
                  <View style={[styles.macroPill, { backgroundColor: '#FF6B35' + '18' }]}>
                    <Text style={[styles.macroText, { color: '#FF6B35' }]}>P {meal.protein_g}g</Text>
                  </View>
                )}
                {meal.carbs_g != null && (
                  <View style={[styles.macroPill, { backgroundColor: '#FFB830' + '18' }]}>
                    <Text style={[styles.macroText, { color: '#FFB830' }]}>C {meal.carbs_g}g</Text>
                  </View>
                )}
                {meal.fats_g != null && (
                  <View style={[styles.macroPill, { backgroundColor: '#4A90E2' + '18' }]}>
                    <Text style={[styles.macroText, { color: '#4A90E2' }]}>F {meal.fats_g}g</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.8} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
            <Ionicons name="bookmark-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Meal Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => store.clearCurrentPlan()} activeOpacity={0.8} style={[styles.newBtn, { borderColor: theme.border }]}>
            <Text style={[styles.newBtnText, { color: theme.textMuted }]}>Generate New</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderGenerateContent = () => {
    if (store.isLoading) return renderLoading();
    if (store.currentPlan) return renderMealPlanResult();
    return renderQuestionnaire();
  };

  const renderSavedPlans = () => {
    if (store.savedPlans.length === 0) {
      return (
        <View style={styles.empty}>
          <Ionicons name="restaurant-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No saved meal plans</Text>
          <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
            Generate a meal plan and save it to see it here
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={store.savedPlans}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.savedList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setActiveTab('generate');
              // We could show it, but for now let user regenerate
            }}
            activeOpacity={0.85}
            style={[styles.savedCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.savedCardBody}>
              <Text style={[styles.savedTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.savedMeta, { color: theme.textSecondary }]}>
                {item.daily_calories} kcal  ·  {item.meals.length} meals  ·  {item.budget_level}
              </Text>
              <Text style={[styles.savedDate, { color: theme.textMuted }]}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.savedActions}>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={12}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={20} color={theme.red} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Meal Plans</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              AI-powered personalized meal planning
            </Text>
          </View>
        </View>
      </View>

      {renderTabBar()}

      <View style={styles.content}>
        {activeTab === 'generate' && renderGenerateContent()}
        {activeTab === 'saved' && renderSavedPlans()}
      </View>

      {store.error && (
        <View style={[styles.errorBar, { backgroundColor: theme.red }]}>
          <Text style={styles.errorText}>{store.error}</Text>
          <TouchableOpacity onPress={store.clearError} hitSlop={12}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  backBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: fontSize.sm, marginTop: 2 },

  tabBar: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md,
    borderRadius: 12, padding: 3, borderWidth: 1,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 10,
  },
  tabLabel: { fontSize: fontSize.sm },

  content: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.huge + 40 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.lg },
  fieldHint: { fontSize: fontSize.xs, marginBottom: spacing.sm, marginTop: -spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '600' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1,
  },
  input: { flex: 1, paddingVertical: spacing.md, fontSize: fontSize.base },
  inputSuffix: { fontSize: fontSize.sm, fontWeight: '600' },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: radius.lg,
    marginTop: spacing.xxl, marginBottom: spacing.huge,
  },
  generateBtnText: { color: '#fff', fontSize: fontSize.xl, fontWeight: '700' },

  // Loading
  loadingContainer: { flex: 1, padding: spacing.lg },
  loadingCard: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, alignItems: 'center' },
  loadingIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  loadingTitle: { fontSize: fontSize.lg, fontWeight: '800', marginBottom: spacing.xs },
  loadingSub: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 18, marginBottom: spacing.lg },

  // Plan result
  planCard: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, marginBottom: spacing.md },
  planTitle: { fontSize: fontSize.xl, fontWeight: '800' },
  planDesc: { fontSize: fontSize.sm, marginTop: spacing.xs, lineHeight: 18 },
  planMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.full },
  metaChipText: { fontSize: fontSize.xs, fontWeight: '700' },

  notesBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderLeftWidth: 3, marginBottom: spacing.md },
  notesText: { flex: 1, fontSize: fontSize.sm, lineHeight: 18 },

  mealCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  mealIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mealName: { flex: 1, fontSize: fontSize.base, fontWeight: '700' },
  mealCal: { fontSize: fontSize.sm, fontWeight: '700' },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, borderBottomWidth: 0.5 },
  foodName: { fontSize: fontSize.sm, flex: 1 },
  macroRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  macroPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  macroText: { fontSize: 10, fontWeight: '700' },

  actionRow: { marginTop: spacing.lg, gap: spacing.sm },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.lg },
  saveBtnText: { color: '#fff', fontSize: fontSize.base, fontWeight: '700' },
  newBtn: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  newBtnText: { fontSize: fontSize.base, fontWeight: '600' },

  errorBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, position: 'absolute', bottom: 0, left: 0, right: 0 },
  errorText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '600', flex: 1 },

  // Saved plans
  savedList: { padding: spacing.lg, paddingBottom: spacing.huge },
  savedCard: { flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.md },
  savedCardBody: { flex: 1 },
  savedTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  savedMeta: { fontSize: fontSize.md, marginTop: 4 },
  savedDate: { fontSize: fontSize.sm, marginTop: 4 },
  savedActions: { justifyContent: 'center', paddingLeft: spacing.md },
  deleteBtn: { padding: spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700', marginTop: spacing.md },
  emptyDesc: { fontSize: fontSize.base, textAlign: 'center', marginTop: spacing.sm },
});
