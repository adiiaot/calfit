import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';

interface Props {
  username: string;
  avatarUrl?: string | null;
  seen: boolean;
  isYours?: boolean;
  theme: typeof colors.dark;
  onPress: () => void;
  onAddStory?: () => void;
}

export function StoryCard({
  username,
  avatarUrl,
  seen,
  isYours = false,
  theme,
  onPress,
  onAddStory,
}: Props) {
  return (
    <TouchableOpacity
      onPress={isYours ? onAddStory : onPress}
      style={styles.container}
    >
      <View style={{ position: 'relative' }}>
        <UserAvatar
          uri={avatarUrl}
          name={username}
          size={56}
          theme={theme}
          hasStory={!isYours}
          seen={seen}
        />
        {isYours && (
          <View style={[styles.addBtn, { backgroundColor: theme.accent }]}>
            <Text style={[styles.addBtnText, { color: theme.bg }]}>+</Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.name, { color: theme.textSecondary }]}
        numberOfLines={1}
      >
        {isYours ? 'Your story' : username}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6, width: 68 },
  addBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 14, fontWeight: '800', lineHeight: 20 },
  name: { fontSize: 10, textAlign: 'center' },
});