import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  meals: { type: string; name: string; calories: number; protein: number; carbs: number; fats: number }[];
  total_calories: number;
}

// ── QUESTIONS ─────────────────────────────────────────────────
const questions = [
  { id: 'cooking',  question: 'How do you usually get your meals?',          options: ['I cook at home', 'I buy food mostly', 'Mix of both'] },
  { id: 'time',     question: 'How much time can you spend cooking daily?',  options: ['Under 30 mins', '30–60 mins', 'Over 1 hour', 'No cooking'] },
  { id: 'budget',   question: "What's your daily food budget?",              options: ['Under ₦2,000', '₦2,000–₦5,000', '₦5,000–₦10,000', 'Over ₦10,000'] },
  { id: 'dislikes', question: 'Any foods you dislike or are allergic to?',   options: ['None', 'Seafood', 'Dairy', 'Gluten', 'Red meat', 'Nuts'] },
  { id: 'cuisine',  question: 'Preferred cuisine style?',                    options: ['Nigerian / African', 'Mixed (local + international)', 'International only', 'Whatever fits my goals'] },
];

// ── QUESTION CARD ─────────────────────────────────────────────
function QuestionCard({ theme, question, options, onSelect, questionNum, total, onTypeAnswer }: {
  theme: typeof colors.light; question: string; options: string[];
  onSelect: (a: string) => void; questionNum: number; total: number;
  onTypeAnswer: () => void;
}) {
  return (
    <View style={styles.questionWrap}>
      {/* Progress dots */}
      <View style={styles.questionProgress}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.progressDot, {
            backgroundColor: i < questionNum ? theme.accent : theme.border,
            width: i === questionNum - 1 ? 20 : 6,
          }]} />
        ))}
      </View>
      <Text style={[styles.questionLabel, { color: theme.textMuted }]}>Question {questionNum} of {total}</Text>
      <Text style={[styles.questionText, { color: theme.textPrimary }]}>{question}</Text>

      <View style={styles.optionsWrap}>
        {options.map((opt) => (
          <TouchableOpacity key={opt} onPress={() => onSelect(opt)} activeOpacity={0.8}
            style={[styles.optionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.optionText, { color: theme.textPrimary }]}>{opt}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Type manually option */}
      <TouchableOpacity onPress={onTypeAnswer} activeOpacity={0.8}
        style={[styles.typeManualBtn, { borderColor: theme.border }]}>
        <Ionicons name="create-outline" size={16} color={theme.textMuted} />
        <Text style={[styles.typeManualText, { color: theme.textMuted }]}>Type a custom answer</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── GENERATING SCREEN ─────────────────────────────────────────
function GeneratingScreen({ theme }: { theme: typeof colors.light }) {
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
    const interval = setInterval(() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1)), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.generatingWrap, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.generatingCard}>
        <View style={styles.generatingSpinner}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
        <Text style={styles.generatingTitle}>Building Your Meal Plan</Text>
        <Text style={[styles.generatingStep, { color: theme.accent }]}>{steps[currentStep]}</Text>
        <Text style={styles.generatingHint}>CalFit Coach is crafting a plan personalised to your goals, diet, budget and lifestyle.</Text>
        <View style={styles.generatingChecks}>
          {steps.slice(0, currentStep + 1).map((s, i) => (
            <View key={i} style={styles.generatingCheckRow}>
              <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
              <Text style={[styles.generatingCheckText, { color: 'rgba(255,255,255,0.70)' }]}>{s}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

// ── PLAN VIEW ─────────────────────────────────────────────────
function PlanView({ theme, plan, onEdit, onPerfect, onDelete }: {
  theme: typeof colors.light; plan: MealPlan;
  onEdit: () => void; onPerfect: () => void; onDelete: () => void;
}) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const MEAL_COLORS: Record<string, string> = {
    Breakfast: '#FF6B35', Lunch: '#FFB830', Dinner: '#4A90E2', Snack: '#2BBCB0', Snacks: '#2BBCB0',
  };

  return (
    <ScrollView contentContainerStyle={styles.planScrollContent}>
      {/* Plan hero */}
      <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.planHero}>
        <Text style={styles.planHeroTitle}>{plan.title}</Text>
        <View style={styles.planHeroStats}>
          {[
            { label: 'Duration', value: `${plan.duration_days} ${plan.duration_days === 1 ? 'day' : 'days'}` },
            { label: 'Per day',  value: `${plan.calories_per_day} kcal` },
          ].map((s) => (
            <View key={s.label} style={styles.planHeroStat}>
              <Text style={styles.planHeroStatVal}>{s.value}</Text>
              <Text style={styles.planHeroStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Edit / Perfect buttons — from corrections doc */}
        <View style={styles.editPerfectRow}>
          <TouchableOpacity onPress={onEdit} activeOpacity={0.8}
            style={[styles.editBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.20)' }]}>
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editBtnText}>Edit Result</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onPerfect} activeOpacity={0.85} style={styles.perfectBtnWrap}>
            <LinearGradient colors={[theme.gradStart, theme.gradMid] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.perfectBtn}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.perfectBtnText}>Perfect ✓</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Day list */}
      {plan.plan.map((day) => (
        <View key={day.day} style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity onPress={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
            style={styles.dayHeader} activeOpacity={0.8}>
            <View style={[styles.dayNumBadge, { backgroundColor: theme.accentDim as string }]}>
              <Text style={[styles.dayNum, { color: theme.accent }]}>Day {day.day}</Text>
            </View>
            <Text style={[styles.dayTotal, { color: theme.textPrimary }]}>{day.total_calories} kcal</Text>
            <Ionicons name={expandedDay === day.day ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {expandedDay === day.day && (
            <View style={styles.mealsWrap}>
              {day.meals.map((meal, i) => {
                const color = MEAL_COLORS[meal.type] ?? theme.accent;
                return (
                  <View key={i} style={[styles.mealRow, { borderColor: theme.border }]}>
                    <View style={[styles.mealTypePill, { backgroundColor: color + '20' }]}>
                      <Text style={[styles.mealTypeText, { color }]}>{meal.type}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mealName, { color: theme.textPrimary }]}>{meal.name}</Text>
                      <View style={styles.mealMacros}>
                        {[
                          { label: 'P', val: meal.protein, color: '#FF6B35' },
                          { label: 'C', val: meal.carbs,   color: '#FFB830' },
                          { label: 'F', val: meal.fats,    color: '#4A90E2' },
                        ].map((m) => (
                          <Text key={m.label} style={[styles.mealMacro, { color: m.color }]}>{m.label}:{m.val}g</Text>
                        ))}
                      </View>
                    </View>
                    <Text style={[styles.mealCal, { color: theme.accent }]}>{meal.calories} kcal</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity onPress={onDelete} activeOpacity={0.8}
        style={[styles.deletePlanBtn, { borderColor: theme.red }]}>
        <Ionicons name="trash-outline" size={16} color={theme.red} />
        <Text style={[styles.deletePlanText, { color: theme.red }]}>Delete Plan</Text>
      </TouchableOpacity>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

// ── TYPE ANSWER MODAL ─────────────────────────────────────────
function TypeAnswerModal({ visible, theme, question, onConfirm, onClose }: {
  visible: boolean; theme: typeof colors.light; question: string;
  onConfirm: (answer: string) => void; onClose: () => void;
}) {
  const [text, setText] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Your answer</Text>
          <Text style={[styles.modalSub, { color: theme.textSecondary }]}>{question}</Text>
          <TextInput value={text} onChangeText={setText} placeholder="Type your answer..."
            placeholderTextColor={theme.textMuted} autoFocus multiline
            style={[styles.modalInput, { color: theme.textPrimary, borderColor: text ? theme.accent : theme.border, backgroundColor: theme.bg }]} />
          <View style={styles.modalBtnRow}>
            <TouchableOpacity onPress={onClose} style={[styles.modalCancelBtn, { borderColor: theme.border }]}>
              <Text style={[{ color: theme.textMuted, fontWeight: '600', fontSize: fontSize.base }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (text.trim()) { onConfirm(text.trim()); setText(''); } }} disabled={!text.trim()} activeOpacity={0.85} style={styles.modalConfirmWrap}>
              <LinearGradient colors={[theme.accent, '#0A9A5E'] as [string, string]} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>Submit →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function MealsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  type View = 'home' | 'questions' | 'generating' | 'viewPlan';
  const [view, setView]               = useState<View>('home');
  const [savedPlans, setSavedPlans]   = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [duration, setDuration]       = useState(7);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<MealPlan | null>(null);

  const goal = (profile as any)?.goal ?? 'general fitness';
  const calorieGoal = (profile as any)?.daily_calorie_goal ?? 2000;
  const dietaryPref = (profile as any)?.dietary_preference?.join(', ') ?? 'no preference';
  const activityLevel = (profile as any)?.activity_level ?? 'Moderately Active';

  useEffect(() => { loadPlans(); }, [user?.id]);

  const loadPlans = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase.from('meal_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setSavedPlans(data.map((p: any) => ({ ...p, plan: p.plan ?? [] })));
    } catch {}
  };

  const startNewPlan = () => { setQuestionIndex(0); setAnswers({}); setView('questions'); };

  const handleAnswer = async (answer: string) => {
    const newAnswers = { ...answers, [questions[questionIndex].id]: answer };
    setAnswers(newAnswers);
    if (questionIndex < questions.length - 1) { setQuestionIndex(questionIndex + 1); return; }
    // All answered — generate
    setView('generating');
    await generatePlan(newAnswers);
  };

  const generatePlan = async (finalAnswers: Record<string, string>) => {
    try {
      const prompt = `Create a ${duration}-day meal plan for someone with these details:
Goal: ${goal}
Calorie target: ${calorieGoal} kcal/day
Dietary preference: ${dietaryPref}
Activity level: ${activityLevel}
Meal source: ${finalAnswers.cooking}
Cooking time: ${finalAnswers.time}
Daily budget: ${finalAnswers.budget}
Foods to avoid: ${finalAnswers.dislikes}
Cuisine preference: ${finalAnswers.cuisine}

Use common Nigerian and local foods where appropriate.
Respond ONLY with valid JSON:
{
  "title": "Short plan title",
  "calories_per_day": number,
  "days": [
    {
      "day": 1,
      "meals": [{"type": "Breakfast", "name": "Food description", "calories": number, "protein": number, "carbs": number, "fats": number}],
      "total_calories": number
    }
  ]
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid AI response');
      const parsed = JSON.parse(jsonMatch[0]);

      const newPlan: MealPlan = {
        id: Date.now().toString(),
        title: parsed.title,
        duration_days: duration,
        calories_per_day: parsed.calories_per_day,
        created_at: new Date().toISOString(),
        plan: parsed.days,
      };

      // Save to Supabase
      if (user?.id) {
        const { supabase } = await import('../../services/supabase');
        const { data: saved } = await supabase.from('meal_plans').insert({
          user_id: user.id, title: newPlan.title, duration_days: newPlan.duration_days,
          calories_per_day: newPlan.calories_per_day, goal, preferences: finalAnswers, plan: newPlan.plan,
        }).select().single();
        if (saved) newPlan.id = saved.id;
      }

      // Show Edit/Perfect screen instead of going straight to viewPlan
      setPendingPlan(newPlan);
      setSavedPlans((prev) => [newPlan, ...prev]);
      setSelectedPlan(newPlan);
      setView('viewPlan'); // PlanView shows Edit/Perfect buttons at top
    } catch (error: any) {
      Alert.alert('Generation Failed', 'Could not generate your meal plan. Please try again.', [{ text: 'OK', onPress: () => setView('home') }]);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    Alert.alert('Delete Plan', `Remove "${selectedPlan.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const { supabase } = await import('../../services/supabase');
          await supabase.from('meal_plans').delete().eq('id', selectedPlan.id);
          setSavedPlans((prev) => prev.filter((p) => p.id !== selectedPlan.id));
          setView('home');
        } catch {}
      }},
    ]);
  };

  // ── QUESTIONS VIEW ────────────────────────────────────────
  if (view === 'questions') {
    return (
      <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <View style={styles.questionsHeader}>
          <TouchableOpacity onPress={() => setView('home')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.questionsHeaderTitle, { color: theme.textPrimary }]}>Meal Plan Setup</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Duration selector shown first */}
        {questionIndex === 0 && (
          <View style={styles.durationRow}>
            <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>Plan duration:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationPills}>
              {[1, 3, 7, 14, 30].map((d) => (
                <TouchableOpacity key={d} onPress={() => setDuration(d)} activeOpacity={0.8}
                  style={[styles.durationPill, { backgroundColor: duration === d ? theme.accent : theme.card, borderColor: duration === d ? theme.accent : theme.border }]}>
                  <Text style={[styles.durationPillText, { color: duration === d ? '#fff' : theme.textSecondary, fontWeight: duration === d ? '700' : '400' }]}>
                    {d === 1 ? '1 Day' : d === 30 ? '1 Month' : `${d} Days`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.questionScrollContent}>
          <QuestionCard
            theme={theme}
            question={questions[questionIndex].question}
            options={questions[questionIndex].options}
            onSelect={handleAnswer}
            questionNum={questionIndex + 1}
            total={questions.length}
            onTypeAnswer={() => setShowTypeModal(true)}
          />
        </ScrollView>

        <TypeAnswerModal
          visible={showTypeModal} theme={theme}
          question={questions[questionIndex].question}
          onConfirm={(answer) => { setShowTypeModal(false); handleAnswer(answer); }}
          onClose={() => setShowTypeModal(false)}
        />
      </AndroidSafeView>
    );
  }

  // ── GENERATING VIEW ───────────────────────────────────────
  if (view === 'generating') {
    return (
      <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <GeneratingScreen theme={theme} />
      </AndroidSafeView>
    );
  }

  // ── PLAN VIEW ─────────────────────────────────────────────
  if (view === 'viewPlan' && selectedPlan) {
    return (
      <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <View style={styles.planHeader}>
          <TouchableOpacity onPress={() => setView('home')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.planHeaderTitle, { color: theme.textPrimary }]} numberOfLines={1}>{selectedPlan.title}</Text>
          <View style={{ width: 26 }} />
        </View>
        <PlanView
          theme={theme}
          plan={selectedPlan}
          onEdit={() => startNewPlan()} // regenerate with new questions
          onPerfect={() => Alert.alert('Plan Saved! ✅', 'Your meal plan is saved and ready to follow.')}
          onDelete={handleDeletePlan}
        />
      </AndroidSafeView>
    );
  }

  // ── HOME VIEW ─────────────────────────────────────────────
  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      <View style={styles.homeHeader}>
        <View>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Meal Planner</Text>
          <Text style={[styles.pageSub, { color: theme.textSecondary }]}>AI-powered nutrition plans</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('IntermittentFasting')} activeOpacity={0.85}
          style={[styles.ifBtn, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
          <Ionicons name="timer-outline" size={16} color={theme.accent} />
          <Text style={[styles.ifBtnText, { color: theme.accent }]}>Fasting</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Generate CTA */}
        <TouchableOpacity onPress={startNewPlan} activeOpacity={0.85} style={styles.generateWrap}>
          <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.generateCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.generateTitle}>✨ Generate AI Meal Plan</Text>
              <Text style={styles.generateSub}>Answer 5 questions — CalFit builds a personalised plan for you</Text>
            </View>
            <View style={[styles.generateArrow, { backgroundColor: theme.accent }]}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* IF shortcut card */}
        <TouchableOpacity onPress={() => navigation.navigate('IntermittentFasting')} activeOpacity={0.85}
          style={[styles.ifCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <LinearGradient colors={[theme.accent + '22', '#2BBCB0' + '22'] as [string, string]} style={styles.ifCardGrad}>
            <View style={[styles.ifCardIcon, { backgroundColor: theme.accent + '22' }]}>
              <Ionicons name="timer" size={24} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ifCardTitle, { color: theme.textPrimary }]}>Intermittent Fasting</Text>
              <Text style={[styles.ifCardSub, { color: theme.textSecondary }]}>16:8, 18:6, 20:4, 5:2 — track your fasting windows</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Saved plans */}
        {savedPlans.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Saved Plans</Text>
            {savedPlans.map((plan) => (
              <TouchableOpacity key={plan.id} onPress={() => { setSelectedPlan(plan); setView('viewPlan'); }} activeOpacity={0.8}
                style={[styles.planCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <LinearGradient colors={[theme.heroCard + 'CC', theme.heroCard + '66'] as [string, string]} style={styles.planCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planCardTitle} numberOfLines={1}>{plan.title}</Text>
                    <Text style={styles.planCardDate}>{new Date(plan.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                  <View style={styles.planCardStats}>
                    <Text style={styles.planCardCal}>{plan.calories_per_day} kcal/day</Text>
                    <Text style={styles.planCardDur}>{plan.duration_days} {plan.duration_days === 1 ? 'day' : 'days'}</Text>
                  </View>
                </LinearGradient>
                <View style={[styles.planCardBottom, { backgroundColor: theme.card }]}>
                  <Text style={[styles.planCardViewText, { color: theme.accent }]}>View plan →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Empty state */}
        {savedPlans.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="restaurant-outline" size={40} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No plans yet</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Generate your first AI meal plan above — answers 5 questions and builds a plan around your goals and budget</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },
  pageSub: { fontSize: fontSize.xs, marginTop: 2 },
  ifBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1 },
  ifBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  scrollContent: { paddingBottom: 100 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },

  // Generate CTA
  generateWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: 20, overflow: 'hidden' },
  generateCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  generateTitle: { fontSize: fontSize.lg, fontWeight: '800', color: '#fff', marginBottom: 4 },
  generateSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.65)', lineHeight: 18 },
  generateArrow: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // IF card
  ifCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  ifCardGrad: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  ifCardIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ifCardTitle: { fontSize: fontSize.base, fontWeight: '700' },
  ifCardSub: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 16 },

  // Plan cards
  planCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  planCardTop: { padding: spacing.md, flexDirection: 'row', alignItems: 'center' },
  planCardTitle: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  planCardDate: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  planCardStats: { alignItems: 'flex-end' },
  planCardCal: { fontSize: fontSize.sm, fontWeight: '700', color: '#FFB830' },
  planCardDur: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)' },
  planCardBottom: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  planCardViewText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Empty
  emptyCard: { marginHorizontal: spacing.lg, padding: spacing.xl, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  emptySub: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },

  // Questions view
  questionsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  questionsHeaderTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  durationRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  durationLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.sm },
  durationPills: { gap: spacing.sm, paddingRight: spacing.lg },
  durationPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1 },
  durationPillText: { fontSize: fontSize.sm },
  questionScrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 60 },

  questionWrap: { paddingTop: spacing.md },
  questionProgress: { flexDirection: 'row', gap: 4, marginBottom: spacing.sm },
  progressDot: { height: 6, borderRadius: 3 },
  questionLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.sm },
  questionText: { fontSize: 24, fontWeight: '800', lineHeight: 30, marginBottom: spacing.xl },
  optionsWrap: { gap: spacing.sm },
  optionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderRadius: 16, borderWidth: 1 },
  optionText: { fontSize: fontSize.base, fontWeight: '600', flex: 1 },
  typeManualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
  typeManualText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Generating
  generatingWrap: { flex: 1, padding: spacing.lg },
  generatingCard: { flex: 1, borderRadius: 20, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  generatingSpinner: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  generatingTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  generatingStep: { fontSize: fontSize.base, fontWeight: '600', textAlign: 'center' },
  generatingHint: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20 },
  generatingChecks: { width: '100%', gap: spacing.sm, marginTop: spacing.md },
  generatingCheckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  generatingCheckText: { fontSize: fontSize.sm },

  // Plan view
  planScrollContent: { paddingBottom: 100 },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  planHeaderTitle: { fontSize: fontSize.lg, fontWeight: '700', flex: 1, textAlign: 'center' },
  planHero: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderRadius: 20 },
  planHeroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: spacing.md },
  planHeroStats: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  planHeroStat: {},
  planHeroStatVal: { fontSize: fontSize.xl, fontWeight: '800', color: '#fff' },
  planHeroStatLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  editPerfectRow: { flexDirection: 'row', gap: spacing.sm },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  editBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: '#fff' },
  perfectBtnWrap: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  perfectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md },
  perfectBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: '#fff' },

  dayCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  dayNumBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 99 },
  dayNum: { fontSize: fontSize.sm, fontWeight: '700' },
  dayTotal: { flex: 1, fontSize: fontSize.base, fontWeight: '700' },
  mealsWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 0.5 },
  mealTypePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexShrink: 0 },
  mealTypeText: { fontSize: 10, fontWeight: '700' },
  mealName: { fontSize: fontSize.sm, fontWeight: '600' },
  mealMacros: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  mealMacro: { fontSize: 10, fontWeight: '600' },
  mealCal: { fontSize: fontSize.sm, fontWeight: '700', flexShrink: 0 },
  deletePlanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, margin: spacing.lg, padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  deletePlanText: { fontSize: fontSize.base, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, gap: spacing.md, paddingBottom: 40 },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800' },
  modalSub: { fontSize: fontSize.base, lineHeight: 20 },
  modalInput: { borderWidth: 1.5, borderRadius: 12, padding: spacing.md, fontSize: fontSize.base, minHeight: 80, textAlignVertical: 'top' },
  modalBtnRow: { flexDirection: 'row', gap: spacing.md },
  modalCancelBtn: { flex: 1, padding: spacing.md, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  modalConfirmWrap: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  modalConfirmBtn: { padding: spacing.md, alignItems: 'center' },
  modalConfirmText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
});