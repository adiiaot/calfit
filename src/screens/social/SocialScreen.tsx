import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── TYPES ─────────────────────────────────────────────────────
interface Post {
  id: string;
  author: string;
  authorId: string;
  avatar: string | null;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
  type: 'workout' | 'meal' | 'milestone' | 'text';
  badge?: string;
}

interface Story {
  id: string;
  username: string;
  avatar: string | null;
  seen: boolean;
  isYours?: boolean;
}

// ── TIME AGO ──────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── AVATAR COMPONENT ──────────────────────────────────────────
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
      styles.avatarWrap,
      hasStory && {
        padding: 2,
        borderRadius: size / 2 + 3,
        borderWidth: 2,
        borderColor: seen ? theme.border : theme.accent,
      }
    ]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size, height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <View style={{
          width: size, height: size,
          borderRadius: size / 2,
          backgroundColor: theme.accentDim as string,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: theme.accent, fontWeight: '700', fontSize: size * 0.38 }}>
            {name[0]?.toUpperCase() ?? 'U'}
          </Text>
        </View>
      )}
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
        <View style={[styles.addStoryWrap, { borderColor: theme.accent }]}>
          <UserAvatar uri={currentUserAvatar} name={currentUserName} size={54} theme={theme} />
          <View style={[styles.addStoryPlus, { backgroundColor: theme.accent }]}>
            <Ionicons name="add" size={14} color={theme.bg} />
          </View>
        </View>
        <Text style={[styles.storyName, { color: theme.textSecondary }]}>Your story</Text>
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
          <Text style={[styles.storyName, { color: theme.textSecondary }]} numberOfLines={1}>
            {s.username}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── KUDOS PILLS ───────────────────────────────────────────────
const KUDOS = ['🔥 Fire', '💪 Strong', '🎯 Goals', '🙌 Well done'];

