// src/components/WithdrawalHistory.tsx
// ─────────────────────────────────────────────────────────────
// Withdrawal History — shows past withdrawal records in earnings screen
//
// USAGE in EarningsScreen or CreditsScreen:
//   import { WithdrawalHistory } from '../../components/WithdrawalHistory';
//   <WithdrawalHistory userId={user.id} theme={theme} />
//
// SUPABASE TABLE EXPECTED:
//   withdrawals (
//     id uuid,
//     user_id uuid,
//     amount numeric,
//     method text,          -- 'bank_transfer' | 'paystack'
//     status text,          -- 'pending' | 'processing' | 'completed' | 'failed'
//     created_at timestamptz,
//     processed_at timestamptz nullable,
//     reference text nullable
//   )
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { colors, spacing, radius, fontSize } from '../theme';

interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
  reference?: string;
}

const STATUS_CONFIG = {
  pending:    { color: '#F59E0B', icon: 'time-outline',            label: 'Pending' },
  processing: { color: '#60A5FA', icon: 'sync-outline',            label: 'Processing' },
  completed:  { color: '#2DDC8C', icon: 'checkmark-circle-outline', label: 'Completed' },
  failed:     { color: '#EF4444', icon: 'close-circle-outline',    label: 'Failed' },
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  paystack:      'Paystack',
  wallet:        'Wallet',
};

interface Props {
  userId: string;
  theme: typeof colors.dark;
}

export function WithdrawalHistory({ userId, theme }: Props) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading]     = useState(true);

  useFocusEffect(useCallback(() => { loadWithdrawals(); }, [userId]));

  const loadWithdrawals = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      setWithdrawals((data ?? []) as Withdrawal[]);
    } catch {
      setWithdrawals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
      .format(amount);

  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Withdrawal History</Text>

      {isLoading ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: spacing.xl }} />
      ) : withdrawals.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 32 }}>💳</Text>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No withdrawals yet</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            Your withdrawal history will appear here once you make your first withdrawal.
          </Text>
        </View>
      ) : (
        withdrawals.map((w, i) => {
          const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.pending;
          return (
            <View
              key={w.id}
              style={[
                styles.row,
                { borderTopColor: theme.border },
                i === 0 && { borderTopWidth: 0 },
              ]}
            >
              {/* Status icon */}
              <View style={[styles.iconWrap, { backgroundColor: cfg.color + '20' }]}>
                <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
              </View>

              {/* Details */}
              <View style={styles.details}>
                <View style={styles.topRow}>
                  <Text style={[styles.amount, { color: theme.textPrimary }]}>
                    {formatAmount(w.amount)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.color + '20' }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                <View style={styles.bottomRow}>
                  <Text style={[styles.method, { color: theme.textMuted }]}>
                    {METHOD_LABELS[w.method] ?? w.method}
                  </Text>
                  <Text style={[styles.date, { color: theme.textMuted }]}>
                    {formatDate(w.created_at)}
                  </Text>
                </View>
                {w.reference && (
                  <Text style={[styles.ref, { color: theme.textMuted }]} numberOfLines={1}>
                    Ref: {w.reference}
                  </Text>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.md },
  title:      { fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.md },
  empty:      { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: { fontSize: fontSize.base, fontWeight: '700' },
  emptySub:   { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1 },
  iconWrap:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  details:    { flex: 1, gap: 3 },
  topRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount:     { fontSize: fontSize.base, fontWeight: '700' },
  statusBadge:{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  statusText: { fontSize: 10, fontWeight: '700' },
  bottomRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  method:     { fontSize: fontSize.xs },
  date:       { fontSize: fontSize.xs },
  ref:        { fontSize: 10, fontStyle: 'italic' },
});