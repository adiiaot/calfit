import {
  View, Text, StyleSheet, Alert,
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
import { pickStoryImage, uploadStoryImage, createManualStory } from '../../modules/social/services/storyService';

import { PostCard } from '../../modules/social/components/postCard';
import { ComposeBox } from '../../modules/social/components/composeBox';
import { CommentSheet } from '../../modules/social/components/commentSheet';
import { StoryRow } from '../../modules/social/components/storyRow';
import { DiscoverUserCard } from '../../modules/social/components/discoverUserCard';
import { EmptyState } from '../../modules/shared/EmptyState';

import { useFeed } from '../../modules/social/hooks/useFeed';
import { useFollow } from '../../modules/social/hooks/useFollow';
import { usePost } from '../../modules/social/hooks/usePost';

// Communities tab — embed existing CommunityScreen inline
import CommunityScreen from '../../modules/community/screens/CommunityScreen';

interface DiscoverUser {
  id: string;
  name: string;
  calfitId: string;
  avatar: string | null;
  goal: string;
  isFollowing: boolean;
}

// CHANGED: Tabs are now 'Feed' (was 'Following'), 'Discover', 'Communities'
type SocialTab = 'Feed' | 'Discover' | 'Communities';

export default function CalFitSocialScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<SocialTab>('Feed');
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);
  const [uploadingStory, setUploadingStory] = useState(false);

  const name = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatar = (profile as any)?.avatar_url ?? null;

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

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadDiscoverUsers();
    }, [user?.id])
  );

  const loadDiscoverUsers = async () => {
    if (!user?.id) return;
    try {
      const [profilesRes, followsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, calfit_id, avatar_url, goal')
          .neq('id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
      ]);

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
            isFollowing: followingSet.has(u.id),
          }))
        );
      }
    } catch (error) {
      console.error('loadDiscoverUsers error:', error);
    }
  };

  const handleAddStory = async () => {
    const imageUri = await pickStoryImage();
    if (!imageUri || !user?.id) return;
    setUploadingStory(true);
    try {
      const { moderateImage } = await import('../../modules/social/services/moderationService');
      const modResult = await moderateImage(imageUri);
      if (!modResult.safe) {
        setUploadingStory(false);
        Alert.alert('Image not allowed', modResult.reason ?? 'This image violates our community guidelines.');
        return;
      }
      const url = await uploadStoryImage(imageUri, user.id);
      if (url) await createManualStory(user.id, url);
    } catch (e) {
      console.error('handleAddStory error:', e);
    } finally {
      setUploadingStory(false);
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
    if (uri) setSelectedImageUri(uri);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { supabase: sb } = await import('../../services/supabase');
      const { error } = await sb.from('posts').delete().eq('id', postId).eq('user_id', user?.id);
      if (!error) updatePost(postId, { _deleted: true } as any);
    } catch (e) { console.error('deletePost error', e); }
  };

  const handleEditPost = (postId: string, newContent: string) => {
    updatePost(postId, { content: newContent });
  };

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    setDiscoverUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, isFollowing: !currentlyFollowing } : u)
    );
    const success = await toggleFollow(userId, currentlyFollowing);
    if (!success) {
      setDiscoverUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, isFollowing: currentlyFollowing } : u)
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

  // ── TAB PILL RENDERER ────────────────────────────────────────
  const TABS: SocialTab[] = ['Feed', 'Discover', 'Communities'];

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* HEADER — removed community icon button (now a tab), kept Live + Messages */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Social</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Live' as never)}
            style={[styles.headerBtn, {
              backgroundColor: (theme as any).red + '18',
              borderColor: (theme as any).red,
            }]}
          >
            <View style={[styles.liveDot, { backgroundColor: (theme as any).red }]} />
            <Ionicons name="radio-outline" size={20} color={(theme as any).red} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3-TAB TOGGLE: Feed | Discover | Communities */}
      <View style={[styles.tabToggle, { borderBottomColor: theme.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
          >
            <Text style={[
              styles.tabBtnText,
              { color: activeTab === tab ? theme.accent : theme.textMuted },
              activeTab === tab && { fontWeight: '700' },
            ]}>
              {tab}
            </Text>
            {activeTab === tab && (
              <View style={[styles.tabUnderline, { backgroundColor: theme.accent }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* COMMUNITIES TAB — renders CommunityScreen directly */}
      {activeTab === 'Communities' ? (
        <CommunityScreen />
      ) : (
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
          {/* Stories row — only on Feed tab */}
          {activeTab === 'Feed' && (
            <StoryRow
              theme={theme}
              stories={[]}
              currentUserName={name}
              currentUserAvatar={avatar}
              onAddStory={handleAddStory}
            />
          )}

          {/* FEED TAB (was 'Following') */}
          {activeTab === 'Feed' && (
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

              {moderationError && (
                <View style={[styles.errorBanner, { backgroundColor: (theme as any).red + '18' }]}>
                  <Text style={[styles.errorText, { color: (theme as any).red }]}>{moderationError}</Text>
                  <TouchableOpacity onPress={clearModerationError}>
                    <Ionicons name="close" size={16} color={(theme as any).red} />
                  </TouchableOpacity>
                </View>
              )}

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
                    onComment={(p) => { setSelectedPost(p); setShowComments(true); }}
                    onShare={handleShare}
                    onDelete={handleDeletePost}
                    onEditComplete={handleEditPost}
                    onProfilePress={(userId) =>
                      navigation.navigate('Profile' as never, { userId } as never)
                    }
                  />
                ))
              )}
            </>
          )}

          {/* DISCOVER TAB */}
          {activeTab === 'Discover' && (
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
      )}

      <CommentSheet
        theme={theme}
        post={selectedPost}
        visible={showComments}
        currentUserId={user?.id ?? ''}
        currentUserName={name}
        currentUserAvatar={avatar}
        onClose={() => { setShowComments(false); setSelectedPost(null); }}
      />
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800' },
  headerRight: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },

  // 3-tab underline style
  tabToggle: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    position: 'relative',
  },
  tabBtnActive: {},
  tabBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2,
    borderRadius: 2,
  },

  scrollContent: { paddingBottom: 120 },

  sectionLabel: {
    fontSize: fontSize.base,
    fontWeight: '700',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: fontSize.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  errorText: { fontSize: fontSize.sm, flex: 1, marginRight: spacing.sm },
});