// ── POST CARD ─────────────────────────────────────────────────
export function PostCard({
  post,
  theme,
  onLike,
  onSave,
}: {
  post: Post;
  theme: typeof colors.dark;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const [showKudos, setShowKudos] = useState(false);

  const typeConfig: Record<Post['type'], { icon: string; color: string; label: string }> = {
    workout:   { icon: 'barbell-outline',    color: theme.orange,        label: 'Workout' },
    meal:      { icon: 'restaurant-outline', color: theme.accentSecond,  label: 'Meal' },
    milestone: { icon: 'trophy-outline',     color: theme.gold,          label: 'Milestone' },
    text:      { icon: 'chatbubble-outline', color: theme.textMuted,     label: 'Update' },
  };

  const config = typeConfig[post.type];

  return (
    <View style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Post header */}
      <View style={styles.postHeader}>
        <UserAvatar uri={post.avatar} name={post.author} size={40} theme={theme} />
        <View style={styles.postAuthorInfo}>
          <View style={styles.postAuthorRow}>
            <Text style={[styles.postAuthorName, { color: theme.textPrimary }]}>
              {post.author}
            </Text>
            {post.badge && (
              <View style={[styles.typeBadge, { backgroundColor: config.color + '22' }]}>
                <Ionicons name={config.icon as any} size={10} color={config.color} />
                <Text style={[styles.typeBadgeText, { color: config.color }]}>
                  {config.label}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.postTime, { color: theme.textMuted }]}>
            @{post.authorId} · {post.time}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={[styles.postContent, { color: theme.textPrimary }]}>
        {post.content}
      </Text>

      {/* Image */}
      {post.image && (
        <Image
          source={{ uri: post.image }}
          style={[styles.postImage, { backgroundColor: theme.border }]}
          resizeMode="cover"
        />
      )}

      {/* Kudos pills */}
      {showKudos && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kudosPills}
        >
          {KUDOS.map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => setShowKudos(false)}
              style={[styles.kudosPill, {
                backgroundColor: theme.accentDim as string,
                borderColor: theme.accent,
              }]}
            >
              <Text style={[styles.kudosPillText, { color: theme.accent }]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Actions */}
      <View style={[styles.postActions, { borderTopColor: theme.border }]}>
        {[
          {
            icon: post.liked ? 'heart' : 'heart-outline',
            color: post.liked ? theme.red : theme.textMuted,
            label: post.likes.toString(),
            onPress: () => onLike(post.id),
          },
          {
            icon: 'chatbubble-outline',
            color: theme.textMuted,
            label: post.comments.toString(),
            onPress: () => {},
          },
          {
            icon: 'hand-right-outline',
            color: theme.textMuted,
            label: 'Kudos',
            onPress: () => setShowKudos(!showKudos),
          },
          {
            icon: 'share-social-outline',
            color: theme.textMuted,
            label: 'Share',
            onPress: () => {},
          },
          {
            icon: post.saved ? 'bookmark' : 'bookmark-outline',
            color: post.saved ? theme.accent : theme.textMuted,
            label: '',
            onPress: () => onSave(post.id),
          },
        ].map((a, i) => (
          <TouchableOpacity key={i} onPress={a.onPress} style={styles.postAction}>
            <Ionicons name={a.icon as any} size={18} color={a.color} />
            {a.label ? (
              <Text style={[styles.postActionLabel, { color: theme.textMuted }]}>
                {a.label}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── COMPOSE BOX ───────────────────────────────────────────────
function ComposeBox({
  theme,
  avatar,
  name,
  onPost,
}: {
  theme: typeof colors.dark;
  avatar: string | null;
  name: string;
  onPost: (content: string) => void;
}) {
  const [text, setText] = useState('');

  return (
    <View style={[styles.composeBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <UserAvatar uri={avatar} name={name} size={36} theme={theme} />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Share a workout, meal, or milestone..."
        placeholderTextColor={theme.textMuted}
        style={[styles.composeInput, { color: theme.textPrimary }]}
        multiline
      />
      {text.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onPost(text);
            setText('');
          }}
          style={[styles.postBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.postBtnText, { color: theme.bg }]}>Post</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── DISCOVER TAB EMPTY STATE ──────────────────────────────────
function DiscoverEmpty({ theme }: { theme: typeof colors.dark }) {
  return (
    <View style={styles.discoverEmpty}>
      <Ionicons name="compass-outline" size={48} color={theme.textMuted} />
      <Text style={[styles.discoverEmptyTitle, { color: theme.textPrimary }]}>
        Discover People
      </Text>
      <Text style={[styles.discoverEmptySub, { color: theme.textMuted }]}>
        Follow other CalFit members to see their workouts, meals, and milestones in your feed.
      </Text>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function SocialScreen() {
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'Following' | 'Discover'>('Following');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const name = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatar = profile?.avatar_url ?? null;

  useFocusEffect(
    useCallback(() => {
      loadFeedData();
    }, [user?.id])
  );

  const loadFeedData = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');

      // Load posts from users the current user follows
     const { data: postsData } = await supabase
  .from('posts')
  .select(`
    id, content, type, media_urls, likes_count, comments_count,
    created_at, user_id,
    profiles:user_id (full_name, calfit_id, avatar_url)
  `)
  .order('created_at', { ascending: false })
  .limit(20);

if (postsData) {
  setPosts(postsData.map((p: any) => ({
    id: p.id,
    author: p.profiles?.full_name ?? 'CalFit User',
    authorId: p.profiles?.calfit_id ?? 'user',
    avatar: p.profiles?.avatar_url ?? null,
    time: timeAgo(p.created_at),
    content: p.content,
    image: p.media_urls?.[0] ?? undefined,
    likes: p.likes_count ?? 0,
    comments: p.comments_count ?? 0,
    liked: false,
    saved: false,
    type: p.type ?? 'text',
  })));
}

      if (postsData) {
        setPosts(postsData.map((p: any) => ({
          id: p.id,
          author: p.profiles?.full_name ?? 'CalFit User',
          authorId: p.profiles?.calfit_id ?? 'user',
          avatar: p.profiles?.avatar_url ?? null,
          time: timeAgo(p.created_at),
          content: p.content,
          image: p.image_url,
          likes: p.likes_count ?? 0,
          comments: p.comments_count ?? 0,
          liked: false,
          saved: false,
          type: p.type ?? 'text',
        })));
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFeedData();
    setIsRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  };

  const handleSave = (postId: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, saved: !p.saved } : p
    ));
  };

 const handlePost = async (content: string) => {
  if (!user?.id || !content.trim()) return;
  try {
    const { supabase } = await import('../../services/supabase');
    const { data } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content.trim(),
        type: 'text',
        likes_count: 0,
        comments_count: 0,
      })
      .select()
      .single();

    if (data) {
      const newPost: Post = {
        id: data.id,
        author: name,
        authorId: profile?.calfit_id ?? 'user',
        avatar,
        time: 'Just now',
        content: data.content,
        likes: 0,
        comments: 0,
        liked: false,
        saved: false,
        type: 'text',
      };
      setPosts((prev) => [newPost, ...prev]);
    }
  } catch (error) {
    console.error('Failed to post:', error);
  }
};

  const isEmpty = posts.length === 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Social</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Ionicons name="search-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="paper-plane-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab toggle */}
      <View style={[styles.tabToggle, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        {(['Following', 'Discover'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabToggleBtn, activeTab === tab && { backgroundColor: theme.accent }]}
          >
            <Text style={[
              styles.tabToggleText,
              { color: activeTab === tab ? theme.bg : theme.textMuted },
              activeTab === tab && { fontWeight: '700' },
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* Stories */}
        <StoryRow
          theme={theme}
          stories={stories}
          currentUserName={name}
          currentUserAvatar={avatar}
        />

        {activeTab === 'Following' ? (
          <>
            {/* Compose box */}
            <ComposeBox
              theme={theme}
              avatar={avatar}
              name={name}
              onPost={handlePost}
            />

            {/* Posts */}
            {isEmpty ? (
              <View style={styles.emptyFeed}>
                <Ionicons name="people-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyFeedTitle, { color: theme.textPrimary }]}>
                  Your feed is empty
                </Text>
                <Text style={[styles.emptyFeedSub, { color: theme.textMuted }]}>
                  Follow other CalFit members or invite friends to see their activity here.
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('Discover')}
                  style={[styles.discoverBtn, { backgroundColor: theme.accent }]}
                >
                  <Text style={[styles.discoverBtnText, { color: theme.bg }]}>
                    Discover People
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  theme={theme}
                  onLike={handleLike}
                  onSave={handleSave}
                />
              ))
            )}
          </>
        ) : (
          <DiscoverEmpty theme={theme} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },
  headerRight: { flexDirection: 'row', gap: spacing.md },

  tabToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabToggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabToggleText: { fontSize: fontSize.base },

  // Stories
  storyRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  storyItem: { alignItems: 'center', gap: 6, width: 64 },
  addStoryWrap: { position: 'relative' },
  addStoryPlus: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  storyName: { fontSize: 10, textAlign: 'center' },
  avatarWrap: {},

  // Compose
  composeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  composeInput: { flex: 1, fontSize: fontSize.base, lineHeight: 20, maxHeight: 80 },
  postBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: 'flex-end',
  },
  postBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  // Post card
  postCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  postAuthorInfo: { flex: 1 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  postAuthorName: { fontSize: fontSize.base, fontWeight: '700' },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  postTime: { fontSize: fontSize.xs, marginTop: 2 },
  postContent: {
    fontSize: fontSize.base,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  postImage: {
    width: '100%',
    height: 240,
  },
  kudosPills: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  kudosPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  kudosPillText: { fontSize: fontSize.sm, fontWeight: '600' },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    marginTop: spacing.xs,
  },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postActionLabel: { fontSize: fontSize.xs, fontWeight: '600' },

  // Empty states
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyFeedTitle: { fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  emptyFeedSub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
  discoverBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  discoverBtnText: { fontSize: fontSize.base, fontWeight: '700' },
  discoverEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  discoverEmptyTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  discoverEmptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
});