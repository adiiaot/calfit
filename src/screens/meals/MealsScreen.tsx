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
import { claudeJSON, hasClaudeKey } from '../../services/ClaudeService';
import { VoiceMicButton } from '../../components/VoicemicButton';

// ── TYPES ─────────────────────────────────────────────────────
interface MealPlan {
  id: string; title: string; duration_days: number;
  calories_per_day: number; created_at: string; plan: DayPlan[];
}
interface DayPlan {
  day: number;
  meals: { type: string; name: string; calories: number; protein: number; carbs: number; fats: number }[];
  total_calories: number;
}

// ── QUESTIONS ─────────────────────────────────────────────────
const questions = [
  { id: 'cooking',  question: 'How do you usually get your meals?',         options: ['I cook at home', 'I buy food mostly', 'Mix of both'] },
  { id: 'time',     question: 'How much time can you spend cooking daily?', options: ['Under 30 mins', '30–60 mins', 'Over 1 hour', 'No cooking'] },
  { id: 'budget',   question: "What's your daily food budget?",             options: ['Under ₦2,000', '₦2,000–₦5,000', '₦5,000–₦10,000', 'Over ₦10,000'] },
  { id: 'dislikes', question: 'Any foods you dislike or are allergic to?',  options: ['None', 'Seafood', 'Dairy', 'Gluten', 'Red meat', 'Nuts'] },
  { id: 'cuisine',  question: 'Preferred cuisine style?',                   options: ['Nigerian / African', 'Mixed (local + international)', 'International only', 'Whatever fits my goals'] },
];

// ── TYPE ANSWER MODAL ─────────────────────────────────────────
function TypeAnswerModal({ visible, theme, question, onConfirm, onClose }: {
  visible: boolean; theme: typeof colors.dark; question: string;
  onConfirm: (a: string) => void; onClose: () => void;
}) {
  const [text, setText] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ta.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={[ta.sheet, { backgroundColor: theme.card }]}>
          <Text style={[ta.q, { color: theme.textPrimary }]}>{question}</Text>
          <TextInput value={text} onChangeText={setText} placeholder="Type your answer..."
            placeholderTextColor={theme.textMuted} autoFocus multiline
            style={[ta.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bg }]} />
          <View style={ta.row}>
            <TouchableOpacity onPress={onClose} style={[ta.cancelBtn, { borderColor: theme.border }]}>
              <Text style={[ta.cancelText, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (text.trim()) { onConfirm(text.trim()); setText(''); } }}
              disabled={!text.trim()} style={[ta.confirmBtn, { backgroundColor: text.trim() ? theme.accent : theme.border }]}>
              <Text style={[ta.confirmText, { color: text.trim() ? theme.bg : theme.textMuted }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const ta = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, gap: spacing.md },
  q:           { fontSize: fontSize.base, fontWeight: '700' },
  input:       { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontSize: fontSize.base, minHeight: 80 },
  row:         { flexDirection: 'row', gap: spacing.sm },
  cancelBtn:   { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, alignItems: 'center' },
  cancelText:  { fontSize: fontSize.base, fontWeight: '600' },
  confirmBtn:  { flex: 2, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  confirmText: { fontSize: fontSize.base, fontWeight: '700' },
});

