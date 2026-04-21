import {
  View, Text, StyleSheet,
  ScrollView, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { AndroidSafeView } from '../../shared/AndriodSafeView';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { GroupCard } from '../components/GroupCard';
import { ChallengeCard } from '../components/ChallengeCard';
import { CreateGroupSheet } from '../components/CreateGroupSheet';
import { GroupDetailSheet } from '../components/GroupDetailSheet';
import { EmptyState } from '../../shared/EmptyState';
import { useGroup } from '../hooks/useGroup';
import { useChallenge } from '../hooks/useChallenge';
import { GroupData } from '../services/groupService';

type Tab = 'My Groups' | 'Discover' | 'Challenges';

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const userTier = (profile as any)?.subscription_tier ?? 'free';

  const [activeTab, setActiveTab] = useState<Tab>('My Groups');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);

  const {
    myGroups, discoverGroups, canCreate, ownedCount, groupLimit,
    isLoading, create, join, leave, remove, reload,
  } = useGroup(user?.id ?? '', userTier);

  const { challenges, toggle: toggleChallenge } = useChallenge(user?.id ?? '');

  const handleCreate = async (
    name: string,
    description: string,
    category: string
  ) => {
    const group = await create(name, description, category);
    if (group) {
      Alert.alert('Group Created! 🎉', `${name} is ready. Add workouts for your members.`);
    }
  };

  const handleJoin = async (groupId: string, isJoined: boolean) => {
    if (isJoined) {
      await leave(groupId);
    } else {
      await join(groupId);
    }
  };

  // ── Fixed: now passes userId so RLS policy matches ─────────
  const handleDelete = (groupId: string) => {
    Alert.alert(
      'Delete Group',
      'This will permanently delete the group and all its workouts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await remove(groupId);
            if (result && !result.success) {
              Alert.alert('Could not delete', result.error ?? 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleOpenGroup = (group: GroupData) => {
    setSelectedGroup(group);
    setShowGroupDetail(true);
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Social</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Community</Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={[styles.createBtn, { backgroundColor: theme.accent }]}
        >
          <Ionicons name="add" size={18} color={theme.bg} />
          <Text style={[styles.createBtnText, { color: theme.bg }]}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Tier bar */}
      <View style={[styles.tierBar, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        <Ionicons name="people-outline" size={13} color={theme.textMuted} />
        <Text style={[styles.tierBarText, { color: theme.textMuted }]}>
          {userTier === 'free'
            ? `Free: ${ownedCount}/1 group`
            : userTier === 'pro'
            ? `Pro: ${ownedCount}/5 groups`
            : 'Premium: Unlimited groups'}
        </Text>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        {(['My Groups', 'Discover', 'Challenges'] as Tab[]).map((tab) => (
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
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={reload}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* My Groups */}
        {activeTab === 'My Groups' && (
          myGroups.length === 0 ? (
            <EmptyState
              theme={theme}
              icon="people-outline"
              title="No groups yet"
              subtitle="Create your own group or join one from Discover to connect with others."
              buttonLabel="Browse Groups"
              onButtonPress={() => setActiveTab('Discover')}
            />
          ) : (
            myGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                theme={theme}
                onPress={() => handleOpenGroup(group)}
                onJoin={() => handleJoin(group.id, group.is_joined ?? false)}
                onDelete={() => handleDelete(group.id)}
              />
            ))
          )
        )}

        {/* Discover */}
        {activeTab === 'Discover' && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Popular Groups
            </Text>
            {discoverGroups.length === 0 ? (
              <EmptyState
                theme={theme}
                icon="compass-outline"
                title="No groups to discover yet"
                subtitle="Be the first to create a group and invite others to join."
              />
            ) : (
              discoverGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  theme={theme}
                  onPress={() => handleOpenGroup(group)}
                  onJoin={() => handleJoin(group.id, group.is_joined ?? false)}
                  onDelete={() => handleDelete(group.id)}
                />
              ))
            )}
          </>
        )}

        {/* Challenges */}
        {activeTab === 'Challenges' && (
          <>
            <View style={[styles.challengeBanner, {
              backgroundColor: theme.accentDim as string,
              borderColor: theme.accent,
            }]}>
              <Ionicons name="flash" size={16} color={theme.accent} />
              <Text style={[styles.challengeBannerText, { color: theme.accent }]}>
                Complete challenges to earn CalFit Points and badges automatically.
              </Text>
            </View>
            {challenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                theme={theme}
                onToggle={() => toggleChallenge(c.id, c.joined)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Create Group Sheet */}
      <CreateGroupSheet
        theme={theme}
        visible={showCreate}
        canCreate={canCreate}
        ownedCount={ownedCount}
        groupLimit={groupLimit}
        userTier={userTier}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />

      {/* Group Detail Sheet */}
      <GroupDetailSheet
  theme={theme}
  group={selectedGroup!}
  visible={showGroupDetail && selectedGroup !== null}
  currentUserId={user?.id ?? ''}
  currentUserName={profile?.full_name ?? 'User'}
  onClose={() => {
    setShowGroupDetail(false);
    setSelectedGroup(null);
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },
  title: { fontSize: fontSize.lg, fontWeight: '700' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  createBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  tierBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  tierBarText: { fontSize: fontSize.xs },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: fontSize.sm },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  challengeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  challengeBannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: '600',
  },
});