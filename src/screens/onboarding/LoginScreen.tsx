import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Animated, Easing, ScrollView,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { supabase } from '../../services/supabase';

WebBrowser.maybeCompleteAuthSession();

const GRAD_START = '#F0427C';
const GRAD_MID   = '#FF6B35';
const GREEN      = '#2DDC8C';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { signIn, isLoading } = useAuthStore();
  const theme = colors[colorScheme];

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const emailAnim = useRef(new Animated.Value(0)).current;

  const toggleEmail = () => {
    const next = !showEmailForm;
    setShowEmailForm(next);
    Animated.timing(emailAnim, {
      toValue: next ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      if (url?.includes('access_token') || url?.includes('code=')) await handleOAuthCallback(url);
    });
    Linking.getInitialURL().then(url => {
      if (url && (url.includes('access_token') || url.includes('code='))) handleOAuthCallback(url);
    });
    return () => sub.remove();
  }, []);

  const handleOAuthCallback = async (url: string) => {
    try {
      let at: string | null = null, rt: string | null = null;
      if (url.includes('#')) {
        const p = new URLSearchParams(url.split('#')[1]);
        at = p.get('access_token'); rt = p.get('refresh_token');
      }
      if (!at && url.includes('?')) {
        const p = new URLSearchParams(url.split('?')[1]?.split('#')[0]);
        const code = p.get('code');
        if (code) { const { error } = await supabase.auth.exchangeCodeForSession(url); if (error) throw error; return; }
        at = p.get('access_token'); rt = p.get('refresh_token');
      }
      if (at && rt) {
        const { error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
        if (error) throw error;
      }
    } catch (e: any) {
      Alert.alert('Sign In Failed', 'Could not complete sign in. Please try again.');
    } finally { setOauthLoading(null); }
  };

  const handleSignIn = async () => {
    if (!email || !password) { Alert.alert('Missing fields', 'Please enter your email and password.'); return; }
    try { await signIn(email, password); }
    catch (error: any) { Alert.alert('Sign In Failed', error.message); }
  };

  const doOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    try {
      const redirectTo = __DEV__ ? 'exp+calfit://' : 'com.bigcutstore.calfit://';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider, options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, { showInRecents: false, createTask: false });
      if (result.type === 'success' && (result as any).url) await handleOAuthCallback((result as any).url);
      else setOauthLoading(null);
    } catch (error: any) {
      Alert.alert(`${provider === 'google' ? 'Google' : 'Apple'} Sign In Failed`, error.message ?? 'Something went wrong.');
      setOauthLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { Alert.alert('Enter your email', 'Type your email above first.'); return; }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'exp+calfit://reset-password' });
      if (error) throw error;
      Alert.alert('Check your email', `Reset link sent to ${email}`);
    } catch (error: any) { Alert.alert('Error', error.message); }
  };

  const disabled = oauthLoading !== null || isLoading;

  const emailMaxHeight = emailAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 420] });
  const emailOpacity   = emailAnim;

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={[GRAD_START, GRAD_MID, '#FFB830']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoCircle}>
            <Text style={styles.logoLetter}>C</Text>
          </LinearGradient>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>Sign in to continue your fitness journey</Text>
        </View>

        {/* Google card */}
        <TouchableOpacity onPress={() => doOAuth('google')} disabled={disabled} activeOpacity={0.85}
          style={[styles.oauthCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.oauthIconBox, { backgroundColor: '#fff', borderColor: '#E0E0E0' }]}>
            {oauthLoading === 'google'
              ? <ActivityIndicator size="small" color="#4285F4" />
              : <Text style={styles.googleG}>G</Text>}
          </View>
          <View style={styles.oauthText}>
            <Text style={[styles.oauthTitle, { color: theme.textPrimary }]}>Continue with Google</Text>
            <Text style={[styles.oauthSub, { color: theme.textMuted }]}>Sign in with your Google account</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </TouchableOpacity>

        {/* Apple card */}
        <TouchableOpacity onPress={() => doOAuth('apple')} disabled={disabled} activeOpacity={0.85}
          style={[styles.oauthCard, { backgroundColor: '#000', borderColor: '#222' }]}>
          <View style={[styles.oauthIconBox, { backgroundColor: '#1C1C1E', borderColor: '#333' }]}>
            {oauthLoading === 'apple'
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="logo-apple" size={22} color="#fff" />}
          </View>
          <View style={styles.oauthText}>
            <Text style={[styles.oauthTitle, { color: '#fff' }]}>Continue with Apple</Text>
            <Text style={[styles.oauthSub, { color: 'rgba(255,255,255,0.5)' }]}>Sign in with your Apple ID</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.divLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.divText, { color: theme.textMuted }]}>or</Text>
          <View style={[styles.divLine, { backgroundColor: theme.border }]} />
        </View>

        {/* Email toggle */}
        <TouchableOpacity onPress={toggleEmail} disabled={disabled} activeOpacity={0.8}
          style={[styles.emailToggle, {
            backgroundColor: showEmailForm ? theme.accentDim as string : theme.card,
            borderColor: showEmailForm ? theme.accent : theme.border,
          }]}>
          <Ionicons name="mail-outline" size={18} color={showEmailForm ? theme.accent : theme.textSecondary} />
          <Text style={[styles.emailToggleText, { color: showEmailForm ? theme.accent : theme.textSecondary }]}>
            {showEmailForm ? 'Hide email sign in' : 'Sign in with Email'}
          </Text>
          <Ionicons name={showEmailForm ? 'chevron-up' : 'chevron-down'} size={15} color={showEmailForm ? theme.accent : theme.textMuted} />
        </TouchableOpacity>

        {/* Collapsible email form */}
        <Animated.View style={{ maxHeight: emailMaxHeight, opacity: emailOpacity, overflow: 'hidden' }}>
          <View style={[styles.emailCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Ionicons name="mail-outline" size={16} color={theme.textMuted} />
              <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com"
                placeholderTextColor={theme.textMuted} keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false} style={[styles.inputText, { color: theme.textPrimary }]} />
            </View>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color={theme.textMuted} />
              <TextInput value={password} onChangeText={setPassword} placeholder="••••••••"
                placeholderTextColor={theme.textMuted} secureTextEntry={!showPassword}
                autoCorrect={false} style={[styles.inputText, { color: theme.textPrimary }]} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}>
              <Text style={[styles.forgotText, { color: theme.accent }]}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignIn} disabled={disabled} activeOpacity={0.85}
              style={{ borderRadius: radius.lg, overflow: 'hidden', opacity: disabled ? 0.6 : 1 }}>
              <LinearGradient colors={[GRAD_START, GRAD_MID] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.signInBtn}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Sign In</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Sign up link */}
        <View style={styles.signUpRow}>
          <Text style={[styles.signUpText, { color: theme.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Onboarding')}>
            <Text style={[styles.signUpLink, { color: GREEN }]}>Sign up free</Text>
          </TouchableOpacity>
        </View>

        {/* Trust */}
        <View style={styles.trustRow}>
          {['🔒 Encrypted', '🚫 No spam', '✓ Cancel anytime'].map(t => (
            <View key={t} style={[styles.trustBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.trustText, { color: theme.textMuted }]}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1 },
  scroll:          { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  backBtn:         { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: spacing.sm },
  hero:            { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  logoCircle:      { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  logoLetter:      { fontSize: 36, fontWeight: '900', color: '#fff' },
  title:           { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  sub:             { fontSize: fontSize.base, textAlign: 'center', lineHeight: 22 },
  oauthCard:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1.5, marginBottom: spacing.sm },
  oauthIconBox:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  googleG:         { fontSize: 22, fontWeight: '900', color: '#4285F4' },
  oauthText:       { flex: 1 },
  oauthTitle:      { fontSize: fontSize.base, fontWeight: '700' },
  oauthSub:        { fontSize: fontSize.xs, marginTop: 2 },
  divider:         { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md },
  divLine:         { flex: 1, height: 1 },
  divText:         { fontSize: fontSize.sm },
  emailToggle:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, marginBottom: spacing.sm },
  emailToggleText: { flex: 1, fontSize: fontSize.base, fontWeight: '600' },
  emailCard:       { borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg, gap: spacing.xs, marginBottom: spacing.sm },
  fieldLabel:      { fontSize: fontSize.sm, fontWeight: '600', marginBottom: 4, marginTop: spacing.xs },
  inputRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.xs },
  inputText:       { flex: 1, fontSize: fontSize.base },
  forgotText:      { fontSize: fontSize.sm, fontWeight: '600' },
  signInBtn:       { padding: spacing.md + 2, alignItems: 'center', borderRadius: radius.lg },
  signInText:      { fontSize: fontSize.lg, fontWeight: '800', color: '#fff' },
  signUpRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  signUpText:      { fontSize: fontSize.base },
  signUpLink:      { fontSize: fontSize.base, fontWeight: '700' },
  trustRow:        { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
  trustBadge:      { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
  trustText:       { fontSize: 10, fontWeight: '600' },
});