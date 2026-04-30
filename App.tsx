import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';
import { colors } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { initIAP, endIAP, setupPurchaseListeners } from './src/services/iapService';
import { setupNotificationHandler } from './src/services/reminderService';

setupNotificationHandler();

export default function App() {
  const { setSession, setOnboarding, user } = useAuthStore();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold, ...Ionicons.font,
  });

  useEffect(() => {
    // Load existing session on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setTimeout(async () => {
          try {
            const { data } = await supabase.from('profiles').select('last_active_date').eq('id', session.user.id).single();
            if (data) {
              const { checkAndSendStreakReminder } = await import('./src/services/notificationService');
              await checkAndSendStreakReminder(session.user.id, data.last_active_date);
            }
          } catch {}
        }, 3000);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // setSession handles auth state — does NOT touch isOnboarding
      setSession(session);

      // When a new user signs in via OAuth for the first time (SIGNED_IN event),
      // check if their profile has a goal. If not, they need onboarding + paywall.
      // We only do this for SIGNED_IN events — not TOKEN_REFRESHED etc.
      if (event === 'SIGNED_IN' && session?.user) {
        // Small delay to let setSession/loadProfile settle first
        setTimeout(async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('goal')
              .eq('id', session.user.id)
              .single();

            // No goal = brand new OAuth user who hasn't done onboarding
            if (!profile?.goal) {
              setOnboarding(true);
            }
            // Has goal = returning user → isOnboarding stays false → home screen
          } catch {}
        }, 500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cleanup: (() => void) | undefined;
    const setup = async () => {
      const ready = await initIAP();
      if (ready) cleanup = setupPurchaseListeners(user.id);
    };
    setup();
    return () => { cleanup?.(); endIAP(); };
  }, [user?.id]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
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