import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { AndroidSafeView } from '../../shared/AndriodSafeView';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';
import { GroupCard } from '../components/GroupCard';
import { ChallengeCard } from '../components/ChallengeCard';
import { CreateGroupSheet } from '../components/CreateGroupSheet';
import { GroupDetailSheet } from '../components/GroupDetailSheet';
import { EmptyState } from '../../shared/EmptyState';
import { useGroup } from '../hooks/useGroup';
import { useChallenge } from '../hooks/useChallenge';
import { GroupData } from '../services/groupService';
import { ChallengeEntry } from '../services/challengeService';
import { supabase } from '../../../services/supabase';

type Tab = 'My Groups' | 'Discover' | 'Challenges';

// ── HARDCODED SAFE COLORS (avoid theme.orange TypeScript issues) ──
const ORANGE  = '#FFB347';
const GOLD    = '#FFD133';
const PINK    = '#FF6B9D';
const PURPLE  = '#B280FF';
const BLUE    = '#6699FF';
const RED     = '#FF5959';

// ── CHALLENGE BADGE MAP ───────────────────────────────────────
// Per client correction: badges replace points on challenges
const BADGE_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  Steps:      { emoji: '👟', label: 'Step Champion',   color: BLUE   },
  Hydration:  { emoji: '💧', label: 'Hydration Hero',  color: '#60A5FA' },
  Fitness:    { emoji: '💪', label: 'Fitness Beast',    color: ORANGE },
  Nutrition:  { emoji: '🥗', label: 'Nutrition Star',   color: '#2DDC8C' },
  Streaks:    { emoji: '🔥', label: 'Streak Legend',    color: PINK   },
  Sleep:      { emoji: '😴', label: 'Sleep Champion',   color: PURPLE },
  Sports:     { emoji: '🏆', label: 'Sports Warrior',   color: GOLD   },
};

// ── COMMUNITY STREAK ROW ──────────────────────────────────────
// Matches client reference image: large circular avatars, fire + count,
// crown on #1, gold/silver/bronze rings for top 3
interface StreakMember {
  id: string; name: string; avatar: string | null; streak: number;
}

