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
import CommunityScreen from '../../modules/community/screens/CommunityScreen';
import { UserAvatar } from '../../modules/shared/UserAvatar';

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
// Shown after image is picked so user can optionally add a caption
function StoryCaptionModal({
  theme,
  visible,
  imageUri,
  onPost,
  onCancel,
  isUploading,
}: {
  theme: typeof colors.dark;
  visible: boolean;
  imageUri: string | null;
  onPost: (caption: string) => void;
  onCancel: () => void;
  isUploading: boolean;
}) {
  const [caption, setCaption] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={storyStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[storyStyles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[storyStyles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onCancel} disabled={isUploading}>
              <Text style={[storyStyles.cancel, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[storyStyles.title, { color: theme.textPrimary }]}>New Story</Text>
            <TouchableOpacity
              onPress={() => { onPost(caption.trim()); setCaption(''); }}
              disabled={isUploading}
              style={[storyStyles.postBtn, { backgroundColor: theme.accent }]}
            >
              {isUploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={storyStyles.postBtnText}>Share</Text>}
            </TouchableOpacity>
          </View>

          {/* Preview */}
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={storyStyles.preview}
              resizeMode="cover"
            />
          )}

          {/* Caption input */}
          <View style={[storyStyles.inputWrap, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption… (optional)"
              placeholderTextColor={theme.textMuted}
              style={[storyStyles.input, { color: theme.textPrimary }]}
              multiline
              maxLength={200}
            />
          </View>
          <Text style={[storyStyles.hint, { color: theme.textMuted }]}>
            Stories expire after 24 hours
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const storyStyles = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:     { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, overflow: 'hidden' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1 },
  cancel:    { fontSize: fontSize.base },
  title:     { fontSize: fontSize.base, fontWeight: '700' },
  postBtn:   { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 99 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  preview:   { width: '100%', height: 260 },
  inputWrap: { margin: spacing.md, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  input:     { fontSize: fontSize.base, minHeight: 60 },
  hint:      { textAlign: 'center', fontSize: fontSize.xs, marginBottom: spacing.md },
});

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function CalFitSocialScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab]           = useState<SocialTab>('Feed');
  const [selectedPost, setSelectedPost]     = useState<PostData | null>(null);
  const [showComments, setShowComments]     = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [discoverUsers, setDiscoverUsers]   = useState<DiscoverUser[]>([]);
  const [stories, setStories]               = useState<StoryData[]>([]);

  // Story upload state
  const [storyPickedUri, setStoryPickedUri] = useState<string | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  const name   = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatar = (profile as any)?.avatar_url ?? null;

  // ── useFeed from the real hook — updatePost(id, partial) ───
  const { posts, isRefreshing, refresh, updatePost, prependPost } = useFeed(user?.id ?? '');
  const { toggle: toggleFollow } = useFollow(user?.id ?? '');
  const { post: createPost, like, selectImage, isPosting, isUploadingImage, moderationError, clearModerationError } = usePost(user?.id ?? '');

  // Load stories + discover users on focus
  useFocusEffect(useCallback(() => {
    if (user?.id) {
      loadDiscoverUsers();
      loadStories();
    }
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
        .from('profiles')
        .select('id, full_name, calfit_id, avatar_url, goal')
        .neq('id', user.id)
        .limit(20);
      if (!data) return;
      const { data: followingData } = await supabase
        .from('follows').select('following_id').eq('follower_id', user.id);
      const followingIds = new Set((followingData ?? []).map((f: any) => f.following_id));
      setDiscoverUsers(data.map((u: any) => ({
        id: u.id,
        name:     u.full_name ?? u.calfit_id ?? 'CalFit User',
        calfitId: u.calfit_id ?? '',
        avatar:   u.avatar_url ?? null,
        goal:     u.goal ?? '',
        isFollowing: followingIds.has(u.id),
      })));
    } catch {}
  };

  // ── HANDLERS ──────────────────────────────────────────────
  const handlePost = async (content: string, postType: string) => {
    const newPost = await createPost(content, postType as any, selectedImageUri ?? undefined);
    if (newPost) { prependPost(newPost); setSelectedImageUri(null); }
  };

  const handlePickImage = async () => {
    const uri = await selectImage();
    if (uri) setSelectedImageUri(uri);
  };

  // FIXED: signature matches what PostCard calls — (postId: string, isLiked: boolean)
  const handleLike = async (postId: string, isLiked: boolean) => {
    updatePost(postId, {
      is_liked: !isLiked,
      likes_count: (posts.find((p) => p.id === postId)?.likes_count ?? 0) + (isLiked ? -1 : 1),
    });
    await like(postId, isLiked);
  };

  const handleDeletePost = async (postId: string) => {
    try { await supabase.from('posts').delete().eq('id', postId); } catch {}
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    try { await supabase.from('posts').update({ content: newContent }).eq('id', postId); } catch {}
  };

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    setDiscoverUsers((prev) => prev.map((u) =>
      u.id === userId ? { ...u, isFollowing: !currentlyFollowing } : u
    ));
    const success = await toggleFollow(userId, currentlyFollowing);
    if (!success) {
      setDiscoverUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, isFollowing: currentlyFollowing } : u
      ));
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refresh(), loadDiscoverUsers(), loadStories()]);
  };

  const handleShare = async (post: PostData) => { await sharePost(post); };

  // ── STORY UPLOAD ──────────────────────────────────────────
  // Step 1: pick image → show caption modal
  const handleAddStory = async () => {
    try {
      const { pickStoryImage } = await import('../../modules/social/services/storyService');
      const uri = await pickStoryImage();
      if (!uri) return;
      setStoryPickedUri(uri);
      setShowStoryModal(true);
    } catch {}
  };

  // Step 2: user confirms caption → upload + create story
  const handlePostStory = async (caption: string) => {
    if (!user?.id || !storyPickedUri) return;
    setIsUploadingStory(true);
    try {
      const { uploadStoryImage, createManualStory } = await import('../../modules/social/services/storyService');
      const url = await uploadStoryImage(storyPickedUri, user.id);
      if (url) {
        await createManualStory(user.id, url, caption || undefined);
        await loadStories(); // refresh story row
      }
    } catch (e) {
      Alert.alert('Upload failed', 'Could not post your story. Please try again.');
    } finally {
      setIsUploadingStory(false);
      setShowStoryModal(false);
      setStoryPickedUri(null);
    }
  };

  const TABS: SocialTab[] = ['Feed', 'Discover', 'Communities'];

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* ── GRADIENT HEADER ── */}
      <LinearGradient
        colors={[theme.gradStart ?? '#1A1040', '#2A1F6B'] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerTitle}>Social</Text>
          <Text style={styles.headerSub}>Connect · Inspire · Grow</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Notifications shortcut */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications' as never)}
            style={styles.headerIconBtn}
          >
            <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          {/* Live button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Live' as never)}
            style={styles.liveBtn}
          >
            <View style={styles.liveDot} />
            <Ionicons name="radio-outline" size={16} color="#FF3B30" />
            <Text style={styles.liveBtnText}>Live</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── TAB BAR ── */}
      <View style={[styles.tabBar, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && { borderBottomColor: theme.accent }]}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? theme.accent : theme.textMuted },
              activeTab === tab && { fontWeight: '700' },
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── COMMUNITIES tab renders inline (no extra nav) ── */}
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

          {/* ── FEED TAB ── */}
          {activeTab === 'Feed' && (
            <>
              {/* Story row — real stories + add-story card */}
              <StoryRow
                theme={theme}
                stories={stories}
                currentUserName={name}
                currentUserAvatar={avatar}
                onAddStory={handleAddStory}
              />

              {/* Compose box */}
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

              {/* Moderation error banner */}
              {moderationError && (
                <View style={[styles.errorBanner, {
                  backgroundColor: '#FF3B30' + '18',
                  borderColor: '#FF3B30' + '44',
                }]}>
                  <Ionicons name="warning-outline" size={16} color="#FF3B30" />
                  <Text style={[styles.errorText, { color: '#FF3B30' }]}>{moderationError}</Text>
                  <TouchableOpacity onPress={clearModerationError}>
                    <Ionicons name="close" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Posts */}
              {posts.length === 0 ? (
                <EmptyState
                  theme={theme}
                  icon="people-outline"
                  title="Your feed is quiet"
                  subtitle="Follow other CalFit members to see their workouts and milestones here — or post something yourself!"
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
              {/* Section header */}
              <View style={styles.discoverHeader}>
                <View style={[styles.discoverHeaderIcon, { backgroundColor: theme.accentDim as string }]}>
                  <Ionicons name="compass" size={18} color={theme.accent} />
                </View>
                <View>
                  <Text style={[styles.discoverTitle, { color: theme.textPrimary }]}>
                    Find Your People
                  </Text>
                  <Text style={[styles.discoverSub, { color: theme.textMuted }]}>
                    Follow members to see their activity in your feed
                  </Text>
                </View>
              </View>

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
      {/* CommentSheet does NOT have onCommentAdded prop — removed to match interface */}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 1,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(255,59,48,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.35)',
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  liveBtnText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: '#FF3B30',
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // Scroll
  scrollContent: {
    paddingBottom: 40,
  },

  // Error banner
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

  // Discover section header
  discoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  discoverHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  discoverSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});