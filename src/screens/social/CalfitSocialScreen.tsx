import {
  View, Text, StyleSheet, Alert,
  ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Image, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { PostData, sharePost } from '../../modules/social/services/postService';
import { StoryData } from '../../modules/social/services/storyService';
import { supabase } from '../../services/supabase';

import { PostCard } from '../../modules/social/components/postCard';
import { ComposeBox } from '../../modules/social/components/composeBox';
import { CommentSheet } from '../../modules/social/components/commentSheet';
import { StoryRow } from '../../modules/social/components/storyRow';
import { DiscoverUserCard } from '../../modules/social/components/discoverUserCard';
import { EmptyState } from '../../modules/shared/EmptyState';
import { SocialCommunitiesTab } from '../../modules/social/components/SocialCommunitiesTab';

import { useFeed } from '../../modules/social/hooks/useFeed';
import { useFollow } from '../../modules/social/hooks/useFollow';
import { usePost } from '../../modules/social/hooks/usePost';

// ── TYPES ─────────────────────────────────────────────────────
interface DiscoverUser {
  id: string; name: string; calfitId: string;
  avatar: string | null; goal: string; isFollowing: boolean;
}
type SocialTab = 'Feed' | 'Discover' | 'Communities';

// ── STORY CAPTION MODAL ───────────────────────────────────────
function StoryCaptionModal({
  theme, visible, imageUri, onPost, onCancel, isUploading,
}: {
  theme: typeof colors.dark; visible: boolean; imageUri: string | null;
  onPost: (caption: string) => void; onCancel: () => void; isUploading: boolean;
}) {
  const [caption, setCaption] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={ss.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[ss.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[ss.sheetHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onCancel} disabled={isUploading}>
              <Text style={[ss.cancel, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[ss.sheetTitle, { color: theme.textPrimary }]}>New Story</Text>
            <TouchableOpacity
              onPress={() => { onPost(caption.trim()); setCaption(''); }}
              disabled={isUploading}
              style={[ss.shareBtn, { backgroundColor: theme.accent }]}
            >
              {isUploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={ss.shareBtnText}>Share</Text>}
            </TouchableOpacity>
          </View>
          {imageUri && <Image source={{ uri: imageUri }} style={ss.preview} resizeMode="cover" />}
          <View style={[ss.inputWrap, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <TextInput
              value={caption} onChangeText={setCaption}
              placeholder="Add a caption… (optional)"
              placeholderTextColor={theme.textMuted}
              style={[ss.input, { color: theme.textPrimary }]}
              multiline maxLength={200}
            />
          </View>
          <Text style={[ss.hint, { color: theme.textMuted }]}>Stories expire after 24 hours</Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ss = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, overflow: 'hidden' },
  sheetHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1 },
  cancel:     { fontSize: fontSize.base },
  sheetTitle: { fontSize: fontSize.base, fontWeight: '700' },
  shareBtn:   { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 99 },
  shareBtnText:{ color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  preview:    { width: '100%', height: 260 },
  inputWrap:  { margin: spacing.md, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  input:      { fontSize: fontSize.base, minHeight: 60 },
  hint:       { textAlign: 'center', fontSize: fontSize.xs, marginBottom: spacing.md },
});

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function CalFitSocialScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab]             = useState<SocialTab>('Feed');
  const [selectedPost, setSelectedPost]       = useState<PostData | null>(null);
  const [showComments, setShowComments]       = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [discoverUsers, setDiscoverUsers]     = useState<DiscoverUser[]>([]);
  const [stories, setStories]                 = useState<StoryData[]>([]);
  const [storyPickedUri, setStoryPickedUri]   = useState<string | null>(null);
  const [showStoryModal, setShowStoryModal]   = useState(false);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  // ── Feed: uses existing useFeed (followed posts + own posts) ─
  // Discover tab shows ALL users not being followed
  const [allPosts, setAllPosts]               = useState<PostData[]>([]);

  const name   = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatar = (profile as any)?.avatar_url ?? null;

  const { posts, discoverPosts, isRefreshing, refresh, updatePost, prependPost } = useFeed(user?.id ?? '');
  const { toggle: toggleFollow } = useFollow(user?.id ?? '');
  const { post: createPost, like, selectImage, isPosting, isUploadingImage, moderationError, clearModerationError } = usePost(user?.id ?? '');

  useFocusEffect(useCallback(() => {
    if (user?.id) { loadDiscoverUsers(); loadStories(); loadAllPosts(); }
  }, [user?.id]));

  // ── LOADERS ───────────────────────────────────────────────
  const loadStories = async () => {
    if (!user?.id) return;
    try {
      const { loadStories: fetchStories } = await import('../../modules/social/services/storyService');
      const data = await fetchStories(user.id);
      setStories(data);
    } catch {}
  };

  const loadDiscoverUsers = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('profiles').select('id, full_name, calfit_id, avatar_url, goal')
        .neq('id', user.id).limit(30);
      if (!data) return;
      const { data: followingData } = await supabase
        .from('follows').select('following_id').eq('follower_id', user.id);
      const followingIds = new Set((followingData ?? []).map((f: any) => f.following_id));
      setDiscoverUsers(data.map((u: any) => ({
        id: u.id, name: u.full_name ?? u.calfit_id ?? 'CalFit User',
        calfitId: u.calfit_id ?? '', avatar: u.avatar_url ?? null,
        goal: u.goal ?? '', isFollowing: followingIds.has(u.id),
      })));
    } catch {}
  };

  // ── Load ALL public posts (not just followed) for the Feed ─
  // This fixes the "can't see other users posts" problem.
  // When the user has few follows, we mix in public posts so the
  // feed is never empty. Uses a separate query outside useFeed.
  const loadAllPosts = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('posts')
        .select(`
          id, user_id, content, type, image_url,
          likes_count, comments_count, moderation_status, created_at,
          profiles:user_id (full_name, calfit_id, avatar_url, goal)
        `)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(40);
      if (!data) return;

      // Check which posts current user has liked
      const ids = (data as any[]).map((p) => p.id);
      const { data: likedData } = await supabase
        .from('post_likes').select('post_id')
        .eq('user_id', user.id).in('post_id', ids);
      const likedSet = new Set(((likedData ?? []) as any[]).map((l) => l.post_id));

      setAllPosts((data as any[]).map((p) => ({
        ...p,
        is_liked: likedSet.has(p.id),
        profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
      })));
    } catch {}
  };

  // ── HANDLERS ──────────────────────────────────────────────
  const handlePost = async (content: string, postType: string) => {
    const newPost = await createPost(content, postType as any, selectedImageUri ?? undefined);
    if (newPost) { prependPost(newPost); setSelectedImageUri(null); loadAllPosts(); }
  };

  const handlePickImage = async () => {
    const uri = await selectImage();
    if (uri) setSelectedImageUri(uri);
  };

  // Matches exactly what PostCard calls: onLike(post.id, post.is_liked ?? false)
  const handleLike = async (postId: string, isLiked: boolean) => {
    const delta = isLiked ? -1 : 1;
    // Update both state arrays optimistically
    updatePost(postId, {
      is_liked: !isLiked,
      likes_count: ((posts.find((p) => p.id === postId) ?? allPosts.find((p) => p.id === postId))?.likes_count ?? 0) + delta,
    } as Partial<PostData>);
    setAllPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, is_liked: !isLiked, likes_count: (p.likes_count ?? 0) + delta } : p
    ));
    await like(postId, isLiked);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await supabase.from('posts').delete().eq('id', postId);
      setAllPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {}
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    try { await supabase.from('posts').update({ content: newContent }).eq('id', postId); } catch {}
  };

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    setDiscoverUsers((prev) => prev.map((u) =>
      u.id === userId ? { ...u, isFollowing: !currentlyFollowing } : u
    ));
    const success = await toggleFollow(userId, currentlyFollowing);
    if (!success) setDiscoverUsers((prev) => prev.map((u) =>
      u.id === userId ? { ...u, isFollowing: currentlyFollowing } : u
    ));
  };

  const handleRefresh = async () => {
    await Promise.all([refresh(), loadDiscoverUsers(), loadStories(), loadAllPosts()]);
  };

  const handleShare = async (post: PostData) => { await sharePost(post); };

  const handleAddStory = async () => {
    try {
      const { pickStoryImage } = await import('../../modules/social/services/storyService');
      const uri = await pickStoryImage();
      if (!uri) return;
      setStoryPickedUri(uri);
      setShowStoryModal(true);
    } catch {}
  };

  const handlePostStory = async (caption: string) => {
    if (!user?.id || !storyPickedUri) return;
    setIsUploadingStory(true);
    try {
      const { uploadStoryImage, createManualStory } = await import('../../modules/social/services/storyService');
      const url = await uploadStoryImage(storyPickedUri, user.id);
      if (url) {
        await createManualStory(user.id, url, caption || undefined);
        await loadStories();
      }
    } catch {
      Alert.alert('Upload failed', 'Could not post your story. Please try again.');
    } finally {
      setIsUploadingStory(false);
      setShowStoryModal(false);
      setStoryPickedUri(null);
    }
  };

  // Feed shows: own posts + followed + recent public (allPosts covers all)
  const feedPosts = allPosts;

  const TABS: SocialTab[] = ['Feed', 'Discover', 'Communities'];

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* ── VIBRANT HEADER — pink→orange→yellow from theme ── */}
      <LinearGradient
        colors={[
          theme.gradStart ?? '#FF6B9D',
          theme.gradMid   ?? '#FF8C42',
          theme.gradEnd   ?? '#FFD166',
        ] as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerTitle}>Social</Text>
          <Text style={styles.headerSub}>Connect · Inspire · Grow</Text>
        </View>

        {/* Live button only — no notifications icon */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Live' as never)}
          style={styles.liveBtn}
        >
          <View style={styles.liveDot} />
          <Ionicons name="radio-outline" size={16} color="#fff" />
          <Text style={styles.liveBtnText}>Live</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── COLOURFUL TAB BAR ── */}
      <View style={[styles.tabBar, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        {TABS.map((tab, i) => {
          const tabColors = [
            theme.gradStart ?? '#FF6B9D',
            theme.accent,
            theme.accentSecond,
          ];
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, isActive && { borderBottomColor: tabColors[i] }]}
            >
              <Text style={[
                styles.tabText,
                { color: isActive ? tabColors[i] : theme.textMuted },
                isActive && { fontWeight: '700' },
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── COMMUNITIES renders inline ── */}
      {activeTab === 'Communities' ? (
        <SocialCommunitiesTab theme={theme} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.gradStart ?? theme.accent}
              colors={[theme.gradStart ?? theme.accent]}
            />
          }
        >

          {/* ── FEED TAB ── */}
          {activeTab === 'Feed' && (
            <>
              <StoryRow
                theme={theme}
                stories={stories}
                currentUserName={name}
                currentUserAvatar={avatar}
                onAddStory={handleAddStory}
              />

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
                <View style={[styles.errorBanner, {
                  backgroundColor: '#FF3B30' + '18',
                  borderColor: '#FF3B30' + '55',
                }]}>
                  <Ionicons name="warning-outline" size={16} color="#FF3B30" />
                  <Text style={[styles.errorText, { color: '#FF3B30' }]}>{moderationError}</Text>
                  <TouchableOpacity onPress={clearModerationError}>
                    <Ionicons name="close" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}

              {feedPosts.length === 0 ? (
                <EmptyState
                  theme={theme}
                  icon="people-outline"
                  title="No posts yet"
                  subtitle="Be the first to post something — or follow members to see their updates here."
                  buttonLabel="Discover People"
                  onButtonPress={() => setActiveTab('Discover')}
                />
              ) : (
                feedPosts.map((post) => (
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
                    onProfilePress={(uid) =>
                      navigation.navigate('Profile' as never, { userId: uid } as never)
                    }
                  />
                ))
              )}
            </>
          )}

          {/* ── DISCOVER TAB ── */}
          {activeTab === 'Discover' && (
            <>
              {/* Colourful discover banner */}
              <LinearGradient
                colors={[theme.accentSecond + 'CC', theme.accent + '99'] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.discoverBanner}
              >
                <Ionicons name="compass" size={22} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.discoverBannerTitle}>Find Your People</Text>
                  <Text style={styles.discoverBannerSub}>
                    Follow members to see their activity in your feed
                  </Text>
                </View>
              </LinearGradient>

              {discoverUsers.length === 0 ? (
                <EmptyState
                  theme={theme}
                  icon="compass-outline"
                  title="No other users yet"
                  subtitle="You're among the first CalFit members! Invite friends and they'll appear here."
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
                      navigation.navigate('Profile' as never, { userId: u.id } as never)
                    }
                  />
                ))
              )}
            </>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* ── COMMENT SHEET ── */}
      <CommentSheet
        theme={theme}
        post={selectedPost}
        visible={showComments}
        currentUserId={user?.id ?? ''}
        currentUserName={name}
        currentUserAvatar={avatar}
        onClose={() => { setShowComments(false); setSelectedPost(null); }}
      />

      {/* ── STORY CAPTION MODAL ── */}
      <StoryCaptionModal
        theme={theme}
        visible={showStoryModal}
        imageUri={storyPickedUri}
        isUploading={isUploadingStory}
        onPost={handlePostStory}
        onCancel={() => { setShowStoryModal(false); setStoryPickedUri(null); }}
      />
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.70)',
    marginTop: 1,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  liveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  liveDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  scrollContent: { paddingBottom: 40 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  errorText: {
    fontSize: fontSize.sm,
    flex: 1,
  },

  discoverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  discoverBannerTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: '#fff',
  },
  discoverBannerSub: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.80)',
    marginTop: 2,
  },
});