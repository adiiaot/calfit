import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';
import { PostData } from '../services/postService';

const TYPE_OPTIONS = (theme: typeof colors.dark) => [
  { value: 'text' as PostData['type'],      label: 'Update',    icon: 'chatbubble-outline',  color: theme.textMuted },
  { value: 'workout' as PostData['type'],   label: 'Workout',   icon: 'barbell-outline',     color: theme.orange },
  { value: 'meal' as PostData['type'],      label: 'Meal',      icon: 'restaurant-outline',  color: theme.accentSecond },
  { value: 'milestone' as PostData['type'], label: 'Milestone', icon: 'trophy-outline',      color: theme.gold },
];

interface Props {
  theme: typeof colors.dark;
  avatarUrl?: string | null;
  userName: string;
  isPosting: boolean;
  selectedImageUri?: string | null;
  onPost: (content: string, type: PostData['type']) => void;
  onAddImage: () => void;
  onRemoveImage: () => void;
}

export function ComposeBox({
  theme,
  avatarUrl,
  userName,
  isPosting,
  selectedImageUri,
  onPost,
  onAddImage,
  onRemoveImage,
}: Props) {
  const [text, setText] = useState('');
  const [type, setType] = useState<PostData['type']>('text');
  const typeOptions = TYPE_OPTIONS(theme);

  const handlePost = () => {
    if (!text.trim() && !selectedImageUri) return;
    onPost(text, type);
    setText('');
  };

  return (
    <View style={[styles.container, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      <View style={styles.top}>
        <UserAvatar uri={avatarUrl} name={userName} size={36} theme={theme} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Share a workout, meal, or milestone..."
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.textPrimary }]}
          multiline
          maxLength={500}
        />
      </View>

      {/* Selected image preview */}
      {selectedImageUri && (
        <View style={styles.imagePreviewWrap}>
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={onRemoveImage}
            style={styles.removeImage}
          >
            <Ionicons name="close-circle" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Type selector + image button */}
      <View style={styles.bottom}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.typeRow}>
            {typeOptions.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setType(t.value)}
                style={[styles.typeBtn, {
                  backgroundColor: type === t.value ? t.color + '22' : 'transparent',
                  borderColor: type === t.value ? t.color : theme.border,
                  borderWidth: 1,
                }]}
              >
                <Ionicons
                  name={t.icon as any}
                  size={12}
                  color={type === t.value ? t.color : theme.textMuted}
                />
                <Text style={[styles.typeBtnText, {
                  color: type === t.value ? t.color : theme.textMuted,
                }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Image upload button */}
        <TouchableOpacity
          onPress={onAddImage}
          style={[styles.imageBtn, {
            backgroundColor: selectedImageUri
              ? theme.accent + '22'
              : theme.bg,
            borderColor: selectedImageUri ? theme.accent : theme.border,
          }]}
        >
          <Ionicons
            name="image-outline"
            size={16}
            color={selectedImageUri ? theme.accent : theme.textMuted}
          />
        </TouchableOpacity>
      </View>

      {(text.trim() || selectedImageUri) && (
        <TouchableOpacity
          onPress={handlePost}
          disabled={isPosting}
          style={[styles.postBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.postBtnText, { color: theme.bg }]}>
            {isPosting ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  top: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  input: { flex: 1, fontSize: fontSize.base, lineHeight: 20, maxHeight: 80 },
  imagePreviewWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    height: 160,
    position: 'relative',
  },
  imagePreview: { width: '100%', height: '100%' },
  removeImage: { position: 'absolute', top: spacing.xs, right: spacing.xs },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeRow: { flexDirection: 'row', gap: spacing.xs },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  typeBtnText: { fontSize: fontSize.xs, fontWeight: '600' },
  imageBtn: {
    width: 32, height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  postBtn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.xl,
  },
  postBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});