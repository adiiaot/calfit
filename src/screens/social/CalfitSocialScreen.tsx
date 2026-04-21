import {
  View, Text, StyleSheet,
  ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { PostData, sharePost } from '../../modules/social/services/postService';
import { supabase } from '../../services/supabase';

import { PostCard } from '../../modules/social/components/postCard';
import { ComposeBox } from '../../modules/social/components/composeBox';
import { CommentSheet } from '../../modules/social/components/commentSheet';
import { StoryRow } from '../../modules/social/components/storyRow';
import { DiscoverUserCard } from '../../modules/social/components/discoverUserCard';
import { ImageUploadSheet } from '../../modules/social/components/imageuploadSheet';
import { EmptyState } from '../../modules/shared/EmptyState';

import { useFeed } from '../../modules/social/hooks/useFeed';
import { useFollow } from '../../modules/social/hooks/useFollow';
import { usePost } from '../../modules/social/hooks/usePost';

interface DiscoverUser {
  id: string;
  name: string;
  calfitId: string;
  avatar: string | null;
  goal: string;
  isFollowing: boolean;
}

export default function CalFitSocialScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'Following' | 'Discover'>('Following');
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);

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

  // Reload on every focus so follow state stays accurate after
  // the user follows someone and navigates back to this screen.
  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadDiscoverUsers();
    }, [user?.id])
  );

  const loadDiscoverUsers = async () => {
    if (!user?.id) return;
    try {
      // Fetch profiles AND the current user's follows in parallel.
      // This is what was missing before — isFollowing was always false
      // because we never checked the DB for who the user already follows.
      const [profilesRes, followsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, calfit_id, avatar_url, goal')
          .neq('id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id),
      ]);

      // Build a Set of IDs the current user follows for O(1) lookup
      const followingSet = new Set(
        ((followsRes.data ?? []) as any[]).map((f) => f.following_id)
      );

      if (profilesRes.data) {
        setDiscoverUsers(
          (profilesRes.data as any[]).map((u) => ({
            id: u.id,
            name: u.full_name ?? 'CalFit User',
            calfitId: u.calfit_id ?? u.id.slice(0, 8),
            avatar: u.avatar_url ?? null,
            goal: u.goal ?? '',
            // Real follow state from DB — not hardcoded false
            isFollowing: followingSet.has(u.id),
          }))
        );
      }
    } catch (error) {
      console.error('loadDiscoverUsers error:', error);
    }
  };

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
    // Optimistic update — flip immediately in UI
    setDiscoverUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, isFollowing: !currentlyFollowing } : u
      )
    );
    // Persist to DB
    const success = await toggleFollow(userId, currentlyFollowing);
    // Revert if DB call failed
    if (!success) {
      setDiscoverUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: currentlyFollowing } : u
        )
      );
    }
  };

  const handleRefresh = async () => {
    await refresh();
    await loadDiscoverUsers();
  };

  const handleShare = async (post: PostData) => {
    await sharePost(post);
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Social</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Community' as never)}
            style={[styles.headerBtn, {
              backgroundColor: theme.card,
              borderColor: theme.border,
            }]}
          >
            <Ionicons name="people-outline" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Live' as never)}
            style={[styles.headerBtn, {
              backgroundColor: theme.red + '18',
              borderColor: theme.red,
            }]}
          >
            <View style={styles.liveDot} />
            <Ionicons name="radio-outline" size={20} color={theme.red} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Messages' as never)}
            style={[styles.headerBtn, {
              backgroundColor: theme.card,
              borderColor: theme.border,
            }]}
          >
            <Ionicons name="paper-plane-outline" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

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
              {tab === 'Discover' && discoverUsers.length > 0
                ? ` (${discoverUsers.length})`
                : ''}
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
                  currentUserId={user?.id}
                  currentUserName={name}
                  onLike={handleLike}
                  onComment={(p) => {
                    setSelectedPost(p);
                    setShowComments(true);
                  }}
                  onShare={handleShare}
                  onProfilePress={(userId) =>
                    navigation.navigate('Profile' as never, { userId } as never)
                  }
                />
              ))
            )}
          </>
        ) : (
          <>
            {discoverUsers.length === 0 ? (
              <EmptyState
                theme={theme}
                icon="compass-outline"
                title="No other users yet"
                subtitle="You are one of the first CalFit members. Invite friends and they will appear here."
              />
            ) : (
              <>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  New on CalFit
                </Text>
                <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
                  Follow members to see their workouts and milestones in your feed.
                </Text>
                {discoverUsers.map((u) => (
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
                      navigation.navigate('Profile' as never, { userId: u.id } as never)
                    }
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

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
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  liveDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 6, right: 6,
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