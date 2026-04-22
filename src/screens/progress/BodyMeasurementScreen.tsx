import {
  View, Text, TouchableOpacity, Modal,
  TextInput, ScrollView, ActivityIndicator,
  StyleSheet, Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme';
import { supabase } from '../../services/supabase';

interface Measurement {
  id: string;
  date: string;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  arms_cm: number | null;
  thighs_cm: number | null;
  weight_kg: number | null;
  notes: string;
}

const FIELDS: { key: keyof Measurement; label: string; icon: string }[] = [
  { key: 'chest_cm',  label: 'Chest (cm)',  icon: 'body-outline' },
  { key: 'waist_cm',  label: 'Waist (cm)',  icon: 'resize-outline' },
  { key: 'hips_cm',   label: 'Hips (cm)',   icon: 'ellipse-outline' },
  { key: 'arms_cm',   label: 'Arms (cm)',   icon: 'barbell-outline' },
  { key: 'thighs_cm', label: 'Thighs (cm)', icon: 'walk-outline' },
  { key: 'weight_kg', label: 'Weight (kg)', icon: 'scale-outline' },
];

function LogMeasurementModal({
  theme,
  visible,
  userId,
  onClose,
  onSaved,
}: {
  theme: typeof colors.dark;
  visible: boolean;
  userId: string;
  onClose: () => void;
  onSaved: (m: Measurement) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const hasAny = FIELDS.some((f) => values[f.key as string]?.trim());
    if (!hasAny) {
      Alert.alert('Add at least one measurement', 'Enter at least one value before saving.');
      return;
    }
    setSaving(true);
    const payload: any = {
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      notes,
    };
    FIELDS.forEach((f) => {
      const v = parseFloat(values[f.key as string] ?? '');
      payload[f.key] = isNaN(v) ? null : v;
    });

    const { data, error } = await supabase
      .from('body_measurements')
      .insert(payload)
      .select()
      .single();

    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Could not save measurements. Please try again.');
      return;
    }
    onSaved(data as Measurement);
    setValues({});
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={bStyles.overlay}>
        <View style={[bStyles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[bStyles.sheetHeader, { borderBottomColor: theme.border }]}>
            <Text style={[bStyles.sheetTitle, { color: theme.textPrimary }]}>Log Measurements</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[bStyles.hint, { color: theme.textMuted }]}>
              Enter any measurements you want to track. Leave blank to skip.
            </Text>
            {FIELDS.map((f) => (
              <View key={f.key as string} style={bStyles.fieldRow}>
                <Ionicons name={f.icon as any} size={18} color={theme.textSecondary} />
                <Text style={[bStyles.fieldLabel, { color: theme.textSecondary }]}>{f.label}</Text>
                <View style={[bStyles.fieldInput, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <TextInput
                    value={values[f.key as string] ?? ''}
                    onChangeText={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={theme.textMuted}
                    style={[bStyles.fieldInputText, { color: theme.accent }]}
                  />
                </View>
              </View>
            ))}
            <View style={[bStyles.notesInput, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Notes (optional)"
                placeholderTextColor={theme.textMuted}
                style={[bStyles.notesText, { color: theme.textPrimary }]}
                multiline
              />
            </View>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[bStyles.saveBtn, { backgroundColor: theme.accent }]}
            >
              {saving
                ? <ActivityIndicator color={theme.bg} />
                : <Text style={[bStyles.saveBtnText, { color: theme.bg }]}>Save Measurements</Text>
              }
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function BodyMeasurements({
  theme,
  userId,
}: {
  theme: typeof colors.dark;
  userId: string;
}) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);
    if (data) setMeasurements(data as Measurement[]);
    setLoading(false);
  };

  const latest = measurements[0];

  const formatVal = (v: number | null, unit: string) =>
    v !== null && v !== undefined ? `${v}${unit}` : '—';

  return (
    <View style={[bStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={bStyles.cardHeader}>
        <Text style={[bStyles.cardLabel, { color: theme.textSecondary }]}>
          Body Measurements
        </Text>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={[bStyles.logBtn, { borderColor: theme.accent }]}
        >
          <Ionicons name="add" size={14} color={theme.accent} />
          <Text style={[bStyles.logBtnText, { color: theme.accent }]}>Log</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: spacing.lg }} />
      ) : !latest ? (
        <View style={bStyles.empty}>
          <Ionicons name="body-outline" size={32} color={theme.textMuted} />
          <Text style={[bStyles.emptyText, { color: theme.textMuted }]}>
            No measurements logged yet. Tap Log to track your body measurements over time.
          </Text>
        </View>
      ) : (
        <>
          <Text style={[bStyles.dateLabel, { color: theme.textMuted }]}>
            Last logged: {new Date(latest.date).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
          <View style={bStyles.metricsGrid}>
            {FIELDS.map((f) => {
              const val = latest[f.key] as number | null;
              const unit = f.key === 'weight_kg' ? 'kg' : 'cm';
              if (val === null) return null;
              return (
                <View key={f.key as string} style={[bStyles.metricCell, {
                  backgroundColor: theme.bg,
                  borderColor: theme.border,
                }]}>
                  <Ionicons name={f.icon as any} size={14} color={theme.accent} />
                  <Text style={[bStyles.metricValue, { color: theme.textPrimary }]}>
                    {formatVal(val, unit)}
                  </Text>
                  <Text style={[bStyles.metricLabel, { color: theme.textMuted }]}>
                    {f.label.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
          </View>

          {measurements.length > 1 && (
            <Text style={[bStyles.historyNote, { color: theme.textMuted }]}>
              {measurements.length} entries logged · Tap Log to add a new measurement
            </Text>
          )}
        </>
      )}

      <LogMeasurementModal
        theme={theme}
        visible={showModal}
        userId={userId}
        onClose={() => setShowModal(false)}
        onSaved={(m) => {
          setMeasurements((prev) => [m, ...prev]);
          setShowModal(false);
        }}
      />
    </View>
  );
}

const bStyles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.sm, borderWidth: 1,
  },
  logBtnText: { fontSize: fontSize.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  dateLabel: { fontSize: fontSize.xs, marginBottom: spacing.sm },
  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
  },
  metricCell: {
    alignItems: 'center', padding: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1,
    minWidth: 80, gap: 2,
  },
  metricValue: { fontSize: fontSize.base, fontWeight: '800' },
  metricLabel: { fontSize: 9 },
  historyNote: { fontSize: fontSize.xs, marginTop: spacing.sm },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    maxHeight: '90%', padding: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  hint: { fontSize: fontSize.sm, lineHeight: 18, marginBottom: spacing.md },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.sm,
  },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  fieldInput: {
    padding: spacing.sm, borderRadius: radius.sm,
    borderWidth: 1, minWidth: 80, alignItems: 'center',
  },
  fieldInputText: { fontSize: fontSize.base, fontWeight: '700', textAlign: 'center' },
  notesInput: {
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, marginTop: spacing.sm, marginBottom: spacing.md,
  },
  notesText: { fontSize: fontSize.base, minHeight: 50 },
  saveBtn: { padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});