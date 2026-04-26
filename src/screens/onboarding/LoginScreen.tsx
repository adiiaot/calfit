import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// Required for OAuth redirect handling on mobile
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { signIn, isLoading } = useAuthStore();
  const theme = colors[colorScheme];

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    try {
      await signIn(email, password);
      // Auth listener in App.tsx handles redirect
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    }
  };

  // ── GOOGLE SIGN IN ────────────────────────────────────────
  // Uses Supabase OAuth → opens browser → redirects back to app
  // Requires Supabase Dashboard → Auth → Providers → Google enabled
  // and Google OAuth credentials configured
  const handleGoogleSignIn = async () => {
    setOauthLoading('google');
    try {
      const { supabase } = await import('../../services/supabase');
      const redirectTo = makeRedirectUri({ scheme: 'com.bigcutstore.calfit' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          // Auth listener handles redirect to main app
        }
      }
    } catch (error: any) {
      Alert.alert('Google Sign In Failed', error.message ?? 'Something went wrong. Please try again.');
    } finally {
      setOauthLoading(null);
    }
  };

  // ── APPLE SIGN IN ─────────────────────────────────────────
  // Uses Supabase OAuth → opens browser → redirects back to app
  // Requires Supabase Dashboard → Auth → Providers → Apple enabled
  // and Apple Developer account with Sign in with Apple configured
  const handleAppleSignIn = async () => {
    setOauthLoading('apple');
    try {
      const { supabase } = await import('../../services/supabase');
      const redirectTo = makeRedirectUri({ scheme: 'com.bigcutstore.calfit' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
    } catch (error: any) {
      Alert.alert('Apple Sign In Failed', error.message ?? 'Something went wrong. Please try again.');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter your email', 'Type your email address above, then tap Forgot Password.');
      return;
    }
    try {
      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'com.bigcutstore.calfit://reset-password',
      });
      if (error) throw error;
      Alert.alert('Check your email', `We sent a password reset link to ${email}`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
        style={styles.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
      </TouchableOpacity>

      <View style={styles.container}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>Sign in to CalFit</Text>
        </View>

        {/* Google Sign In */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={oauthLoading !== null || isLoading}
          style={[styles.socialBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          {oauthLoading === 'google'
            ? <ActivityIndicator size="small" color={theme.textPrimary} />
            : <Text style={styles.googleIcon}>G</Text>}
          <Text style={[styles.socialBtnText, { color: theme.textPrimary }]}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Apple Sign In */}
        <TouchableOpacity
          onPress={handleAppleSignIn}
          disabled={oauthLoading !== null || isLoading}
          style={[styles.socialBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          {oauthLoading === 'apple'
            ? <ActivityIndicator size="small" color={theme.textPrimary} />
            : <Ionicons name="logo-apple" size={20} color={theme.textPrimary} />}
          <Text style={[styles.socialBtnText, { color: theme.textPrimary }]}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        {/* Email */}
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
        <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password */}
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Password</Text>
        <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            secureTextEntry={!showPassword}
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: theme.accent }]}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Sign in CTA */}
        <TouchableOpacity
          onPress={handleSignIn}
          disabled={isLoading || oauthLoading !== null}
          style={styles.signInBtnWrap}
        >
          <LinearGradient
            colors={[theme.accent, theme.accent] as [string, string]}
            style={styles.signInBtn}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.signInBtnText}>Sign In</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {/* Biometric */}
        <TouchableOpacity style={[styles.biometricBtn, { borderColor: theme.border }]}>
          <Ionicons name="finger-print-outline" size={20} color={theme.textSecondary} />
          <Text style={[styles.biometricText, { color: theme.textSecondary }]}>
            Sign in with Face ID / Fingerprint
          </Text>
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={styles.signUpRow}>
          <Text style={[styles.signUpText, { color: theme.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Onboarding')}>
            <Text style={[styles.signUpLink, { color: theme.accent }]}>Sign up free</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { padding: spacing.lg, paddingBottom: 0 },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },

  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: fontSize.lg, marginTop: 4 },

  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1,
  },
  googleIcon: { fontSize: 18, fontWeight: '900', color: '#4285F4' },
  socialBtnText: { fontSize: fontSize.lg, fontWeight: '600' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: fontSize.sm },

  inputLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: -spacing.xs },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm,
  },
  input: { flex: 1, fontSize: fontSize.lg },

  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: fontSize.base, fontWeight: '600' },

  signInBtnWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  signInBtn: { padding: spacing.lg, alignItems: 'center', borderRadius: radius.lg },
  signInBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },

  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1,
  },
  biometricText: { fontSize: fontSize.base, fontWeight: '500' },

  signUpRow: { flexDirection: 'row', justifyContent: 'center' },
  signUpText: { fontSize: fontSize.base },
  signUpLink: { fontSize: fontSize.base, fontWeight: '700' },
});