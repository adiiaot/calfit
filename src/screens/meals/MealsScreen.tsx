import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── TYPES ─────────────────────────────────────────────────────
interface MealPlan {
  id: string;
  title: string;
  duration_days: number;
  calories_per_day: number;
  created_at: string;
  plan: DayPlan[];
}

interface DayPlan {
  day: number;
  meals: {
    type: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
  total_calories: number;
}

// ── CONVERSATION QUESTIONS ────────────────────────────────────
const questions = [
  {
    id: 'cooking',
    question: 'How do you usually get your meals?',
    options: ['I cook at home', 'I buy food mostly', 'Mix of both'],
  },
  {
    id: 'time',
    question: 'How much time can you spend cooking daily?',
    options: ['Under 30 mins', '30–60 mins', 'Over 1 hour', 'I prefer no cooking'],
  },
  {
    id: 'budget',
    question: "What's your daily food budget?",
    options: ['Under ₦2,000', '₦2,000–₦5,000', '₦5,000–₦10,000', 'Over ₦10,000'],
  },
  {
    id: 'dislikes',
    question: 'Any foods you strongly dislike or are allergic to?',
    options: ['None', 'Seafood', 'Dairy', 'Gluten', 'Red meat', 'Nuts'],
  },
  {
    id: 'cuisine',
    question: 'Preferred cuisine style?',
    options: ['Nigerian / African', 'Mixed (local + international)', 'International only', 'Whatever fits my goals'],
  },
];

// ── QUESTION CARD ─────────────────────────────────────────────
function QuestionCard({
  theme,
  question,
  options,
  onSelect,
  questionNum,
  total,
}: {
  theme: typeof colors.dark;
  question: string;
  options: string[];
  onSelect: (answer: string) => void;
  questionNum: number;
  total: number;
}) {
  return (
    <View style={styles.questionWrap}>
      <View style={styles.questionProgress}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.progressDot, {
              backgroundColor: i < questionNum ? theme.accent : theme.border,
            }]}
          />
        ))}
      </View>

      <Text style={[styles.questionLabel, { color: theme.textMuted }]}>
        Question {questionNum} of {total}
      </Text>

      <Text style={[styles.questionText, { color: theme.textPrimary }]}>
        {question}
      </Text>

      <View style={styles.optionsWrap}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            style={[styles.optionBtn, {
              backgroundColor: theme.card,
              borderColor: theme.border,
            }]}
          >
            <Text style={[styles.optionText, { color: theme.textPrimary }]}>
              {opt}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── GENERATING SCREEN ─────────────────────────────────────────
function GeneratingScreen({ theme }: { theme: typeof colors.dark }) {
  const steps = [
    'Analysing your goals and preferences...',
    'Calculating your calorie targets...',
    'Selecting foods that match your diet...',
    'Building your personalised meal plan...',
    'Adding Nigerian and local food options...',
    'Finalising your plan...',
  ];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.generatingWrap}>
      <View style={[styles.generatingIcon, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
      <Text style={[styles.generatingTitle, { color: theme.textPrimary }]}>
        Building Your Meal Plan
      </Text>
      <Text style={[styles.generatingStep, { color: theme.accent }]}>
        {steps[currentStep]}
      </Text>
      <Text style={[styles.generatingHint, { color: theme.textMuted }]}>
        CalFit Coach is crafting a plan personalised to your goals, diet, budget and lifestyle.
      </Text>
    </View>
  );
}

