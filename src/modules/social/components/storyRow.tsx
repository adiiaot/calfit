import { ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../../../theme';
import { StoryCard } from './storyCard';
import { StoryData } from '../services/storyService';

interface Props {
  theme: typeof colors.dark;
  stories: StoryData[];
  currentUserName: string;
  currentUserAvatar?: string | null;
  onStoryPress?: (story: StoryData) => void;
  onAddStory?: () => void;
}

export function StoryRow({
  theme,
  stories,
  currentUserName,
  currentUserAvatar,
  onStoryPress,
  onAddStory,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <StoryCard
        username={currentUserName}
        avatarUrl={currentUserAvatar}
        seen={false}
        isYours
        theme={theme}
        onPress={() => {}}
        onAddStory={onAddStory}
      />
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          username={story.profiles?.full_name ?? 'User'}
          avatarUrl={story.profiles?.avatar_url}
          seen={false}
          theme={theme}
          onPress={() => onStoryPress?.(story)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
});