import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { useNavigation } from '@react-navigation/native';

// ── STORIES ROW ──────────────────────────────────────────────
function StoriesRow({ theme }: { theme: typeof colors.dark }) {
  const stories = [
    { name: 'You', initial: '+', isYou: true },
    { name: 'Alex', initial: 'A', isYou: false },
    { name: 'Jordan', initial: 'J', isYou: false },
    { name: 'Mia', initial: 'M', isYou: false },
    { name: 'Sam', initial: 'S', isYou: false },
    { name: 'Dan', initial: 'D', isYou: false },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.storiesRow}
      style={[styles.storiesContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
    >
      {stories.map((s) => (
        <TouchableOpacity key={s.name} style={styles.storyItem}>
          <View style={[
            styles.storyRing,
            {
              backgroundColor: s.isYou ? theme.card : theme.accentDim as string,
              borderColor: s.isYou ? theme.border : theme.accent,
            },
          ]}>
            <Text style={[styles.storyInitial, {
              color: theme.accent,
            }]}>
              {s.initial}
            </Text>
          </View>
          <Text style={[styles.storyName, { color: theme.textSecondary }]}>
            {s.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── POST CARD ────────────────────────────────────────────────
function PostCard({
  theme,
  post,
}: {
  theme: typeof colors.dark;
  post: {
    user: string;
    initial: string;
    caption: string;
    likes: string;
    comments: string;
    type: 'video' | 'photo' | 'text';
    kudos: string;
    color: string;
  };
}) {
  const [liked, setLiked] = useState(false);

  return (
    <View style={[styles.postCard, {
      backgroundColor: theme.surface,
      borderBottomColor: theme.border,
    }]}>
      {/* Post header */}
      <View style={styles.postHeader}>
        <View style={[styles.postAvatar, {
          backgroundColor: post.color + '33',
          borderColor: post.color,
        }]}>
          <Text style={[styles.postAvatarText, { color: post.color }]}>
            {post.initial}
          </Text>
        </View>
        <View style={styles.postUserInfo}>
          <Text style={[styles.postUser, { color: theme.textPrimary }]}>
            {post.user}
          </Text>
          <Text style={[styles.postCaption, { color: theme.textSecondary }]}>
            {post.caption}
          </Text>
        </View>
        <TouchableOpacity>
          <Text style={[styles.postMore, { color: theme.textMuted }]}>···</Text>
        </TouchableOpacity>
      </View>

      {/* Media area */}
      {post.type !== 'text' && (
        <View style={[styles.postMedia, { backgroundColor: theme.card }]}>
          <Text style={styles.postMediaIcon}>
            {post.type === 'video' ? '▶' : '📸'}
          </Text>
        </View>
      )}

      {/* Kudos pill */}
      <TouchableOpacity style={[styles.kudosPill, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}>
        <Text style={[styles.kudosText, { color: theme.accent }]}>
          🔥 {post.kudos}
        </Text>
      </TouchableOpacity>

    {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          onPress={() => setLiked(!liked)}
          style={styles.actionBtn}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? theme.red : theme.textSecondary}
          />
          <Text style={[styles.actionCount, { color: theme.textMuted }]}>
            {post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={22} color={theme.textSecondary} />
          <Text style={[styles.actionCount, { color: theme.textMuted }]}>
            {post.comments}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="paper-plane-outline" size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]}>
          <Ionicons name="bookmark-outline" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function SocialScreen() {
    const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const [activeTab, setActiveTab] = useState<'Discover' | 'Following'>('Discover');

  const posts = [
    {
      user: 'Favour',
      initial: 'F',
      caption: 'Leg day done! 💪',
      likes: '248',
      comments: '34',
      type: 'video' as const,
      kudos: 'Well done!',
      color: theme.accent,
    },
    {
      user: 'Jordan M.',
      initial: 'J',
      caption: 'High protein lunch prep',
      likes: '112',
      comments: '18',
      type: 'photo' as const,
      kudos: 'I need to try this',
      color: theme.purple,
    },
    {
      user: 'Mia K.',
      initial: 'M',
      caption: 'Morning 5K done ☀️',
      likes: '89',
      comments: '12',
      type: 'photo' as const,
      kudos: 'Fire 🔥',
      color: theme.orange,
    },
    {
      user: 'Alex R.',
      initial: 'A',
      caption: 'New PR on bench press — 120kg! 🏋️',
      likes: '310',
      comments: '47',
      type: 'text' as const,
      kudos: 'Teach me',
      color: theme.accentSecond,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: theme.surface,
        borderBottomColor: theme.border,
      }]}>
        <Text style={[styles.logo, { color: theme.accent }]}>CalFit</Text>
        <View style={styles.headerTabs}>
          {(['Discover', 'Following'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.headerTab,
                activeTab === tab && { borderBottomColor: theme.accent },
              ]}
            >
              <Text style={[
                styles.headerTabText,
                { color: activeTab === tab ? theme.textPrimary : theme.textMuted },
                activeTab === tab && { fontWeight: '700' },
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
  onPress={() => navigation.getParent()?.navigate('Community')}
  style={[styles.bellBtn, {
    backgroundColor: theme.card,
    borderColor: theme.border,
  }]}
>
  <Ionicons name="people" size={18} color={theme.accent} />
</TouchableOpacity>
          <View style={[styles.avatarBtn, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>F</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stories */}
        <StoriesRow theme={theme} />

        {/* Posts */}
        {posts.map((post, i) => (
          <PostCard key={i} theme={theme} post={post} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  logo: { fontSize: fontSize.xl, fontWeight: '800' },
  headerTabs: { flex: 1, flexDirection: 'row', gap: spacing.lg },
  headerTab: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  headerTabText: { fontSize: fontSize.base },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bellBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, position: 'relative',
  },
  bellDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
  },
  avatarBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: fontSize.base, fontWeight: '700' },

  // Stories
  storiesContainer: {
    borderBottomWidth: 1,
  },
  storiesRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  storyItem: { alignItems: 'center', gap: 4 },
  storyRing: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  storyInitial: { fontSize: fontSize.xl, fontWeight: '700' },
  storyName: { fontSize: 9, fontWeight: '500' },

  // Post card
  postCard: {
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  postAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  postAvatarText: { fontSize: fontSize.lg, fontWeight: '700' },
  postUserInfo: { flex: 1 },
  postUser: { fontSize: fontSize.base, fontWeight: '700' },
  postCaption: { fontSize: fontSize.sm, marginTop: 2 },
  postMore: { fontSize: fontSize.xxl },

  // Media
  postMedia: {
    width: '100%', height: 200,
    alignItems: 'center', justifyContent: 'center',
  },
  postMediaIcon: { fontSize: 44, opacity: 0.4 },

  //Action buttons
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },

  // Kudos
  kudosPill: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  kudosText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Actions
postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  actionIcon: { fontSize: 22 },
  postStats: { fontSize: fontSize.xs, marginLeft: 'auto' },
});