// ── MEAL PLAN CARD ────────────────────────────────────────────
function MealPlanCard({
  theme,
  plan,
  onView,
  onDelete,
}: {
  theme: typeof colors.dark;
  plan: MealPlan;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.planCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.planCardHeader}>
        <View style={[styles.planIcon, { backgroundColor: theme.accentDim as string }]}>
          <Ionicons name="restaurant" size={20} color={theme.accent} />
        </View>
        <View style={styles.planInfo}>
          <Text style={[styles.planTitle, { color: theme.textPrimary }]}>{plan.title}</Text>
          <Text style={[styles.planMeta, { color: theme.textMuted }]}>
            {plan.duration_days} days · {plan.calories_per_day} kcal/day
          </Text>
          <Text style={[styles.planDate, { color: theme.textMuted }]}>
            Created {new Date(plan.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert(
            'Delete Plan',
            'Are you sure you want to delete this meal plan?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ]
          )}
        >
          <Ionicons name="trash-outline" size={18} color={(theme as any).red} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onView}
        style={[styles.viewPlanBtn, { backgroundColor: theme.accent }]}
      >
        <Text style={[styles.viewPlanBtnText, { color: theme.bg }]}>View Plan →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── DAY PLAN VIEWER ───────────────────────────────────────────
function DayPlanViewer({
  theme,
  plan,
  onBack,
}: {
  theme: typeof colors.dark;
  plan: MealPlan;
  onBack: () => void;
}) {
  const [activeDay, setActiveDay] = useState(0);
  const dayPlan = plan.plan[activeDay];

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Plans</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          {plan.title}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelectorRow}
      >
        {plan.plan.map((d, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setActiveDay(i)}
            style={[styles.dayPill, {
              backgroundColor: activeDay === i ? theme.accent : theme.card,
              borderColor: activeDay === i ? theme.accent : theme.border,
            }]}
          >
            <Text style={[styles.dayPillText, {
              color: activeDay === i ? theme.bg : theme.textSecondary,
              fontWeight: activeDay === i ? '700' : '400',
            }]}>
              Day {d.day}
            </Text>
            <Text style={[styles.dayPillCal, {
              color: activeDay === i ? theme.bg : theme.accent,
              opacity: activeDay === i ? 0.8 : 1,
            }]}>
              {d.total_calories} kcal
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.dayViewContent}
      >
        {dayPlan?.meals.map((meal, i) => (
          <View key={i} style={[styles.dayMealCard, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <View style={styles.dayMealHeader}>
              <Text style={[styles.dayMealType, { color: theme.textSecondary }]}>
                {meal.type}
              </Text>
              <Text style={[styles.dayMealCal, { color: theme.accent }]}>
                {meal.calories} kcal
              </Text>
            </View>
            <Text style={[styles.dayMealName, { color: theme.textPrimary }]}>
              {meal.name}
            </Text>
            <View style={styles.dayMealMacros}>
              {[
                { label: 'P', value: meal.protein, color: theme.accent },
                { label: 'C', value: meal.carbs, color: theme.accentSecond },
                { label: 'F', value: meal.fats, color: (theme as any).purple },
              ].map((m) => (
                <View key={m.label} style={[styles.macroBadge, {
                  backgroundColor: m.color + '22',
                }]}>
                  <Text style={[styles.macroBadgeText, { color: m.color }]}>
                    {m.label}: {m.value}g
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </AndroidSafeView>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function MealsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [view, setView] = useState<'home' | 'questions' | 'generating' | 'viewPlan'>('home');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedPlans, setSavedPlans] = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [duration, setDuration] = useState(7);

  useEffect(() => {
    if (user?.id) loadSavedPlans();
  }, [user?.id]);

  const loadSavedPlans = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setSavedPlans(data);
    } catch (error) {
      console.error('Failed to load meal plans:', error);
    }
  };

  const handleAnswer = (answer: string) => {
    const question = questions[questionIndex];
    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      generateMealPlan(newAnswers);
    }
  };

  const generateMealPlan = async (finalAnswers: Record<string, string>) => {
    setView('generating');
    try {
      const goal = profile?.goal ?? 'Get Fit';
      const calories = profile?.daily_calorie_goal ?? 2000;
      const diet = profile?.dietary_preference?.join(', ') ?? 'No preference';
      const weight = profile?.current_weight_kg ?? 70;
      const targetWeight = profile?.target_weight_kg ?? 65;

      const prompt = `You are a professional nutritionist and meal planner. Create a detailed ${duration}-day meal plan for this person:

PROFILE:
- Goal: ${goal}
- Current weight: ${weight}kg, Target: ${targetWeight}kg
- Daily calorie target: ${calories} kcal
- Dietary preferences: ${diet}
- Activity level: ${profile?.activity_level ?? 'Moderately Active'}

THEIR ANSWERS:
- Meal source: ${finalAnswers.cooking}
- Cooking time available: ${finalAnswers.time}
- Daily food budget: ${finalAnswers.budget}
- Foods to avoid: ${finalAnswers.dislikes}
- Preferred cuisine: ${finalAnswers.cuisine}

Create a realistic, practical meal plan using common Nigerian and local foods where appropriate, with some international options.

IMPORTANT: Respond ONLY with valid JSON in this exact format, no other text:
{
  "title": "Short descriptive title for this plan",
  "calories_per_day": number,
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "type": "Breakfast",
          "name": "Food name and brief description",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fats": number
        }
      ],
      "total_calories": number
    }
  ]
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response from AI');

      const parsed = JSON.parse(jsonMatch[0]);

      const newPlan: MealPlan = {
        id: Date.now().toString(),
        title: parsed.title,
        duration_days: duration,
        calories_per_day: parsed.calories_per_day,
        created_at: new Date().toISOString(),
        plan: parsed.days.map((d: any) => ({
          day: d.day,
          meals: d.meals,
          total_calories: d.total_calories,
        })),
      };

      if (user?.id) {
        const { supabase } = await import('../../services/supabase');
        const { data: saved } = await supabase
          .from('meal_plans')
          .insert({
            user_id: user.id,
            title: newPlan.title,
            duration_days: newPlan.duration_days,
            calories_per_day: newPlan.calories_per_day,
            goal,
            preferences: finalAnswers,
            plan: newPlan.plan,
          })
          .select()
          .single();

        if (saved) newPlan.id = saved.id;
      }

      setSavedPlans((prev) => [newPlan, ...prev]);
      setSelectedPlan(newPlan);
      setView('viewPlan');

    } catch (error: any) {
      console.error('Meal plan generation failed:', error);
      Alert.alert(
        'Generation Failed',
        'Could not generate your meal plan. Please check your connection and try again.',
        [{ text: 'OK', onPress: () => setView('home') }]
      );
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const { supabase } = await import('../../services/supabase');
      await supabase.from('meal_plans').delete().eq('id', planId);
      setSavedPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  const startNewPlan = () => {
    setQuestionIndex(0);
    setAnswers({});
    setView('questions');
  };

  // ── VIEWS ─────────────────────────────────────────────────

  if (view === 'viewPlan' && selectedPlan) {
    return (
      <DayPlanViewer
        theme={theme}
        plan={selectedPlan}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'generating') {
    return (
      <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <GeneratingScreen theme={theme} />
      </AndroidSafeView>
    );
  }

  if (view === 'questions') {
    return (
      <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (questionIndex > 0) setQuestionIndex(questionIndex - 1);
              else setView('home');
            }}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
            <Text style={[styles.backText, { color: theme.textPrimary }]}>
              {questionIndex === 0 ? 'Back' : 'Previous'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
            Meal Planner
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {questionIndex === 0 && (
          <View style={styles.durationWrap}>
            <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>
              Plan Duration
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.durationRow}
            >
              {[1, 3, 7, 14, 30].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDuration(d)}
                  style={[styles.durationPill, {
                    backgroundColor: duration === d ? theme.accent : theme.card,
                    borderColor: duration === d ? theme.accent : theme.border,
                  }]}
                >
                  <Text style={[styles.durationPillText, {
                    color: duration === d ? theme.bg : theme.textSecondary,
                    fontWeight: duration === d ? '700' : '400',
                  }]}>
                    {d === 1 ? '1 Day' : d === 30 ? '1 Month' : `${d} Days`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.questionScrollContent}
        >
          <QuestionCard
            theme={theme}
            question={questions[questionIndex].question}
            options={questions[questionIndex].options}
            onSelect={handleAnswer}
            questionNum={questionIndex + 1}
            total={questions.length}
          />
        </ScrollView>
      </AndroidSafeView>
    );
  }

  // ── HOME VIEW ─────────────────────────────────────────────
  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* Header — IF button added here */}
      <View style={styles.homeHeader}>
        <View>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
            Meal Planner
          </Text>
          <Text style={[styles.pageSub, { color: theme.textSecondary }]}>
            AI-powered nutrition plans
          </Text>
        </View>

        {/* Intermittent Fasting shortcut */}
        <TouchableOpacity
          onPress={() => navigation.navigate('IntermittentFasting')}
          style={[styles.ifBtn, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}
        >
          <Ionicons name="timer-outline" size={16} color={theme.accent} />
          <Text style={[styles.ifBtnText, { color: theme.accent }]}>Fasting</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Generate new plan CTA */}
        <TouchableOpacity
          onPress={startNewPlan}
          style={[styles.generateCard, { backgroundColor: theme.accent }]}
        >
          <View>
            <Text style={[styles.generateCardTitle, { color: theme.bg }]}>
              ✨ Generate AI Meal Plan
            </Text>
            <Text style={[styles.generateCardSub, { color: theme.bg, opacity: 0.8 }]}>
              Answer 5 quick questions and CalFit Coach builds your personalised plan in seconds
            </Text>
          </View>
          <Ionicons
            name="arrow-forward-circle"
            size={36}
            color={theme.bg}
            style={{ opacity: 0.9 }}
          />
        </TouchableOpacity>

        {/* Intermittent Fasting banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('IntermittentFasting')}
          style={[styles.ifBanner, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}
        >
          <View style={[styles.ifBannerIcon, {
            backgroundColor: theme.accentDim as string,
          }]}>
            <Ionicons name="timer-outline" size={24} color={theme.accent} />
          </View>
          <View style={styles.ifBannerInfo}>
            <Text style={[styles.ifBannerTitle, { color: theme.textPrimary }]}>
              Intermittent Fasting
            </Text>
            <Text style={[styles.ifBannerSub, { color: theme.textMuted }]}>
              Track 16:8, 18:6, 20:4 and more. Start your fast timer.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </TouchableOpacity>

        {/* Profile summary */}
        <View style={[styles.profileSummary, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <Text style={[styles.profileSummaryTitle, { color: theme.textPrimary }]}>
            Your Plan Will Be Based On
          </Text>
          {[
            { icon: 'flag-outline',      label: 'Goal',     value: profile?.goal ?? 'Not set — complete onboarding' },
            { icon: 'flame-outline',     label: 'Calories', value: profile?.daily_calorie_goal ? `${profile.daily_calorie_goal} kcal` : '2,000 kcal (default)' },
            { icon: 'leaf-outline',      label: 'Diet',     value: profile?.dietary_preference?.join(', ') ?? 'No preference' },
            { icon: 'body-outline',      label: 'Activity', value: profile?.activity_level ?? 'Moderately Active' },
          ].map((item) => (
            <View key={item.label} style={styles.profileSummaryRow}>
              <Ionicons name={item.icon as any} size={16} color={theme.accent} />
              <Text style={[styles.profileSummaryLabel, { color: theme.textSecondary }]}>
                {item.label}:
              </Text>
              <Text style={[styles.profileSummaryValue, { color: theme.textPrimary }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Saved plans */}
        {savedPlans.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Saved Plans ({savedPlans.length})
            </Text>
            {savedPlans.map((plan) => (
              <MealPlanCard
                key={plan.id}
                theme={theme}
                plan={plan}
                onView={() => {
                  setSelectedPlan(plan);
                  setView('viewPlan');
                }}
                onDelete={() => handleDeletePlan(plan.id)}
              />
            ))}
          </>
        )}

        {savedPlans.length === 0 && (
          <View style={[styles.emptyState, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <Ionicons name="restaurant-outline" size={44} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              No plans yet
            </Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Tap Generate above and CalFit Coach will build your first personalised meal plan in seconds.
            </Text>
          </View>
        )}
      </ScrollView>
    </AndroidSafeView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Home header — row layout with IF button
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },
  pageSub: { fontSize: fontSize.base, marginTop: 2 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },

  // Intermittent Fasting button in header
  ifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  ifBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  // Intermittent Fasting banner card in feed
  ifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  ifBannerIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ifBannerInfo: { flex: 1 },
  ifBannerTitle: { fontSize: fontSize.base, fontWeight: '700' },
  ifBannerSub: { fontSize: fontSize.sm, marginTop: 2, lineHeight: 18 },

  // Generate card
  generateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  generateCardTitle: { fontSize: fontSize.xl, fontWeight: '800', marginBottom: 6 },
  generateCardSub: { fontSize: fontSize.sm, lineHeight: 18, maxWidth: 260 },

  // Profile summary
  profileSummary: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  profileSummaryTitle: { fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.xs },
  profileSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  profileSummaryLabel: { fontSize: fontSize.sm, width: 80 },
  profileSummaryValue: { fontSize: fontSize.sm, flex: 1, fontWeight: '500' },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },

  // Plan cards
  planCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  planCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  planIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  planInfo: { flex: 1 },
  planTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  planMeta: { fontSize: fontSize.sm, marginTop: 2 },
  planDate: { fontSize: fontSize.xs, marginTop: 2 },
  viewPlanBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  viewPlanBtnText: { fontSize: fontSize.base, fontWeight: '700' },

  emptyState: {
    marginHorizontal: spacing.lg,
    padding: spacing.xxl,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  emptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },

  questionScrollContent: { paddingBottom: 100 },
  questionWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  questionProgress: { flexDirection: 'row', gap: spacing.xs },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  questionLabel: { fontSize: fontSize.sm, fontWeight: '600' },
  questionText: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
  optionsWrap: { gap: spacing.sm },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  optionText: { fontSize: fontSize.lg, fontWeight: '500', flex: 1 },

  durationWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  durationLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  durationRow: { gap: spacing.sm },
  durationPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  durationPillText: { fontSize: fontSize.sm },

  generatingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  generatingIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  generatingTitle: { fontSize: fontSize.xxl, fontWeight: '800', textAlign: 'center' },
  generatingStep: { fontSize: fontSize.base, fontWeight: '600', textAlign: 'center' },
  generatingHint: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },

  daySelectorRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dayPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  dayPillText: { fontSize: fontSize.sm },
  dayPillCal: { fontSize: fontSize.xs, marginTop: 2 },
  dayViewContent: { paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.sm },
  dayMealCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  dayMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayMealType: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayMealCal: { fontSize: fontSize.sm, fontWeight: '700' },
  dayMealName: { fontSize: fontSize.lg, fontWeight: '600' },
  dayMealMacros: { flexDirection: 'row', gap: spacing.xs },
  macroBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  macroBadgeText: { fontSize: fontSize.xs, fontWeight: '600' },
});