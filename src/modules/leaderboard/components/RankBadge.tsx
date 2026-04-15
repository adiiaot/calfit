import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontSize } from '../../../theme';

const MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  rank: number;
  theme: typeof colors.dark;
  size?: 'sm' | 'md' | 'lg';
}

export function RankBadge({ rank, theme, size = 'md' }: Props) {
  const emojiSize = { sm: 20, md: 28, lg: 36 }[size];
  const badgeSize = { sm: 28, md: 36, lg: 44 }[size];
  const textSize = { sm: fontSize.sm, md: fontSize.base, lg: fontSize.xl }[size];

  if (rank <= 3) {
    return (
      <Text style={{ fontSize: emojiSize, textAlign: 'center', width: badgeSize }}>
        {MEDALS[rank - 1]}
      </Text>
    );
  }

  return (
    <View style={[styles.badge, {
      width: badgeSize,
      height: badgeSize,
      borderRadius: badgeSize / 2,
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      <Text style={[styles.rankText, { color: theme.textMuted, fontSize: textSize }]}>
        {rank}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rankText: { fontWeight: '800' },
});