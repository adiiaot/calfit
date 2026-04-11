import {
  View, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, Text,
  FlatList, Image, ActivityIndicator,
  Dimensions,
} from 'react-native';
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
  const [following, setFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [targetUserId])
  );

  const load = async () => {
    setIsLoading(true);
    const [profileRes, postsRes, counts] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, calfit_id, avatar_url, goal, bio, streak_count')
        .eq('id', targetUserId)
        .single(),
      loadUserPosts(targetUserId),
      getFollowCounts(targetUserId),
    ]);

    setProfileData(profileRes.data);
    setPosts(postsRes);
    setFollowCounts(counts);

    if (!isCurrentUser && user?.id) {
      const following = await isFollowing(user.id, targetUserId);
      setFollowing(following);
    }
    setIsLoading(false);
  };

  const handleFollow = async () => {
    if (!user?.id) return;
    if (following) {
      await unfollowUser(user.id, targetUserId);
      setFollowing(false);
      setFollowCounts((prev) => ({
        ...prev,
        followers: prev.followers - 1,
      }));
    } else {
      await followUser(user.id, targetUserId);
      setFollowing(true);
      setFollowCounts((prev) => ({
        ...prev,
        followers: prev.followers + 1,
      }));
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
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
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
          avatarUrl={profileData?.avatar_url}
          bio={profileData?.bio}
          goal={profileData?.goal}
          followersCount={followCounts.followers}
          followingCount={followCounts.following}
          postsCount={posts.length}
          streakCount={profileData?.streak_count ?? 0}
          isCurrentUser={isCurrentUser}
          isFollowing={following}
          onFollowPress={handleFollow}
          onMessagePress={handleMessage}
          onEditPress={() => navigation.navigate('EditProfile')}
        />

        {/* Post grid */}
        {posts.length === 0 ? (
          <View style={styles.noPosts}>
            <Ionicons name="grid-outline" size={32} color={theme.textMuted} />
            <Text style={[styles.noPostsText, { color: theme.textMuted }]}>
              No posts yet
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {posts.map((post) => (
              <TouchableOpacity key={post.id} style={styles.gridItem}>
                {post.image_url ? (
                  <Image
                    source={{ uri: post.image_url }}
                    style={[styles.gridImage, { backgroundColor: theme.border }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.gridTextPost, {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  }]}>
                    <Text
                      style={[styles.gridTextContent, { color: theme.textPrimary }]}
                      numberOfLines={4}
                    >
                      {post.content}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: fontSize.base, fontWeight: '700' },
  noPosts: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  noPostsText: { fontSize: fontSize.base },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  gridImage: { width: '100%', height: '100%' },
  gridTextPost: {
    width: '100%',
    height: '100%',
    padding: spacing.xs,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  gridTextContent: { fontSize: 9, lineHeight: 13 },
});