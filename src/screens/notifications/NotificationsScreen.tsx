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

// ── NOTIFICATION TYPES ────────────────────────────────────────
type NotificationType =
  | 'achievement'
  | 'social'
  | 'streak'
  | 'upgrade'
  | 'coach'
  | 'community'
  | 'goal'
  | 'referral'
  | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  actionLabel?: string;
}

// ── NOTIFICATION ICON ─────────────────────────────────────────
function NotifIcon({
  type,
  theme,
}: {
  type: NotificationType;
  theme: typeof colors.dark;
}) {
  const config: Record<NotificationType, { icon: string; color: string }> = {
    achievement: { icon: 'trophy',              color: theme.gold },
    social:      { icon: 'heart',               color: theme.red },
    streak:      { icon: 'flame',               color: theme.orange },
    upgrade:     { icon: 'star',                color: theme.gold },
    coach:       { icon: 'chatbubble-ellipses', color: theme.accent },
    community:   { icon: 'people',              color: theme.accentSecond },
    goal:        { icon: 'checkmark-circle',    color: theme.accent },
    referral:    { icon: 'wallet',              color: theme.accent },
    system:      { icon: 'notifications',       color: theme.textSecondary },
  };

  const { icon, color } = config[type];

  return (
    <View style={[styles.notifIcon, { backgroundColor: color + '22' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
  );
}

// ── NOTIFICATION ITEM ─────────────────────────────────────────
function NotifItem({
  notif,
  theme,
  onPress,
}: {
  notif: Notification;
  theme: typeof colors.dark;
  onPress: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onPress(notif.id)}
      style={[styles.notifRow, {
        backgroundColor: notif.read ? theme.card : theme.accentDim as string,
        borderColor: notif.read ? theme.border : theme.accent,
      }]}
    >
      <NotifIcon type={notif.type} theme={theme} />
      <View style={styles.notifContent}>
        <View style={styles.notifTitleRow}>
          <Text style={[styles.notifTitle, { color: theme.textPrimary }]}>
            {notif.title}
          </Text>
          {!notif.read && (
            <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />
          )}
        </View>
        <Text style={[styles.notifBody, { color: theme.textSecondary }]}>
          {notif.body}
        </Text>
        <View style={styles.notifFooter}>
          <Text style={[styles.notifTime, { color: theme.textMuted }]}>
            {notif.time}
          </Text>
          {notif.actionLabel && (
            <Text style={[styles.notifAction, { color: theme.accent }]}>
              {notif.actionLabel} →
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── FILTER TABS ───────────────────────────────────────────────
function FilterTabs({
  theme,
  active,
  onSelect,
  unreadCount,
}: {
  theme: typeof colors.dark;
  active: string;
  onSelect: (f: string) => void;
  unreadCount: number;
}) {
  const filters = ['All', 'Unread', 'Social', 'Achievements', 'System'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {filters.map((f) => (
        <TouchableOpacity
          key={f}
          onPress={() => onSelect(f)}
          style={[styles.filterTab, {
            backgroundColor: active === f ? theme.accent : theme.card,
            borderColor: active === f ? theme.accent : theme.border,
          }]}
        >
          <Text style={[styles.filterTabText, {
            color: active === f ? theme.bg : theme.textSecondary,
            fontWeight: active === f ? '700' : '400',
          }]}>
            {f}
            {f === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const [activeFilter, setActiveFilter] = useState('All');

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'achievement',
      title: '14-Day Streak! 🔥',
      body: "You've hit a 14-day streak — Gold badge unlocked. Keep it going!",
      time: '2 min ago',
      read: false,
      actionLabel: 'View Streaks',
    },
    {
      id: '2',
      type: 'coach',
      title: 'Weekly Feedback from Coach',
      body: 'You averaged 128g protein/day this week. Sleep dipped mid-week — I have a plan to fix that.',
      time: '18 min ago',
      read: false,
      actionLabel: 'Open Coach',
    },
    {
      id: '3',
      type: 'social',
      title: 'Alex liked your post',
      body: 'Alex reacted 🔥 to your leg day workout post.',
      time: '1 hr ago',
      read: false,
      actionLabel: 'View Post',
    },
    {
      id: '4',
      type: 'goal',
      title: 'Daily Calorie Goal Hit! ✓',
      body: "You hit your 2,000 kcal goal today. Protein was on point at 142g.",
      time: '2 hrs ago',
      read: false,
    },
    {
      id: '5',
      type: 'community',
      title: 'Jordan joined your group',
      body: 'Jordan M. just joined CalFit Champions. Welcome them to the group!',
      time: '3 hrs ago',
      read: true,
      actionLabel: 'View Group',
    },
    {
      id: '6',
      type: 'social',
      title: 'Mia commented on your post',
      body: 'Mia K.: "This is so inspiring! What programme are you following?"',
      time: '4 hrs ago',
      read: true,
      actionLabel: 'Reply',
    },
    {
      id: '7',
      type: 'streak',
      title: "Don't lose your streak!",
      body: "You haven't checked in today. Log anything to keep your 14-day streak alive.",
      time: '5 hrs ago',
      read: true,
      actionLabel: 'Check In',
    },
    {
      id: '8',
      type: 'referral',
      title: 'Referral Earnings Update',
      body: 'Sam just upgraded to Pro. You earned $0.99 in referral commission.',
      time: 'Yesterday',
      read: true,
      actionLabel: 'View Earnings',
    },
    {
      id: '9',
      type: 'upgrade',
      title: 'Upgrade to Premium 🌟',
      body: 'Unlock unlimited Coach prompts, live streaming, and the full earnings wallet.',
      time: 'Yesterday',
      read: true,
      actionLabel: 'Upgrade Now',
    },
    {
      id: '10',
      type: 'achievement',
      title: 'New Badge Unlocked — FirstMile 👟',
      body: "You've tracked 1,000 steps for the first time. Your step journey begins!",
      time: '2 days ago',
      read: true,
    },
    {
      id: '11',
      type: 'goal',
      title: 'Water Goal Achieved 💧',
      body: "You hit your 2.5L water goal today. Hydration is key to recovery.",
      time: '2 days ago',
      read: true,
    },
    {
      id: '12',
      type: 'system',
      title: 'CalFit Update Available',
      body: 'Version 1.1.0 is available. New features: improved food scanner accuracy and meal plan sharing.',
      time: '3 days ago',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !n.read;
    if (activeFilter === 'Social') return n.type === 'social' || n.type === 'community';
    if (activeFilter === 'Achievements') return n.type === 'achievement' || n.type === 'goal' || n.type === 'streak';
    if (activeFilter === 'System') return n.type === 'system' || n.type === 'upgrade';
    return true;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
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
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Home</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          Notifications
        </Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={[styles.markAllText, { color: theme.accent }]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <FilterTabs
        theme={theme}
        active={activeFilter}
        onSelect={setActiveFilter}
        unreadCount={unreadCount}
      />

      {/* Notification list */}
      {filteredNotifs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            All caught up!
          </Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            No notifications in this category
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Unread section */}
          {filteredNotifs.some((n) => !n.read) && (
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              New
            </Text>
          )}
          {filteredNotifs.filter((n) => !n.read).map((notif) => (
            <NotifItem key={notif.id} notif={notif} theme={theme} onPress={markRead} />
          ))}

          {/* Read section */}
          {filteredNotifs.some((n) => n.read) && (
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Earlier
            </Text>
          )}
          {filteredNotifs.filter((n) => n.read).map((notif) => (
            <NotifItem key={notif.id} notif={notif} theme={theme} onPress={markRead} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: spacing.sm },

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
  markAllText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Filters
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
  },
  filterTabText: { fontSize: fontSize.sm },

  // Section label
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  // Notification row
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  notifIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: { fontSize: fontSize.base, fontWeight: '700', flex: 1 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    marginLeft: spacing.sm, flexShrink: 0,
  },
  notifBody: { fontSize: fontSize.sm, lineHeight: 18, marginBottom: spacing.xs },
  notifFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTime: { fontSize: fontSize.xs },
  notifAction: { fontSize: fontSize.xs, fontWeight: '700' },

  // Empty state
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  emptySub: { fontSize: fontSize.base },
});