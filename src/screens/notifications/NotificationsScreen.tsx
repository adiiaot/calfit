import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import {
  AppNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../services/notificationService';

// ── NOTIFICATION ICON ─────────────────────────────────────────
function NotifIcon({
  type,
  theme,
}: {
  type: AppNotification['type'];
  theme: typeof colors.dark;
}) {
  const config: Record<AppNotification['type'], { icon: string; color: string }> = {
    achievement: { icon: 'trophy',              color: theme.gold },
    social:      { icon: 'heart',               color: theme.red },
    streak:      { icon: 'flame',               color: theme.orange },
    upgrade:     { icon: 'star',                color: theme.gold },
    coach:       { icon: 'chatbubble-ellipses', color: theme.accent },
    community:   { icon: 'people',              color: theme.accentSecond },
    goal:        { icon: 'checkmark-circle',    color: theme.accent },
    referral:    { icon: 'wallet',              color: theme.accent },
    system:      { icon: 'settings',            color: theme.textSecondary },
    welcome:     { icon: 'sparkles',            color: theme.accent },
  };

  const { icon, color } = config[type] ?? { icon: 'notifications', color: theme.accent };

  return (
    <View style={[styles.notifIcon, { backgroundColor: color + '22' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
  );
}

// ── TIME AGO ──────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── NOTIFICATION ITEM ─────────────────────────────────────────
function NotifItem({
  notif,
  theme,
  onPress,
  onDelete,
}: {
  notif: AppNotification;
  theme: typeof colors.dark;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onPress(notif.id)}
      onLongPress={() =>
        Alert.alert(
          'Delete notification?',
          '',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(notif.id) },
          ]
        )
      }
      style={[styles.notifRow, {
        backgroundColor: notif.read ? theme.card : theme.accentDim as string,
        borderColor: notif.read ? theme.border : theme.accent,
      }]}
    >
      <NotifIcon type={notif.type} theme={theme} />
      <View style={styles.notifContent}>
        <View style={styles.notifTitleRow}>
          <Text style={[styles.notifTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {notif.title}
          </Text>
          {!notif.read && (
            <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />
          )}
        </View>
        <Text style={[styles.notifBody, { color: theme.textSecondary }]} numberOfLines={2}>
          {notif.body}
        </Text>
        <View style={styles.notifFooter}>
          <Text style={[styles.notifTime, { color: theme.textMuted }]}>
            {timeAgo(notif.created_at)}
          </Text>
          {notif.action_label && (
            <Text style={[styles.notifAction, { color: theme.accent }]}>
              {notif.action_label} →
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
  const filters = ['All', 'Unread', 'Activity', 'Achievements', 'System'];

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
            {f === 'Unread' && unreadCount > 0 ? `Unread (${unreadCount})` : f}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user } = useAuthStore();
  const theme = colors[colorScheme];

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load on mount and every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadNotifications();
    }, [user?.id])
  );

  const loadNotifications = async () => {
    if (!user?.id) return;
    const data = await getNotifications(user.id);
    setNotifications(data);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

 const handleMarkRead = async (id: string) => {
  // Mark as read in DB
  await markNotificationRead(id);

  // Update local state
  setNotifications((prev) =>
    prev.map((n) => n.id === id ? { ...n, read: true } : n)
  );

  // Navigate based on action label
  const notif = notifications.find((n) => n.id === id);
  if (!notif?.action_label) return;

  const actionMap: Record<string, () => void> = {
    'View Streaks':  () => navigation.getParent()?.navigate('Streaks'),
    'Check In':      () => navigation.getParent()?.navigate('Streaks'),
    'View Progress': () => navigation.getParent()?.navigate('Progress'),
    'View Calories': () => navigation.navigate('Calorie'),
    'View History':  () => navigation.navigate('Activity'),
    'View Plan':     () => navigation.navigate('Meals'),
    'Open Coach':    () => navigation.navigate('Coach'),
    'View Group':    () => navigation.getParent()?.navigate('Community'),
    'View Earnings': () => navigation.navigate('Credits'),
    'View Plans':    () => navigation.getParent()?.navigate('Subscription'),
    'Complete Profile': () => navigation.getParent()?.navigate('EditProfile'),
    'Reply':         () => navigation.navigate('Social'),
    'View Post':     () => navigation.navigate('Social'),
  };

  const navigate = actionMap[notif.action_label];
  if (navigate) navigate();
};

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Filter logic
  const filtered = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !n.read;
    if (activeFilter === 'Activity') return ['goal', 'streak', 'coach'].includes(n.type);
    if (activeFilter === 'Achievements') return ['achievement', 'referral', 'upgrade'].includes(n.type);
    if (activeFilter === 'System') return ['system', 'welcome'].includes(n.type);
    return true;
  });

  const unread = filtered.filter((n) => !n.read);
  const read = filtered.filter((n) => n.read);

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
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markAllText, { color: theme.accent }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      {/* Filter tabs */}
      <FilterTabs
        theme={theme}
        active={activeFilter}
        onSelect={setActiveFilter}
        unreadCount={unreadCount}
      />

      {/* Empty state */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={52} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {activeFilter === 'Unread' ? 'All caught up!' : 'No notifications yet'}
          </Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            {activeFilter === 'Unread'
              ? 'You have no unread notifications right now.'
              : 'Complete activities in the app and your notifications will appear here.'}
          </Text>
        </View>
      ) : (
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
          {/* Unread section */}
          {unread.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>New</Text>
              {unread.map((notif) => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  theme={theme}
                  onPress={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}

          {/* Read section */}
          {read.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Earlier</Text>
              {read.map((notif) => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  theme={theme}
                  onPress={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}

          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Long press any notification to delete it
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: spacing.xs },

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

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },


  actionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },

  
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

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },

  hint: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});