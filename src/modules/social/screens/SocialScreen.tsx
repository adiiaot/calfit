import {
  View, Text, StyleSheet,
  ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { AndroidSafeView } from '../../shared/AndriodSafeView';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { PostCard } from '../components/postCard';
import { ComposeBox } from '../components/composeBox';
import { CommentSheet } from '../components/commentSheet';
import { StoryRow } from '../components/storyRow';
import { DiscoverUserCard } from '../components/discoverUserCard';
import { ImageUploadSheet } from '../components/imageuploadSheet';
import { EmptyState } from '../../shared/EmptyState';
import { useFeed } from '../hooks/useFeed';
import { useFollow } from '../hooks/useFollow';
import { usePost } from '../hooks/usePost';
import { PostData } from '../services/postService';
import { isFollowing as checkFollowing, followUser, unfollowUser } from '../services/followService';
import { useState as useStateAlias } from 'react';

export default function SocialScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'Following' | 'Discover'>('Following');
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);

  const name = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatar = profile?.avatar_url ?? null;

  const { posts, isRefreshing, refresh, updatePost, prependPost } = useFeed(user?.id ?? '');
  const { toggle: toggleFollow } = useFollow(user?.id ?? '');
  const {
    post: createPost,
    like,
    selectImage,
    isPosting,
    isUploadingImage,
    moderationError,
    clearModerationError,
  } = usePost(user?.id ?? '');

  const handlePost = async (content: string, type: PostData['type']) => {
    const newPost = await createPost(content, type, selectedImageUri ?? undefined);
    if (newPost) {
      prependPost({ ...newPost, is_liked: false });
      setSelectedImageUri(null);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    updatePost(postId, {
      is_liked: !isLiked,
      likes_count: isLiked
        ? (posts.find((p) => p.id === postId)?.likes_count ?? 1) - 1
        : (posts.find((p) => p.id === postId)?.likes_count ?? 0) + 1,
    });
    await like(postId, isLiked);
  };

  const handlePickImage = async () => {
    const uri = await selectImage();
    if (uri) {
      setSelectedImageUri(uri);
      setShowImageSheet(true);
    }
  };

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    setDiscoverUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, isFollowing: !currentlyFollowing } : u
      )
    );
    await toggleFollow(userId, currentlyFollowing);
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Social</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Community')}
            style={[styles.headerBtn, {
              backgroundColor: theme.card,
              borderColor: theme.border,
            }]}
          >
            <Ionicons name="people-outline" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Messages')}
            style={[styles.headerBtn, {
              backgroundColor: theme.card,
              borderColor: theme.border,
            }]}
          >
            <Ionicons name="paper-plane-outline" size={20} color={theme.textPrimary} />
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
            style={[styles.tabBtn, activeTab === tab && {
              backgroundColor: theme.accent,
            }]}
          >
            <Text style={[styles.tabBtnText, {
              color: activeTab === tab ? theme.bg : theme.textMuted,
              fontWeight: activeTab === tab ? '700' : '400',
            }]}>
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
            onRefresh={refresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* Stories */}
        <StoryRow
          theme={theme}
          stories={[]}
          currentUserName={name}
          currentUserAvatar={avatar}
        />

        {activeTab === 'Following' ? (
          <>
            <ComposeBox
              theme={theme}
              avatarUrl={avatar}
              userName={name}
              isPosting={isPosting || isUploadingImage}
              selectedImageUri={selectedImageUri}
              onPost={handlePost}
              onAddImage={handlePickImage}
              onRemoveImage={() => setSelectedImageUri(null)}
            />

            {posts.length === 0 ? (
              <EmptyState
                theme={theme}
                icon="people-outline"
                title="Your feed is empty"
                subtitle="Follow other CalFit members to see their workouts and milestones here."
                buttonLabel="Find People to Follow"
                onButtonPress={() => setActiveTab('Discover')}
              />
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  theme={theme}
                  onLike={handleLike}
                  onComment={(p) => {
                    setSelectedPost(p);
                    setShowComments(true);
                  }}
                  onProfilePress={(userId) =>
                    navigation.navigate('Profile', { userId })
                  }
                />
              ))
            )}
          </>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              New on CalFit
            </Text>
            <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
              Follow members to see their workouts in your feed.
            </Text>
            {discoverUsers.length === 0 ? (
              <EmptyState
                theme={theme}
                icon="compass-outline"
                title="No users yet"
                subtitle="Invite friends to CalFit to grow your network."
              />
            ) : (
              discoverUsers.map((u) => (
                <DiscoverUserCard
                  key={u.id}
                  userId={u.id}
                  name={u.name}
                  calfitId={u.calfitId}
                  avatarUrl={u.avatar}
                  goal={u.goal}
                  isFollowing={u.isFollowing}
                  theme={theme}
                  onFollow={() => handleFollow(u.id, u.isFollowing)}
                  onProfilePress={() =>
                    navigation.navigate('Profile', { userId: u.id })
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Comment Sheet */}
      <CommentSheet
        theme={theme}
        post={selectedPost}
        visible={showComments}
        currentUserId={user?.id ?? ''}
        currentUserName={name}
        currentUserAvatar={avatar}
        onClose={() => {
          setShowComments(false);
          setSelectedPost(null);
        }}
      />

      {/* Image Upload Sheet */}
      <ImageUploadSheet
        theme={theme}
        visible={showImageSheet}
        selectedImageUri={selectedImageUri}
        isUploading={isUploadingImage}
        moderationError={moderationError}
        onPickImage={handlePickImage}
        onRemoveImage={() => {
          setSelectedImageUri(null);
          clearModerationError();
        }}
        onClose={() => {
          setShowImageSheet(false);
          clearModerationError();
        }}
      />
    </AndroidSafeView>
  );
}

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
  title: { fontSize: fontSize.xxl, fontWeight: '800' },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  tabToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabBtnText: { fontSize: fontSize.base },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: fontSize.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});