function CommunityStreakRow({ theme }: { theme: typeof colors.dark }) {
  const [members, setMembers] = useState<StreakMember[]>([]);

  useFocusEffect(useCallback(() => { loadTopStreaks(); }, []));

  const loadTopStreaks = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, streak_count')
        .order('streak_count', { ascending: false })
        .limit(8);
      if (data) setMembers((data as any[]).map((m) => ({
        id: m.id,
        name: m.full_name ?? 'User',
        avatar: m.avatar_url ?? null,
        streak: m.streak_count ?? 0,
      })));
    } catch {}
  };

  if (members.length === 0) return null;

  const ringColor = (i: number) =>
    i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : theme.border;

  const crownEmoji = (i: number) =>
    i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

  return (
    <View style={[str.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header row */}
      <View style={str.cardHeader}>
        <View style={str.cardHeaderLeft}>
          <Text style={str.fireIcon}>🔥</Text>
          <View>
            <Text style={[str.cardTitle, { color: theme.textPrimary }]}>Community Streaks</Text>
            <Text style={[str.cardSub, { color: theme.textMuted }]}>Top members this week</Text>
          </View>
        </View>
      </View>

      {/* Avatar row — matches reference: large circles, fire + count below */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={str.row}
      >
        {members.map((m, i) => (
          <View key={m.id} style={str.memberWrap}>
            {/* Crown / medal above avatar */}
            <Text style={str.crown}>{crownEmoji(i) ?? ' '}</Text>

            {/* Avatar with coloured ring */}
            <View style={[str.ring, { borderColor: ringColor(i) }]}>
              <UserAvatar uri={m.avatar} name={m.name} size={56} theme={theme} />
            </View>

            {/* Fire + streak count pill below avatar */}
            <View style={[str.streakPill, {
              backgroundColor: m.streak > 0 ? PINK : theme.border,
            }]}>
              <Text style={str.streakPillText}>🔥 {m.streak}</Text>
            </View>

            {/* First name */}
            <Text style={[str.memberName, { color: theme.textSecondary }]} numberOfLines={1}>
              {m.name.split(' ')[0]}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const str = StyleSheet.create({
  card:       { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: radius.lg, borderWidth: 1, paddingBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fireIcon:   { fontSize: 20 },
  cardTitle:  { fontSize: fontSize.base, fontWeight: '700' },
  cardSub:    { fontSize: fontSize.xs, marginTop: 1 },
  row:        { paddingHorizontal: spacing.md, gap: spacing.lg },
  memberWrap: { alignItems: 'center', gap: 4, width: 68 },
  crown:      { fontSize: 14, height: 18, textAlign: 'center' },
  ring:       { borderRadius: 32, borderWidth: 2.5, padding: 2 },
  streakPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, marginTop: 2 },
  streakPillText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  memberName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});

// ── FREE TIER GATE CARD ───────────────────────────────────────
function PremiumGateCard({ theme, onUpgrade }: { theme: typeof colors.dark; onUpgrade: () => void }) {
  return (
    <View style={[gate.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <LinearGradient
        colors={[PINK + 'CC', ORANGE + 'CC'] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={gate.banner}
      >
        <Ionicons name="lock-closed" size={18} color="#fff" />
        <Text style={gate.bannerText}>Premium Communities</Text>
      </LinearGradient>
      <Text style={[gate.desc, { color: theme.textMuted }]}>
        Upgrade to Pro or Premium to join communities created by other CalFit members.
      </Text>
      <TouchableOpacity onPress={onUpgrade} style={[gate.btn, { backgroundColor: theme.accent }]}>
        <Text style={[gate.btnText, { color: theme.bg }]}>Upgrade Now</Text>
      </TouchableOpacity>
    </View>
  );
}
const gate = StyleSheet.create({
  wrap:   { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  bannerText: { color: '#fff', fontWeight: '800', fontSize: fontSize.base },
  desc:   { padding: spacing.md, paddingTop: spacing.sm, fontSize: fontSize.sm, lineHeight: 20 },
  btn:    { marginHorizontal: spacing.md, marginBottom: spacing.md, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  btnText:{ fontWeight: '800', fontSize: fontSize.sm },
});

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const userTier = (profile as any)?.subscription_tier ?? 'free';
  const isFree   = userTier === 'free';

  const [activeTab, setActiveTab]           = useState<Tab>('My Groups');
  const [showCreate, setShowCreate]         = useState(false);
  const [selectedGroup, setSelectedGroup]   = useState<GroupData | null>(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [isRefreshing, setIsRefreshing]     = useState(false);

  const {
    myGroups, discoverGroups, canCreate, ownedCount, groupLimit,
    isLoading, create, join, leave, remove, reload,
  } = useGroup(user?.id ?? '', userTier);

  const { challenges, toggle: toggleChallenge } = useChallenge(user?.id ?? '');

  const handleCreate = async (name: string, description: string, category: string) => {
    const group = await create(name, description, category);
    if (group) Alert.alert('Group Created! 🎉', `${name} is ready.`);
  };

  const handleJoin = async (groupId: string, isJoined: boolean) => {
    isJoined ? await leave(groupId) : await join(groupId);
  };

  const handleDelete = (groupId: string) => {
    Alert.alert('Delete Group', 'This will permanently delete the group.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const result = await remove(groupId);
        if (result && !result.success) Alert.alert('Error', result.error ?? 'Please try again.');
      }},
    ]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  // Tab colours — no theme.orange, use hardcoded safe values
  const TAB_COLORS: Record<Tab, string> = {
    'My Groups':  theme.accent,
    'Discover':   BLUE,
    'Challenges': ORANGE,
  };
  const TABS: Tab[] = ['My Groups', 'Discover', 'Challenges'];

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* ── GRADIENT HEADER ── */}
      <LinearGradient
        colors={[BLUE + 'DD', theme.accent + 'CC'] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Communities</Text>
          <Text style={styles.headerSub}>Train together · Grow together</Text>
        </View>

        {canCreate && (
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={styles.createBtn}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* ── FREE TIER LIMIT BAR ── */}
      {isFree && (
        <View style={[styles.tierBar, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
          <Ionicons name="information-circle-outline" size={14} color={theme.accent} />
          <Text style={[styles.tierBarText, { color: theme.accent }]}>
            Free plan · {groupLimit - ownedCount} group{groupLimit - ownedCount !== 1 ? 's' : ''} remaining · Upgrade for more
          </Text>
        </View>
      )}

      {/* ── COLOURED TAB BAR ── */}
      <View style={[styles.tabBar, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, active && { borderBottomColor: TAB_COLORS[tab] }]}
            >
              <Text style={[
                styles.tabText,
                { color: active ? TAB_COLORS[tab] : theme.textMuted },
                active && { fontWeight: '700' },
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing} onRefresh={handleRefresh}
            tintColor={theme.accent} colors={[theme.accent]}
          />
        }
      >
        {/* ── COMMUNITY STREAK ROW — always at top ── */}
        <View style={{ marginTop: spacing.md }}>
          <CommunityStreakRow theme={theme} />
        </View>

        {/* ══════════ MY GROUPS TAB ══════════ */}
        {activeTab === 'My Groups' && (
          <>
            {/* Upgrade nudge if at limit */}
            {!canCreate && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Subscription' as never)}
                style={[styles.nudgeRow, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}
              >
                <Ionicons name="rocket-outline" size={16} color={theme.accent} />
                <Text style={[styles.nudgeText, { color: theme.accent }]}>
                  Upgrade to create more groups
                </Text>
                <Ionicons name="chevron-forward" size={14} color={theme.accent} />
              </TouchableOpacity>
            )}

            {myGroups.length === 0 ? (
              <EmptyState
                theme={theme} icon="people-outline"
                title="No groups yet"
                subtitle="Create a group or join one in Discover to start training together."
                buttonLabel="Discover Groups"
                onButtonPress={() => setActiveTab('Discover')}
              />
            ) : (
              myGroups.map((g) => (
                <GroupCard
                  key={g.id} group={g} theme={theme}
                  onPress={() => { setSelectedGroup(g); setShowGroupDetail(true); }}
                  onJoin={() => handleJoin(g.id, g.is_joined ?? false)}
                  onDelete={() => handleDelete(g.id)}
                />
              ))
            )}
          </>
        )}

        {/* ══════════ DISCOVER TAB ══════════ */}
        {activeTab === 'Discover' && (
          <>
            {/* Gate card for free users — shown before any groups */}
            {isFree && (
              <PremiumGateCard
                theme={theme}
                onUpgrade={() => navigation.navigate('Subscription' as never)}
              />
            )}

            {discoverGroups.length === 0 ? (
              <EmptyState
                theme={theme} icon="compass-outline"
                title="No groups to discover"
                subtitle="Be the first to create a community group!"
              />
            ) : (
              discoverGroups
                // Free users: only see non-premium groups
                .filter((g: any) => isFree ? !g.is_premium : true)
                .map((g: any) => (
                  <GroupCard
                    key={g.id} group={g} theme={theme}
                    onPress={() => { setSelectedGroup(g); setShowGroupDetail(true); }}
                    onJoin={() => handleJoin(g.id, g.is_joined ?? false)}
                    onDelete={() => handleDelete(g.id)}
                  />
                ))
            )}
          </>
        )}

        {/* ══════════ CHALLENGES TAB ══════════ */}
        {activeTab === 'Challenges' && (
          <>
            {/* Badge info banner */}
            <View style={[styles.badgeBanner, { backgroundColor: GOLD + '18', borderColor: GOLD + '44' }]}>
              <Text style={{ fontSize: 18 }}>🏅</Text>
              <Text style={[styles.badgeBannerText, { color: GOLD }]}>
                Complete challenges to earn exclusive badges shown on your public profile
              </Text>
            </View>

            {challenges.length === 0 ? (
              <EmptyState
                theme={theme} icon="trophy-outline"
                title="No active challenges"
                subtitle="New challenges drop every week. Check back soon!"
              />
            ) : (
              challenges.map((c: ChallengeEntry) => {
                const badge = BADGE_MAP[c.category] ?? { emoji: '🏅', label: 'Community Badge', color: theme.accent };
                return (
                  <View
                    key={c.id}
                    style={[styles.challengeCard, {
                      backgroundColor: theme.card,
                      borderColor: c.joined ? theme.accent : theme.border,
                      borderWidth: c.joined ? 2 : 1,
                    }]}
                  >
                    {/* Auto badge pill */}
                    <View style={[styles.autoPill, { backgroundColor: theme.accentDim as string }]}>
                      <Ionicons name="flash" size={10} color={theme.accent} />
                      <Text style={[styles.autoPillText, { color: theme.accent }]}>Auto Challenge</Text>
                    </View>

                    {/* Emoji + title + category */}
                    <View style={styles.challengeHeader}>
                      <Text style={styles.challengeEmoji}>{c.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={styles.challengeTitleRow}>
                          <Text style={[styles.challengeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                            {c.title}
                          </Text>
                          <View style={[styles.catPill, { backgroundColor: badge.color + '22' }]}>
                            <Text style={[styles.catText, { color: badge.color }]}>{c.category}</Text>
                          </View>
                        </View>
                        <Text style={[styles.challengeDesc, { color: theme.textMuted }]} numberOfLines={2}>
                          {c.description}
                        </Text>
                      </View>
                    </View>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Ionicons name="people-outline" size={12} color={BLUE} />
                        <Text style={[styles.statText, { color: BLUE }]}>
                          {c.participants.toLocaleString()} joined
                        </Text>
                      </View>
                      <View style={styles.stat}>
                        <Ionicons name="time-outline" size={12} color={ORANGE} />
                        <Text style={[styles.statText, { color: ORANGE }]}>
                          {c.days_left}d left
                        </Text>
                      </View>
                    </View>

                    {/* Badge reward — replaces points per client correction */}
                    <View style={[styles.badgeReward, { backgroundColor: badge.color + '12', borderColor: badge.color + '33' }]}>
                      <Text style={{ fontSize: 16 }}>{badge.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.badgeRewardTitle, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                        <Text style={[styles.badgeRewardSub, { color: theme.textMuted }]}>
                          Earns a profile badge upon completion
                        </Text>
                      </View>
                    </View>

                    {/* Join / Leave button */}
                    <TouchableOpacity
                      onPress={() => toggleChallenge(c.id, c.joined)}
                      style={[styles.joinBtn, {
                        backgroundColor: c.joined ? theme.border : theme.accent,
                      }]}
                    >
                      <Text style={[styles.joinBtnText, {
                        color: c.joined ? theme.textMuted : theme.bg,
                      }]}>
                        {c.joined ? '✓ Joined' : 'Join Challenge'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── SHEETS ── */}
      <CreateGroupSheet
        theme={theme} visible={showCreate} canCreate={canCreate}
        ownedCount={ownedCount} groupLimit={groupLimit} userTier={userTier}
        onClose={() => setShowCreate(false)} onCreate={handleCreate}
      />

      {selectedGroup !== null && (
        <GroupDetailSheet
          theme={theme} group={selectedGroup} visible={showGroupDetail}
          currentUserId={user?.id ?? ''} currentUserName={profile?.full_name ?? 'User'}
          onClose={() => { setShowGroupDetail(false); setSelectedGroup(null); }}
        />
      )}
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:          { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 4 },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: fontSize.xl, fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  createBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.18)' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },

  // Tier bar
  tierBar:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.xs, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1 },
  tierBarText: { fontSize: fontSize.xs, fontWeight: '600', flex: 1 },

  // Tab bar
  tabBar:  { flexDirection: 'row', borderBottomWidth: 1 },
  tab:     { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2, borderBottomWidth: 2.5, borderBottomColor: 'transparent', marginBottom: -1 },
  tabText: { fontSize: fontSize.sm, fontWeight: '500' },

  // Nudge row
  nudgeRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  nudgeText: { flex: 1, fontSize: fontSize.xs, fontWeight: '600' },

  // Badge banner
  badgeBanner:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  badgeBannerText: { flex: 1, fontSize: fontSize.xs, fontWeight: '600', lineHeight: 16 },

  // Challenge card
  challengeCard:   { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, gap: spacing.md },
  autoPill:        { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  autoPillText:    { fontSize: 9, fontWeight: '700' },
  challengeHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  challengeEmoji:  { fontSize: 30 },
  challengeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  challengeTitle:  { fontSize: fontSize.base, fontWeight: '700', flex: 1 },
  catPill:         { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  catText:         { fontSize: 9, fontWeight: '700' },
  challengeDesc:   { fontSize: fontSize.sm, marginTop: 2, lineHeight: 18 },
  statsRow:        { flexDirection: 'row', gap: spacing.lg },
  stat:            { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText:        { fontSize: fontSize.xs, fontWeight: '600' },
  badgeReward:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  badgeRewardTitle:{ fontSize: fontSize.sm, fontWeight: '700' },
  badgeRewardSub:  { fontSize: fontSize.xs, marginTop: 1 },
  joinBtn:         { paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  joinBtnText:     { fontSize: fontSize.base, fontWeight: '700' },
});