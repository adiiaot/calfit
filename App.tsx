import { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Platform, LayoutChangeEvent } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';
import { colors } from './src/theme';
import { setContentWidth } from './src/theme/responsive';
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

  const onWebLayout = useCallback((e: LayoutChangeEvent) => {
    setContentWidth(e.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
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

  const app = (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </SafeAreaProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: theme.bg }}>
        <View onLayout={onWebLayout} style={{ flex: 1, width: '100%', maxWidth: 480 }}>
          {app}
        </View>
      </View>
    );
  }

  return app;
}
