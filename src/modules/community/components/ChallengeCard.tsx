import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { ChallengeEntry } from '../services/challengeService';

interface Props {
  challenge: ChallengeEntry;
  theme: typeof colors.dark;
  onToggle: () => void;
}

const CAT_COLORS = (theme: typeof colors.dark): Record<string, string> => ({
  Steps: theme.accentSecond,
  Hydration: '#60A5FA',
  Fitness: theme.orange,
  Nutrition: theme.accent,
  Streaks: theme.red,
  Sleep: '#A78BFA',
  Sports: theme.accentSecond,
});

export function ChallengeCard({ challenge, theme, onToggle }: Props) {
  const catColor = CAT_COLORS(theme)[challenge.category] ?? theme.accent;

  return (
    <View style={[styles.container, {
      backgroundColor: theme.card,
      borderColor: challenge.joined ? theme.accent : theme.border,
      borderWidth: challenge.joined ? 2 : 1,
    }]}>
      {/* Auto badge */}
      <View style={[styles.autoBadge, { backgroundColor: theme.accentDim as string }]}>
        <Ionicons name="flash" size={10} color={theme.accent} />
        <Text style={[styles.autoText, { color: theme.accent }]}>Auto Challenge</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{challenge.emoji}</Text>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {challenge.title}
            </Text>
            <View style={[styles.catBadge, { backgroundColor: catColor + '22' }]}>
              <Text style={[styles.catText, { color: catColor }]}>
                {challenge.category}
              </Text>
            </View>
          </View>
          <Text style={[styles.desc, { color: theme.textMuted }]} numberOfLines={2}>
            {challenge.description}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="people-outline" size={12} color={theme.accentSecond} />
          <Text style={[styles.statText, { color: theme.accentSecond }]}>
            {challenge.participants.toLocaleString()} joined
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={12} color={theme.orange} />
          <Text style={[styles.statText, { color: theme.orange }]}>
            {challenge.days_left}d left
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="gift-outline" size={12} color={theme.gold} />
          <Text style={[styles.statText, { color: theme.gold }]}>
            {challenge.reward}
          </Text>
        </View>
      </View>

      {/* Join button */}
      <TouchableOpacity
        onPress={onToggle}
        style={[styles.joinBtn, {
          backgroundColor: challenge.joined ? theme.border : theme.accent,
        }]}
      >
        <Text style={[styles.joinBtnText, {
          color: challenge.joined ? theme.textMuted : theme.bg,
        }]}>
          {challenge.joined ? '✓ Joined' : 'Join Challenge'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  autoText: { fontSize: 9, fontWeight: '700' },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  emoji: { fontSize: 32 },
  headerInfo: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  title: { fontSize: fontSize.base, fontWeight: '700' },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  catText: { fontSize: 9, fontWeight: '700' },
  desc: { fontSize: fontSize.sm, marginTop: 4, lineHeight: 18 },
  stats: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: fontSize.xs, fontWeight: '600' },
  joinBtn: { padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  joinBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});