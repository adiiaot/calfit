import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';
import { GroupCard } from '../../community/components/GroupCard';
import { GroupDetailSheet } from '../../community/components/GroupDetailSheet';
import { ChallengeCard } from '../../community/components/ChallengeCard';
import { useGroup } from '../../community/hooks/useGroup';
import { useChallenge } from '../../community/hooks/useChallenge';
import { GroupData } from '../../community/services/groupService';
import { ChallengeEntry } from '../../community/services/challengeService';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../services/supabase';

// ── PURPOSE ───────────────────────────────────────────────────
// This is the LIGHTWEIGHT embedded version of communities shown
// inside the Social screen's Communities tab.
// No AndroidSafeView, no header, no back button, no 3-tab nav.
// Just: streak row → top challenges → joinable groups
// with a "View All Communities" button that navigates to the
// full CommunityScreen for the complete experience.

const ORANGE = '#FFB347';
const PINK   = '#FF6B9D';
const BLUE   = '#6699FF';
const GOLD   = '#FFD133';

const BADGE_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  Steps:     { emoji: '👟', label: 'Step Champion',  color: BLUE   },
  Hydration: { emoji: '💧', label: 'Hydration Hero', color: '#60A5FA' },
  Fitness:   { emoji: '💪', label: 'Fitness Beast',  color: ORANGE },
  Nutrition: { emoji: '🥗', label: 'Nutrition Star', color: '#2DDC8C' },
  Streaks:   { emoji: '🔥', label: 'Streak Legend',  color: PINK   },
  Sleep:     { emoji: '😴', label: 'Sleep Champion', color: '#A78BFA' },
  Sports:    { emoji: '🏆', label: 'Sports Warrior', color: GOLD   },
};

// ── STREAK ROW ────────────────────────────────────────────────
interface StreakMember {
  id: string; name: string; avatar: string | null; streak: number;
}

