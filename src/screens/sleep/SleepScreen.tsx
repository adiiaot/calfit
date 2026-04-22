import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Modal,
  ActivityIndicator, Alert,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { supabase } from '../../services/supabase';

interface SleepLog {
  id: string;
  date: string;
  hours: number;
  quality: number; // 1-5
  notes: string;
  logged_at: string;
}

const QUALITY_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
const QUALITY_COLORS = (theme: any) => ['', theme.red, theme.orange, theme.gold, theme.accent, theme.accent];
const HOUR_OPTIONS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const SLEEP_GOAL_HRS = 8;

// ── LOG SLEEP MODAL ───────────────────────────────────────────
function LogSleepModal({
  theme,
  visible,
  onClose,
  onSave,
}: {
  theme: typeof colors.dark;
  visible: boolean;
  onClose: () => void;
  onSave: (hours: number, quality: number, notes: string) => Promise<void>;
}) {
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(hours, quality, notes);
    setSaving(false);
    setNotes('');
    setQuality(3);
    onClose();
  };

  const qualColors = QUALITY_COLORS(theme);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Log Sleep</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Hours */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Hours slept last night
            </Text>
            <View style={[styles.hoursDisplay, { backgroundColor: theme.bg, borderColor: theme.accent }]}>
              <Text style={[styles.hoursValue, { color: theme.accent }]}>{hours}</Text>
              <Text style={[styles.hoursUnit, { color: theme.textMuted }]}>hrs</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourPills}>
              {HOUR_OPTIONS.map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() => setHours(h)}
                  style={[styles.hourPill, {
                    backgroundColor: hours === h ? theme.accent : theme.bg,
                    borderColor: hours === h ? theme.accent : theme.border,
                  }]}
                >
                  <Text style={[styles.hourPillText, {
                    color: hours === h ? theme.bg : theme.textSecondary,
                  }]}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Quality */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Sleep quality</Text>
            <View style={styles.qualityRow}>
              {[1, 2, 3, 4, 5].map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => setQuality(q)}
                  style={[styles.qualityBtn, {
                    backgroundColor: quality === q ? qualColors[q] + '22' : theme.bg,
                    borderColor: quality === q ? qualColors[q] : theme.border,
                  }]}
                >
                  <Text style={[styles.qualityNum, { color: quality === q ? qualColors[q] : theme.textMuted }]}>
                    {q}
                  </Text>
                  <Text style={[styles.qualityLabel, { color: quality === q ? qualColors[q] : theme.textMuted }]}>
                    {QUALITY_LABELS[q]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notes (optional)</Text>
            <View style={[styles.notesInput, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="How did you feel? Any disturbances?"
                placeholderTextColor={theme.textMuted}
                style={[styles.notesInputText, { color: theme.textPrimary }]}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: theme.accent }]}
            >
              {saving
                ? <ActivityIndicator color={theme.bg} />
                : <Text style={[styles.saveBtnText, { color: theme.bg }]}>Save Sleep Log</Text>
              }
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── CONSISTENCY SCORE ─────────────────────────────────────────
function ConsistencyScore({
  theme,
  logs,
}: {
  theme: typeof colors.dark;
  logs: SleepLog[];
}) {
  const last7 = logs.slice(0, 7);
  const daysLogged = last7.length;
  const avgHours = daysLogged > 0
    ? last7.reduce((s, l) => s + l.hours, 0) / daysLogged
    : 0;
  const avgQuality = daysLogged > 0
    ? last7.reduce((s, l) => s + l.quality, 0) / daysLogged
    : 0;
  const goalDays = last7.filter((l) => l.hours >= SLEEP_GOAL_HRS).length;
  const score = Math.round((goalDays / 7) * 100);

  return (
    <View style={[styles.scoreCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.scoreCardTitle, { color: theme.textSecondary }]}>
        7-Day Sleep Consistency
      </Text>
      <View style={styles.scoreRow}>
        <View style={styles.scoreMain}>
          <Text style={[styles.scoreValue, { color: theme.accent }]}>{score}%</Text>
          <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>consistency score</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreStats}>
          <View style={styles.scoreStat}>
            <Text style={[styles.scoreStatValue, { color: theme.textPrimary }]}>
              {avgHours > 0 ? avgHours.toFixed(1) : '—'}h
            </Text>
            <Text style={[styles.scoreStatLabel, { color: theme.textMuted }]}>avg/night</Text>
          </View>
          <View style={styles.scoreStat}>
            <Text style={[styles.scoreStatValue, { color: theme.textPrimary }]}>
              {avgQuality > 0 ? avgQuality.toFixed(1) : '—'}
            </Text>
            <Text style={[styles.scoreStatLabel, { color: theme.textMuted }]}>avg quality</Text>
          </View>
          <View style={styles.scoreStat}>
            <Text style={[styles.scoreStatValue, { color: theme.textPrimary }]}>
              {goalDays}/7
            </Text>
            <Text style={[styles.scoreStatLabel, { color: theme.textMuted }]}>goal met</Text>
          </View>
        </View>
      </View>

      {/* 7-day bar chart */}
      <View style={styles.barRow}>
        {Array.from({ length: 7 }).map((_, i) => {
          const log = last7[6 - i]; // oldest to newest left to right
          const pct = log ? Math.min(log.hours / SLEEP_GOAL_HRS, 1) : 0;
          const isGoal = log && log.hours >= SLEEP_GOAL_HRS;
          return (
            <View key={i} style={styles.barWrap}>
              <View style={[styles.barBg, { backgroundColor: theme.border }]}>
                <View style={[styles.barFill, {
                  height: `${pct * 100}%` as any,
                  backgroundColor: isGoal ? theme.accent : (theme as any).orange,
                }]} />
              </View>
              <Text style={[styles.barLabel, { color: theme.textMuted }]}>
                {log ? `${log.hours}h` : '—'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── SLEEP LOG ITEM ────────────────────────────────────────────
function SleepLogItem({
  log,
  theme,
  onDelete,
}: {
  log: SleepLog;
  theme: typeof colors.dark;
  onDelete: () => void;
}) {
  const qualColors = QUALITY_COLORS(theme);
  const qualColor = qualColors[log.quality] ?? theme.textMuted;
  const isGoal = log.hours >= SLEEP_GOAL_HRS;

  const dateLabel = (() => {
    const d = new Date(log.date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  })();

  return (
    <View style={[styles.logItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.logIconWrap, {
        backgroundColor: isGoal ? theme.accent + '22' : (theme as any).orange + '22',
      }]}>
        <Ionicons name="moon" size={20} color={isGoal ? theme.accent : (theme as any).orange} />
      </View>
      <View style={styles.logInfo}>
        <View style={styles.logTopRow}>
          <Text style={[styles.logDate, { color: theme.textPrimary }]}>{dateLabel}</Text>
          <Text style={[styles.logHours, { color: isGoal ? theme.accent : (theme as any).orange }]}>
            {log.hours}h
          </Text>
        </View>
        <View style={styles.logBottomRow}>
          <View style={[styles.qualityBadge, { backgroundColor: qualColor + '22' }]}>
            <Text style={[styles.qualityBadgeText, { color: qualColor }]}>
              {QUALITY_LABELS[log.quality]}
            </Text>
          </View>
          {log.notes ? (
            <Text style={[styles.logNotes, { color: theme.textMuted }]} numberOfLines={1}>
              {log.notes}
            </Text>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function SleepScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user } = useAuthStore();
  const theme = colors[colorScheme];

  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadLogs();
    }, [user?.id])
  );

  const loadLogs = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    if (!error && data) setLogs(data as SleepLog[]);
    setIsLoading(false);
  };

  const handleSave = async (hours: number, quality: number, notes: string) => {
    if (!user?.id) return;

    const today = new Date().toISOString().split('T')[0];

    // Check if already logged today — update instead of insert
    const existing = logs.find((l) => l.date === today);

    if (existing) {
      const { error } = await supabase
        .from('sleep_logs')
        .update({ hours, quality, notes })
        .eq('id', existing.id);

      if (!error) {
        setLogs((prev) => prev.map((l) =>
          l.id === existing.id ? { ...l, hours, quality, notes } : l
        ));
      }
    } else {
      const { data, error } = await supabase
        .from('sleep_logs')
        .insert({ user_id: user.id, date: today, hours, quality, notes })
        .select()
        .single();

      if (!error && data) {
        setLogs((prev) => [data as SleepLog, ...prev]);

        // Send in-app notification
        try {
          const { sendNotification } = await import('../../services/notificationService');
          await sendNotification(
            user.id, 'goal',
            `Sleep logged — ${hours} hours 🌙`,
            hours >= SLEEP_GOAL_HRS
              ? 'Great job hitting your sleep goal!'
              : 'Keep working towards your 8-hour goal.',
            'View Progress'
          );
        } catch (_) {}
      }
    }
  };

  const handleDelete = (logId: string) => {
    Alert.alert('Delete log?', 'This will remove this sleep entry.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('sleep_logs').delete().eq('id', logId);
          setLogs((prev) => prev.filter((l) => l.id !== logId));
        },
      },
    ]);
  };

  const todayLog = logs.find((l) => l.date === new Date().toISOString().split('T')[0]);

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Sleep Tracker</Text>
        <TouchableOpacity
          onPress={() => setShowLogModal(true)}
          style={[styles.logBtn, { backgroundColor: theme.accent }]}
        >
          <Ionicons name="add" size={18} color={theme.bg} />
          <Text style={[styles.logBtnText, { color: theme.bg }]}>Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Today's sleep card */}
        <View style={[styles.todayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.todayTop}>
            <View>
              <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>Last night</Text>
              <Text style={[styles.todayHours, {
                color: todayLog && todayLog.hours >= SLEEP_GOAL_HRS ? theme.accent : (theme as any).orange,
              }]}>
                {todayLog ? `${todayLog.hours}h` : '—'}
              </Text>
              <Text style={[styles.todayGoal, { color: theme.textMuted }]}>
                Goal: {SLEEP_GOAL_HRS}h
              </Text>
            </View>
            <View style={styles.moonWrap}>
              <Text style={styles.moonEmoji}>🌙</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.sleepBarBg, { backgroundColor: theme.border }]}>
            <View style={[styles.sleepBarFill, {
              backgroundColor: todayLog && todayLog.hours >= SLEEP_GOAL_HRS
                ? theme.accent : (theme as any).orange,
              width: `${Math.min((todayLog?.hours ?? 0) / SLEEP_GOAL_HRS * 100, 100)}%` as any,
            }]} />
          </View>

          {todayLog ? (
            <View style={styles.todayQualityRow}>
              <View style={[styles.qualityBadge, {
                backgroundColor: QUALITY_COLORS(theme)[todayLog.quality] + '22',
              }]}>
                <Text style={[styles.qualityBadgeText, {
                  color: QUALITY_COLORS(theme)[todayLog.quality],
                }]}>
                  {QUALITY_LABELS[todayLog.quality]} quality
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLogModal(true)}>
                <Text style={[styles.editText, { color: theme.accent }]}>Edit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowLogModal(true)}
              style={[styles.logNowBtn, { borderColor: theme.accent }]}
            >
              <Ionicons name="add-circle-outline" size={16} color={theme.accent} />
              <Text style={[styles.logNowText, { color: theme.accent }]}>Log last night's sleep</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Consistency score */}
        {logs.length > 0 && <ConsistencyScore theme={theme} logs={logs} />}

        {/* Sleep tips */}
        <View style={[styles.tipsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.tipsTitle, { color: theme.textPrimary }]}>💡 Sleep Tips</Text>
          {[
            'Aim for 7–9 hours every night for optimal recovery',
            'Keep a consistent bedtime — even on weekends',
            'Avoid screens 30 minutes before bed',
            'Keep your room cool and dark for deeper sleep',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* History */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>History</Text>
        {isLoading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.xl }} />
        ) : logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="moon-outline" size={40} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No sleep logged yet</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Tap Log to record last night's sleep and start tracking your consistency.
            </Text>
          </View>
        ) : (
          logs.map((log) => (
            <SleepLogItem
              key={log.id}
              log={log}
              theme={theme}
              onDelete={() => handleDelete(log.id)}
            />
          ))
        )}
      </ScrollView>

      <LogSleepModal
        theme={theme}
        visible={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSave={handleSave}
      />
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: fontSize.lg, fontWeight: '700' },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  logBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  // Today card
  todayCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1,
  },
  todayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  todayLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: 4 },
  todayHours: { fontSize: 48, fontWeight: '800', lineHeight: 52 },
  todayGoal: { fontSize: fontSize.xs, marginTop: 2 },
  moonWrap: { alignItems: 'center', justifyContent: 'center' },
  moonEmoji: { fontSize: 48, opacity: 0.6 },
  sleepBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.sm },
  sleepBarFill: { height: '100%', borderRadius: 4 },
  todayQualityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editText: { fontSize: fontSize.sm, fontWeight: '600' },
  logNowBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderStyle: 'dashed',
  },
  logNowText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Score card
  scoreCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1,
  },
  scoreCardTitle: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  scoreMain: { alignItems: 'center', flex: 1 },
  scoreValue: { fontSize: 40, fontWeight: '800' },
  scoreLabel: { fontSize: fontSize.xs, marginTop: 2 },
  scoreDivider: { width: 1, height: 60, backgroundColor: '#ffffff22', marginHorizontal: spacing.lg },
  scoreStats: { flex: 2, gap: spacing.sm },
  scoreStat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreStatValue: { fontSize: fontSize.base, fontWeight: '700' },
  scoreStatLabel: { fontSize: fontSize.xs },
  barRow: { flexDirection: 'row', gap: spacing.xs, height: 60, alignItems: 'flex-end' },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  barBg: { flex: 1, width: '100%', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 8, textAlign: 'center' },

  // Tips
  tipsCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1,
    gap: spacing.sm,
  },
  tipsTitle: { fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.xs },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  tipText: { fontSize: fontSize.sm, lineHeight: 20, flex: 1 },

  sectionLabel: {
    fontSize: fontSize.sm, fontWeight: '600',
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Log items
  logItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1,
  },
  logIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logInfo: { flex: 1 },
  logTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logDate: { fontSize: fontSize.base, fontWeight: '600' },
  logHours: { fontSize: fontSize.base, fontWeight: '800' },
  logBottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  logNotes: { fontSize: fontSize.xs, flex: 1 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  emptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 22 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    maxHeight: '90%', padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
  hoursDisplay: {
    flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs,
    padding: spacing.md, borderRadius: radius.md, borderWidth: 2, marginBottom: spacing.sm,
  },
  hoursValue: { fontSize: 36, fontWeight: '800' },
  hoursUnit: { fontSize: fontSize.lg },
  hourPills: { marginBottom: spacing.md },
  hourPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, marginRight: spacing.xs,
  },
  hourPillText: { fontSize: fontSize.sm, fontWeight: '600' },
  qualityRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  qualityBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1,
  },
  qualityNum: { fontSize: fontSize.lg, fontWeight: '800' },
  qualityLabel: { fontSize: 9, marginTop: 2 },
  notesInput: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.lg },
  notesInputText: { fontSize: fontSize.base, lineHeight: 22, minHeight: 60 },
  saveBtn: { padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.lg, fontWeight: '700' },

  qualityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.xs },
  qualityBadgeText: { fontSize: fontSize.xs, fontWeight: '700' },
});