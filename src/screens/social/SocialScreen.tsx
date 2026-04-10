import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
  likes: number;
  comments: Comment[];
  liked: boolean;
  type: 'workout' | 'meal' | 'milestone' | 'text';
  recapCard?: RecapCard;
}

interface Comment {
  id: string;
  author: string;
  avatar: string | null;
  content: string;
  time: string;
}

interface Story {
  id: string;
  username: string;
  avatar: string | null;
  seen: boolean;
}

interface DiscoverUser {
  id: string;
  name: string;
  calfitId: string;
  avatar: string | null;
  goal: string;
  isFollowing: boolean;
}

interface RecapCard {
  type: 'workout' | 'calorie' | 'streak' | 'milestone';
  title: string;
  value: string;
  sub: string;
  emoji: string;
  color: string;
}

// ── TIME AGO ──────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── USER AVATAR ───────────────────────────────────────────────
function UserAvatar({
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
      hasStory && {
        padding: 2,
        borderRadius: size / 2 + 3,
        borderWidth: 2,
        borderColor: seen ? theme.border : theme.accent,
      }
    ]}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.accentDim as string,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <Text style={{
          color: theme.accent,
          fontWeight: '700',
          fontSize: size * 0.38,
        }}>
          {name[0]?.toUpperCase() ?? 'U'}
        </Text>
      </View>
    </View>
  );
}