// ── QUESTION CARD ─────────────────────────────────────────────
function QuestionCard({ theme, question, options, onSelect, questionNum, total, onTypeAnswer }: {
  theme: typeof colors.dark; question: string; options: string[];
  onSelect: (a: string) => void; questionNum: number; total: number; onTypeAnswer: () => void;
}) {
  return (
    <View style={styles.questionWrap}>
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
        {options.map(opt => (
          <TouchableOpacity key={opt} onPress={() => onSelect(opt)} activeOpacity={0.8}
            style={[styles.optionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.optionText, { color: theme.textPrimary }]}>{opt}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
      {/* Type or voice */}
      <View style={styles.typeVoiceRow}>
        <TouchableOpacity onPress={onTypeAnswer} activeOpacity={0.8}
          style={[styles.typeManualBtn, { borderColor: theme.border, flex: 1 }]}>
          <Ionicons name="create-outline" size={16} color={theme.textMuted} />
          <Text style={[styles.typeManualText, { color: theme.textMuted }]}>Type answer</Text>
        </TouchableOpacity>
        <VoiceMicButton theme={theme} size={42} onTranscribed={(text) => onSelect(text)} />
      </View>
    </View>
  );
}

// ── GENERATING SCREEN ─────────────────────────────────────────
function GeneratingScreen({ theme }: { theme: typeof colors.dark }) {
  const steps = [
    'Analysing your goals...', 'Calculating calorie targets...',
    'Selecting local foods...', 'Building your meal plan...',
    'Adding Nigerian options...', 'Finalising...',
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(p => Math.min(p + 1, steps.length - 1)), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={[styles.generatingWrap, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={[theme.heroCard ?? '#1A1445', '#2A1F6B'] as [string, string]} style={styles.generatingCard}>
        <View style={styles.generatingSpinner}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
        <Text style={[styles.generatingTitle, { color: '#fff' }]}>Building Your Meal Plan</Text>
        <Text style={[styles.generatingStep, { color: theme.accent }]}>{steps[step]}</Text>
        <Text style={styles.generatingHint}>CalFit Coach is crafting a personalised plan for your goals, diet, budget and lifestyle.</Text>
        <View style={styles.generatingChecks}>
          {steps.slice(0, step + 1).map((s, i) => (
            <View key={i} style={styles.generatingCheckRow}>
              <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
              <Text style={[styles.generatingCheckText, { color: 'rgba(255,255,255,0.7)' }]}>{s}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

// ── PLAN VIEW ─────────────────────────────────────────────────
function PlanView({ theme, plan, onEdit, onPerfect }: {
  theme: typeof colors.dark; plan: MealPlan; onEdit: () => void; onPerfect: () => void;
}) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.planScrollContent}>
      <LinearGradient colors={[theme.heroCard ?? '#1A1445', '#2A1F6B'] as [string, string]}
        style={[styles.planHero, { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: 20, padding: spacing.lg }]}>
        <Text style={styles.planHeroTitle}>{plan.title}</Text>
        <View style={styles.planHeroStats}>
          <View style={styles.planHeroStat}>
            <Text style={styles.planHeroStatVal}>{plan.calories_per_day}</Text>
            <Text style={styles.planHeroStatLabel}>kcal/day</Text>
          </View>
          <View style={styles.planHeroStat}>
            <Text style={styles.planHeroStatVal}>{plan.duration_days}</Text>
            <Text style={styles.planHeroStatLabel}>{plan.duration_days === 1 ? 'day' : 'days'}</Text>
          </View>
        </View>
        {/* Edit / Perfect */}
        <View style={styles.editPerfectRow}>
          <TouchableOpacity onPress={onEdit} style={[styles.editBtn, { borderColor: 'rgba(255,255,255,0.25)' }]}>
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editBtnText}>Edit Result</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onPerfect} style={styles.perfectBtnWrap}>
            <LinearGradient colors={[theme.accent, '#0A9A5E'] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.perfectBtn}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.perfectBtnText}>Perfect ✓</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {plan.plan.map((day) => (
        <TouchableOpacity key={day.day} onPress={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
          activeOpacity={0.8} style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.dayHeader, { borderBottomColor: theme.border, borderBottomWidth: expandedDay === day.day ? 1 : 0 }]}>
            <Text style={[styles.dayTitle, { color: theme.textPrimary }]}>Day {day.day}</Text>
            <Text style={[styles.dayTotal, { color: theme.accent }]}>{day.total_calories} kcal</Text>
            <Ionicons name={expandedDay === day.day ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
          </View>
          {expandedDay === day.day && day.meals.map((meal, i) => (
            <View key={i} style={[styles.mealRow, { borderBottomColor: theme.border, borderBottomWidth: i < day.meals.length - 1 ? 1 : 0 }]}>
              <View style={[styles.mealTypeTag, { backgroundColor: theme.accent + '22' }]}>
                <Text style={[styles.mealTypeText, { color: theme.accent }]}>{meal.type}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mealName, { color: theme.textPrimary }]}>{meal.name}</Text>
                <Text style={[styles.mealMacros, { color: theme.textMuted }]}>
                  P {meal.protein}g · C {meal.carbs}g · F {meal.fats}g
                </Text>
              </View>
              <Text style={[styles.mealCal, { color: theme.textSecondary }]}>{meal.calories} kcal</Text>
            </View>
          ))}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function MealsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const goal         = (profile as any)?.goal ?? 'general fitness';
  const calorieGoal  = (profile as any)?.daily_calorie_goal ?? 2000;
  const dietaryPref  = (profile as any)?.dietary_preference?.join(', ') ?? 'no preference';
  const activityLevel = (profile as any)?.activity_level ?? 'Moderately Active';

  const DURATIONS = [1, 3, 7, 14, 30];

  const [view, setView]               = useState<'home' | 'questions' | 'generating' | 'viewPlan'>('home');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [duration, setDuration]       = useState(7);
  const [savedPlans, setSavedPlans]   = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);

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
    setView('generating');
    await generatePlan(newAnswers);
  };

  const generatePlan = async (finalAnswers: Record<string, string>) => {
    try {
      if (!hasClaudeKey()) {
        Alert.alert('AI not connected', 'Add your Anthropic API key to generate meal plans.');
        setView('home'); return;
      }

      const systemPrompt = 'You are a nutrition expert. Create personalised meal plans using Nigerian and local foods where appropriate. Always respond with valid JSON only. No markdown.';

      const prompt = `Create a ${duration}-day meal plan:
Goal: ${goal}, Calories: ${calorieGoal} kcal/day, Diet: ${dietaryPref}, Activity: ${activityLevel}
Meal source: ${finalAnswers.cooking}, Time: ${finalAnswers.time}, Budget: ${finalAnswers.budget}
Avoid: ${finalAnswers.dislikes}, Cuisine: ${finalAnswers.cuisine}

JSON format:
{"title":"Short title","calories_per_day":number,"days":[{"day":1,"meals":[{"type":"Breakfast","name":"Food name","calories":number,"protein":number,"carbs":number,"fats":number}],"total_calories":number}]}`;

      const parsed = await claudeJSON<any>(systemPrompt, prompt, 3000);
      if (!parsed) throw new Error('Could not generate plan');

      const newPlan: MealPlan = {
        id: Date.now().toString(), title: parsed.title,
        duration_days: duration, calories_per_day: parsed.calories_per_day,
        created_at: new Date().toISOString(), plan: parsed.days,
      };

      if (user?.id) {
        const { supabase } = await import('../../services/supabase');
        const { data: saved } = await supabase.from('meal_plans').insert({
          user_id: user.id, title: newPlan.title, duration_days: newPlan.duration_days,
          calories_per_day: newPlan.calories_per_day, goal, preferences: finalAnswers, plan: newPlan.plan,
        }).select().single();
        if (saved) newPlan.id = saved.id;
      }

      setSavedPlans(prev => [newPlan, ...prev]);
      setSelectedPlan(newPlan);
      setView('viewPlan');
    } catch {
      Alert.alert('Generation Failed', 'Could not generate your meal plan. Please try again.');
      setView('home');
    }
  };

  // ── HOME VIEW ─────────────────────────────────────────────
  if (view === 'home') {
    return (
      <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <View style={styles.homeHeader}>
          <View>
            <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Meal Planner</Text>
            <Text style={[styles.pageSub, { color: theme.textMuted }]}>AI-powered nutrition planning</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('IntermittentFasting' as never)}
            style={[styles.ifBtn, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
            <Ionicons name="time-outline" size={16} color={theme.accent} />
            <Text style={[styles.ifBtnText, { color: theme.accent }]}>Fasting</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Generate CTA */}
          <View style={[styles.generateWrap, { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: 20, overflow: 'hidden' }]}>
            <TouchableOpacity onPress={startNewPlan} activeOpacity={0.85}>
              <LinearGradient colors={[theme.heroCard ?? '#1A1445', '#2A1F6B'] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.generateCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.generateTitle}>Generate My Meal Plan</Text>
                  <Text style={styles.generateSub}>Answer 5 quick questions and get a personalised plan with Nigerian and local food options</Text>
                </View>
                <View style={[styles.generateArrow, { backgroundColor: theme.accent }]}>
                  <Ionicons name="sparkles" size={22} color={theme.bg} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* IF shortcut */}
          <View style={[styles.ifCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.navigate('IntermittentFasting' as never)} activeOpacity={0.8}>
              <LinearGradient colors={['#B280FF22', '#6699FF22'] as [string, string]} style={styles.ifCardGrad}>
                <View style={[styles.ifCardIcon, { backgroundColor: '#B280FF22' }]}>
                  <Ionicons name="timer-outline" size={22} color="#B280FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ifCardTitle, { color: theme.textPrimary }]}>Intermittent Fasting</Text>
                  <Text style={[styles.ifCardSub, { color: theme.textMuted }]}>Set up and track your fasting schedule</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Saved plans */}
          {savedPlans.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Saved Plans</Text>
              {savedPlans.map(plan => (
                <TouchableOpacity key={plan.id} onPress={() => { setSelectedPlan(plan); setView('viewPlan'); }}
                  activeOpacity={0.8} style={[styles.planCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <LinearGradient colors={[(theme.heroCard ?? '#1A1445') + 'CC', (theme.heroCard ?? '#1A1445') + '66'] as [string, string]}
                    style={styles.planCardTop}>
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

          {savedPlans.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="restaurant-outline" size={40} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No plans yet</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Generate your first AI meal plan — answer 5 questions and get a plan built around your goals and budget</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </AndroidSafeView>
    );
  }

  // ── QUESTIONS VIEW ────────────────────────────────────────
  if (view === 'questions') {
    return (
      <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <View style={styles.questionsHeader}>
          <TouchableOpacity onPress={() => { if (questionIndex > 0) setQuestionIndex(q => q - 1); else setView('home'); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.questionsHeaderTitle, { color: theme.textPrimary }]}>Build Your Plan</Text>
          <View style={{ width: 26 }} />
        </View>

        {questionIndex === 0 && (
          <View style={styles.durationRow}>
            <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>Plan duration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationPills}>
              {DURATIONS.map(d => (
                <TouchableOpacity key={d} onPress={() => setDuration(d)}
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
    return <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}><GeneratingScreen theme={theme} /></AndroidSafeView>;
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
          theme={theme} plan={selectedPlan}
          onEdit={() => startNewPlan()}
          onPerfect={() => Alert.alert('Plan Saved! ✅', 'Your meal plan is saved and ready to follow.')}
        />
      </AndroidSafeView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  pageTitle: { fontSize: fontSize.xxl ?? 26, fontWeight: '800' },
  pageSub: { fontSize: fontSize.xs, marginTop: 2 },
  ifBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99, borderWidth: 1 },
  ifBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  scrollContent: { paddingBottom: 100 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  generateWrap: {},
  generateCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  generateTitle: { fontSize: fontSize.lg, fontWeight: '800', color: '#fff', marginBottom: 4 },
  generateSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.65)', lineHeight: 18 },
  generateArrow: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ifCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  ifCardGrad: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  ifCardIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ifCardTitle: { fontSize: fontSize.base, fontWeight: '700' },
  ifCardSub: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 16 },
  planCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  planCardTop: { padding: spacing.md, flexDirection: 'row', alignItems: 'center' },
  planCardTitle: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  planCardDate: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  planCardStats: { alignItems: 'flex-end' },
  planCardCal: { fontSize: fontSize.sm, fontWeight: '700', color: '#FFB830' },
  planCardDur: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)' },
  planCardBottom: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  planCardViewText: { fontSize: fontSize.sm, fontWeight: '600' },
  emptyCard: { marginHorizontal: spacing.lg, padding: spacing.xl, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  emptySub: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  questionsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  questionsHeaderTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  durationRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  durationLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.sm },
  durationPills: { gap: spacing.sm, paddingRight: spacing.lg },
  durationPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99, borderWidth: 1 },
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
  typeVoiceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  typeManualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
  typeManualText: { fontSize: fontSize.sm, fontWeight: '600' },
  generatingWrap: { flex: 1, padding: spacing.lg },
  generatingCard: { flex: 1, borderRadius: 20, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  generatingSpinner: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  generatingTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  generatingStep: { fontSize: fontSize.base, fontWeight: '600', textAlign: 'center' },
  generatingHint: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20 },
  generatingChecks: { width: '100%', gap: spacing.sm, marginTop: spacing.md },
  generatingCheckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  generatingCheckText: { fontSize: fontSize.sm },
  planScrollContent: { paddingBottom: 100 },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  planHeaderTitle: { fontSize: fontSize.lg, fontWeight: '700', flex: 1, textAlign: 'center' },
  planHeroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: spacing.md },
  planHeroStats: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  planHeroStat: {},
  planHeroStatVal: { fontSize: fontSize.xl ?? 20, fontWeight: '800', color: '#fff' },
  planHeroStatLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  editPerfectRow: { flexDirection: 'row', gap: spacing.sm },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  editBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: '#fff' },
  perfectBtnWrap: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  perfectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md },
  perfectBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: '#fff' },
  dayCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  dayTitle: { fontSize: fontSize.base, fontWeight: '700', flex: 1 },
  dayTotal: { fontSize: fontSize.sm, fontWeight: '700', marginRight: spacing.sm },
  mealRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md },
  mealTypeTag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  mealTypeText: { fontSize: fontSize.xs, fontWeight: '700' },
  mealName: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  mealMacros: { fontSize: fontSize.xs, marginTop: 2 },
  mealCal: { fontSize: fontSize.xs, fontWeight: '600' },
  planHero: {},
});