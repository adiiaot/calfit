import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { supabase } from '../../services/supabase';

const GRAD_START = '#F0427C';
const GRAD_MID   = '#FF6B35';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const [loading, setLoading] = useState(false);

  const handleEnter = async () => {
    setLoading(true);
    try {
      const { data: anonData, error } = await supabase.auth.signInAnonymously();
      if (error || !anonData?.session) {
        Alert.alert('Error', error?.message ?? 'Could not sign in.');
        return;
      }
      useAuthStore.setState({
        session: anonData.session,
        user: anonData.session.user,
        isAuthenticated: true,
        isOnboarding: true,
      });
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      <View style={styles.container}>
        <LinearGradient colors={[GRAD_START, GRAD_MID, '#FFB830']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoCircle}>
          <Text style={styles.logoLetter}>C</Text>
        </LinearGradient>
        <Text style={[styles.title, { color: theme.textPrimary }]}>CalFit</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>Your personal fitness companion</Text>

        <TouchableOpacity onPress={handleEnter} disabled={loading} activeOpacity={0.85} style={styles.enterBtnWrap}>
          <LinearGradient colors={[GRAD_START, GRAD_MID] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.enterBtn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.enterText}>Enter the App</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.footnote, { color: theme.textMuted }]}>Anonymous demo — no account needed</Text>
      </View>
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoLetter: { fontSize: 40, fontWeight: '900', color: '#fff' },
  title: { fontSize: 32, fontWeight: '900' },
  sub: { fontSize: fontSize.base, textAlign: 'center', marginBottom: spacing.xl },
  enterBtnWrap: { width: '100%', borderRadius: radius.lg, overflow: 'hidden' },
  enterBtn: { padding: spacing.lg, alignItems: 'center' },
  enterText: { fontSize: fontSize.lg, fontWeight: '800', color: '#fff' },
  footnote: { fontSize: fontSize.xs, marginTop: spacing.sm },
});
