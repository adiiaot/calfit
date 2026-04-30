// ─────────────────────────────────────────────────────────────────────────────
// src/components/MicronutrientCard.tsx
//
// Shown below each food log entry when the user has micronutrients enabled
// in Settings (prefs.micronutrients = true).
// Only renders if at least one micronutrient value is present.
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize } from '../theme';

interface MicronutrientData {
  fiber_g?:      number | null;
  sugar_g?:      number | null;
  sodium_mg?:    number | null;
  vitamin_c_mg?: number | null;
  calcium_mg?:   number | null;
  iron_mg?:      number | null;
  potassium_mg?: number | null;
}

interface Props {
  data:  MicronutrientData;
  theme: typeof colors.light;
}

const NUTRIENTS = [
  { key: 'fiber_g',      label: 'Fibre',     unit: 'g',  color: '#2DDC8C' },
  { key: 'sugar_g',      label: 'Sugar',     unit: 'g',  color: '#FF6B9D' },
  { key: 'sodium_mg',    label: 'Sodium',    unit: 'mg', color: '#FFB347' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg', color: '#FFD133' },
  { key: 'calcium_mg',   label: 'Calcium',   unit: 'mg', color: '#6699FF' },
  { key: 'iron_mg',      label: 'Iron',      unit: 'mg', color: '#B280FF' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg', color: '#2BBCB0' },
] as const;

export function MicronutrientCard({ data, theme }: Props) {
  // Only show nutrients that have values
  const present = NUTRIENTS.filter(n => data[n.key] != null && data[n.key]! > 0);
  if (present.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Text style={[styles.heading, { color: theme.textMuted }]}>Micronutrients</Text>
      <View style={styles.grid}>
        {present.map(n => (
          <View key={n.key} style={[styles.pill, { borderColor: n.color + '44', backgroundColor: n.color + '14' }]}>
            <Text style={[styles.pillValue, { color: n.color }]}>
              {data[n.key]}{n.unit}
            </Text>
            <Text style={[styles.pillLabel, { color: theme.textMuted }]}>{n.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:      { borderRadius: radius.md, borderWidth: 1, padding: spacing.sm, marginTop: spacing.xs },
  heading:   { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.xs },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill:      { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 99, borderWidth: 1, alignItems: 'center' },
  pillValue: { fontSize: fontSize.xs, fontWeight: '800' },
  pillLabel: { fontSize: 9 },
});