function StreakRow({ theme }: { theme: typeof colors.dark }) {
  const [members, setMembers] = useState<StreakMember[]>([]);

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, streak_count')
        .order('streak_count', { ascending: false })
        .limit(8);
      if (data) setMembers((data as any[]).map((m) => ({
        id: m.id, name: m.full_name ?? 'User',
        avatar: m.avatar_url ?? null, streak: m.streak_count ?? 0,
      })));
    } catch {}
  };

  if (members.length === 0) return null;

  const ringColor = (i: number) =>
    i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : theme.border;

  const crownFor = (i: number) =>
    ['👑', '🥈', '🥉'][i] ?? null;

  return (
    <View style={[sr.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={sr.headerRow}>
        <Text style={sr.fire}>🔥</Text>
        <View>
          <Text style={[sr.title, { color: theme.textPrimary }]}>Community Streaks</Text>
          <Text style={[sr.sub, { color: theme.textMuted }]}>Top members this week</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sr.row}
      >
        {members.map((m, i) => (
          <View key={m.id} style={sr.memberWrap}>
            <Text style={sr.crown}>{crownFor(i) ?? ' '}</Text>
            <View style={[sr.ring, { borderColor: ringColor(i) }]}>
              <UserAvatar uri={m.avatar} name={m.name} size={56} theme={theme} />
            </View>
            <View style={[sr.pill, { backgroundColor: m.streak > 0 ? PINK : theme.border }]}>
              <Text style={sr.pillText}>🔥 {m.streak}</Text>
            </View>
            <Text style={[sr.name, { color: theme.textSecondary }]} numberOfLines={1}>
              {m.name.split(' ')[0]}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const sr = StyleSheet.create({
  card:       { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: radius.lg, borderWidth: 1, paddingBottom: spacing.md },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.sm },
  fire:       { fontSize: 20 },
  title:      { fontSize: fontSize.base, fontWeight: '700' },
  sub:        { fontSize: fontSize.xs, marginTop: 1 },
  row:        { paddingHorizontal: spacing.md, gap: spacing.lg },
  memberWrap: { alignItems: 'center', gap: 4, width: 68 },
  crown:      { fontSize: 14, height: 18, textAlign: 'center' },
  ring:       { borderRadius: 32, borderWidth: 2.5, padding: 2 },
  pill:       { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, marginTop: 2 },
  pillText:   { fontSize: 10, color: '#fff', fontWeight: '800' },
  name:       { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});

// ── MAIN COMPONENT ────────────────────────────────────────────
interface Props {
  theme: typeof colors.dark;
}

export function SocialCommunitiesTab({ theme }: Props) {
  const navigation = useNavigation<any>();
  const { user, profile } = useAuthStore();

  const userTier = (profile as any)?.subscription_tier ?? 'free';
  const isFree   = userTier === 'free';

  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [showDetail, setShowDetail]       = useState(false);
  const [isRefreshing, setIsRefreshing]   = useState(false);

  const { discoverGroups, join, leave, reload } = useGroup(user?.id ?? '', userTier);
  const { challenges, toggle: toggleChallenge } = useChallenge(user?.id ?? '');

  const handleJoin = async (groupId: string, isJoined: boolean) => {
    isJoined ? await leave(groupId) : await join(groupId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  // Show top 3 challenges and top 5 groups — keeps the tab lightweight
  const topChallenges = challenges.slice(0, 3);
  const topGroups     = (discoverGroups as any[])
    .filter((g) => isFree ? !g.is_premium : true)
    .slice(0, 5);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing} onRefresh={handleRefresh}
          tintColor={theme.accent} colors={[theme.accent]}
        />
      }
    >
      {/* ── STREAK ROW ── */}
      <View style={{ marginTop: spacing.md }}>
        <StreakRow theme={theme} />
      </View>

      {/* ── SECTION: TOP CHALLENGES ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <Text style={styles.sectionIcon}>🏆</Text>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Active Challenges
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Community' as never)}
          style={[styles.seeAllBtn, { borderColor: theme.border }]}
        >
          <Text style={[styles.seeAllText, { color: theme.accent }]}>See All</Text>
          <Ionicons name="chevron-forward" size={12} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {topChallenges.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No active challenges right now. Check back soon!
          </Text>
        </View>
      ) : (
        topChallenges.map((c: ChallengeEntry) => {
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
              <View style={styles.challengeTop}>
                <Text style={styles.challengeEmoji}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.challengeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <Text style={[styles.challengeDesc, { color: theme.textMuted }]} numberOfLines={1}>
                    {c.description}
                  </Text>
                </View>
                {/* Badge pill */}
                <View style={[styles.badgePill, { backgroundColor: badge.color + '20' }]}>
                  <Text style={{ fontSize: 10 }}>{badge.emoji}</Text>
                  <Text style={[styles.badgePillText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              <View style={styles.challengeBottom}>
                <View style={styles.stat}>
                  <Ionicons name="people-outline" size={11} color={BLUE} />
                  <Text style={[styles.statText, { color: BLUE }]}>{c.participants.toLocaleString()} joined</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="time-outline" size={11} color={ORANGE} />
                  <Text style={[styles.statText, { color: ORANGE }]}>{c.days_left}d left</Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleChallenge(c.id, c.joined)}
                  style={[styles.joinChallengeBtn, {
                    backgroundColor: c.joined ? theme.border : theme.accent,
                  }]}
                >
                  <Text style={[styles.joinChallengeBtnText, {
                    color: c.joined ? theme.textMuted : theme.bg,
                  }]}>
                    {c.joined ? '✓ Joined' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* ── SECTION: POPULAR GROUPS ── */}
      <View style={[styles.sectionHeader, { marginTop: spacing.sm }]}>
        <View style={styles.sectionLeft}>
          <Text style={styles.sectionIcon}>👥</Text>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Popular Groups
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Community' as never)}
          style={[styles.seeAllBtn, { borderColor: theme.border }]}
        >
          <Text style={[styles.seeAllText, { color: theme.accent }]}>See All</Text>
          <Ionicons name="chevron-forward" size={12} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {/* Free tier gate banner */}
      {isFree && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Subscription' as never)}
          style={[styles.gateBanner, { backgroundColor: PINK + '15', borderColor: PINK + '40' }]}
        >
          <Ionicons name="lock-closed-outline" size={14} color={PINK} />
          <Text style={[styles.gateBannerText, { color: PINK }]}>
            Upgrade to access all CalFit communities
          </Text>
          <Text style={[styles.gateBannerCta, { color: PINK }]}>Upgrade →</Text>
        </TouchableOpacity>
      )}

      {topGroups.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No groups yet. Be the first to create one!
          </Text>
        </View>
      ) : (
        topGroups.map((g: any) => (
          <GroupCard
            key={g.id}
            group={g}
            theme={theme}
            onPress={() => { setSelectedGroup(g); setShowDetail(true); }}
            onJoin={() => handleJoin(g.id, g.is_joined ?? false)}
            onDelete={() => {}}
          />
        ))
      )}

      {/* ── VIEW ALL CTA ── */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Community' as never)}
        style={[styles.viewAllBtn, { borderColor: theme.accent }]}
      >
        <LinearGradient
          colors={[theme.accent + '22', theme.accentSecond + '22'] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.viewAllGrad}
        >
          <Ionicons name="people-circle-outline" size={20} color={theme.accent} />
          <Text style={[styles.viewAllText, { color: theme.accent }]}>
            Explore All Communities
          </Text>
          <Ionicons name="arrow-forward" size={16} color={theme.accent} />
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 80 }} />

      {/* Group detail sheet */}
      {selectedGroup !== null && (
        <GroupDetailSheet
          theme={theme}
          group={selectedGroup}
          visible={showDetail}
          currentUserId={user?.id ?? ''}
          currentUserName={profile?.full_name ?? 'User'}
          onClose={() => { setShowDetail(false); setSelectedGroup(null); }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.lg },
  sectionLeft:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionIcon:   { fontSize: 16 },
  sectionTitle:  { fontSize: fontSize.base, fontWeight: '700' },
  seeAllBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1 },
  seeAllText:    { fontSize: fontSize.xs, fontWeight: '700' },

  // Empty card
  emptyCard:  { marginHorizontal: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center' },
  emptyText:  { fontSize: fontSize.sm, textAlign: 'center' },

  // Challenge card
  challengeCard:      { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.lg, gap: spacing.sm },
  challengeTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  challengeEmoji:     { fontSize: 26 },
  challengeTitle:     { fontSize: fontSize.sm, fontWeight: '700' },
  challengeDesc:      { fontSize: fontSize.xs, marginTop: 2 },
  badgePill:          { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: radius.sm },
  badgePillText:      { fontSize: 9, fontWeight: '700' },
  challengeBottom:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stat:               { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  statText:           { fontSize: fontSize.xs, fontWeight: '600' },
  joinChallengeBtn:   { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.md },
  joinChallengeBtnText:{ fontSize: fontSize.xs, fontWeight: '700' },

  // Gate banner
  gateBanner:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  gateBannerText: { flex: 1, fontSize: fontSize.xs, fontWeight: '600' },
  gateBannerCta:  { fontSize: fontSize.xs, fontWeight: '800' },

  // View all CTA
  viewAllBtn:   { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, overflow: 'hidden' },
  viewAllGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md + 2 },
  viewAllText:  { fontSize: fontSize.base, fontWeight: '700' },
});