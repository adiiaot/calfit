import {
  View, StyleSheet,
  ScrollView, TouchableOpacity, Text,
  Image, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { AndroidSafeView } from '../../shared/AndriodSafeView';
import { useState, useCallback } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { ProfileHeader } from '../components/profileHeader';
import { isFollowing, followUser, unfollowUser, getFollowCounts } from '../services/followService';
import { loadUserPosts, PostData } from '../services/postService';
import { getOrCreateConversation } from '../../chat/services/chatServices';
import { supabase } from '../../../services/supabase';
import PRShowcaseCard from '../../../components/Prshowcasecard';

const GRID_SIZE = (Dimensions.get('window').width - spacing.lg * 2 - spacing.xs * 2) / 3;

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile: currentProfile } = useAuthStore();
  const theme = colors[colorScheme];

  const targetUserId = route.params?.userId ?? user?.id;
  const isCurrentUser = targetUserId === user?.id;

  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [followingUser, setFollowingUser] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [targetUserId])
  );

  const load = async () => {
    setIsLoading(true);

    if (isCurrentUser && currentProfile) {
      const counts = await getFollowCounts(user!.id);
      setProfileData({
        id: user?.id,
        full_name: currentProfile.full_name,
        calfit_id: (currentProfile as any).calfit_id,
        avatar_url: (currentProfile as any).avatar_url,
        goal: (currentProfile as any).goal,
        bio: (currentProfile as any).bio,
        streak_count: (currentProfile as any).streak_count ?? 0,
      });
      const postsRes = await loadUserPosts(user!.id);
      setPosts(postsRes);
      setFollowCounts(counts);
      setIsLoading(false);
      return;
    }

    const [profileRes, postsRes, counts] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, calfit_id, avatar_url, goal, streak_count')
        .eq('id', targetUserId)
        .single(),
      loadUserPosts(targetUserId),
      getFollowCounts(targetUserId),
    ]);

    if (profileRes.error) {
      console.error('ProfileScreen load error:', profileRes.error.message);
    }

    const rawProfile = profileRes.data;
    setProfileData(rawProfile
      ? {
          ...rawProfile,
          full_name: rawProfile.full_name
            || rawProfile.calfit_id
            || targetUserId.slice(0, 8),
        }
      : null
    );
    setPosts(postsRes);
    setFollowCounts(counts);

    if (user?.id) {
      const isF = await isFollowing(user.id, targetUserId);
      setFollowingUser(isF);
    }

    setIsLoading(false);
  };

  const handleFollow = async () => {
    if (!user?.id) return;
    if (followingUser) {
      setFollowingUser(false);
      setFollowCounts((prev) => ({ ...prev, followers: Math.max(prev.followers - 1, 0) }));
      await unfollowUser(user.id, targetUserId);
    } else {
      setFollowingUser(true);
      setFollowCounts((prev) => ({ ...prev, followers: prev.followers + 1 }));
      await followUser(user.id, targetUserId);
    }
  };

  const handleMessage = async () => {
    if (!user?.id) return;
    const convId = await getOrCreateConversation(user.id, targetUserId);
    if (convId) {
      navigation.navigate('Chat', {
        conversationId: convId,
        otherUserId: targetUserId,
        otherUserName: profileData?.full_name ?? 'User',
        otherUserCalfitId: profileData?.calfit_id ?? '',
        otherUserAvatar: profileData?.avatar_url ?? null,
        otherUserGoal: profileData?.goal ?? '',
        otherUserStreak: profileData?.streak_count ?? 0,
      });
    }
  };

  if (isLoading) {
    return (
      <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </AndroidSafeView>
    );
  }

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {profileData?.calfit_id ? `@${profileData.calfit_id}` : 'Profile'}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader
          theme={theme}
          name={profileData?.full_name ?? 'CalFit User'}
          calfitId={profileData?.calfit_id ?? ''}
          avatarUrl={profileData?.avatar_url ?? null}
          goal={profileData?.goal ?? 'Get Fit'}
          bio=""
          streakCount={profileData?.streak_count ?? 0}
          followersCount={followCounts.followers}
          followingCount={followCounts.following}
          postsCount={posts.length}
          isCurrentUser={isCurrentUser}
          isFollowing={followingUser}
          onFollowPress={handleFollow}
          onMessagePress={handleMessage}
          onEditPress={() => navigation.navigate('EditProfile')}
        />

        {/* ── PERSONAL RECORDS SHOWCASE ─────────────────────── */}
        {/* Shows only when the user has completed workouts with PRs */}
        <PRShowcaseCard userId={targetUserId} theme={theme} />

        {/* ── POST GRID ─────────────────────────────────────── */}
        <View style={styles.gridSection}>
          <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>
            Posts
          </Text>
          {posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="images-outline" size={32} color={theme.textMuted} />
              <Text style={[styles.emptyPostsText, { color: theme.textMuted }]}>
                No posts yet
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {posts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={[styles.gridCell, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  {post.image_url ? (
                    <Image source={{ uri: post.image_url }} style={styles.gridImage} />
                  ) : (
                    <View style={[styles.gridTextCell, { backgroundColor: theme.surface }]}>
                      <Text
                        style={[styles.gridCellText, { color: theme.textSecondary }]}
                        numberOfLines={3}
                      >
                        {post.content}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: fontSize.base, fontWeight: '700' },
  gridSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  gridLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  gridCell: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
  },
  gridImage: { width: '100%', height: '100%' },
  gridTextCell: {
    flex: 1,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellText: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyPostsText: { fontSize: fontSize.sm },
});