// ── STORY ROW ─────────────────────────────────────────────────
function StoryRow({
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
      <TouchableOpacity style={styles.storyItem}>
        <View style={{ position: 'relative' }}>
          <UserAvatar uri={currentUserAvatar} name={currentUserName} size={54} theme={theme} />
          <View style={[styles.addStoryPlus, { backgroundColor: theme.accent }]}>
            <Ionicons name="add" size={14} color={theme.bg} />
          </View>
        </View>
        <Text style={[styles.storyName, { color: theme.textSecondary }]}>Your story</Text>
      </TouchableOpacity>
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

// ── APP-GENERATED RECAP CARD ──────────────────────────────────
function RecapCardView({ card, theme }: { card: RecapCard; theme: typeof colors.dark }) {
  return (
    <View style={[styles.recapCard, { backgroundColor: card.color + '22', borderColor: card.color }]}>
      <Text style={styles.recapEmoji}>{card.emoji}</Text>
      <View style={styles.recapInfo}>
        <Text style={[styles.recapTitle, { color: theme.textPrimary }]}>{card.title}</Text>
        <Text style={[styles.recapValue, { color: card.color }]}>{card.value}</Text>
        <Text style={[styles.recapSub, { color: theme.textMuted }]}>{card.sub}</Text>
      </View>
      <View style={[styles.recapBadge, { backgroundColor: card.color }]}>
        <Text style={styles.recapBadgeText}>CalFit</Text>
      </View>
    </View>
  );
}

// ── COMMENT MODAL ─────────────────────────────────────────────
function CommentModal({
  theme,
  post,
  visible,
  onClose,
  onAddComment,
  currentUserName,
  currentUserAvatar,
}: {
  theme: typeof colors.dark;
  post: Post | null;
  visible: boolean;
  onClose: () => void;
  onAddComment: (postId: string, content: string) => void;
  currentUserName: string;
  currentUserAvatar: string | null;
}) {
  const [text, setText] = useState('');
  if (!post) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.modalDismiss} onPress={onClose} />
        <View style={[styles.commentSheet, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={[styles.commentHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.commentTitle, { color: theme.textPrimary }]}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.commentList} showsVerticalScrollIndicator={false}>
            {post.comments.length === 0 ? (
              <View style={styles.noComments}>
                <Ionicons name="chatbubble-outline" size={32} color={theme.textMuted} />
                <Text style={[styles.noCommentsText, { color: theme.textMuted }]}>
                  No comments yet. Be the first!
                </Text>
              </View>
            ) : (
              post.comments.map((c) => (
                <View key={c.id} style={styles.commentRow}>
                  <UserAvatar uri={c.avatar} name={c.author} size={32} theme={theme} />
                  <View style={[styles.commentBubble, {
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                  }]}>
                    <Text style={[styles.commentAuthor, { color: theme.accent }]}>
                      {c.author}
                    </Text>
                    <Text style={[styles.commentContent, { color: theme.textPrimary }]}>
                      {c.content}
                    </Text>
                    <Text style={[styles.commentTime, { color: theme.textMuted }]}>
                      {c.time}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={[styles.commentInputRow, { borderTopColor: theme.border }]}>
            <UserAvatar uri={currentUserAvatar} name={currentUserName} size={32} theme={theme} />
            <View style={[styles.commentInput, {
              backgroundColor: theme.bg,
              borderColor: theme.border,
            }]}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Add a comment..."
                placeholderTextColor={theme.textMuted}
                style={[styles.commentInputText, { color: theme.textPrimary }]}
                multiline
                maxLength={300}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!text.trim()) return;
                onAddComment(post.id, text.trim());
                setText('');
              }}
              style={[styles.sendCommentBtn, {
                backgroundColor: text.trim() ? theme.accent : theme.border,
              }]}
            >
              <Ionicons name="send" size={16} color={theme.bg} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── DM MODAL ──────────────────────────────────────────────────
function DMModal({
  theme,
  visible,
  onClose,
}: {
  theme: typeof colors.dark;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalDismiss} onPress={onClose} />
        <View style={[styles.dmSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.commentHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.commentTitle, { color: theme.textPrimary }]}>Messages</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.dmEmpty}>
            <Ionicons name="paper-plane-outline" size={44} color={theme.textMuted} />
            <Text style={[styles.dmEmptyTitle, { color: theme.textPrimary }]}>
              No messages yet
            </Text>
            <Text style={[styles.dmEmptySub, { color: theme.textMuted }]}>
              Follow other CalFit members to start chatting about workouts, goals and progress.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── SHARE RECAP MODAL ─────────────────────────────────────────
function ShareRecapModal({
  theme,
  visible,
  onClose,
  onShare,
  profile,
}: {
  theme: typeof colors.dark;
  visible: boolean;
  onClose: () => void;
  onShare: (card: RecapCard, caption: string) => void;
  profile: any;
}) {
  const [caption, setCaption] = useState('');
  const [selectedCard, setSelectedCard] = useState<RecapCard | null>(null);

  const recapCards: RecapCard[] = [
    {
      type: 'workout',
      title: 'Workout Complete',
      value: `${profile?.streak_count ?? 0} day streak`,
      sub: 'Consistency is key 💪',
      emoji: '🏋️',
      color: '#F59E0B',
    },
    {
      type: 'calorie',
      title: 'Calorie Goal Hit',
      value: `${profile?.daily_calorie_goal ?? 2000} kcal`,
      sub: 'Daily target reached ✓',
      emoji: '🎯',
      color: '#0DAE6C',
    },
    {
      type: 'streak',
      title: 'Streak Milestone',
      value: `${profile?.streak_count ?? 0} days`,
      sub: 'On fire right now 🔥',
      emoji: '🔥',
      color: '#EF4444',
    },
    {
      type: 'milestone',
      title: 'Personal Record',
      value: 'New best!',
      sub: 'Crushed it today 🏆',
      emoji: '🏆',
      color: '#B280FF',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalDismiss} onPress={onClose} />
        <View style={[styles.shareSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.commentHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.commentTitle, { color: theme.textPrimary }]}>
              Share a Recap Card
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.shareHint, { color: theme.textMuted }]}>
            Share an app-generated card showing your real CalFit stats.
          </Text>

          {/* Recap card picker */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardPicker}
          >
            {recapCards.map((card) => (
              <TouchableOpacity
                key={card.type}
                onPress={() => setSelectedCard(card)}
                style={[styles.cardPickerItem, {
                  borderColor: selectedCard?.type === card.type ? card.color : theme.border,
                  borderWidth: selectedCard?.type === card.type ? 2 : 1,
                }]}
              >
                <Text style={styles.cardPickerEmoji}>{card.emoji}</Text>
                <Text style={[styles.cardPickerTitle, { color: theme.textPrimary }]}>
                  {card.title}
                </Text>
                <Text style={[styles.cardPickerValue, { color: card.color }]}>
                  {card.value}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Caption input */}
          <View style={[styles.commentInput, {
            backgroundColor: theme.bg,
            borderColor: theme.border,
            marginBottom: spacing.md,
          }]}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption (optional)..."
              placeholderTextColor={theme.textMuted}
              style={[styles.commentInputText, { color: theme.textPrimary }]}
              multiline
              maxLength={200}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!selectedCard) {
                Alert.alert('Select a card', 'Please select a recap card to share.');
                return;
              }
              onShare(selectedCard, caption);
              setCaption('');
              setSelectedCard(null);
              onClose();
            }}
            style={[styles.sharePostBtn, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="share-social-outline" size={18} color={theme.bg} />
            <Text style={[styles.sharePostBtnText, { color: theme.bg }]}>Share to Feed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── DISCOVER USER CARD ────────────────────────────────────────
function DiscoverUserCard({
  user: discoverUser,
  theme,
  onFollow,
}: {
  user: DiscoverUser;
  theme: typeof colors.dark;
  onFollow: (id: string) => void;
}) {
  return (
    <View style={[styles.discoverCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <UserAvatar uri={discoverUser.avatar} name={discoverUser.name} size={48} theme={theme} />
      <View style={styles.discoverInfo}>
        <Text style={[styles.discoverName, { color: theme.textPrimary }]}>
          {discoverUser.name}
        </Text>
        <Text style={[styles.discoverHandle, { color: theme.textMuted }]}>
          @{discoverUser.calfitId}
        </Text>
        {discoverUser.goal ? (
          <View style={[styles.goalPill, { backgroundColor: theme.accentDim as string }]}>
            <Text style={[styles.goalPillText, { color: theme.accent }]}>
              🎯 {discoverUser.goal}
            </Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={() => onFollow(discoverUser.id)}
        style={[styles.followBtn, {
          backgroundColor: discoverUser.isFollowing ? theme.card : theme.accent,
          borderColor: discoverUser.isFollowing ? theme.border : theme.accent,
          borderWidth: 1,
        }]}
      >
        <Text style={[styles.followBtnText, {
          color: discoverUser.isFollowing ? theme.textSecondary : theme.bg,
        }]}>
          {discoverUser.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── POST CARD ─────────────────────────────────────────────────
function PostCard({
  post,
  theme,
  onLike,
  onComment,
}: {
  post: Post;
  theme: typeof colors.dark;
  onLike: (id: string) => void;
  onComment: (post: Post) => void;
}) {
  const [showKudos, setShowKudos] = useState(false);
  const KUDOS = ['🔥 Fire', '💪 Strong', '🎯 Goals', '🙌 Well done'];

  const typeConfig: Record<Post['type'], { icon: string; color: string; label: string }> = {
    workout:   { icon: 'barbell-outline',    color: theme.orange,       label: 'Workout' },
    meal:      { icon: 'restaurant-outline', color: theme.accentSecond, label: 'Meal' },
    milestone: { icon: 'trophy-outline',     color: theme.gold,         label: 'Milestone' },
    text:      { icon: 'chatbubble-outline', color: theme.textMuted,    label: 'Update' },
  };

  const config = typeConfig[post.type];

  return (
    <View style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.postHeader}>
        <UserAvatar uri={post.avatar} name={post.author} size={40} theme={theme} />
        <View style={styles.postAuthorInfo}>
          <View style={styles.postAuthorRow}>
            <Text style={[styles.postAuthorName, { color: theme.textPrimary }]}>
              {post.author}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: config.color + '22' }]}>
              <Ionicons name={config.icon as any} size={10} color={config.color} />
              <Text style={[styles.typeBadgeText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
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

      {/* App-generated recap card */}
      {post.recapCard && (
        <View style={styles.recapCardWrap}>
          <RecapCardView card={post.recapCard} theme={theme} />
        </View>
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
        <TouchableOpacity onPress={() => onLike(post.id)} style={styles.postAction}>
          <Ionicons
            name={post.liked ? 'heart' : 'heart-outline'}
            size={18}
            color={post.liked ? theme.red : theme.textMuted}
          />
          <Text style={[styles.postActionLabel, { color: theme.textMuted }]}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onComment(post)} style={styles.postAction}>
          <Ionicons name="chatbubble-outline" size={18} color={theme.textMuted} />
          <Text style={[styles.postActionLabel, { color: theme.textMuted }]}>
            {post.comments.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowKudos(!showKudos)} style={styles.postAction}>
          <Ionicons name="hand-right-outline" size={18} color={theme.textMuted} />
          <Text style={[styles.postActionLabel, { color: theme.textMuted }]}>Kudos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postAction}>
          <Ionicons name="share-social-outline" size={18} color={theme.textMuted} />
          <Text style={[styles.postActionLabel, { color: theme.textMuted }]}>Share</Text>
        </TouchableOpacity>
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
  onShareRecap,
}: {
  theme: typeof colors.dark;
  avatar: string | null;
  name: string;
  onPost: (content: string, type: Post['type']) => void;
  onShareRecap: () => void;
}) {
  const [text, setText] = useState('');
  const [type, setType] = useState<Post['type']>('text');

  const typeOptions: { value: Post['type']; label: string; icon: string; color: string }[] = [
    { value: 'text',      label: 'Update',    icon: 'chatbubble-outline',  color: theme.textMuted },
    { value: 'workout',   label: 'Workout',   icon: 'barbell-outline',     color: theme.orange },
    { value: 'meal',      label: 'Meal',      icon: 'restaurant-outline',  color: theme.accentSecond },
    { value: 'milestone', label: 'Milestone', icon: 'trophy-outline',      color: theme.gold },
  ];

  return (
    <View style={[styles.composeBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.composeTop}>
        <UserAvatar uri={avatar} name={name} size={36} theme={theme} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Share a workout, meal, or milestone..."
          placeholderTextColor={theme.textMuted}
          style={[styles.composeInput, { color: theme.textPrimary }]}
          multiline
          maxLength={500}
        />
      </View>

      <View style={styles.composeActions}>
        {/* Post type pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.typeRow}>
            {typeOptions.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setType(t.value)}
                style={[styles.typeBtn, {
                  backgroundColor: type === t.value ? t.color + '22' : 'transparent',
                  borderColor: type === t.value ? t.color : theme.border,
                  borderWidth: 1,
                }]}
              >
                <Ionicons name={t.icon as any} size={12} color={type === t.value ? t.color : theme.textMuted} />
                <Text style={[styles.typeBtnText, {
                  color: type === t.value ? t.color : theme.textMuted,
                }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Share recap button */}
        <TouchableOpacity
          onPress={onShareRecap}
          style={[styles.recapShareBtn, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}
        >
          <Ionicons name="stats-chart" size={14} color={theme.accent} />
          <Text style={[styles.recapShareBtnText, { color: theme.accent }]}>Recap</Text>
        </TouchableOpacity>
      </View>

      {text.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onPost(text, type);
            setText('');
            setType('text');
          }}
          style={[styles.postBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.postBtnText, { color: theme.bg }]}>Post</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function SocialScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'Following' | 'Discover'>('Following');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories] = useState<Story[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [showShareRecap, setShowShareRecap] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);

  const name = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatar = profile?.avatar_url ?? null;

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadFeedData();
        loadDiscoverUsers();
      }
    }, [user?.id])
  );

  const loadFeedData = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase
        .from('posts')
        .select(`
          id, content, type, likes_count,
          created_at, user_id,
          profiles:user_id (full_name, calfit_id, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setPosts(data.map((p: any) => ({
          id: p.id,
          author: p.profiles?.full_name ?? 'CalFit User',
          authorId: p.profiles?.calfit_id ?? 'user',
          avatar: p.profiles?.avatar_url ?? null,
          time: timeAgo(p.created_at),
          content: p.content,
          likes: p.likes_count ?? 0,
          comments: [],
          liked: false,
          type: p.type ?? 'text',
        })));
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    }
  };

  const loadDiscoverUsers = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, calfit_id, avatar_url, goal')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setDiscoverUsers(data.map((u: any) => ({
          id: u.id,
          name: u.full_name ?? 'CalFit User',
          calfitId: u.calfit_id ?? u.id.slice(0, 8),
          avatar: u.avatar_url ?? null,
          goal: u.goal ?? '',
          isFollowing: false,
        })));
      }
    } catch (error) {
      console.error('Failed to load discover users:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadFeedData(), loadDiscoverUsers()]);
    setIsRefreshing(false);
  };

  const handleLike = (postId: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  };

  const handleOpenComments = (post: Post) => {
    setSelectedPost(post);
    setShowComments(true);
  };

  const handleAddComment = (postId: string, content: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      author: name,
      avatar,
      content,
      time: 'Just now',
    };
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    ));
    setSelectedPost((prev) =>
      prev?.id === postId
        ? { ...prev, comments: [...prev.comments, newComment] }
        : prev
    );
  };

  const handleFollow = (userId: string) => {
    setDiscoverUsers((prev) => prev.map((u) =>
      u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
    ));
  };

  const handlePost = async (content: string, type: Post['type']) => {
    if (!user?.id || !content.trim()) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          type,
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (data) {
        setPosts((prev) => [{
          id: data.id,
          author: name,
          authorId: profile?.calfit_id ?? 'user',
          avatar,
          time: 'Just now',
          content: data.content,
          likes: 0,
          comments: [],
          liked: false,
          type,
        }, ...prev]);
      }
    } catch (error) {
      console.error('Failed to post:', error);
    }
  };

  const handleShareRecap = async (card: RecapCard, caption: string) => {
    if (!user?.id) return;
    const content = caption.trim() || `Just hit a milestone on CalFit! ${card.emoji} ${card.title}: ${card.value}`;
    try {
      const { supabase } = await import('../../services/supabase');
      await supabase.from('posts').insert({
        user_id: user.id,
        content,
        type: card.type === 'calorie' ? 'meal' : card.type,
        likes_count: 0,
        comments_count: 0,
      });

      setPosts((prev) => [{
        id: Date.now().toString(),
        author: name,
        authorId: profile?.calfit_id ?? 'user',
        avatar,
        time: 'Just now',
        content,
        likes: 0,
        comments: [],
        liked: false,
        type: card.type === 'calorie' ? 'meal' : card.type as Post['type'],
        recapCard: card,
      }, ...prev]);
    } catch (error) {
      console.error('Failed to share recap:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Social</Text>
        <View style={styles.headerRight}>
          {/* Community icon */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Community' as never)}
            style={[styles.headerIcon, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="people-outline" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          {/* DM icon */}
          <TouchableOpacity
  onPress={() => navigation.navigate('Messages' as never)}
  style={[styles.headerIcon, { backgroundColor: theme.card, borderColor: theme.border }]}
>
  <Ionicons name="paper-plane-outline" size={20} color={theme.textPrimary} />
</TouchableOpacity>
        </View>
      </View>

      {/* Tab toggle */}
      <View style={[styles.tabToggle, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
            <ComposeBox
              theme={theme}
              avatar={avatar}
              name={name}
              onPost={handlePost}
              onShareRecap={() => setShowShareRecap(true)}
            />

            {posts.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Ionicons name="people-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                  Your feed is empty
                </Text>
                <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                  Follow other CalFit members to see their workouts and milestones here.
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('Discover')}
                  style={[styles.discoverCta, { backgroundColor: theme.accent }]}
                >
                  <Text style={[styles.discoverCtaText, { color: theme.bg }]}>
                    Find People to Follow
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
                  onComment={handleOpenComments}
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
              Follow members to see their workouts and milestones in your feed.
            </Text>
            {discoverUsers.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Ionicons name="compass-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                  No other users yet
                </Text>
                <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                  Invite friends to CalFit to grow your network.
                </Text>
              </View>
            ) : (
              discoverUsers.map((u) => (
                <DiscoverUserCard
                  key={u.id}
                  user={u}
                  theme={theme}
                  onFollow={handleFollow}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <CommentModal
        theme={theme}
        post={selectedPost}
        visible={showComments}
        onClose={() => { setShowComments(false); setSelectedPost(null); }}
        onAddComment={handleAddComment}
        currentUserName={name}
        currentUserAvatar={avatar}
      />

      <ShareRecapModal
        theme={theme}
        visible={showShareRecap}
        onClose={() => setShowShareRecap(false)}
        onShare={handleShareRecap}
        profile={profile}
      />
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
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  headerIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },

  tabToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4, gap: 4,
  },
  tabToggleBtn: {
    flex: 1, paddingVertical: spacing.sm,
    borderRadius: radius.sm, alignItems: 'center',
  },
  tabToggleText: { fontSize: fontSize.base },

  // Stories
  storyRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  storyItem: { alignItems: 'center', gap: 6, width: 64 },
  addStoryPlus: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  storyName: { fontSize: 10, textAlign: 'center' },

  // Compose
  composeBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  composeTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  composeInput: { flex: 1, fontSize: fontSize.base, lineHeight: 20, maxHeight: 80 },
  composeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  typeRow: { flexDirection: 'row', gap: spacing.xs },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.sm,
  },
  typeBtnText: { fontSize: fontSize.xs, fontWeight: '600' },
  recapShareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.sm, borderWidth: 1, flexShrink: 0,
  },
  recapShareBtnText: { fontSize: fontSize.xs, fontWeight: '700' },
  postBtn: {
    padding: spacing.sm, borderRadius: radius.sm,
    alignItems: 'center', alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  postBtnText: { fontSize: fontSize.base, fontWeight: '700' },

  // Post card
  postCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, padding: spacing.md,
  },
  postAuthorInfo: { flex: 1 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  postAuthorName: { fontSize: fontSize.base, fontWeight: '700' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  postTime: { fontSize: fontSize.xs, marginTop: 2 },
  postContent: {
    fontSize: fontSize.base, lineHeight: 22,
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
  },
  recapCardWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  kudosPills: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  kudosPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1,
  },
  kudosPillText: { fontSize: fontSize.sm, fontWeight: '600' },
  postActions: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postActionLabel: { fontSize: fontSize.xs, fontWeight: '600' },

  // Recap card
  recapCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, gap: spacing.md,
  },
  recapEmoji: { fontSize: 32 },
  recapInfo: { flex: 1 },
  recapTitle: { fontSize: fontSize.sm, fontWeight: '600' },
  recapValue: { fontSize: fontSize.xl, fontWeight: '800', marginTop: 2 },
  recapSub: { fontSize: fontSize.xs, marginTop: 2 },
  recapBadge: {
    paddingHorizontal: spacing.xs, paddingVertical: 2,
    borderRadius: radius.sm,
  },
  recapBadgeText: { fontSize: 8, fontWeight: '800', color: '#0C0D10' },

  // Discover user card
  discoverCard: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, marginHorizontal: spacing.lg,
    marginBottom: spacing.sm, padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 1,
  },
  discoverInfo: { flex: 1 },
  discoverName: { fontSize: fontSize.base, fontWeight: '700' },
  discoverHandle: { fontSize: fontSize.xs, marginTop: 2 },
  goalPill: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: radius.sm, marginTop: 4,
  },
  goalPillText: { fontSize: fontSize.xs, fontWeight: '600' },
  followBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.sm, flexShrink: 0,
  },
  followBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  // Section labels
  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: 2,
  },
  sectionHint: { fontSize: fontSize.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm },

  // Empty states
  emptyFeed: {
    alignItems: 'center', paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl, gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
  discoverCta: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: radius.lg, marginTop: spacing.sm,
  },
  discoverCtaText: { fontSize: fontSize.base, fontWeight: '700' },

  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalDismiss: { flex: 1 },

  commentSheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    maxHeight: '85%',
  },
  commentHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1,
  },
  commentTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  commentList: { maxHeight: 300, padding: spacing.lg },
  noComments: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  noCommentsText: { fontSize: fontSize.sm },
  commentRow: {
    flexDirection: 'row', gap: spacing.sm,
    marginBottom: spacing.md, alignItems: 'flex-start',
  },
  commentBubble: {
    flex: 1, padding: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, gap: 2,
  },
  commentAuthor: { fontSize: fontSize.xs, fontWeight: '700' },
  commentContent: { fontSize: fontSize.base, lineHeight: 18 },
  commentTime: { fontSize: 9, marginTop: 2 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, padding: spacing.md,
    paddingBottom: spacing.xxl, borderTopWidth: 1,
  },
  commentInput: {
    flex: 1, padding: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, maxHeight: 80,
  },
  commentInputText: { fontSize: fontSize.base },
  sendCommentBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  dmSheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    maxHeight: '60%', paddingBottom: spacing.xxxl,
  },
  dmEmpty: {
    alignItems: 'center', paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl, gap: spacing.sm,
  },
  dmEmptyTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  dmEmptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },

  // Share recap modal
  shareSheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm,
  },
  shareHint: { fontSize: fontSize.sm, lineHeight: 18 },
  cardPicker: { gap: spacing.sm, paddingVertical: spacing.sm },
  cardPickerItem: {
    width: 130, padding: spacing.md, borderRadius: radius.lg,
    alignItems: 'center', gap: spacing.xs,
    backgroundColor: 'transparent',
  },
  cardPickerEmoji: { fontSize: 28 },
  cardPickerTitle: { fontSize: fontSize.xs, fontWeight: '700', textAlign: 'center' },
  cardPickerValue: { fontSize: fontSize.sm, fontWeight: '800', textAlign: 'center' },
  sharePostBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm,
    padding: spacing.lg, borderRadius: radius.lg,
  },
  sharePostBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});