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

// ── INNER TAB BAR ────────────────────────────────────────────
function InnerTabs({
  tabs,
  active,
  onPress,
  theme,
}: {
  tabs: string[];
  active: string;
  onPress: (tab: string) => void;
  theme: typeof colors.dark;
}) {
  return (
    <View style={[styles.innerTabBar, { borderBottomColor: theme.border }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onPress(tab)}
          style={[
            styles.innerTab,
            active === tab && { borderBottomColor: theme.accent },
          ]}
        >
          <Text style={[
            styles.innerTabText,
            { color: active === tab ? theme.textPrimary : theme.textMuted },
            active === tab && { fontWeight: '700' },
          ]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── TODAY TAB ────────────────────────────────────────────────
function TodayTab({ theme }: { theme: typeof colors.dark }) {
  const exercises = [
    { name: 'Bench Press', sets: '4 × 8 reps', weight: '80 kg', done: true },
    { name: 'Incline DB Press', sets: '3 × 10 reps', weight: '30 kg', done: true },
    { name: 'Cable Fly', sets: '3 × 12 reps', weight: '15 kg', done: false },
    { name: 'Tricep Pushdown', sets: '3 × 15 reps', weight: '25 kg', done: false },
    { name: 'Overhead Press', sets: '4 × 8 reps', weight: '50 kg', done: false },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
      {/* Active workout banner */}
      <View style={[styles.activeBanner, { backgroundColor: theme.accent }]}>
        <View>
          <Text style={styles.bannerTitle}>Upper Body – Push Day</Text>
          <Text style={styles.bannerSub}>In progress · 38:22</Text>
        </View>
        <TouchableOpacity style={styles.resumeBtn}>
          <Text style={styles.resumeText}>Resume →</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Today's Exercises
      </Text>

      {exercises.map((ex) => (
        <View key={ex.name} style={[
          styles.exerciseRow,
          {
            backgroundColor: ex.done
              ? (theme === colors.dark ? 'rgba(45,220,140,0.08)' : 'rgba(13,174,108,0.08)')
              : theme.card,
            borderColor: ex.done ? theme.accent : theme.border,
          }
        ]}>
          <View style={styles.exInfo}>
            <Text style={[styles.exName, {
              color: ex.done ? theme.accent : theme.textPrimary,
            }]}>
              {ex.name}
            </Text>
            <Text style={[styles.exSets, { color: theme.textSecondary }]}>
              {ex.sets} · {ex.weight}
            </Text>
          </View>
          {ex.done ? (
            <Text style={[styles.exCheck, { color: theme.accent }]}>✓</Text>
          ) : (
            <View style={[styles.exCheckBox, { borderColor: theme.border }]} />
          )}
        </View>
      ))}

      <TouchableOpacity style={[styles.addExBtn, { borderColor: theme.border }]}>
        <Text style={[styles.addExText, { color: theme.textMuted }]}>
          + Add Exercise
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.completeBtn, { backgroundColor: theme.accent }]}>
        <Text style={styles.completeBtnText}>Complete Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── CALORIES TAB ─────────────────────────────────────────────
function CaloriesTab({ theme }: { theme: typeof colors.dark }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const values = [0.6, 0.8, 0.45, 0.9, 0.7, 1.0, 0.2];
  const today = 5;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
          Calories Burned Today
        </Text>
        <Text style={[styles.bigStat, { color: theme.accent }]}>320 kcal</Text>
        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
          <View style={[styles.progressBarFill, {
            backgroundColor: theme.accent, width: '64%',
          }]} />
        </View>
        <Text style={[styles.progressSub, { color: theme.textMuted }]}>
          64% of 500 kcal daily burn goal
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        This Week
      </Text>

      <View style={[styles.barChartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.barChart}>
          {days.map((day, i) => (
            <View key={`${day}-${i}`} style={styles.barWrap}>
              <View style={styles.barInner}>
                <View style={[styles.bar, {
                  height: `${values[i] * 100}%` as any,
                  backgroundColor: i === today ? theme.accent : theme.border,
                  opacity: i === today ? 1 : 0.6,
                }]} />
              </View>
              <Text style={[styles.barLabel, { color: theme.textMuted }]}>{day}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ── STEPS TAB ────────────────────────────────────────────────
function StepsTab({ theme }: { theme: typeof colors.dark }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const values = [0.75, 1.0, 0.55, 0.9, 0.65, 0.68, 0.1];
  const today = 5;

  const timeline = [
    { time: '6–9 AM', steps: 843, pct: 0.4 },
    { time: '9–12 PM', steps: 2390, pct: 0.85 },
    { time: '12–3 PM', steps: 3000, pct: 1.0 },
    { time: '3–6 PM', steps: 1000, pct: 0.35 },
    { time: '6–9 PM', steps: 609, pct: 0.22 },
  ];

  const badges = [
    { name: 'FirstMile', icon: '👟', earned: true },
    { name: 'Speed Walker', icon: '⚡', earned: true },
    { name: 'Marathon', icon: '🏅', earned: false },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
      {/* Steps hero card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
          Steps Today
        </Text>
        <View style={styles.stepsHeroRow}>
          <Text style={[styles.bigStat, { color: theme.accent }]}>6,842</Text>
          <Text style={[styles.stepsGoal, { color: theme.textSecondary }]}> / 10,000</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
          <View style={[styles.progressBarFill, {
            backgroundColor: theme.accent, width: '68%',
          }]} />
        </View>
        <View style={styles.stepsMetaRow}>
          <Text style={[styles.progressSub, { color: theme.textMuted }]}>
            274 cal · 42 min active
          </Text>
          <Text style={[styles.stepsChange, { color: theme.accent }]}>
            +12% vs last week
          </Text>
        </View>
      </View>

      {/* Weekly bar chart */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        This Week
      </Text>
      <View style={[styles.barChartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.barChart}>
          {days.map((day, i) => (
            <View key={`${day}-${i}`} style={styles.barWrap}>
              <View style={styles.barInner}>
                <View style={[styles.bar, {
                  height: `${values[i] * 100}%` as any,
                  backgroundColor: i === today ? theme.accent : theme.border,
                  opacity: i === today ? 1 : 0.7,
                }]} />
              </View>
              <Text style={[
                styles.barLabel,
                { color: i === today ? theme.accent : theme.textMuted },
                i === today && { fontWeight: '700' },
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.weeklyAvg, { color: theme.textMuted }]}>
          Weekly avg: 9,088 steps/day
        </Text>
      </View>

      {/* Activity timeline */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Activity Timeline
      </Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {timeline.map((t) => (
          <View key={t.time} style={styles.timelineRow}>
            <Text style={[styles.timelineTime, { color: theme.textMuted }]}>
              {t.time}
            </Text>
            <View style={[styles.timelineBarBg, { backgroundColor: theme.border }]}>
              <View style={[styles.timelineBarFill, {
                backgroundColor: theme.accent,
                width: `${t.pct * 100}%` as any,
              }]} />
            </View>
            <Text style={[styles.timelineSteps, { color: theme.textPrimary }]}>
              {t.steps.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Step badges */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Step Badges
      </Text>
      <View style={styles.badgeRow}>
        {badges.map((b) => (
          <View key={b.name} style={[
            styles.badge,
            {
              backgroundColor: theme.card,
              borderColor: b.earned ? theme.accent : theme.border,
              opacity: b.earned ? 1 : 0.5,
            }
          ]}>
            <Text style={styles.badgeIcon}>{b.icon}</Text>
            <Text style={[styles.badgeName, {
              color: b.earned ? theme.accent : theme.textMuted,
            }]}>
              {b.name}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── HISTORY TAB ──────────────────────────────────────────────
function HistoryTab({ theme }: { theme: typeof colors.dark }) {
  const history = [
    { name: 'Upper Body – Push', date: 'Apr 6', exercises: 5, duration: '38 min', cal: '320 kcal' },
    { name: 'Leg Day', date: 'Apr 5', exercises: 6, duration: '55 min', cal: '410 kcal' },
    { name: 'Cardio Run', date: 'Apr 4', exercises: 1, duration: '28 min', cal: '280 kcal' },
    { name: 'Pull Day', date: 'Apr 3', exercises: 5, duration: '45 min', cal: '350 kcal' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
      {history.map((h) => (
        <View key={h.name + h.date} style={[styles.historyRow, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={styles.historyInfo}>
            <Text style={[styles.historyName, { color: theme.textPrimary }]}>
              {h.name}
            </Text>
            <Text style={[styles.historySub, { color: theme.textMuted }]}>
              {h.exercises} exercises · {h.duration} · {h.cal}
            </Text>
          </View>
          <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
            {h.date}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function WorkoutScreen() {
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const [activeTab, setActiveTab] = useState('Today');
  const tabs = ['Today', 'Calories', 'Steps', 'History'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Workout</Text>
      </View>
      <InnerTabs tabs={tabs} active={activeTab} onPress={setActiveTab} theme={theme} />
      {activeTab === 'Today' && <TodayTab theme={theme} />}
      {activeTab === 'Calories' && <CaloriesTab theme={theme} />}
      {activeTab === 'Steps' && <StepsTab theme={theme} />}
      {activeTab === 'History' && <HistoryTab theme={theme} />}
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },

  // Inner tabs
  innerTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  innerTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  innerTabText: { fontSize: fontSize.base, color: 'gray' },

  // Tab content
  tabContent: { paddingBottom: spacing.massive },

  // Cards
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
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
  bigStat: { fontSize: 28, fontWeight: '800', marginBottom: spacing.sm },
  progressBarBg: { height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressSub: { fontSize: fontSize.xs },

  // Section label
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Active banner
  activeBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: '#0C0D10' },
  bannerSub: { fontSize: fontSize.sm, color: 'rgba(0,0,0,0.6)', marginTop: 4 },
  resumeBtn: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  resumeText: { fontSize: fontSize.sm, fontWeight: '700', color: '#0C0D10' },

  // Exercise rows
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  exInfo: { flex: 1 },
  exName: { fontSize: fontSize.lg, fontWeight: '600' },
  exSets: { fontSize: fontSize.sm, marginTop: 2 },
  exCheck: { fontSize: 20, fontWeight: '700' },
  exCheckBox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
  },

  // Add exercise
  addExBtn: {
    marginHorizontal: spacing.lg,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addExText: { fontSize: fontSize.base },

  // Complete button
  completeBtn: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completeBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: '#0C0D10' },

  // Bar chart
  barChartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
    gap: spacing.xs,
  },
  barWrap: {
    flex: 1, alignItems: 'center',
    gap: 4, height: '100%',
    justifyContent: 'flex-end',
  },
  barInner: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9, fontWeight: '500' },
  weeklyAvg: {
    fontSize: fontSize.xs,
    textAlign: 'right',
    marginTop: spacing.sm,
  },

  // Steps
  stepsHeroRow: { flexDirection: 'row', alignItems: 'baseline' },
  stepsGoal: { fontSize: fontSize.lg },
  stepsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stepsChange: { fontSize: fontSize.xs, fontWeight: '600' },

  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timelineTime: { fontSize: fontSize.xs, width: 52 },
  timelineBarBg: {
    flex: 1, height: 20, borderRadius: 4, overflow: 'hidden',
  },
  timelineBarFill: { height: '100%', borderRadius: 4 },
  timelineSteps: { fontSize: fontSize.xs, width: 40, textAlign: 'right' },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  badge: {
    flex: 1, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1,
    alignItems: 'center',
  },
  badgeIcon: { fontSize: 26, marginBottom: spacing.xs },
  badgeName: { fontSize: fontSize.xs, fontWeight: '600', textAlign: 'center' },

  // History
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  historyInfo: { flex: 1 },
  historyName: { fontSize: fontSize.base, fontWeight: '700' },
  historySub: { fontSize: fontSize.xs, marginTop: 2 },
  historyDate: { fontSize: fontSize.sm },
});