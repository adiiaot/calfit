// src/components/PRShowcaseCard.tsx
// ─────────────────────────────────────────────────────────────
// Shows a user's Personal Records on their public profile.
// Used in both own profile and other users' profiles.
// Reads from the `personal_records` table via personalRecordsService.
// ─────────────────────────────────────────────────────────────

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, fontSize } from '../theme';
import { fetchPersonalRecords, PersonalRecord } from '../services/personalRecordsService';

// ── DISPLAY CONFIG ────────────────────────────────────────────
const RECORD_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  longest_duration: { label: 'Longest Workout', icon: 'time-outline',     color: '#6699FF' },
  most_calories:    { label: 'Most Calories',   icon: 'flame-outline',    color: '#FF6B35' },
  most_exercises:   { label: 'Most Exercises',  icon: 'barbell-outline',  color: '#2DDC8C' },
  longest_exercise: { label: 'Exercise PR',     icon: 'trophy-outline',   color: '#FFB830' },
};

function formatValue(record: PersonalRecord): string {
  if (record.record_type === 'longest_duration' || record.record_type === 'longest_exercise') {
    const h = Math.floor(record.value / 3600);
    const m = Math.floor((record.value % 3600) / 60);
    const s = Math.floor(record.value % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
  if (record.record_type === 'most_calories') return `${Math.round(record.value)} kcal`;
  if (record.record_type === 'most_exercises') return `${Math.round(record.value)} exercises`;
  return `${record.value}`;
}

// ── COMPONENT ─────────────────────────────────────────────────
export default function PRShowcaseCard({
  userId,
  theme,
}: {
  userId: string;
  theme: typeof colors.light;
}) {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchPersonalRecords(userId).then((data) => {
      // Show max 4: prefer session-level PRs first, then exercise PRs
      const sessionPRs  = data.filter((r) => r.record_type !== 'longest_exercise');
      const exercisePRs = data.filter((r) => r.record_type === 'longest_exercise');
      const combined    = [...sessionPRs, ...exercisePRs].slice(0, 4);
      setRecords(combined);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ActivityIndicator color={theme.accent} size="small" style={{ marginVertical: spacing.md }} />
      </View>
    );
  }

  if (records.length === 0) return null; // hide if no PRs yet

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <LinearGradient
          colors={['#FFB830', '#FF6B35'] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.headerIconWrap}
        >
          <Ionicons name="trophy" size={16} color="#fff" />
        </LinearGradient>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Personal Records</Text>
      </View>

      {/* PR grid — 2 columns */}
      <View style={styles.grid}>
        {records.map((record) => {
          const config = RECORD_CONFIG[record.record_type] ?? {
            label: record.exercise_name ?? record.record_type,
            icon: 'medal-outline' as any,
            color: theme.accent,
          };
          const label = record.record_type === 'longest_exercise' && record.exercise_name
            ? record.exercise_name
            : config.label;

          return (
            <View
              key={record.id}
              style={[styles.prCell, { backgroundColor: config.color + '12', borderColor: config.color + '30' }]}
            >
              <View style={[styles.prIconWrap, { backgroundColor: config.color + '20' }]}>
                <Ionicons name={config.icon} size={16} color={config.color} />
              </View>
              <Text style={[styles.prValue, { color: config.color }]} numberOfLines={1}>
                {formatValue(record)}
              </Text>
              <Text style={[styles.prLabel, { color: theme.textSecondary }]} numberOfLines={2}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  prCell: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  prIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  prValue: {
    fontSize: fontSize.lg,
    fontWeight: '900',
  },
  prLabel: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
});