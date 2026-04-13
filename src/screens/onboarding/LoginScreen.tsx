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
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { signIn, isLoading } = useAuthStore();
  const theme = colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  return (


          <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
                 {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
      </TouchableOpacity>

      <View style={styles.container}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Welcome back
          </Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            Sign in to CalFit
          </Text>
        </View>

        {/* Social logins */}
        {[
          { icon: 'logo-google', label: 'Continue with Google' },
          { icon: 'logo-apple', label: 'Continue with Apple' },
        ].map((s) => (
          <TouchableOpacity key={s.label} style={[styles.socialBtn, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <Ionicons name={s.icon as any} size={20} color={theme.textPrimary} />
            <Text style={[styles.socialBtnText, { color: theme.textPrimary }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        {/* Email */}
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
        <View style={[styles.inputWrap, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="favour@email.com"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Password</Text>
        <View style={[styles.inputWrap, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: theme.accent }]}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        {/* Sign in */}
        <TouchableOpacity
          onPress={handleSignIn}
          disabled={isLoading}
          style={[styles.signInBtn, { backgroundColor: theme.accent }]}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.bg} />
          ) : (
            <Text style={[styles.signInBtnText, { color: theme.bg }]}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Biometric */}
        <TouchableOpacity style={[styles.biometricBtn, {
          borderColor: theme.border,
        }]}>
          <Ionicons name="finger-print-outline" size={20} color={theme.textSecondary} />
          <Text style={[styles.biometricText, { color: theme.textSecondary }]}>
            Sign in with Face ID / Fingerprint
          </Text>
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={styles.signUpRow}>
          <Text style={[styles.signUpText, { color: theme.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Onboarding')}>
            <Text style={[styles.signUpLink, { color: theme.accent }]}>
              Sign up free
            </Text>
          </TouchableOpacity>
        </View>
      </View>
          </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { padding: spacing.lg, paddingBottom: 0 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },

  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: fontSize.lg, marginTop: 4 },

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  socialBtnText: { fontSize: fontSize.lg, fontWeight: '600' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: fontSize.sm },

  inputLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: -spacing.xs },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  input: { flex: 1, fontSize: fontSize.lg },

  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: fontSize.base, fontWeight: '600' },

  signInBtn: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  signInBtnText: { fontSize: fontSize.lg, fontWeight: '700' },

  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  biometricText: { fontSize: fontSize.base, fontWeight: '500' },

  signUpRow: { flexDirection: 'row', justifyContent: 'center' },
  signUpText: { fontSize: fontSize.base },
  signUpLink: { fontSize: fontSize.base, fontWeight: '700' },
});