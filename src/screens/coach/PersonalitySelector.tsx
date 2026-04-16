import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme';

export interface CoachPersonality {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tone: string;
  color: string;
}

export const PERSONALITIES: CoachPersonality[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    emoji: '⚖️',
    description: 'Supportive and evidence-based. The default CalFit experience.',
    tone: 'You are a balanced, knowledgeable fitness coach. Be helpful, informative and supportive.',
    color: '#0DAE6C',
  },
  {
    id: 'motivator',
    name: 'Hype Coach',
    emoji: '🔥',
    description: 'High energy, hype you up, never lets you quit.',
    tone: 'You are an extremely motivating, high-energy fitness coach. Use energetic language, celebrate every win, and pump the user up. Never let them give up.',
    color: '#F59E0B',
  },
  {
    id: 'strict',
    name: 'Drill Sergeant',
    emoji: '💪',
    description: 'No excuses. Tough love. Maximum accountability.',
    tone: 'You are a strict, no-nonsense fitness coach. Be direct, hold the user accountable, give no excuses but always be constructive.',
    color: '#EF4444',
  },
  {
    id: 'calm',
    name: 'Zen Coach',
    emoji: '🧘',
    description: 'Calm, mindful, focused on balance and wellness.',
    tone: 'You are a calm, mindful fitness coach. Speak gently, focus on balance, mental wellness and sustainable habits. Never add pressure.',
    color: '#8B5CF6',
  },
  {
    id: 'friendly',
    name: 'Best Friend',
    emoji: '😊',
    description: 'Casual, funny and feels like talking to a friend.',
    tone: 'You are a friendly, casual fitness buddy. Use everyday language, be funny, relatable and feel like a supportive best friend who happens to know a lot about fitness.',
    color: '#60A5FA',
  },
];

interface Props {
  theme: typeof colors.dark;
  activePersonality: string;
  onSelect: (id: string) => void;
}

export function PersonalitySelector({ theme, activePersonality, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Coach Personality
      </Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Choose how your CalFit Coach speaks to you
      </Text>
      {PERSONALITIES.map((p) => (
        <TouchableOpacity
          key={p.id}
          onPress={() => onSelect(p.id)}
          style={[styles.card, {
            backgroundColor: activePersonality === p.id
              ? p.color + '18'
              : theme.card,
            borderColor: activePersonality === p.id ? p.color : theme.border,
            borderWidth: activePersonality === p.id ? 2 : 1,
          }]}
        >
          <Text style={styles.emoji}>{p.emoji}</Text>
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.textPrimary }]}>{p.name}</Text>
            <Text style={[styles.desc, { color: theme.textMuted }]}>{p.description}</Text>
          </View>
          {activePersonality === p.id && (
            <Ionicons name="checkmark-circle" size={22} color={p.color} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: '800' },
  subtitle: { fontSize: fontSize.sm, marginBottom: spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  emoji: { fontSize: 28, width: 40, textAlign: 'center' },
  info: { flex: 1 },
  name: { fontSize: fontSize.base, fontWeight: '700' },
  desc: { fontSize: fontSize.sm, marginTop: 2, lineHeight: 18 },
});