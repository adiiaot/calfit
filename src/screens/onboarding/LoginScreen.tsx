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
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { supabase } from '../../services/supabase';

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

  // ── DEEP LINK LISTENER ────────────────────────────────────
  // When Safari redirects back to the app after OAuth, this catches
  // the URL and extracts the Supabase tokens from the fragment/params.
  // Works in both Expo Go (exp+calfit://) and production builds.
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (!url) return;

      // Supabase returns tokens in the URL fragment (#access_token=...)
      // We need to parse both hash fragments and query params
      if (url.includes('access_token') || url.includes('code=')) {
        await handleOAuthCallback(url);
      }
    };

    // Listen for deep links while app is open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Also check if app was opened via deep link (cold start)
    Linking.getInitialURL().then(url => {
      if (url && (url.includes('access_token') || url.includes('code='))) {
        handleOAuthCallback(url);
      }
    });

    return () => subscription.remove();
  }, []);

  const handleOAuthCallback = async (url: string) => {
    try {
      // Supabase PKCE flow returns a code, exchange it for a session
      // Parse the URL — tokens can be in hash fragment or query string
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // Try hash fragment first (implicit flow)
      if (url.includes('#')) {
        const hash = url.split('#')[1];
        const params = new URLSearchParams(hash);
        accessToken  = params.get('access_token');
        refreshToken = params.get('refresh_token');
      }

      // Try query string (PKCE flow)
      if (!accessToken && url.includes('?')) {
        const query = url.split('?')[1]?.split('#')[0];
        const params = new URLSearchParams(query);
        const code = params.get('code');

        if (code) {
          // Exchange code for session via Supabase
          const { data, error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) throw error;
          // Session is set automatically — authStore listener handles navigation
          return;
        }

        accessToken  = params.get('access_token');
        refreshToken = params.get('refresh_token');
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token:  accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        // authStore onAuthStateChange listener handles navigation automatically
      }
    } catch (e: any) {
      console.error('[OAuth] callback error:', e);
      Alert.alert('Sign In Failed', 'Could not complete sign in. Please try again.');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    }
  };

  // ── GOOGLE SIGN IN ────────────────────────────────────────
  // WHY exp+calfit scheme:
  //   In Expo Go the app runs under Expo's container, not your bundle ID.
  //   Expo Go uses exp+{slug} as the deep link scheme.
  //   Your slug in app.json is "calfit" so the scheme is "exp+calfit".
  //   In a production EAS build this switches to com.bigcutstore.calfit.
  const handleGoogleSignIn = async () => {
    setOauthLoading('google');
    try {
      // Detect if running in Expo Go or production build
      const isExpoGo = typeof __DEV__ !== 'undefined' && __DEV__;

    const redirectTo = makeRedirectUri({
  scheme: isExpoGo ? 'exp+calfit' : 'com.bigcutstore.calfit',
});

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      // Open browser — it will redirect back to redirectTo when done
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (result.type === 'success' && result.url) {
        await handleOAuthCallback(result.url);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User closed browser — not an error
        setOauthLoading(null);
      }
    } catch (error: any) {
      Alert.alert('Google Sign In Failed', error.message ?? 'Something went wrong. Please try again.');
      setOauthLoading(null);
    }
  };

  // ── APPLE SIGN IN ─────────────────────────────────────────
  // Requires Apple Developer account + Sign In with Apple capability.
  // The button shows on iOS — will work once Apple Dev account is set up.
  const handleAppleSignIn = async () => {
    setOauthLoading('apple');
    try {
      const isExpoGo = typeof __DEV__ !== 'undefined' && __DEV__;

    const redirectTo = makeRedirectUri({
  scheme: isExpoGo ? 'exp+calfit' : 'com.bigcutstore.calfit',
});

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (result.type === 'success' && result.url) {
        await handleOAuthCallback(result.url);
      } else {
        setOauthLoading(null);
      }
    } catch (error: any) {
      Alert.alert('Apple Sign In Failed', error.message ?? 'Something went wrong. Please try again.');
      setOauthLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter your email', 'Type your email address above, then tap Forgot Password.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'exp+calfit://reset-password',
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
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.textMuted}
            />
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
  safe:       { flex: 1 },
  backBtn:    { padding: spacing.lg, paddingBottom: 0 },
  container:  { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  title:      { fontSize: 28, fontWeight: '800' },
  sub:        { fontSize: fontSize.lg, marginTop: 4 },
  socialBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  googleIcon: { fontSize: 18, fontWeight: '900', color: '#4285F4' },
  socialBtnText: { fontSize: fontSize.lg, fontWeight: '600' },
  divider:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dividerLine:{ flex: 1, height: 1 },
  dividerText:{ fontSize: fontSize.sm },
  inputLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: -spacing.xs },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm },
  input:      { flex: 1, fontSize: fontSize.lg },
  forgotBtn:  { alignSelf: 'flex-end' },
  forgotText: { fontSize: fontSize.base, fontWeight: '600' },
  signInBtnWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  signInBtn:  { padding: spacing.lg, alignItems: 'center', borderRadius: radius.lg },
  signInBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },
  biometricBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  biometricText: { fontSize: fontSize.base, fontWeight: '500' },
  signUpRow:  { flexDirection: 'row', justifyContent: 'center' },
  signUpText: { fontSize: fontSize.base },
  signUpLink: { fontSize: fontSize.base, fontWeight: '700' },
});