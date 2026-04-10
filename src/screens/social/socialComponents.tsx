import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

// ── TYPES ─────────────────────────────────────────────────────
export interface Story {
  id: string;
  username: string;
  avatar: string | null;
  seen: boolean;
}

// ── USER AVATAR ───────────────────────────────────────────────
export function UserAvatar({
  uri,
  name,
  size = 40,
  theme,
  hasStory = false,
  seen = false,
}: {
  uri: string | null;
  name: string;
  size?: number;
  theme: typeof colors.dark;
  hasStory?: boolean;
  seen?: boolean;
}) {
  return (
    <View style={[
      hasStory && {
        padding: 2,
        borderRadius: size / 2 + 3,
        borderWidth: 2,
        borderColor: seen ? theme.border : theme.accent,
      }
    ]}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.accentDim as string,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <Text style={{
          color: theme.accent,
          fontWeight: '700',
          fontSize: size * 0.38,
        }}>
          {name[0]?.toUpperCase() ?? 'U'}
        </Text>
      </View>
    </View>
  );
}

// ── STORY ROW ─────────────────────────────────────────────────
export function StoryRow({
  theme,
  stories,
  currentUserName,
  currentUserAvatar,
}: {
  theme: typeof colors.dark;
  stories: Story[];
  currentUserName: string;
  currentUserAvatar: string | null;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.storyRow}
    >
      {/* Your story */}
      <TouchableOpacity style={styles.storyItem}>
        <View style={{ position: 'relative' }}>
          <UserAvatar
            uri={currentUserAvatar}
            name={currentUserName}
            size={54}
            theme={theme}
          />
          <View style={[styles.addStoryPlus, { backgroundColor: theme.accent }]}>
            <Ionicons name="add" size={14} color={theme.bg} />
          </View>
        </View>
        <Text style={[styles.storyName, { color: theme.textSecondary }]}>
          Your story
        </Text>
      </TouchableOpacity>

      {/* Other stories */}
      {stories.map((s) => (
        <TouchableOpacity key={s.id} style={styles.storyItem}>
          <UserAvatar
            uri={s.avatar}
            name={s.username}
            size={54}
            theme={theme}
            hasStory
            seen={s.seen}
          />
          <Text
            style={[styles.storyName, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {s.username}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  storyRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  storyItem: { alignItems: 'center', gap: 6, width: 64 },
  addStoryPlus: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 20, height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyName: { fontSize: 10, textAlign: 'center' },
});