import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── PROFILE CARD ─────────────────────────────────────────────
function ProfileCard({
  theme,
  name,
  username,
  tier,
  onProgressPress,
  onEditPress,
}: {
  theme: typeof colors.dark;
  name: string;
  username: string;
  tier: string;
  onProgressPress: () => void;
  onEditPress: () => void;
}) {
  const tierColor =
    tier === 'premium' ? theme.accent :
    tier === 'pro' ? theme.gold : theme.textMuted;
  const tierLabel =
    tier === 'premium' ? 'Premium' :
    tier === 'pro' ? 'Pro' : 'Free';

  return (
    <>
      <View style={[styles.profileCard, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        <View style={[styles.profileAvatar, {
          backgroundColor: theme.accentDim as string,
          borderColor: theme.accent,
        }]}>
          <Text style={[styles.profileAvatarText, { color: theme.accent }]}>
            {name[0]?.toUpperCase() ?? 'U'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.profileNameRow}>
            <Text style={[styles.profileName, { color: theme.textPrimary }]}>{name}</Text>
            <View style={[styles.tierBadge, {
              backgroundColor: tierColor + '22',
              borderColor: tierColor,
            }]}>
              <Text style={[styles.tierBadgeText, { color: tierColor }]}>{tierLabel}</Text>
            </View>
          </View>
          <Text style={[styles.profileHandle, { color: theme.textSecondary }]}>
            @{username}
          </Text>
          <TouchableOpacity onPress={onEditPress}>
            <Text style={[styles.profileEdit, { color: theme.accent }]}>
              Edit Profile →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={onProgressPress}
        style={[styles.progressShortcut, {
          backgroundColor: theme.accentDim as string,
          borderColor: theme.accent,
        }]}
      >
        <Ionicons name="trending-up" size={18} color={theme.accent} />
        <Text style={[styles.progressShortcutText, { color: theme.accent }]}>
          View My Progress
        </Text>
        <Ionicons name="chevron-forward" size={16} color={theme.accent} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>
    </>
  );
}

// ── SETTINGS GROUP ───────────────────────────────────────────
function SettingsGroup({
  theme,
  title,
  items,
}: {
  theme: typeof colors.dark;
  title: string;
  items: {
    label: string;
    value?: string;
    icon: string;
    iconColor?: string;
    toggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (val: boolean) => void;
    danger?: boolean;
    onPress?: () => void;
  }[];
}) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{title}</Text>
      <View style={[styles.groupCard, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            onPress={item.onPress}
            activeOpacity={item.toggle ? 1 : 0.7}
            style={[
              styles.settingsRow,
              i < items.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <View style={[styles.settingsIconWrap, {
              backgroundColor: (item.danger ? theme.red : (item.iconColor || theme.accent)) + '22',
            }]}>
              <Ionicons
                name={item.icon as any}
                size={16}
                color={item.danger ? theme.red : (item.iconColor || theme.accent)}
              />
            </View>
            <View style={styles.settingsLabelWrap}>
              <Text style={[
                styles.settingsLabel,
                { color: item.danger ? theme.red : theme.textPrimary },
              ]}>
                {item.label}
              </Text>
              {item.value && (
                <Text style={[styles.settingsValue, { color: theme.textMuted }]}>
                  {item.value}
                </Text>
              )}
            </View>
            {item.toggle ? (
              <Switch
                value={item.toggleValue}
                onValueChange={item.onToggle}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="white"
              />
            ) : !item.danger ? (
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme, toggleTheme } = useThemeStore();
  const { user, profile, userTier, signOut, updateProfile } = useAuthStore();
  const theme = colors[colorScheme];

  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [micronutrients, setMicronutrients] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [coachMessages, setCoachMessages] = useState(true);

  // Reload profile on focus so name changes reflect immediately
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      const reload = async () => {
        try {
          const { supabase } = await import('../../services/supabase');
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (data) updateProfile(data);
        } catch (e) {}
      };
      reload();
    }, [user?.id])
  );

  const name = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const username = profile?.calfit_id ||
    profile?.full_name?.toLowerCase().replace(/\s+/g, '') ||
    user?.email?.split('@')[0] || 'user';

  const handleDarkMode = (val: boolean) => {
    setDarkMode(val);
    toggleTheme();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all your data, workout history, meal logs, and earnings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) return;
              const { supabase } = await import('../../services/supabase');

              // Delete all user data from all tables
              await Promise.all([
                supabase.from('food_logs').delete().eq('user_id', user.id),
                supabase.from('water_logs').delete().eq('user_id', user.id),
                supabase.from('workout_sessions').delete().eq('user_id', user.id),
                supabase.from('meal_plans').delete().eq('user_id', user.id),
                supabase.from('notifications').delete().eq('user_id', user.id),
                supabase.from('calfit_points').delete().eq('user_id', user.id),
                supabase.from('earnings_wallet').delete().eq('user_id', user.id),
                supabase.from('subscriptions').delete().eq('user_id', user.id),
                supabase.from('profiles').delete().eq('id', user.id),
              ]);

              // Sign out — navigates to Welcome automatically via auth state change
              await supabase.auth.signOut();
              signOut();
            } catch (error) {
              Alert.alert('Error', 'Could not delete account. Please try again or contact support.');
            }
          },
        },
      ]
    );
  };

  const handleMicronutrients = (val: boolean) => {
    setMicronutrients(val);
    if (val) {
      Alert.alert(
        'Micronutrients Enabled',
        'Vitamin and mineral tracking will be available in the next major update. Your food logs will automatically include micronutrient data when it launches.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Home</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileCard
          theme={theme}
          name={name}
          username={username}
          tier={userTier ?? 'free'}
          onProgressPress={() => navigation.navigate('Progress' as never)}
          onEditPress={() => navigation.navigate('EditProfile' as never)}
        />

        <SettingsGroup
          theme={theme}
          title="Preferences"
          items={[
            {
              label: 'Dark Mode',
              icon: 'moon-outline',
              iconColor: theme.purple,
              toggle: true,
              toggleValue: darkMode,
              onToggle: handleDarkMode,
            },
            {
              label: 'Units',
              value: profile?.units === 'imperial' ? 'Imperial (lbs, ft)' : 'Metric (kg, cm)',
              icon: 'scale-outline',
              iconColor: theme.accentSecond,
              onPress: () => navigation.navigate('EditProfile' as never),
            },
            {
              label: 'Language',
              value: 'English',
              icon: 'language-outline',
              iconColor: theme.orange,
              onPress: () => navigation.navigate('Language' as never),
            },
          ]}
        />

        <SettingsGroup
          theme={theme}
          title="Tracking & Goals"
          items={[
            {
              label: 'Update Goals',
              value: `${profile?.daily_calorie_goal ?? 2000} kcal · ${
                profile?.water_goal_ml
                  ? (profile.water_goal_ml / 1000).toFixed(1)
                  : '2.5'
              }L water`,
              icon: 'flag-outline',
              iconColor: theme.accent,
              onPress: () => navigation.navigate('Goals' as never),
            },
            {
              label: 'Micronutrients',
              value: micronutrients ? 'Enabled — coming next update' : 'Track vitamins & minerals',
              icon: 'leaf-outline',
              iconColor: theme.accent,
              toggle: true,
              toggleValue: micronutrients,
              onToggle: handleMicronutrients,
            },
            {
              label: 'Equipment',
              value: 'Dumbbells, barbells — coming soon',
              icon: 'barbell-outline',
              iconColor: theme.orange,
              onPress: () => Alert.alert(
                'Equipment Weights',
                'Add your gym equipment and weights to get more accurate calorie calculations during workouts. This feature is coming in the next update.',
                [{ text: 'OK' }]
              ),
            },
          ]}
        />

        <SettingsGroup
          theme={theme}
          title="Notifications"
          items={[
            {
              label: 'Push Notifications',
              value: notificationsEnabled ? 'All alerts enabled' : 'All alerts disabled',
              icon: 'notifications-outline',
              iconColor: theme.gold,
              toggle: true,
              toggleValue: notificationsEnabled,
              onToggle: (val) => {
                setNotificationsEnabled(val);
                Alert.alert(
                  val ? 'Notifications Enabled' : 'Notifications Disabled',
                  val
                    ? 'You will receive streak reminders, goal achievements, Coach messages and activity alerts.'
                    : 'You will no longer receive push notifications from CalFit.',
                  [{ text: 'OK' }]
                );
              },
            },
            {
              label: 'Streak Reminders',
              value: 'Tap to check in',
              icon: 'flame-outline',
              iconColor: theme.orange,
              onPress: () => navigation.navigate('Streaks' as never),
            },
            {
              label: 'Coach Messages',
              value: coachMessages ? 'Show in notifications' : 'Hidden from notifications',
              icon: 'chatbubble-outline',
              iconColor: theme.accentSecond,
              toggle: true,
              toggleValue: coachMessages,
              onToggle: setCoachMessages,
            },
          ]}
        />

        <SettingsGroup
          theme={theme}
          title="Connected Accounts"
          items={[
            {
              label: 'Google',
              value: 'Connect to sign in with Google',
              icon: 'logo-google',
              iconColor: '#EA4335',
              onPress: () => Alert.alert(
                'Connect Google',
                'Google sign-in will be enabled once the OAuth provider is configured in the app settings.',
                [{ text: 'OK' }]
              ),
            },
            {
              label: 'Apple',
              value: 'Connect to sign in with Apple',
              icon: 'logo-apple',
              iconColor: theme.textPrimary,
              onPress: () => Alert.alert(
                'Connect Apple',
                'Apple sign-in will be enabled once the Apple Developer account is configured.',
                [{ text: 'OK' }]
              ),
            },
            {
              label: 'Instagram',
              value: 'Share workouts and recaps',
              icon: 'logo-instagram',
              iconColor: '#E1306C',
              onPress: () => Alert.alert(
                'Connect Instagram',
                'Instagram sharing will be enabled in a future update. You will be able to share your recaps and progress directly.',
                [{ text: 'OK' }]
              ),
            },
            {
              label: 'Smartwatch / Apple Health',
              value: 'Coming in next update',
              icon: 'watch-outline',
              iconColor: theme.accentSecond,
              onPress: () => Alert.alert(
                'Wearable Integration',
                'Smartwatch and Apple Health sync is coming in the next major update. Steps, heart rate and sleep data will sync automatically.',
                [{ text: 'OK' }]
              ),
            },
          ]}
        />

        <SettingsGroup
          theme={theme}
          title="Subscription"
          items={[
            {
              label: 'Current Plan',
              value: userTier === 'premium'
                ? 'Premium — All features unlocked'
                : userTier === 'pro'
                ? 'Pro — Upgrade to Premium'
                : 'Free — Upgrade to Pro',
              icon: 'star-outline',
              iconColor: theme.gold,
              onPress: () => navigation.navigate('Subscription' as never),
            },
            {
              label: 'Credits & Earnings',
              value: 'CalFit Points & referrals',
              icon: 'wallet-outline',
              iconColor: theme.accent,
              onPress: () => navigation.navigate('Credits' as never),
            },
          ]}
        />

        <SettingsGroup
          theme={theme}
          title="Account & Privacy"
          items={[
            {
              label: 'Privacy & Data Policy',
              value: 'How we use your data',
              icon: 'shield-outline',
              iconColor: theme.accentSecond,
              onPress: () => navigation.navigate('Privacy' as never),
            },
            {
              label: 'Download My Data',
              value: 'Export as CSV',
              icon: 'download-outline',
              iconColor: theme.textSecondary,
              onPress: () => navigation.navigate('DownloadData' as never),
            },
            {
              label: 'Sign Out',
              icon: 'log-out-outline',
              iconColor: theme.red,
              onPress: handleSignOut,
            },
            {
              label: 'Delete Account',
              icon: 'trash-outline',
              danger: true,
              onPress: handleDeleteAccount,
            },
          ]}
        />

        <Text style={[styles.version, { color: theme.textMuted }]}>
          CalFit v1.0.0 · Built by AOT for BigCut LLC
        </Text>
      </ScrollView>
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

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  profileAvatar: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, flexShrink: 0,
  },
  profileAvatarText: { fontSize: fontSize.xxl, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  profileName: { fontSize: fontSize.lg, fontWeight: '700' },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  tierBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  profileHandle: { fontSize: fontSize.sm, marginTop: 2 },
  profileEdit: { fontSize: fontSize.sm, fontWeight: '600', marginTop: 6 },

  progressShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  progressShortcutText: { fontSize: fontSize.base, fontWeight: '600' },

  group: { marginBottom: spacing.md },
  groupTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  groupCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  settingsIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  settingsLabelWrap: { flex: 1 },
  settingsLabel: { fontSize: fontSize.base, fontWeight: '500' },
  settingsValue: { fontSize: fontSize.sm, marginTop: 1 },

  version: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});