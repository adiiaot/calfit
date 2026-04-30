import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';
import { colors } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import {
  initIAP,
  endIAP,
  setupPurchaseListeners,
} from './src/services/iapService';
import { setupNotificationHandler } from './src/services/reminderService';

setupNotificationHandler();

export default function App() {
  const { setSession, user } = useAuthStore();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    ...Ionicons.font,
  });

  // ── AUTH LISTENER ─────────────────────────────────────────
  useEffect(() => {
    // Load existing session on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      if (session?.user) {
        setTimeout(async () => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('last_active_date')
              .eq('id', session.user.id)
              .single();

            if (profileData) {
              const { checkAndSendStreakReminder } = await import(
                './src/services/notificationService'
              );
              await checkAndSendStreakReminder(
                session.user.id,
                profileData.last_active_date
              );
            }
          } catch (e) {
            // Silent fail — non critical
          }
        }, 3000);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // ── KEY FIX ───────────────────────────────────────────
      // During onboarding Google/Apple OAuth, the auth state changes
      // (SIGNED_IN fires) while isOnboarding is still true.
      // If we call setSession here unconditionally, AppNavigator
      // re-renders and can unmount OnboardingScreen, resetting all
      // step state back to 'welcome'.
      //
      // Solution: skip the setSession call during onboarding.
      // OnboardingScreen handles the session itself after OAuth completes
      // and calls setOnboarding(false) only when the user reaches the
      // paywall and makes a choice. At that point, the next auth state
      // change or the explicit setSession call in the component will
      // navigate correctly.
      //
      // We still handle TOKEN_REFRESHED and SIGNED_OUT unconditionally
      // since those need to update state regardless of onboarding status.

      const { isOnboarding } = useAuthStore.getState();

      if (event === 'SIGNED_OUT') {
        // Always handle sign out
        setSession(null);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        // Always refresh tokens silently
        setSession(session);
        return;
      }

      if (event === 'SIGNED_IN' && isOnboarding) {
        // User signed in via OAuth during onboarding flow.
        // OnboardingScreen is managing navigation — don't interfere.
        // Just update the session data quietly without triggering
        // AppNavigator re-render.
        useAuthStore.setState({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        });
        return;
      }

      // All other events (SIGNED_IN outside onboarding, PASSWORD_RECOVERY, etc.)
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── IAP LISTENERS ─────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    let cleanupListeners: (() => void) | undefined;

    const setupIAP = async () => {
      const ready = await initIAP();
      if (ready) {
        cleanupListeners = setupPurchaseListeners(user.id);
      }
    };

    setupIAP();

    return () => {
      cleanupListeners?.();
      endIAP();
    };
  }, [user?.id]);

  if (!fontsLoaded) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.bg,
      }}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}