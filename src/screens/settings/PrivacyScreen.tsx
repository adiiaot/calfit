import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

const SECTIONS = [
  {
    title: 'Data We Collect',
    content: `CalFit collects the following information to provide and improve our services:

- Account information: name, email address, and CalFit ID
- Body stats: age, height, weight, and target weight that you provide
- Activity data: food logs, water intake, workout sessions, steps, and sleep you record
- Usage data: how you interact with the app to improve our features

We only collect what is necessary to deliver your personalised fitness experience.`,
  },
  {
    title: 'How We Use Your Data',
    content: `Your data is used exclusively to:

- Calculate your personalised calorie targets and macro splits
- Power the CalFit Coach AI with your fitness context
- Track your progress and generate your weekly and monthly recaps
- Send you relevant notifications and reminders you have enabled
- Improve app features through anonymised, aggregated analytics

We do not build advertising profiles from your health data.`,
  },
  {
    title: 'Data Sharing',
    content: `CalFit does not sell your personal data. We share limited data with:

- Supabase — our secure database and authentication provider
- Anthropic — powers the CalFit Coach AI (your prompts only, no health data shared)
- Stripe — payment processing only (no health data shared)
- Cloudinary — media storage for profile photos and shared content

All third-party providers are contractually bound to protect your data.`,
  },
  {
    title: 'Your Rights',
    content: `You have full control over your data:

- Access: view all data stored about you
- Download: export your complete data at any time from Settings
- Correct: update your information in Edit Profile
- Delete: permanently delete your account and all associated data
- Opt out: disable personalised coaching or notifications at any time

To exercise any of these rights, use the controls in your Settings or contact us.`,
  },
  {
    title: 'Data Security',
    content: `We take security seriously:

- All data is encrypted in transit via HTTPS with TLS 1.3
- Authentication tokens are stored in your device's secure keychain
- Row Level Security ensures your data is only accessible to you
- No API keys or secrets are ever stored in the app codebase
- Payment data is handled entirely by Stripe (PCI DSS Level 1)`,
  },
  {
    title: 'Data Retention',
    content: `We retain your data for as long as your account is active. When you delete your account:

- All personal data is permanently deleted within 30 days
- Anonymised, aggregated data may be retained for analytics
- You can request immediate deletion by contacting our support team

Backups are purged on a 90-day rolling cycle.`,
  },
  {
    title: 'Contact Us',
    content: `For privacy questions or requests:

Email: privacy@calfit.app
Response time: within 72 hours

CalFit is built by Trivian Technologies for BigCut LLC.
Last updated: April 2026`,
  },
];

export default function PrivacyScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Privacy & Data</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroBadge, {
          backgroundColor: theme.accentDim as string,
          borderColor: theme.accent,
        }]}>
          <Ionicons name="shield-checkmark" size={24} color={theme.accent} />
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
              Your data is protected
            </Text>
            <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
              CalFit never sells your data. You own it and can delete it anytime.
            </Text>
          </View>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={[styles.sectionCard, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: spacing.sm },
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

  heroBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: 4 },
  heroSub: { fontSize: fontSize.sm, lineHeight: 18 },

  sectionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm },
  sectionContent: { fontSize: fontSize.base, lineHeight: 22 },
});