import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { logFood, logWater, getTodayCalories, getTodayWater } from '../../services/profileService';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

interface FoodEntry {
  id: string;
  food_name: string;
  calories: number;
  meal_type: MealType;
}

// ── ADD FOOD MODAL ────────────────────────────────────────────
function AddFoodModal({
  theme,
  mealType,
  visible,
  onClose,
  onAdd,
}: {
  theme: typeof colors.dark;
  mealType: MealType;
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: { food_name: string; calories: number; meal_type: MealType }) => void;
}) {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!foodName || !calories) {
      Alert.alert('Missing fields', 'Please enter food name and calories.');
      return;
    }
    setIsSaving(true);
    await onAdd({
      food_name: foodName,
      calories: parseInt(calories),
      meal_type: mealType,
    });
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {[
            { label: 'Food Name *', value: foodName, onChange: setFoodName, placeholder: 'e.g. Grilled chicken', keyboard: 'default' },
            { label: 'Calories *', value: calories, onChange: setCalories, placeholder: '350', keyboard: 'number-pad' },
            { label: 'Protein (g)', value: protein, onChange: setProtein, placeholder: '0', keyboard: 'decimal-pad' },
            { label: 'Carbs (g)', value: carbs, onChange: setCarbs, placeholder: '0', keyboard: 'decimal-pad' },
            { label: 'Fats (g)', value: fats, onChange: setFats, placeholder: '0', keyboard: 'decimal-pad' },
          ].map((f) => (
            <View key={f.label} style={styles.modalField}>
              <Text style={[styles.modalFieldLabel, { color: theme.textSecondary }]}>
                {f.label}
              </Text>
              <View style={[styles.modalInput, {
                backgroundColor: theme.card,
                borderColor: theme.border,
              }]}>
                <TextInput
                  value={f.value}
                  onChangeText={f.onChange}
                  placeholder={f.placeholder}
                  placeholderTextColor={theme.textMuted}
                  keyboardType={f.keyboard as any}
                  style={[styles.modalInputText, { color: theme.textPrimary }]}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleAdd}
            disabled={isSaving}
            style={[styles.modalAddBtn, { backgroundColor: theme.accent }]}
          >
            {isSaving ? (
              <ActivityIndicator color={theme.bg} />
            ) : (
              <Text style={[styles.modalAddBtnText, { color: theme.bg }]}>
                Add Food
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── SEARCH BAR ───────────────────────────────────────────────
function SearchBar({
  theme,
  onScanPress,
}: {
  theme: typeof colors.dark;
  onScanPress: () => void;
}) {
  return (
    <View style={styles.searchRow}>
      <View style={[styles.searchInput, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} />
        <TextInput
          placeholder="Search food or log by voice..."
          placeholderTextColor={theme.textMuted}
          style={[styles.searchText, { color: theme.textPrimary }]}
        />
      </View>
      <TouchableOpacity
        onPress={onScanPress}
        style={[styles.scanBtn, { backgroundColor: theme.accent }]}
      >
        <Ionicons name="barcode-outline" size={22} color={theme.bg} />
      </TouchableOpacity>
    </View>
  );
}

// ── CALORIE DONUT SUMMARY ────────────────────────────────────
function CalorieSummary({
  theme,
  consumed,
  goal,
}: {
  theme: typeof colors.dark;
  consumed: number;
  goal: number;
}) {
  const remaining = Math.max(goal - consumed, 0);

  return (
    <View style={[styles.card, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
        Today's Calories
      </Text>
      <View style={styles.donutRow}>
        <View style={styles.donutContainer}>
          <View style={[styles.donutRingOuter, { borderColor: theme.border }]} />
          <View style={[styles.donutRingProgress, { borderColor: theme.accent }]} />
          <View style={styles.donutCenterText}>
            <Text style={[styles.donutValue, { color: theme.textPrimary }]}>
              {remaining}
            </Text>
            <Text style={[styles.donutSub, { color: theme.textMuted }]}>left</Text>
          </View>
        </View>
        <View style={styles.donutStats}>
          {[
            { dot: theme.textMuted, label: 'Goal', value: `${goal} kcal` },
            { dot: theme.orange, label: 'Consumed', value: `${consumed} kcal` },
            { dot: theme.accent, label: 'Remaining', value: `${remaining} kcal` },
          ].map((s) => (
            <View key={s.label} style={styles.donutStatRow}>
              <View style={[styles.donutDot, { backgroundColor: s.dot }]} />
              <Text style={[styles.donutLabel, { color: theme.textSecondary }]}>
                {s.label}
              </Text>
              <Text style={[styles.donutVal, { color: theme.textPrimary }]}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── WATER INTAKE CARD ────────────────────────────────────────
function WaterCard({
  theme,
  waterMl,
  goalMl,
  onAdd,
}: {
  theme: typeof colors.dark;
  waterMl: number;
  goalMl: number;
  onAdd: (ml: number) => void;
}) {
  const waterL = (waterMl / 1000).toFixed(1);
  const goalL = (goalMl / 1000).toFixed(1);
  const pct = Math.min(waterMl / goalMl, 1);

  return (
    <View style={[styles.card, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
        Water Intake
      </Text>
      <Text style={[styles.waterValue, { color: theme.accentSecond }]}>
        {waterL}L
      </Text>
      <Text style={[styles.waterSub, { color: theme.textSecondary }]}>
        of {goalL}L daily goal
      </Text>
      <View style={[styles.waterBarBg, { backgroundColor: theme.border }]}>
        <View style={[styles.waterBarFill, {
          backgroundColor: theme.accentSecond,
          width: `${pct * 100}%` as any,
        }]} />
      </View>
      <View style={styles.waterBtns}>
        {[250, 500, 1000].map((ml) => (
          <TouchableOpacity
            key={ml}
            onPress={() => onAdd(ml)}
            style={[styles.waterAddBtn, { borderColor: theme.accentSecond }]}
          >
            <Text style={[styles.waterAddText, { color: theme.accentSecond }]}>
              +{ml >= 1000 ? '1L' : `${ml}ml`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── MEAL SECTION ─────────────────────────────────────────────
function MealSection({
  theme,
  title,
  mealType,
  items,
  onAddFood,
}: {
  theme: typeof colors.dark;
  title: string;
  mealType: MealType;
  items: FoodEntry[];
  onAddFood: (mealType: MealType) => void;
}) {
  const totalCal = items.reduce((sum, item) => sum + item.calories, 0);

  return (
    <View style={styles.mealSection}>
      <View style={styles.mealHeader}>
        <Text style={[styles.mealTitle, { color: theme.textSecondary }]}>
          {title}
        </Text>
        <Text style={[styles.mealCal, { color: theme.accent }]}>
          {totalCal > 0 ? `${totalCal} kcal` : '—'}
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyMeal, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <Text style={[styles.emptyMealText, { color: theme.textMuted }]}>
            Nothing logged yet
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={[styles.foodItem, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <Text style={[styles.foodName, { color: theme.textPrimary }]}>
              {item.food_name}
            </Text>
            <Text style={[styles.foodCal, { color: theme.accent }]}>
              {item.calories} kcal
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity
        onPress={() => onAddFood(mealType)}
        style={[styles.addFoodBtn, { borderColor: theme.accent }]}
      >
        <Ionicons name="add" size={16} color={theme.accent} />
        <Text style={[styles.addFoodText, { color: theme.accent }]}>
          Add food
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function CalorieScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [waterMl, setWaterMl] = useState(0);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [activeMeal, setActiveMeal] = useState<MealType>('breakfast');
  const [showAddFood, setShowAddFood] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const calorieGoal = profile?.daily_calorie_goal ?? 2000;
  const waterGoalMl = profile?.water_goal_ml ?? 2500;

  const handleOpenScanner = () => {
    navigation.getParent()?.navigate('FoodScanner');
  };

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { supabase } = await import('../../services/supabase');
      const today = new Date().toISOString().split('T')[0];

      const [caloriesData, waterData, foodData] = await Promise.all([
        getTodayCalories(user.id),
        getTodayWater(user.id),
        supabase
          .from('food_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .order('logged_at', { ascending: true }),
      ]);

      setCaloriesConsumed(caloriesData);
      setWaterMl(waterData);
      if (foodData.data) {
        setFoodEntries(foodData.data.map((d: any) => ({
          id: d.id,
          food_name: d.food_name,
          calories: d.calories,
          meal_type: d.meal_type,
        })));
      }
    } catch (error) {
      console.error('Failed to load calorie data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWater = async (ml: number) => {
    if (!user?.id) return;
    const success = await logWater(user.id, ml);
    if (success) {
      setWaterMl((prev) => prev + ml);
    }
  };

  const handleAddFood = async (entry: {
    food_name: string;
    calories: number;
    meal_type: MealType;
  }) => {
    if (!user?.id) return;
    const success = await logFood(user.id, entry);
    if (success) {
      const newEntry: FoodEntry = {
        id: Date.now().toString(),
        ...entry,
      };
      setFoodEntries((prev) => [...prev, newEntry]);
      setCaloriesConsumed((prev) => prev + entry.calories);
    }
  };

  const meals: { title: string; type: MealType }[] = [
    { title: 'Breakfast', type: 'breakfast' },
    { title: 'Lunch', type: 'lunch' },
    { title: 'Dinner', type: 'dinner' },
    { title: 'Snacks', type: 'snacks' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          Calorie Tracker
        </Text>
        <Text style={[styles.pageDate, { color: theme.textSecondary }]}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
          })}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SearchBar theme={theme} onScanPress={handleOpenScanner} />

        <CalorieSummary
          theme={theme}
          consumed={caloriesConsumed}
          goal={calorieGoal}
        />

        <TouchableOpacity
          onPress={handleOpenScanner}
          style={[styles.scanFoodBtn, {
            borderColor: theme.accent,
            backgroundColor: theme.accentDim as string,
          }]}
        >
          <Ionicons name="camera-outline" size={18} color={theme.accent} />
          <Text style={[styles.scanFoodText, { color: theme.accent }]}>
            Scan Food / Barcode / Food Label
          </Text>
        </TouchableOpacity>

        <WaterCard
          theme={theme}
          waterMl={waterMl}
          goalMl={waterGoalMl}
          onAdd={handleAddWater}
        />

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Meals
        </Text>

        {meals.map((meal) => (
          <MealSection
            key={meal.type}
            theme={theme}
            title={meal.title}
            mealType={meal.type}
            items={foodEntries.filter((e) => e.meal_type === meal.type)}
            onAddFood={(type) => {
              setActiveMeal(type);
              setShowAddFood(true);
            }}
          />
        ))}

        <TouchableOpacity
          onPress={() => navigation.navigate('Meals')}
          style={[styles.mealPlannerBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.mealPlannerText, { color: theme.bg }]}>
            📅  Open Meal Planner
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Food Modal */}
      <AddFoodModal
        theme={theme}
        mealType={activeMeal}
        visible={showAddFood}
        onClose={() => setShowAddFood(false)}
        onAdd={handleAddFood}
      />
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
  pageDate: { fontSize: fontSize.md, marginTop: 2 },

  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 48, borderRadius: radius.md, borderWidth: 1,
  },
  searchText: { flex: 1, fontSize: fontSize.base },
  scanBtn: {
    width: 48, height: 48,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },

  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  donutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  donutContainer: {
    width: 90, height: 90,
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  donutRingOuter: {
    position: 'absolute',
    width: 84, height: 84,
    borderRadius: 42, borderWidth: 8,
  },
  donutRingProgress: {
    position: 'absolute',
    width: 84, height: 84,
    borderRadius: 42, borderWidth: 8,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
  donutCenterText: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutValue: { fontSize: fontSize.lg, fontWeight: '800', lineHeight: 20 },
  donutSub: { fontSize: fontSize.xs, lineHeight: 14 },
  donutStats: { flex: 1, gap: spacing.sm },
  donutStatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  donutDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  donutLabel: { fontSize: fontSize.sm, flex: 1 },
  donutVal: { fontSize: fontSize.sm, fontWeight: '700' },

  scanFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  scanFoodText: { fontSize: fontSize.base, fontWeight: '600' },

  waterValue: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  waterSub: { fontSize: fontSize.sm, marginBottom: spacing.sm },
  waterBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.md },
  waterBarFill: { height: '100%', borderRadius: 4 },
  waterBtns: { flexDirection: 'row', gap: spacing.sm },
  waterAddBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  waterAddText: { fontSize: fontSize.sm, fontWeight: '700' },

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  mealSection: { marginBottom: spacing.sm },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  mealTitle: { fontSize: fontSize.base, fontWeight: '700' },
  mealCal: { fontSize: fontSize.sm, fontWeight: '700' },

  emptyMeal: {
    marginHorizontal: spacing.lg,
    marginBottom: 6,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyMealText: { fontSize: fontSize.sm },

  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: 6,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  foodName: { fontSize: fontSize.base, flex: 1 },
  foodCal: { fontSize: fontSize.sm, fontWeight: '700' },

  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginHorizontal: spacing.lg,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: spacing.sm,
  },
  addFoodText: { fontSize: fontSize.sm, fontWeight: '600' },

  mealPlannerBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  mealPlannerText: { fontSize: fontSize.lg, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    paddingBottom: spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  modalField: { gap: 6 },
  modalFieldLabel: { fontSize: fontSize.sm, fontWeight: '600' },
  modalInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  modalInputText: { fontSize: fontSize.lg },
  modalAddBtn: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  modalAddBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});