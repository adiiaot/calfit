import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── FASTING PROTOCOLS ─────────────────────────────────────────
type Protocol = {
  id: string;
  label: string;
  fastHours: number;
  eatingHours: number;
  description: string;
  popular?: boolean;
};

const PROTOCOLS: Protocol[] = [
  {
    id: '16:8',
    label: '16:8',
    fastHours: 16,
    eatingHours: 8,
    description: 'Fast 16hrs, eat within 8hrs. Most popular.',
    popular: true,
  },
  {
    id: '18:6',
    label: '18:6',
    fastHours: 18,
    eatingHours: 6,
    description: 'Fast 18hrs, eat within 6hrs. Intermediate.',
  },
  {
    id: '20:4',
    label: '20:4',
    fastHours: 20,
    eatingHours: 4,
    description: 'Fast 20hrs, eat within 4hrs. Advanced.',
  },
  {
    id: '24',
    label: '24hr',
    fastHours: 24,
    eatingHours: 0,
    description: 'Full 24-hour fast. For experienced fasters.',
  },
  {
    id: '5:2',
    label: '5:2',
    fastHours: 36,
    eatingHours: 12,
    description: 'Eat normally 5 days, restrict 2 days.',
  },
];

// ── FASTING LOG TYPE ──────────────────────────────────────────
type FastingLog = {
  id: string;
  protocol: string;
  fast_hours: number;
  eating_hours: number;
  started_at: string;
  ended_at: string | null;
  target_end_at: string;
  completed: boolean;
};

