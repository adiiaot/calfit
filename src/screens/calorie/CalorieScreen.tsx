import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

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
        <Text style={[styles.searchIcon, { color: theme.textMuted }]}>⊕</Text>
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
        <Text style={styles.scanBtnText}>▦</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── CALORIE DONUT SUMMARY ────────────────────────────────────
function CalorieSummary({ theme }: { theme: typeof colors.dark }) {
  const goal = 2000;
  const consumed = 1340;
  const burned = 320;
  const remaining = goal - consumed + burned;

  return (
    <View style={[styles.card, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
        Today's Calories
      </Text>
      <View style={styles.donutRow}>
        {/* Donut */}
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

        {/* Stats */}
        <View style={styles.donutStats}>
          {[
            { dot: theme.textMuted, label: 'Goal', value: `${goal} kcal` },
            { dot: theme.orange, label: 'Consumed', value: `${consumed} kcal` },
            { dot: theme.accent, label: 'Burned', value: `${burned} kcal` },
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

// ── SCAN FOOD BUTTON ─────────────────────────────────────────
function ScanFoodButton({
  theme,
  onPress,
}: {
  theme: typeof colors.dark;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.scanFoodBtn, {
        borderColor: theme.accent,
        backgroundColor: theme.accentDim as string,
      }]}
    >
      <Text style={[styles.scanFoodText, { color: theme.accent }]}>
        📷   Scan Food / Barcode / Food Label
      </Text>
    </TouchableOpacity>
  );
}

// ── WATER INTAKE CARD ────────────────────────────────────────
function WaterCard({ theme }: { theme: typeof colors.dark }) {
  const current = 1.6;
  const goal = 2.5;
  const pct = current / goal;

  return (
    <View style={[styles.card, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
        Water Intake
      </Text>
      <Text style={[styles.waterValue, { color: theme.accentSecond }]}>
        {current}L
      </Text>
      <Text style={[styles.waterSub, { color: theme.textSecondary }]}>
        of {goal}L daily goal
      </Text>
      <View style={[styles.waterBarBg, { backgroundColor: theme.border }]}>
        <View style={[styles.waterBarFill, {
          backgroundColor: theme.accentSecond,
          width: `${pct * 100}%` as any,
        }]} />
      </View>
      <View style={styles.waterBtns}>
        {['+250ml', '+500ml', '+1L'].map((amt) => (
          <TouchableOpacity
            key={amt}
            style={[styles.waterAddBtn, {
              borderColor: theme.accentSecond,
            }]}
          >
            <Text style={[styles.waterAddText, { color: theme.accentSecond }]}>
              {amt}
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
  calories,
  items,
}: {
  theme: typeof colors.dark;
  title: string;
  calories: string;
  items: { name: string; cal: string }[];
}) {
  return (
    <View style={styles.mealSection}>
      {/* Section header */}
      <View style={styles.mealHeader}>
        <Text style={[styles.mealTitle, { color: theme.textSecondary }]}>
          {title}
        </Text>
        <Text style={[styles.mealCal, { color: theme.accent }]}>
          {calories}
        </Text>
      </View>

      {/* Food items */}
      {items.map((item) => (
        <View key={item.name} style={[styles.foodItem, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <Text style={[styles.foodName, { color: theme.textPrimary }]}>
            {item.name}
          </Text>
          <Text style={[styles.foodCal, { color: theme.accent }]}>
            {item.cal}
          </Text>
        </View>
      ))}

      {/* Add food button */}
      <TouchableOpacity style={[styles.addFoodBtn, { borderColor: theme.border }]}>
        <Text style={[styles.addFoodText, { color: theme.textMuted }]}>
          + Add food
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function CalorieScreen() {
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  const meals = [
    {
      title: 'Breakfast',
      calories: '480 kcal',
      items: [
        { name: 'Overnight oats', cal: '320 kcal' },
        { name: 'Black coffee', cal: '5 kcal' },
      ],
    },
    {
      title: 'Lunch',
      calories: '760 kcal',
      items: [
        { name: 'Grilled chicken rice', cal: '560 kcal' },
        { name: 'Mixed salad', cal: '120 kcal' },
      ],
    },
    {
      title: 'Dinner',
      calories: '—',
      items: [],
    },
    {
      title: 'Snacks',
      calories: '—',
      items: [],
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Header */}
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
        <SearchBar
          theme={theme}
          onScanPress={() => console.log('Open scanner')}
        />
        <CalorieSummary theme={theme} />
        <ScanFoodButton
          theme={theme}
          onPress={() => console.log('Open scanner')}
        />
        <WaterCard theme={theme} />

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Meals
        </Text>

        {meals.map((meal) => (
          <MealSection
            key={meal.title}
            theme={theme}
            title={meal.title}
            calories={meal.calories}
            items={meal.items}
          />
        ))}

        {/* Meal Planner CTA */}
        <TouchableOpacity
          style={[styles.mealPlannerBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.mealPlannerText}>📅   Open Meal Planner</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: spacing.massive },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },
  pageDate: { fontSize: fontSize.md, marginTop: 2 },

  // Search
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
  searchIcon: { fontSize: 18 },
  searchText: { flex: 1, fontSize: fontSize.base },
  scanBtn: {
    width: 48, height: 48,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtnText: { fontSize: 22, color: '#0C0D10', fontWeight: '700' },

  // Cards
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

  // Donut
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  donutContainer: {
    width: 90, height: 90,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
  donutCenterText: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  donutValue: { fontSize: fontSize.lg, fontWeight: '800', lineHeight: 20 },
  donutSub: { fontSize: fontSize.xs, lineHeight: 14 },
  donutStats: { flex: 1, gap: spacing.sm },
  donutStatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  donutDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  donutLabel: { fontSize: fontSize.sm, flex: 1 },
  donutVal: { fontSize: fontSize.sm, fontWeight: '700' },

  // Scan food button
  scanFoodBtn: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  scanFoodText: { fontSize: fontSize.base, fontWeight: '600' },

  // Water
  waterValue: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  waterSub: { fontSize: fontSize.sm, marginBottom: spacing.sm },
  waterBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.md },
  waterBarFill: { height: '100%', borderRadius: 4 },
  waterBtns: { flexDirection: 'row', gap: spacing.sm },
  waterAddBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  waterAddText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Section label
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Meal section
  mealSection: { marginBottom: spacing.sm },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  mealTitle: { fontSize: fontSize.base, fontWeight: '600' },
  mealCal: { fontSize: fontSize.sm, fontWeight: '700' },

  // Food items
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
  foodName: { fontSize: fontSize.base },
  foodCal: { fontSize: fontSize.sm, fontWeight: '700' },

  // Add food
  addFoodBtn: {
    marginHorizontal: spacing.lg,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addFoodText: { fontSize: fontSize.sm },

  // Meal planner CTA
  mealPlannerBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  mealPlannerText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#0C0D10',
  },
});