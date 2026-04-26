import {
  View, Text, StyleSheet, Alert,
  ScrollView, TouchableOpacity, RefreshControl,
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
import { supabase } from '../../services/supabase';

import { PostCard } from '../../modules/social/components/postCard';
import { ComposeBox } from '../../modules/social/components/composeBox';
import { CommentSheet } from '../../modules/social/components/commentSheet';
import { StoryRow } from '../../modules/social/components/storyRow';
import { DiscoverUserCard } from '../../modules/social/components/discoverUserCard';
import { EmptyState } from '../../modules/shared/EmptyState';
import CommunityScreen from '../../modules/community/screens/CommunityScreen';

import { useFeed } from '../../modules/social/hooks/useFeed';
import { useFollow } from '../../modules/social/hooks/useFollow';
import { usePost } from '../../modules/social/hooks/usePost';

interface DiscoverUser {
  id: string; name: string; calfitId: string;
  avatar: string | null; goal: string; isFollowing: boolean;
}

type SocialTab = 'Feed' | 'Discover' | 'Communities';

export default function CalFitSocialScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab]       = useState<SocialTab>('Feed');
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);

  const name   = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatar = (profile as any)?.avatar_url ?? null;

  const { posts, isRefreshing, refresh, updatePost, prependPost } = useFeed(user?.id ?? '');
  const { toggle: toggleFollow } = useFollow(user?.id ?? '');
  const { post: createPost, like, selectImage, isPosting, isUploadingImage, moderationError, clearModerationError } = usePost(user?.id ?? '');

  useFocusEffect(useCallback(() => { loadDiscoverUsers(); }, [user?.id]));

  const loadDiscoverUsers = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.from('profiles').select('id, full_name, calfit_id, avatar_url, goal')
        .neq('id', user.id).limit(20);
      if (!data) return;
      const { data: followingData } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
      const followingIds = new Set((followingData ?? []).map((f: any) => f.following_id));
      setDiscoverUsers(data.map((u: any) => ({
        id: u.id, name: u.full_name ?? u.calfit_id ?? 'CalFit User',
        calfitId: u.calfit_id ?? '', avatar: u.avatar_url ?? null,
        goal: u.goal ?? '', isFollowing: followingIds.has(u.id),
      })));
    } catch {}
  };

  const handlePost = async (content: string, postType: string) => {
    const newPost = await createPost(content, postType as any, selectedImageUri ?? undefined);
    if (newPost) { prependPost(newPost); setSelectedImageUri(null); }
  };

  const handlePickImage = async () => {
    const uri = await selectImage();
    if (uri) setSelectedImageUri(uri);
  };

  const handleLike = async (post: PostData) => {
    const wasLiked = post.is_liked_by_me;
    updatePost(post.id, { is_liked_by_me: !wasLiked, likes_count: post.likes_count + (wasLiked ? -1 : 1) });
    await like(post.id, wasLiked);
  };

  const handleDeletePost = async (postId: string) => {
    try { await supabase.from('posts').delete().eq('id', postId); } catch {}
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    try { await supabase.from('posts').update({ content: newContent }).eq('id', postId); } catch {}
  };

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    setDiscoverUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isFollowing: !currentlyFollowing } : u));
    const success = await toggleFollow(userId, currentlyFollowing);
    if (!success) setDiscoverUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isFollowing: currentlyFollowing } : u));
  };

  const handleRefresh = async () => { await refresh(); await loadDiscoverUsers(); };
  const handleShare   = async (post: PostData) => { await sharePost(post); };

  const handleAddStory = async () => {
    try {
      const { pickStoryImage, uploadStoryImage, createManualStory } = await import('../../modules/social/services/storyService');
      const uri = await pickStoryImage();
      if (!uri || !user?.id) return;
      const url = await uploadStoryImage(uri, user.id);
      if (url) await createManualStory(user.id, url);
    } catch {}
  };

  const TABS: SocialTab[] = ['Feed', 'Discover', 'Communities'];

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      {/* Gradient header */}
      <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.header}>
        <Text style={styles.headerTitle}>Social</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Live' as never)}
          style={[styles.liveBtn, { backgroundColor: 'rgba(255,59,48,0.20)', borderColor: 'rgba(255,59,48,0.40)' }]}>
          <View style={styles.liveDot} />
          <Ionicons name="radio-outline" size={18} color="#FF3B30" />
          <Text style={styles.liveBtnText}>Live</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && { borderBottomColor: theme.accent }]}>
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.accent : theme.textMuted },
              activeTab === tab && { fontWeight: '700' }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Communities tab renders inline */}
      {activeTab === 'Communities' ? (
        <CommunityScreen />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} colors={[theme.accent]} />}>

          {/* FEED */}
          {activeTab === 'Feed' && (
            <>
              <StoryRow theme={theme} stories={[]} currentUserName={name} currentUserAvatar={avatar} onAddStory={handleAddStory} />
              <ComposeBox theme={theme} avatarUrl={avatar} userName={name} isPosting={isPosting || isUploadingImage}
                selectedImageUri={selectedImageUri} onPost={handlePost} onAddImage={handlePickImage} onRemoveImage={() => setSelectedImageUri(null)} />
              {moderationError && (
                <View style={[styles.errorBanner, { backgroundColor: '#FF3B30' + '18', borderColor: '#FF3B30' + '44' }]}>
                  <Text style={[styles.errorText, { color: '#FF3B30' }]}>{moderationError}</Text>
                  <TouchableOpacity onPress={clearModerationError}><Ionicons name="close" size={16} color="#FF3B30" /></TouchableOpacity>
                </View>
              )}
              {posts.length === 0 ? (
                <EmptyState theme={theme} icon="people-outline" title="Your feed is empty"
                  subtitle="Follow other CalFit members to see their workouts and milestones here."
                  buttonLabel="Find People to Follow" onButtonPress={() => setActiveTab('Discover')} />
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} theme={theme} currentUserId={user?.id}
                    currentUserName={name} onLike={handleLike}
                    onComment={(p) => { setSelectedPost(p); setShowComments(true); }}
                    onShare={handleShare} onDelete={handleDeletePost} onEditComplete={handleEditPost}
                    onProfilePress={(userId) => navigation.navigate('Profile' as never, { userId } as never)} />
                ))
              )}
            </>
          )}

          {/* DISCOVER */}
          {activeTab === 'Discover' && (
            <>
              {discoverUsers.length === 0 ? (
                <EmptyState theme={theme} icon="compass-outline" title="No other users yet"
                  subtitle="You are one of the first CalFit members. Invite friends and they will appear here." />
              ) : (
                <>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>New on CalFit</Text>
                  <Text style={[styles.sectionHint, { color: theme.textMuted }]}>Follow members to see their workouts in your feed.</Text>
                  {discoverUsers.map((u) => (
                    <DiscoverUserCard key={u.id} userId={u.id} name={u.name} calfitId={u.calfitId}
                      avatarUrl={u.avatar} goal={u.goal} isFollowing={u.isFollowing} theme={theme}
                      onFollow={() => handleFollow(u.id, u.isFollowing)}
                      onProfilePress={() => navigation.navigate('Profile' as never, { userId: u.id } as never)} />
                  ))}
                </>
              )}
            </>
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <CommentSheet theme={theme} post={selectedPost} visible={showComments}
        currentUserId={user?.id ?? ''} currentUserName={name}
        onClose={() => { setShowComments(false); setSelectedPost(null); }}
        onCommentAdded={(postId) => updatePost(postId, { comments_count: (selectedPost?.comments_count ?? 0) + 1 })} />
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: '#fff' },
  liveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 99, borderWidth: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' },
  liveBtnText: { fontSize: fontSize.xs, fontWeight: '700', color: '#FF3B30' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabText: { fontSize: fontSize.sm },
  scrollContent: { paddingBottom: 60 },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: '700', marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.xs },
  sectionHint: { fontSize: fontSize.xs, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  errorBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: 10, borderWidth: 1 },
  errorText: { fontSize: fontSize.sm, flex: 1 },
});