import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import Avatar from '../../components/Avatar';
import {
  scheduleMealReminders,
  scheduleWaterReminder,
  scheduleWorkoutReminder,
  scheduleSleepReminder,
  cancelAllReminders,
  requestNotificationPermissions,
} from '../../services/reminderService';

// ── WHY TOGGLES RESET ─────────────────────────────────────────
// The old screen stored reminder state in React useState only.
// useState resets when the component unmounts (navigation away).
// useFocusEffect re-runs on every visit but didn't reload saved prefs.
// Fix: persist to SecureStore on every toggle.
// Load from SecureStore on every useFocusEffect.
// This means preferences survive navigation, app restart, and re-login.

const PREFS_KEY = 'calfit_notification_prefs';

interface NotifPrefs {
  pushEnabled:       boolean;
  coachMessages:     boolean;
  mealReminders:     boolean;
  waterReminders:    boolean;
  workoutReminders:  boolean;
  sleepReminders:    boolean;
  micronutrients:    boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  pushEnabled:      true,
  coachMessages:    true,
  mealReminders:    false,
  waterReminders:   false,
  workoutReminders: false,
  sleepReminders:   false,
  micronutrients:   false,
};

async function loadPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { return DEFAULT_PREFS; }
}

async function savePrefs(prefs: NotifPrefs): Promise<void> {
  try { await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

// ── SAFE COLORS ───────────────────────────────────────────────
const ORANGE = '#FFB347';
const GOLD   = '#FFD133';
const PURPLE = '#B280FF';
const RED    = '#FF5959';
const PINK   = '#FF6B9D';

// ── SETTINGS GROUP ────────────────────────────────────────────
function SettingsGroup({ theme, title, items }: {
  theme: typeof colors.dark;
  title: string;
  items: Array<{
    label: string; value?: string; icon: string; iconColor?: string;
    toggle?: boolean; toggleValue?: boolean;
    onToggle?: (val: boolean) => void;
    onPress?: () => void; danger?: boolean;
  }>;
}) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            onPress={item.onPress}
            disabled={item.toggle && !item.onPress}
            activeOpacity={item.toggle ? 1 : 0.7}
            style={[
              styles.settingsRow,
              i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: (item.iconColor ?? theme.accent) + '18' }]}>
              <Ionicons name={item.icon as any} size={17} color={item.iconColor ?? theme.accent} />
            </View>
            <View style={styles.settingsInfo}>
              <Text style={[styles.settingsLabel, {
                color: item.danger ? RED : theme.textPrimary,
              }]}>{item.label}</Text>
              {item.value && (
                <Text style={[styles.settingsValue, { color: theme.textMuted }]} numberOfLines={1}>
                  {item.value}
                </Text>
              )}
            </View>
            {item.toggle ? (
              <Switch
                value={item.toggleValue ?? false}
                onValueChange={item.onToggle}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#fff"
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

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme, toggleTheme } = useThemeStore();
  const { user, profile, userTier, signOut, updateProfile } = useAuthStore();
  const theme = colors[colorScheme];

  const [darkMode, setDarkMode]       = useState(colorScheme === 'dark');
  const [prefs, setPrefs]             = useState<NotifPrefs>(DEFAULT_PREFS);

  const name     = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const username = (profile as any)?.calfit_id
    || profile?.full_name?.toLowerCase().replace(/\s+/g, '')
    || user?.email?.split('@')[0] || 'user';
  const tierColor =
    userTier === 'premium' ? theme.accent :
    userTier === 'pro'     ? GOLD : theme.textMuted;
  const tierLabel =
    userTier === 'premium' ? 'Premium' :
    userTier === 'pro'     ? 'Pro' : 'Free';

  // ── LOAD PREFS ON EVERY FOCUS — fixes the toggle reset bug ──
  useFocusEffect(useCallback(() => {
    let active = true;
    const init = async () => {
      // Reload profile
      if (user?.id) {
        try {
          const { supabase } = await import('../../services/supabase');
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data && active) updateProfile(data);
        } catch {}
      }
      // Reload notification prefs from SecureStore
      const saved = await loadPrefs();
      if (active) {
        setPrefs(saved);
        setDarkMode(colorScheme === 'dark');
      }
    };
    init();
    return () => { active = false; };
  }, [user?.id, colorScheme]));

  // ── PREF TOGGLE HELPER ────────────────────────────────────
  // Updates state + persists to SecureStore in one call
  const updatePref = async (key: keyof NotifPrefs, val: boolean, sideEffect?: () => Promise<void>) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    await savePrefs(updated);
    if (sideEffect) await sideEffect();
  };

  // ── HANDLERS ─────────────────────────────────────────────
  const handleDarkMode = async (val: boolean) => {
    setDarkMode(val);
    toggleTheme();
  };

  const handlePushToggle = async (val: boolean) => {
    const granted = val ? await requestNotificationPermissions() : true;
    if (val && !granted) {
      Alert.alert('Permission Required', 'Allow notifications in your device Settings to enable reminders.');
      return;
    }
    if (!val) {
      await cancelAllReminders();
      // Turn off all reminders too
      const updated: NotifPrefs = {
        ...prefs, pushEnabled: false,
        mealReminders: false, waterReminders: false,
        workoutReminders: false, sleepReminders: false,
      };
      setPrefs(updated);
      await savePrefs(updated);
    } else {
      await updatePref('pushEnabled', true);
    }
    Alert.alert(
      val ? 'Notifications On' : 'Notifications Off',
      val ? "You'll get streak, goal and activity alerts." : 'All CalFit notifications disabled.',
      [{ text: 'OK' }]
    );
  };

  const handleMealReminders = async (val: boolean) =>
    updatePref('mealReminders', val, () => scheduleMealReminders(val));

  const handleWaterReminder = async (val: boolean) =>
    updatePref('waterReminders', val, () => scheduleWaterReminder(val));

  const handleWorkoutReminder = async (val: boolean) =>
    updatePref('workoutReminders', val, () => scheduleWorkoutReminder(val));

  const handleSleepReminder = async (val: boolean) =>
    updatePref('sleepReminders', val, () => scheduleSleepReminder(val));

  const handleMicronutrients = async (val: boolean) =>
    updatePref('micronutrients', val);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This permanently deletes your account and all data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Forever',
        style: 'destructive',
        onPress: async () => {
          try {
            const { supabase } = await import('../../services/supabase');
            await supabase.functions.invoke('delete-account', { body: { userId: user?.id } });
            await signOut();
          } catch {
            Alert.alert('Error', 'Could not delete account. Please contact support@calfit.tech.');
          }
        },
      },
    ]);
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Main' as never)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── PROFILE CARD ── */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Avatar size={52} borderWidth={2} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.profileName, { color: theme.textPrimary }]}>{name}</Text>
              <View style={[styles.tierBadge, { backgroundColor: tierColor + '20', borderColor: tierColor }]}>
                <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
              </View>
            </View>
            <Text style={[styles.profileHandle, { color: theme.textSecondary }]}>@{username}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile' as never)}>
              <Text style={[styles.editLink, { color: theme.accent }]}>Edit Profile →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Progress' as never)}
          style={[styles.progressRow, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}
        >
          <Ionicons name="trending-up" size={18} color={theme.accent} />
          <Text style={[styles.progressRowText, { color: theme.accent }]}>View My Progress</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.accent} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* ── APPEARANCE ── */}
        <SettingsGroup theme={theme} title="Appearance" items={[
          {
            label: 'Dark Mode',
            value: darkMode ? 'Dark theme active' : 'Light theme active',
            icon: darkMode ? 'moon' : 'sunny',
            iconColor: darkMode ? PURPLE : GOLD,
            toggle: true, toggleValue: darkMode, onToggle: handleDarkMode,
          },
        ]} />

        {/* ── FITNESS GOALS ── */}
        <SettingsGroup theme={theme} title="Fitness" items={[
          {
            label: 'Goals',
            value: `${(profile as any)?.daily_calorie_goal ?? 2000} kcal · ${((profile as any)?.water_goal_ml ?? 2500) / 1000}L water`,
            icon: 'flag-outline', iconColor: theme.accent,
            onPress: () => navigation.navigate('Goals' as never),
          },
          {
            label: 'Units',
            value: (profile as any)?.units === 'imperial' ? 'Imperial (lbs, ft)' : 'Metric (kg, cm)',
            icon: 'speedometer-outline', iconColor: theme.accentSecond,
            onPress: () => navigation.navigate('EditProfile' as never),
          },
          {
            label: 'Micronutrients',
            value: prefs.micronutrients ? 'Showing vitamins & minerals' : 'Hidden from food log',
            icon: 'leaf-outline', iconColor: theme.accent,
            toggle: true, toggleValue: prefs.micronutrients, onToggle: handleMicronutrients,
          },
          {
  label: 'Equipment Preferences',
  value: 'Filter workouts by your gear',
  icon: 'barbell-outline', iconColor: ORANGE,
  onPress: () => navigation.navigate('EquipmentPreferences' as never),
},
        ]} />

        {/* ── NOTIFICATIONS ── */}
        <SettingsGroup theme={theme} title="Notifications" items={[
          {
            label: 'Push Notifications',
            value: prefs.pushEnabled ? 'All alerts enabled' : 'All alerts disabled',
            icon: 'notifications-outline', iconColor: GOLD,
            toggle: true, toggleValue: prefs.pushEnabled, onToggle: handlePushToggle,
          },
          {
            label: 'Coach Messages',
            value: prefs.coachMessages ? 'Show in notifications' : 'Hidden',
            icon: 'chatbubble-outline', iconColor: theme.accentSecond,
            toggle: true, toggleValue: prefs.coachMessages,
            onToggle: (val) => updatePref('coachMessages', val),
          },
          {
            label: 'Streak Reminders',
            value: 'Daily check-in alert',
            icon: 'flame-outline', iconColor: ORANGE,
            onPress: () => navigation.navigate('Streaks' as never),
          },
          {
            label: 'Meal Reminders',
            value: prefs.mealReminders ? '8am · 12pm · 7pm' : 'Off',
            icon: 'restaurant-outline', iconColor: theme.accentSecond,
            toggle: true, toggleValue: prefs.mealReminders, onToggle: handleMealReminders,
          },
          {
            label: 'Water Reminder',
            value: prefs.waterReminders ? 'Daily at 12:00 PM' : 'Off',
            icon: 'water-outline', iconColor: theme.accentSecond,
            toggle: true, toggleValue: prefs.waterReminders, onToggle: handleWaterReminder,
          },
          {
            label: 'Workout Reminder',
            value: prefs.workoutReminders ? 'Daily at 7:00 AM' : 'Off',
            icon: 'barbell-outline', iconColor: theme.accent,
            toggle: true, toggleValue: prefs.workoutReminders, onToggle: handleWorkoutReminder,
          },
          {
            label: 'Sleep Reminder',
            value: prefs.sleepReminders ? 'Daily at 10:00 PM' : 'Off',
            icon: 'moon-outline', iconColor: PURPLE,
            toggle: true, toggleValue: prefs.sleepReminders, onToggle: handleSleepReminder,
          },
        ]} />

        {/* ── CONNECTED ACCOUNTS ── */}
        {/* Instagram removed — not in client feature docs */}
        <SettingsGroup theme={theme} title="Connected Accounts" items={[
          {
            label: 'Google Sign-In',
            value: 'Connect to sign in with Google',
            icon: 'logo-google', iconColor: '#EA4335',
            onPress: () => Alert.alert('Google Sign-In',
              'Google sign-in will be active once the Play Console account is set up.', [{ text: 'OK' }]),
          },
          {
            label: 'Apple Sign-In',
            value: 'Connect to sign in with Apple',
            icon: 'logo-apple', iconColor: theme.textPrimary,
            onPress: () => Alert.alert('Apple Sign-In',
              'Apple sign-in will be active once the Apple Developer account is set up.', [{ text: 'OK' }]),
          },
          {
            label: 'Apple Health & Smartwatch',
            value: 'Sync steps, sleep, heart rate',
            icon: 'watch-outline', iconColor: theme.accentSecond,
            onPress: () => Alert.alert(
              'Health & Wearable Sync',
              'CalFit can sync with Apple Health (iPhone) and Google Fit (Android) to automatically import steps, sleep, and heart rate.\n\nThis feature is active — make sure you have granted health permissions in your device Settings under Privacy → Health → CalFit.',
              [
                { text: 'Open Settings', onPress: async () => {
                  const { Linking } = await import('react-native');
                  Linking.openSettings();
                }},
                { text: 'OK' },
              ]
            ),
          },
        ]} />

        {/* ── SUBSCRIPTION ── */}
        <SettingsGroup theme={theme} title="Subscription" items={[
          {
            label: 'Current Plan',
            value: userTier === 'premium' ? 'Premium — All features unlocked'
              : userTier === 'pro' ? 'Pro — Upgrade for more'
              : 'Free — Upgrade to unlock all features',
            icon: 'star-outline', iconColor: GOLD,
            onPress: () => navigation.navigate('Subscription' as never),
          },
          {
            label: 'Credits & Earnings',
            value: 'CalFit Points and referral earnings',
            icon: 'wallet-outline', iconColor: theme.accent,
            onPress: () => navigation.navigate('Credits' as never),
          },
        ]} />

        {/* ── ACCOUNT & PRIVACY ── */}
        <SettingsGroup theme={theme} title="Account & Privacy" items={[
          {
            label: 'Privacy & Data Policy',
            value: 'How we use your data',
            icon: 'shield-outline', iconColor: theme.accentSecond,
            onPress: () => navigation.navigate('Privacy' as never),
          },
          {
            label: 'Download My Data',
            value: 'Export all your activity as PDF or CSV',
            icon: 'download-outline', iconColor: theme.textSecondary,
            onPress: () => navigation.navigate('DownloadData' as never),
          },
          {
            label: 'Sign Out',
            icon: 'log-out-outline', iconColor: RED,
            danger: true, onPress: handleSignOut,
          },
          {
            label: 'Delete Account',
            icon: 'trash-outline', iconColor: RED,
            danger: true, onPress: handleDeleteAccount,
          },
        ]} />

        <View style={{ height: 60 }} />
      </ScrollView>
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn:{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700' },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  profileInfo: { flex: 1 },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  profileName: { fontSize: fontSize.base, fontWeight: '700' },
  tierBadge:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.sm, borderWidth: 1 },
  tierText:    { fontSize: 10, fontWeight: '700' },
  profileHandle:{ fontSize: fontSize.sm, marginTop: 2 },
  editLink:    { fontSize: fontSize.sm, fontWeight: '600', marginTop: 4 },

  progressRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  progressRowText: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },

  group:      { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  groupTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing.xs },
  groupCard:  { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  iconWrap:   { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  settingsInfo:{ flex: 1 },
  settingsLabel:{ fontSize: fontSize.base },
  settingsValue:{ fontSize: fontSize.xs, marginTop: 1 },
});