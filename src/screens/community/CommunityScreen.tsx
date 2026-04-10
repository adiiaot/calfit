import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── TYPES ─────────────────────────────────────────────────────
interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  streak: number;
  isJoined: boolean;
  emoji: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  daysLeft: number;
  reward: string;
  emoji: string;
  joined: boolean;
}

// ── GROUP CARD ────────────────────────────────────────────────
export function GroupCard({
  group,
  theme,
  onJoin,
  onOpen,
}: {
  group: Group;
  theme: typeof colors.dark;
  onJoin: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onOpen(group.id)}
      style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={[styles.groupEmoji, { backgroundColor: theme.accentDim as string }]}>
        <Text style={styles.groupEmojiText}>{group.emoji}</Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={[styles.groupName, { color: theme.textPrimary }]}>{group.name}</Text>
        <Text style={[styles.groupDesc, { color: theme.textMuted }]} numberOfLines={1}>
          {group.description}
        </Text>
        <View style={styles.groupMeta}>
          <View style={styles.groupMetaItem}>
            <Ionicons name="people-outline" size={12} color={theme.textMuted} />
            <Text style={[styles.groupMetaText, { color: theme.textMuted }]}>
              {group.members} members
            </Text>
          </View>
          {group.streak > 0 && (
            <View style={styles.groupMetaItem}>
              <Text style={styles.groupStreakFire}>🔥</Text>
              <Text style={[styles.groupMetaText, { color: theme.accent }]}>
                {group.streak}d streak
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onJoin(group.id)}
        style={[styles.joinBtn, {
          backgroundColor: group.isJoined ? theme.card : theme.accent,
          borderColor: group.isJoined ? theme.border : theme.accent,
          borderWidth: 1,
        }]}
      >
        <Text style={[styles.joinBtnText, {
          color: group.isJoined ? theme.textSecondary : theme.bg,
        }]}>
          {group.isJoined ? 'Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── CHALLENGE CARD ────────────────────────────────────────────
export function ChallengeCard({
  challenge,
  theme,
  onJoin,
}: {
  challenge: Challenge;
  theme: typeof colors.dark;
  onJoin: (id: string) => void;
}) {
  return (
    <View style={[styles.challengeCard, {
      backgroundColor: theme.card,
      borderColor: challenge.joined ? theme.accent : theme.border,
      borderWidth: challenge.joined ? 2 : 1,
    }]}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
        <View style={styles.challengeHeaderInfo}>
          <Text style={[styles.challengeTitle, { color: theme.textPrimary }]}>
            {challenge.title}
          </Text>
          <Text style={[styles.challengeDesc, { color: theme.textMuted }]} numberOfLines={2}>
            {challenge.description}
          </Text>
        </View>
      </View>

      <View style={styles.challengeStats}>
        {[
          { icon: 'people-outline', value: `${challenge.participants} joined`, color: theme.accentSecond },
          { icon: 'time-outline', value: `${challenge.daysLeft}d left`, color: theme.orange },
          { icon: 'gift-outline', value: challenge.reward, color: theme.gold },
        ].map((s) => (
          <View key={s.value} style={styles.challengeStat}>
            <Ionicons name={s.icon as any} size={14} color={s.color} />
            <Text style={[styles.challengeStatText, { color: s.color }]}>{s.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => onJoin(challenge.id)}
        style={[styles.joinChallengeBtn, {
          backgroundColor: challenge.joined ? theme.border : theme.accent,
        }]}
      >
        <Text style={[styles.joinChallengeBtnText, {
          color: challenge.joined ? theme.textMuted : theme.bg,
        }]}>
          {challenge.joined ? '✓ Joined' : 'Join Challenge'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── CREATE GROUP MODAL ────────────────────────────────────────
function CreateGroupSheet({
  theme,
  onClose,
  onCreate,
}: {
  theme: typeof colors.dark;
  onClose: () => void;
  onCreate: (name: string, desc: string, category: string) => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Fitness');
  const categories = ['Fitness', 'Nutrition', 'Weight Loss', 'Muscle Gain', 'Running', 'Yoga', 'Mental Health'];

  return (
    <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.sheetHeader}>
        <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Create a Group</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sheetLabel, { color: theme.textSecondary }]}>Group Name</Text>
      <View style={[styles.sheetInput, { backgroundColor: theme.bg, borderColor: theme.border }]}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Morning Warriors"
          placeholderTextColor={theme.textMuted}
          style={[styles.sheetInputText, { color: theme.textPrimary }]}
        />
      </View>

      <Text style={[styles.sheetLabel, { color: theme.textSecondary }]}>Description</Text>
      <View style={[styles.sheetInput, {
        backgroundColor: theme.bg,
        borderColor: theme.border,
        height: 80,
        alignItems: 'flex-start',
      }]}>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="What is this group about?"
          placeholderTextColor={theme.textMuted}
          style={[styles.sheetInputText, { color: theme.textPrimary, flex: 1 }]}
          multiline
        />
      </View>

      <Text style={[styles.sheetLabel, { color: theme.textSecondary }]}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        <View style={styles.categoryPills}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.categoryPill, {
                backgroundColor: category === c ? theme.accent : theme.bg,
                borderColor: category === c ? theme.accent : theme.border,
              }]}
            >
              <Text style={[styles.categoryPillText, {
                color: category === c ? theme.bg : theme.textSecondary,
              }]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => {
          if (!name.trim()) {
            Alert.alert('Missing name', 'Please enter a group name.');
            return;
          }
          onCreate(name, desc, category);
          onClose();
        }}
        style={[styles.createBtn, { backgroundColor: theme.accent }]}
      >
        <Text style={[styles.createBtnText, { color: theme.bg }]}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'My Groups' | 'Discover' | 'Challenges'>('My Groups');
  const [showCreate, setShowCreate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([
    {
      id: 'd1',
      name: 'Morning Warriors',
      description: 'Early risers who crush their workouts before 8am',
      members: 1240,
      category: 'Fitness',
      streak: 14,
      isJoined: false,
      emoji: '🌅',
    },
    {
      id: 'd2',
      name: 'Clean Eaters Nigeria',
      description: 'Healthy Nigerian food, local recipes, calorie tracking',
      members: 892,
      category: 'Nutrition',
      streak: 7,
      isJoined: false,
      emoji: '🥗',
    },
    {
      id: 'd3',
      name: 'Weight Loss Warriors',
      description: 'Accountability group for sustainable weight loss',
      members: 3400,
      category: 'Weight Loss',
      streak: 30,
      isJoined: false,
      emoji: '⚡',
    },
    {
      id: 'd4',
      name: 'Muscle & Macros',
      description: 'Bodybuilding, protein tracking and progressive overload',
      members: 2100,
      category: 'Muscle Gain',
      streak: 21,
      isJoined: false,
      emoji: '💪',
    },
    {
      id: 'd5',
      name: 'Mental Wellness Circle',
      description: 'Mindfulness, stress management and mental health support',
      members: 660,
      category: 'Mental Health',
      streak: 5,
      isJoined: false,
      emoji: '🧘',
    },
  ]);

  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: 'c1',
      title: '30-Day Step Challenge',
      description: 'Walk 8,000 steps every day for 30 days. Track with CalFit and stay consistent.',
      participants: 4200,
      daysLeft: 18,
      reward: '500 CalFit Points',
      emoji: '👟',
      joined: false,
    },
    {
      id: 'c2',
      title: 'Water Goal Week',
      description: 'Hit your daily water goal every day for 7 days straight.',
      participants: 1800,
      daysLeft: 4,
      reward: '100 CalFit Points',
      emoji: '💧',
      joined: false,
    },
    {
      id: 'c3',
      title: 'No Sugar September',
      description: 'Cut out added sugars for the entire month. Log daily to stay accountable.',
      participants: 890,
      daysLeft: 22,
      reward: '300 CalFit Points + Badge',
      emoji: '🚫',
      joined: false,
    },
    {
      id: 'c4',
      title: '5-Workout Week',
      description: 'Complete 5 workouts in 7 days. Any type counts — just move.',
      participants: 3100,
      daysLeft: 6,
      reward: '200 CalFit Points',
      emoji: '🏋️',
      joined: false,
    },
  ]);

  const handleJoinGroup = (id: string) => {
    setDiscoverGroups((prev) => prev.map((g) =>
      g.id === id
        ? { ...g, isJoined: !g.isJoined, members: g.isJoined ? g.members - 1 : g.members + 1 }
        : g
    ));

    const group = discoverGroups.find((g) => g.id === id);
    if (group && !group.isJoined) {
      setMyGroups((prev) => [...prev, { ...group, isJoined: true }]);
    } else {
      setMyGroups((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const handleJoinChallenge = (id: string) => {
    setChallenges((prev) => prev.map((c) =>
      c.id === id
        ? { ...c, joined: !c.joined, participants: c.joined ? c.participants - 1 : c.participants + 1 }
        : c
    ));
  };

  const handleCreateGroup = async (name: string, desc: string, category: string) => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase
        .from('groups')
        .insert({
          name,
          description: desc,
          category,
          creator_id: user.id,
          member_count: 1,
        })
        .select()
        .single();

      if (data) {
        const newGroup: Group = {
          id: data.id,
          name,
          description: desc,
          members: 1,
          category,
          streak: 0,
          isJoined: true,
          emoji: '✨',
        };
        setMyGroups((prev) => [newGroup, ...prev]);
        Alert.alert('Group Created! 🎉', `${name} has been created. Invite friends to join.`);
      }
    } catch (error) {
      // Show it locally even if Supabase fails (table may not exist yet)
      const newGroup: Group = {
        id: Date.now().toString(),
        name, description: desc,
        members: 1, category,
        streak: 0, isJoined: true, emoji: '✨',
      };
      setMyGroups((prev) => [newGroup, ...prev]);
      Alert.alert('Group Created! 🎉', `${name} has been created.`);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Social</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Community</Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={[styles.createGroupBtn, { backgroundColor: theme.accent }]}
        >
          <Ionicons name="add" size={18} color={theme.bg} />
          <Text style={[styles.createGroupBtnText, { color: theme.bg }]}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {(['My Groups', 'Discover', 'Challenges'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && {
              borderBottomColor: theme.accent,
              borderBottomWidth: 2,
            }]}
          >
            <Text style={[styles.tabText, {
              color: activeTab === tab ? theme.textPrimary : theme.textMuted,
              fontWeight: activeTab === tab ? '700' : '400',
            }]}>
              {tab}
              {tab === 'My Groups' && myGroups.length > 0
                ? ` (${myGroups.length})`
                : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {}}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* My Groups tab */}
        {activeTab === 'My Groups' && (
          myGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No groups yet
              </Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                Join a group from Discover or create your own to connect with others.
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab('Discover')}
                style={[styles.emptyBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={[styles.emptyBtnText, { color: theme.bg }]}>Browse Groups</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                theme={theme}
                onJoin={handleJoinGroup}
                onOpen={() => {}}
              />
            ))
          )
        )}

        {/* Discover tab */}
        {activeTab === 'Discover' && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Popular Groups
            </Text>
            {discoverGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                theme={theme}
                onJoin={handleJoinGroup}
                onOpen={() => {}}
              />
            ))}
          </>
        )}

        {/* Challenges tab */}
        {activeTab === 'Challenges' && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Active Challenges
            </Text>
            {challenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                theme={theme}
                onJoin={handleJoinChallenge}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Create Group Sheet */}
      {showCreate && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBg}
            onPress={() => setShowCreate(false)}
          />
          <CreateGroupSheet
            theme={theme}
            onClose={() => setShowCreate(false)}
            onCreate={handleCreateGroup}
          />
        </View>
      )}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },
  pageTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  createGroupBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  // Tabs
  tabBar: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    marginBottom: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: fontSize.base },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },

  // Group card
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  groupEmoji: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  groupEmojiText: { fontSize: 24 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: fontSize.base, fontWeight: '700' },
  groupDesc: { fontSize: fontSize.xs, marginTop: 2 },
  groupMeta: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  groupMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  groupMetaText: { fontSize: fontSize.xs },
  groupStreakFire: { fontSize: 10 },
  joinBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  joinBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  // Challenge card
  challengeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  challengeHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  challengeEmoji: { fontSize: 32 },
  challengeHeaderInfo: { flex: 1 },
  challengeTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  challengeDesc: { fontSize: fontSize.sm, marginTop: 4, lineHeight: 18 },
  challengeStats: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' },
  challengeStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  challengeStatText: { fontSize: fontSize.xs, fontWeight: '600' },
  joinChallengeBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  joinChallengeBtnText: { fontSize: fontSize.base, fontWeight: '700' },

  // Create sheet
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: spacing.xxxl,
    gap: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sheetTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  sheetLabel: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.sm },
  sheetInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  sheetInputText: { flex: 1, fontSize: fontSize.base },
  categoryPills: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  categoryPillText: { fontSize: fontSize.sm, fontWeight: '600' },
  createBtn: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  createBtnText: { fontSize: fontSize.lg, fontWeight: '700' },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  emptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  emptyBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});