// ── FORMAT DURATION ───────────────────────────────────────────
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ── PROGRESS RING ─────────────────────────────────────────────
function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  bgColor,
  children,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  bgColor: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: bgColor,
      }} />
      <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: 'transparent',
        borderTopColor: progress > 0 ? color : 'transparent',
        borderRightColor: progress > 0.25 ? color : 'transparent',
        borderBottomColor: progress > 0.5 ? color : 'transparent',
        borderLeftColor: progress > 0.75 ? color : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      {children}
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function IntermittentFastingScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user } = useAuthStore();
  const theme = colors[colorScheme];

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>(PROTOCOLS[0]);
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<FastingLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadData();
    }, [user?.id])
  );

  useEffect(() => {
    if (activeFast) {
      timerRef.current = setInterval(() => {
        const start = new Date(activeFast.started_at).getTime();
        setElapsed(Date.now() - start);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeFast]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');

      const { data: activeFastData } = await supabase
        .from('fasting_logs')
        .select('*')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (activeFastData) {
        setActiveFast(activeFastData as FastingLog);
        const proto = PROTOCOLS.find((p) => p.id === activeFastData.protocol);
        if (proto) setSelectedProtocol(proto);
      } else {
        setActiveFast(null);
      }

      const { data: historyData } = await supabase
        .from('fasting_logs')
        .select('*')
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(10);

      setHistory((historyData ?? []) as FastingLog[]);
    } catch (error) {
      console.error('loadData error:', error);
    }
  };

  const handleStartFast = async () => {
    if (!user?.id) return;
    if (activeFast) return;

    setIsLoading(true);

    // Inside handleStartFast after the insert succeeds — find this block and update:
try {
  const { sendNotification } = await import(
    '../../services/notificationService'
  );
  await sendNotification(
    user.id,
    'goal',
    `${selectedProtocol.label} Fast Started ⏳`,
    `Your fast has begun. Stay hydrated and stay strong!`,
    'View Fasting'  // ← changed from 'View History'
  );
} catch (e) {
  // Silent fail
}
    try {
      const { supabase } = await import('../../services/supabase');
      const now = new Date();
      const targetEnd = new Date(
        now.getTime() + selectedProtocol.fastHours * 60 * 60 * 1000
      );

      const { data, error } = await supabase
        .from('fasting_logs')
        .insert({
          user_id: user.id,
          protocol: selectedProtocol.id,
          fast_hours: selectedProtocol.fastHours,
          eating_hours: selectedProtocol.eatingHours,
          started_at: now.toISOString(),
          target_end_at: targetEnd.toISOString(),
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      setActiveFast(data as FastingLog);

      // ── Notify fast started ──────────────────────────────
      try {
        const { sendNotification } = await import(
          '../../services/notificationService'
        );
        const endTimeStr = targetEnd.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true,
        });
        await sendNotification(
          user.id,
          'goal',
          `${selectedProtocol.label} fast started! ⏳`,
          `Your fast is running. Eating window opens at ${endTimeStr}. Stay hydrated!`,
          'View Fast'
        );
      } catch (e) {
        // Silent fail — non-critical
      }

    } catch (error) {
      console.error('startFast error:', error);
      Alert.alert('Error', 'Could not start fast. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndFast = () => {
    Alert.alert(
      'End Fast?',
      'Are you sure you want to end your fast early?',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'End Fast', style: 'destructive', onPress: endFast },
      ]
    );
  };

  const endFast = async () => {
  if (!activeFast || !user?.id) return;
  setIsLoading(true);
  try {
    const { supabase } = await import('../../services/supabase');
    const now = new Date();
    const targetEnd = new Date(activeFast.target_end_at);
    const completed = now >= targetEnd;

    await supabase
      .from('fasting_logs')
      .update({
        ended_at: now.toISOString(),
        completed,
      })
      .eq('id', activeFast.id);

    setActiveFast(null);
    await loadData();

    // ── Send notification with correct action label ────────
    try {
      const { sendNotification } = await import(
        '../../services/notificationService'
      );
      if (completed) {
        await sendNotification(
          user.id,
          'achievement',
          `${activeFast.protocol} Fast Complete! 🎉`,
          `You completed your ${activeFast.protocol} fast. Incredible discipline!`,
          'View Fasting'  // ← matches actionMap now
        );
      } else {
        await sendNotification(
          user.id,
          'goal',
          'Fast ended',
          `Your ${activeFast.protocol} fast has been ended. Every fast counts!`,
          'View Fasting'  // ← matches actionMap now
        );
      }
    } catch (e) {
      // Silent fail
    }

    Alert.alert(
      completed ? '🎉 Fast Complete!' : 'Fast Ended',
      completed
        ? `You completed your ${activeFast.protocol} fast! Great discipline.`
        : `Fast ended after ${formatDuration(elapsed)}. Every fast counts!`
    );
  } catch (error) {
    console.error('endFast error:', error);
  } finally {
    setIsLoading(false);
  }
};

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const totalFastMs = selectedProtocol.fastHours * 60 * 60 * 1000;
  const progress = activeFast ? Math.min(elapsed / totalFastMs, 1) : 0;
  const remaining = activeFast ? Math.max(totalFastMs - elapsed, 0) : 0;
  const isFastComplete = activeFast && remaining === 0;

  const eatingWindowStart = activeFast
    ? new Date(new Date(activeFast.started_at).getTime() + totalFastMs)
    : null;

  const eatingWindowEnd = eatingWindowStart && selectedProtocol.eatingHours > 0
    ? new Date(eatingWindowStart.getTime() + selectedProtocol.eatingHours * 60 * 60 * 1000)
    : null;

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
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Meals</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          Intermittent Fasting
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* Protocol selector */}
        {!activeFast && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Select Protocol
            </Text>
            {PROTOCOLS.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedProtocol(p)}
                style={[styles.protocolCard, {
                  backgroundColor: selectedProtocol.id === p.id
                    ? theme.accentDim as string
                    : theme.card,
                  borderColor: selectedProtocol.id === p.id
                    ? theme.accent
                    : theme.border,
                  borderWidth: selectedProtocol.id === p.id ? 2 : 1,
                }]}
              >
                <View style={styles.protocolLeft}>
                  <View style={styles.protocolLabelRow}>
                    <Text style={[styles.protocolLabel, {
                      color: selectedProtocol.id === p.id
                        ? theme.accent
                        : theme.textPrimary,
                    }]}>
                      {p.label}
                    </Text>
                    {p.popular && (
                      <View style={[styles.popularBadge, {
                        backgroundColor: theme.accent + '22',
                      }]}>
                        <Text style={[styles.popularText, { color: theme.accent }]}>
                          Popular
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.protocolDesc, { color: theme.textMuted }]}>
                    {p.description}
                  </Text>
                </View>
                <View style={styles.protocolStats}>
                  <View style={styles.protocolStat}>
                    <Text style={[styles.protocolStatValue, { color: theme.textPrimary }]}>
                      {p.fastHours}h
                    </Text>
                    <Text style={[styles.protocolStatLabel, { color: theme.textMuted }]}>
                      fast
                    </Text>
                  </View>
                  {p.eatingHours > 0 && (
                    <View style={styles.protocolStat}>
                      <Text style={[styles.protocolStatValue, { color: theme.accent }]}>
                        {p.eatingHours}h
                      </Text>
                      <Text style={[styles.protocolStatLabel, { color: theme.textMuted }]}>
                        eat
                      </Text>
                    </View>
                  )}
                </View>
                {selectedProtocol.id === p.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.accent}
                    style={{ marginLeft: spacing.sm }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Active fast timer */}
        {activeFast ? (
          <View style={styles.timerSection}>
            <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
              {isFastComplete
                ? '🎉 Fast complete! You can break your fast.'
                : '⏳ Fasting in progress...'}
            </Text>

            <View style={[styles.activeBadge, {
              backgroundColor: theme.accentDim as string,
              borderColor: theme.accent,
            }]}>
              <Text style={[styles.activeBadgeText, { color: theme.accent }]}>
                {activeFast.protocol} Protocol
              </Text>
            </View>

            <View style={styles.ringWrap}>
              <ProgressRing
                progress={progress}
                size={220}
                strokeWidth={14}
                color={isFastComplete ? (theme as any).gold : theme.accent}
                bgColor={theme.border}
              >
                <View style={styles.ringInner}>
                  <Text style={[styles.ringLabel, { color: theme.textMuted }]}>
                    {isFastComplete ? 'Complete!' : 'Elapsed'}
                  </Text>
                  <Text style={[styles.ringTime, { color: theme.textPrimary }]}>
                    {formatDuration(elapsed)}
                  </Text>
                  <Text style={[styles.ringPercent, { color: theme.accent }]}>
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
              </ProgressRing>
            </View>

            {!isFastComplete && (
              <View style={[styles.remainingCard, {
                backgroundColor: theme.card,
                borderColor: theme.border,
              }]}>
                <Text style={[styles.remainingLabel, { color: theme.textMuted }]}>
                  Time remaining
                </Text>
                <Text style={[styles.remainingTime, { color: theme.textPrimary }]}>
                  {formatDuration(remaining)}
                </Text>
              </View>
            )}

            {eatingWindowStart && eatingWindowEnd && (
              <View style={[styles.windowCard, {
                backgroundColor: theme.card,
                borderColor: theme.border,
              }]}>
                <View style={styles.windowRow}>
                  <Ionicons name="restaurant-outline" size={18} color={theme.accent} />
                  <Text style={[styles.windowLabel, { color: theme.textSecondary }]}>
                    Eating window opens
                  </Text>
                </View>
                <Text style={[styles.windowTime, { color: theme.textPrimary }]}>
                  {eatingWindowStart.toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', hour12: true,
                  })}
                  {' — '}
                  {eatingWindowEnd.toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', hour12: true,
                  })}
                </Text>
                <Text style={[styles.windowDuration, { color: theme.textMuted }]}>
                  {selectedProtocol.eatingHours} hour eating window
                </Text>
              </View>
            )}

            <Text style={[styles.startedAt, { color: theme.textMuted }]}>
              Started at {new Date(activeFast.started_at).toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit', hour12: true,
              })} on {new Date(activeFast.started_at).toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
            </Text>

            <TouchableOpacity
              onPress={isFastComplete ? endFast : handleEndFast}
              disabled={isLoading}
              style={[styles.endBtn, {
                backgroundColor: isFastComplete ? (theme as any).gold : theme.card,
                borderColor: isFastComplete ? (theme as any).gold : (theme as any).red,
                borderWidth: 1,
              }]}
            >
              <Ionicons
                name={isFastComplete ? 'checkmark-circle' : 'stop-circle-outline'}
                size={20}
                color={isFastComplete ? theme.bg : (theme as any).red}
              />
              <Text style={[styles.endBtnText, {
                color: isFastComplete ? theme.bg : (theme as any).red,
              }]}>
                {isFastComplete ? 'Complete Fast 🎉' : 'End Fast Early'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleStartFast}
            disabled={isLoading}
            style={[styles.startBtn, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="timer-outline" size={22} color={theme.bg} />
            <Text style={styles.startBtnText}>
              Start {selectedProtocol.label} Fast
            </Text>
          </TouchableOpacity>
        )}

        {/* Tips */}
        {!activeFast && (
          <View style={[styles.tipsCard, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <Text style={[styles.tipsTitle, { color: theme.textPrimary }]}>
              Tips for success
            </Text>
            {[
              'Stay hydrated — water, black coffee, and plain tea are allowed',
              'Start your fast after dinner so you sleep through most of it',
              'Break your fast with a light, nutritious meal',
              "Don't break a fast with processed food or sugar",
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: theme.accent }]} />
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* History */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Fast History
            </Text>
            {history.map((log) => {
              const start = new Date(log.started_at);
              const end = log.ended_at ? new Date(log.ended_at) : null;
              const durationMs = end ? end.getTime() - start.getTime() : 0;

              return (
                <View key={log.id} style={[styles.historyCard, {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }]}>
                  <View style={[styles.historyIcon, {
                    backgroundColor: log.completed
                      ? theme.accent + '22'
                      : theme.border,
                  }]}>
                    <Ionicons
                      name={log.completed ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={log.completed ? theme.accent : theme.textMuted}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyProtocol, { color: theme.textPrimary }]}>
                      {log.protocol} Fast
                    </Text>
                    <Text style={[styles.historyDate, { color: theme.textMuted }]}>
                      {start.toLocaleDateString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyDuration, { color: theme.textPrimary }]}>
                      {formatDuration(durationMs)}
                    </Text>
                    <Text style={[styles.historyStatus, {
                      color: log.completed ? theme.accent : theme.textMuted,
                    }]}>
                      {log.completed ? 'Completed' : 'Ended early'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },
  pageTitle: { fontSize: fontSize.lg, fontWeight: '700' },

  section: { paddingTop: spacing.md },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },

  protocolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  protocolLeft: { flex: 1 },
  protocolLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  protocolLabel: { fontSize: fontSize.lg, fontWeight: '800' },
  popularBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  popularText: { fontSize: 10, fontWeight: '700' },
  protocolDesc: { fontSize: fontSize.sm, marginTop: 2, lineHeight: 18 },
  protocolStats: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  protocolStat: { alignItems: 'center' },
  protocolStatValue: { fontSize: fontSize.lg, fontWeight: '800' },
  protocolStatLabel: { fontSize: fontSize.xs },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  startBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },

  timerSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  statusLabel: { fontSize: fontSize.base, textAlign: 'center' },
  activeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  activeBadgeText: { fontSize: fontSize.sm, fontWeight: '700' },

  ringWrap: { marginVertical: spacing.md },
  ringInner: { alignItems: 'center', gap: 4 },
  ringLabel: { fontSize: fontSize.xs },
  ringTime: { fontSize: 32, fontWeight: '800' },
  ringPercent: { fontSize: fontSize.base, fontWeight: '700' },

  remainingCard: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  remainingLabel: { fontSize: fontSize.sm },
  remainingTime: { fontSize: fontSize.xxl, fontWeight: '800', marginTop: 4 },

  windowCard: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  windowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  windowLabel: { fontSize: fontSize.sm, fontWeight: '600' },
  windowTime: { fontSize: fontSize.xl, fontWeight: '800' },
  windowDuration: { fontSize: fontSize.sm },

  startedAt: { fontSize: fontSize.sm, textAlign: 'center' },

  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  endBtnText: { fontSize: fontSize.base, fontWeight: '700' },

  tipsCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  tipsTitle: { fontSize: fontSize.base, fontWeight: '700', marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  tipText: { fontSize: fontSize.sm, lineHeight: 20, flex: 1 },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  historyIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  historyInfo: { flex: 1 },
  historyProtocol: { fontSize: fontSize.base, fontWeight: '700' },
  historyDate: { fontSize: fontSize.xs, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyDuration: { fontSize: fontSize.base, fontWeight: '700' },
  historyStatus: { fontSize: fontSize.xs, marginTop: 2 },
});