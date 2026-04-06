import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  const features = [
    { icon: 'nutrition-outline', text: 'Track calories, macros & water intake' },
    { icon: 'chatbubble-ellipses-outline', text: 'AI Coach powered by Claude API' },
    { icon: 'barbell-outline', text: 'Workouts, sleep & step tracking' },
    { icon: 'people-outline', text: 'Social feed & accountability partner' },
    { icon: 'star-outline', text: 'Earn CalFit Points & referral rewards' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={[styles.logoCircle, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}>
            <Text style={[styles.logoLetter, { color: theme.accent }]}>C</Text>
          </View>
          <Text style={[styles.logoText, { color: theme.textPrimary }]}>CALFIT</Text>
          <Text style={[styles.logoSub, { color: theme.textSecondary }]}>
            Your personal fitness & nutrition coach
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {features.map((f) => (
            <View key={f.text} style={[styles.featureRow, {
              backgroundColor: theme.card,
              borderColor: theme.border,
            }]}>
              <View style={[styles.featureIcon, {
                backgroundColor: theme.accentDim as string,
              }]}>
                <Ionicons name={f.icon as any} size={20} color={theme.accent} />
              </View>
              <Text style={[styles.featureText, { color: theme.textPrimary }]}>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Onboarding')}
            style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.bg }]}>
              Get Started — It's Free
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={[styles.secondaryBtn, {
              borderColor: theme.border,
            }]}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>
              I already have an account
            </Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
            No credit card required · Cancel anytime
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },

  // Logo
  logoWrap: { alignItems: 'center', paddingTop: spacing.xl },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginBottom: spacing.md,
  },
  logoLetter: { fontSize: 40, fontWeight: '800' },
  logoText: {
    fontSize: 32, fontWeight: '800',
    letterSpacing: 4, marginBottom: spacing.sm,
  },
  logoSub: { fontSize: fontSize.base, textAlign: 'center' },

  // Features
  features: { gap: spacing.sm },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { fontSize: fontSize.base, fontWeight: '500', flex: 1 },

  // CTAs
  ctas: { gap: spacing.sm },
  primaryBtn: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
  secondaryBtn: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: fontSize.lg, fontWeight: '600' },
  disclaimer: { textAlign: 'center', fontSize: fontSize.sm },
});