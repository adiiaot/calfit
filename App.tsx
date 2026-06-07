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
import { setupNotificationHandler } from './src/services/reminderService';

setupNotificationHandler();

export default function App() {
  const { setSession, user } = useAuthStore();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold, ...Ionicons.font,
  });

  useEffect(() => {
    // On app start — restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      if (session?.user) {
        setTimeout(async () => {
          try {
            const { data } = await supabase.from('profiles')
              .select('last_active_date').eq('id', session.user.id).single();
            if (data) {
              const { checkAndSendStreakReminder } = await import('./src/services/notificationService');
              await checkAndSendStreakReminder(session.user.id, data.last_active_date);
            }
          } catch {}
        }, 3000);
      }
    });

    // Auth state changes — ONLY call setSession.
    // Never touch isOnboarding here — OnboardingScreen owns that flag.
    // setSession loads the profile for display but does NOT change routing.
    // Routing is controlled exclusively by isOnboarding which is set by:
    //   - OnboardingScreen.setOnboarding(true)  → locks to onboarding
    //   - OnboardingScreen.handleSkip/Trial/Pay → setOnboarding(false) → home
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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