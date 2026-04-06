import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── MY GROUPS TAB ─────────────────────────────────────────────
function MyGroupsTab({ theme }: { theme: typeof colors.dark }) {
  const groups = [
    {
      name: 'CalFit Champions',
      members: 5,
      goal: 'Log meals daily',
      streak: 22,
      active: true,
      initial: 'C',
    },
    {
      name: 'Morning Warriors',
      members: 12,
      goal: '6am workouts',
      streak: 8,
      active: false,
      initial: 'M',
    },
    {
      name: 'Plant Based Crew',
      members: 8,
      goal: 'Track macros daily',
      streak: 15,
      active: false,
      initial: 'P',
    },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
    >
      {/* Create group button */}
      <TouchableOpacity style={[styles.createGroupBtn, {
        borderColor: theme.accent,
      }]}>
        <Ionicons name="add-circle-outline" size={20} color={theme.accent} />
        <Text style={[styles.createGroupText, { color: theme.accent }]}>
          Create a new group
        </Text>
      </TouchableOpacity>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        My Groups ({groups.length})
      </Text>

      {groups.map((g) => (
        <TouchableOpacity key={g.name} style={[styles.groupCard, {
          backgroundColor: theme.card,
          borderColor: g.active ? theme.accent : theme.border,
        }]}>
          {g.active && (
            <View style={[styles.activeBar, { backgroundColor: theme.accent }]} />
          )}
          <View style={[styles.groupAvatar, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
            marginLeft: g.active ? spacing.sm : 0,
          }]}>
            <Text style={[styles.groupAvatarText, { color: theme.accent }]}>
              {g.initial}
            </Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: theme.textPrimary }]}>
              {g.name}
            </Text>
            <Text style={[styles.groupSub, { color: theme.textSecondary }]}>
              {g.members} members · {g.goal}
            </Text>
            <Text style={[styles.groupStreak, { color: theme.accent }]}>
              🔥 {g.streak} day streak
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── DISCOVER TAB ──────────────────────────────────────────────
function DiscoverTab({ theme }: { theme: typeof colors.dark }) {
  const suggested = [
    {
      name: 'Intermittent Fasting Club',
      members: 234,
      category: 'Nutrition',
      color: theme.orange,
    },
    {
      name: 'Runners United',
      members: 512,
      category: 'Cardio',
      color: theme.accentSecond,
    },
    {
      name: 'Keto Lifestyle',
      members: 189,
      category: 'Diet',
      color: theme.purple,
    },
    {
      name: 'Home Workout Heroes',
      members: 341,
      category: 'Fitness',
      color: theme.accent,
    },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
    >
      {/* Search */}
      <View style={[styles.searchBar, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} />
        <Text style={[styles.searchPlaceholder, { color: theme.textMuted }]}>
          Search groups...
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Suggested for You
      </Text>

      {suggested.map((g) => (
        <View key={g.name} style={[styles.discoverCard, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={[styles.discoverAvatar, {
            backgroundColor: g.color + '22',
            borderColor: g.color,
          }]}>
            <Ionicons name="people-outline" size={22} color={g.color} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: theme.textPrimary }]}>
              {g.name}
            </Text>
            <Text style={[styles.groupSub, { color: theme.textSecondary }]}>
              {g.members} members · {g.category}
            </Text>
          </View>
          <TouchableOpacity style={[styles.joinBtn, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}>
            <Text style={[styles.joinBtnText, { color: theme.accent }]}>Join</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// ── CHALLENGES TAB ────────────────────────────────────────────
function ChallengesTab({ theme }: { theme: typeof colors.dark }) {
  const challenges = [
    {
      name: '30-Day Protein Challenge',
      joined: 248,
      daysLeft: 18,
      pct: 0.6,
      color: theme.accent,
      icon: 'nutrition-outline',
    },
    {
      name: '10K Steps Weekly',
      joined: 512,
      daysLeft: 4,
      pct: 0.82,
      color: theme.accentSecond,
      icon: 'footsteps-outline',
    },
    {
      name: 'No Sugar November',
      joined: 189,
      daysLeft: 22,
      pct: 0.27,
      color: theme.orange,
      icon: 'ban-outline',
    },
    {
      name: '21-Day Meditation',
      joined: 94,
      daysLeft: 14,
      pct: 0.33,
      color: theme.purple,
      icon: 'leaf-outline',
    },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
    >
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Active Challenges
      </Text>

      {challenges.map((ch) => (
        <View key={ch.name} style={[styles.challengeCard, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={styles.challengeHeader}>
            <View style={[styles.challengeIcon, {
              backgroundColor: ch.color + '22',
            }]}>
              <Ionicons name={ch.icon as any} size={20} color={ch.color} />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={[styles.groupName, { color: theme.textPrimary }]}>
                {ch.name}
              </Text>
              <Text style={[styles.groupSub, { color: theme.textSecondary }]}>
                {ch.joined} joined · {ch.daysLeft} days left
              </Text>
            </View>
            <TouchableOpacity style={[styles.joinBtn, {
              backgroundColor: ch.color + '22',
              borderColor: ch.color,
            }]}>
              <Text style={[styles.joinBtnText, { color: ch.color }]}>Join</Text>
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={[styles.challengeBarBg, { backgroundColor: theme.border }]}>
            <View style={[styles.challengeBarFill, {
              backgroundColor: ch.color,
              width: `${ch.pct * 100}%` as any,
            }]} />
          </View>
          <Text style={[styles.challengePct, { color: theme.textMuted }]}>
            {Math.round(ch.pct * 100)}% complete
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const [activeTab, setActiveTab] = useState<'MyGroups' | 'Discover' | 'Challenges'>('MyGroups');

  const tabs = [
    { key: 'MyGroups', label: 'My Groups' },
    { key: 'Discover', label: 'Discover' },
    { key: 'Challenges', label: 'Challenges' },
  ] as const;

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
          <Text style={[styles.backText, { color: theme.textPrimary }]}>
            Home
          </Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          Community
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: theme.accent },
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? theme.textPrimary : theme.textMuted },
              activeTab === tab.key && { fontWeight: '700' },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'MyGroups' && <MyGroupsTab theme={theme} />}
      {activeTab === 'Discover' && <DiscoverTab theme={theme} />}
      {activeTab === 'Challenges' && <ChallengesTab theme={theme} />}
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabContent: { paddingBottom: 100 },

  // Header
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

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabText: { fontSize: fontSize.base },

  // Section label
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  // Create group
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  createGroupText: { fontSize: fontSize.base, fontWeight: '600' },

  // Group cards
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activeBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
  },
  groupAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
    marginRight: spacing.md,
  },
  groupAvatarText: { fontSize: fontSize.xl, fontWeight: '700' },
  groupInfo: { flex: 1 },
  groupName: { fontSize: fontSize.base, fontWeight: '700' },
  groupSub: { fontSize: fontSize.sm, marginTop: 2 },
  groupStreak: { fontSize: fontSize.sm, fontWeight: '600', marginTop: 4 },

  // Discover
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchPlaceholder: { fontSize: fontSize.base },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  discoverAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  joinBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  joinBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  // Challenges
  challengeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  challengeIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  challengeInfo: { flex: 1 },
  challengeBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  challengeBarFill: { height: '100%', borderRadius: 3 },
  challengePct: { fontSize: fontSize.xs, marginTop: 4 },
});