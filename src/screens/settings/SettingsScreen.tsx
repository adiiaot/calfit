import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── PROFILE CARD ─────────────────────────────────────────────
function ProfileCard({
  theme,
  firstName,
  onProgressPress,
}: {
  theme: typeof colors.dark;
  firstName: string;
  onProgressPress: () => void;
}) {
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
            {firstName[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: theme.textPrimary }]}>
            {firstName}
          </Text>
          <Text style={[styles.profileHandle, { color: theme.textSecondary }]}>
            @{firstName.toLowerCase()} · calfit.app/@{firstName.toLowerCase()}
          </Text>
          <TouchableOpacity>
            <Text style={[styles.profileEdit, { color: theme.accent }]}>
              Edit Profile →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* My Progress shortcut */}
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
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.accent}
          style={{ marginLeft: 'auto' }}
        />
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
            style={[
              styles.settingsRow,
              i < items.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <View style={[styles.settingsIconWrap, {
              backgroundColor: (item.iconColor || theme.accent) + '22',
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
  const { user, signOut } = useAuthStore();
  const theme = colors[colorScheme];
  const firstName = user?.email?.split('@')[0] ?? 'Favour';

  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [micronutrients, setMicronutrients] = useState(false);
  const [appleHealth, setAppleHealth] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleDarkMode = (val: boolean) => {
    setDarkMode(val);
    toggleTheme();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileCard
          theme={theme}
          firstName={firstName}
          onProgressPress={() => navigation.navigate('Progress' as never)}
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
              value: 'Metric (kg, cm)',
              icon: 'scale-outline',
              iconColor: theme.accentSecond,
            },
            {
              label: 'Language',
              value: 'English',
              icon: 'language-outline',
              iconColor: theme.orange,
            },
          ]}
        />

        <SettingsGroup
          theme={theme}
          title="Tracking & Goals"
          items={[
            {
              label: 'Update Goals',
              value: 'Calories, macros, water',
              icon: 'flag-outline',
              iconColor: theme.accent,
            },
            {
              label: 'Micronutrients',
              value: 'Track vitamins & minerals',
              icon: 'leaf-outline',
              iconColor: theme.accent,
              toggle: true,
              toggleValue: micronutrients,
              onToggle: setMicronutrients,
            },
            {
              label: 'Equipment',
              value: 'Gym, home, bodyweight',
              icon: 'barbell-outline',
              iconColor: theme.orange,
            },
          ]}
        />

        <SettingsGroup
          theme={theme}
          title="Notifications"
          items={[
            {
              label: 'Push Notifications',
              value: 'Manage alerts',
              icon: 'notifications-outline',
              iconColor: theme.gold,
              toggle: true,
              toggleValue: notifications,
              onToggle: setNotifications,
            },
            {
              label: 'Streak Reminders',
              value: 'Daily at 8:00 PM',
              icon: 'flame-outline',
              iconColor: theme.orange,
            },
            {
              label: 'Coach Messages',
              value: 'Enabled',
              icon: 'chatbubble-outline',
              iconColor: theme.accentSecond,
            },
          ]}
        />

        <SettingsGroup
          theme={theme}
          title="Connected Apps"
          items={[
            {
              label: 'Apple Health',
              value: 'Connected',
              icon: 'heart-outline',
              iconColor: theme.red,
              toggle: true,
              toggleValue: appleHealth,
              onToggle: setAppleHealth,
            },
            {
              label: 'Instagram',
              value: 'Not linked',
              icon: 'logo-instagram',
              iconColor: theme.purple,
            },
            {
              label: 'Smartwatch',
              value: 'Coming soon',
              icon: 'watch-outline',
              iconColor: theme.accentSecond,
            },
          ]}
        />

        <SettingsGroup
          theme={theme}
          title="Subscription"
          items={[
            {
              label: 'Current Plan',
              value: 'Free — Upgrade to Pro',
              icon: 'star-outline',
              iconColor: theme.gold,
            },
            {
              label: 'Credits & Earnings',
              value: '1,240 CalFit Points',
              icon: 'wallet-outline',
              iconColor: theme.accent,
            },
          ]}
        />

        <SettingsGroup
          theme={theme}
          title="Account & Privacy"
          items={[
            {
              label: 'Privacy Controls',
              value: 'Data & visibility',
              icon: 'shield-outline',
              iconColor: theme.accentSecond,
            },
            {
              label: 'Download My Data',
              icon: 'download-outline',
              iconColor: theme.textSecondary,
            },
            {
              label: 'Sign Out',
              icon: 'log-out-outline',
              iconColor: theme.red,
              danger: false,
              onPress: signOut,
            },
            {
              label: 'Delete Account',
              icon: 'trash-outline',
              danger: true,
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    padding: 4,
  },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },

  // Profile
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
  profileName: { fontSize: fontSize.lg, fontWeight: '700' },
  profileHandle: { fontSize: fontSize.sm, marginTop: 2 },
  profileEdit: { fontSize: fontSize.sm, fontWeight: '600', marginTop: 6 },

  // Progress shortcut
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

  // Groups
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
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  settingsLabelWrap: { flex: 1 },
  settingsLabel: { fontSize: fontSize.base, fontWeight: '500' },
  settingsValue: { fontSize: fontSize.sm, marginTop: 1 },

  // Version
  version: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});