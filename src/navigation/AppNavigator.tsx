import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, StatusBar } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

// Fix Android status bar overlap globally
if (Platform.OS === 'android') {
  StatusBar.setTranslucent(true);
  StatusBar.setBackgroundColor('transparent');
}

// ── CORE SCREENS ──────────────────────────────────────────────
import HomeScreen from '../screens/dashboard/HomeScreen';
import CalorieScreen from '../screens/calorie/CalorieScreen';
import MealsScreen from '../screens/meals/MealsScreen';
import WorkoutScreen from '../screens/Activity/ActivityScreen';
import CoachScreen from '../screens/coach/CoachScreen';
import CreditsScreen from '../screens/earnings/CreditsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import StreaksScreen from '../screens/streaks/StreaksScreen';
import SleepScreen from '../screens/sleep/SleepScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import DownloadDataScreen from '../screens/settings/DownloadDataScreen';
import LanguageScreen from '../screens/settings/LanguageScreen';
import PrivacyScreen from '../screens/settings/PrivacyScreen';
import FoodScannerScreen from '../screens/calorie/FoodScannerScreen';
import GoalsScreen from '../screens/settings/GoalsScreen';
import QuickStartScreen from '../screens/Activity/QuickStartScreen';
import SubscriptionScreen from '../screens/earnings/SubscriptionScreen';
import PurchaseCreditsScreen from '../screens/earnings/PurchaseCreditsScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import LoginScreen from '../screens/onboarding/LoginScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import RecapScreen from '../screens/progress/RecapScreen';
import IntermittentFastingScreen from '../screens/meals/IntermittentFastingScreen';
import BodyMeasurementsScreen from '../screens/progress/BodyMeasurementScreen';

// ── SOCIAL MODULE ─────────────────────────────────────────────
import SocialScreen from '../screens/social/CalfitSocialScreen';
import ProfileScreen from '../modules/social/screens/ProfileScreen';

// ── COMMUNITY MODULE ──────────────────────────────────────────
import CommunityScreen from '../modules/community/screens/CommunityScreen';

// ── LEADERBOARD MODULE ────────────────────────────────────────
import LeaderboardScreen from '../modules/leaderboard/screens/LeaderboardScreen';

// ── CHAT MODULE ───────────────────────────────────────────────
import MessagesScreen from '../modules/chat/screens/MessageScreen';
import ChatScreen from '../modules/chat/screens/ChatScreen';

// ── ACCOUNTABILITY MODULE ─────────────────────────────────────
import AccountabilityScreen from '../modules/accountability/screens/AccountabilityScreen';

// ── LIVE MODULE ───────────────────────────────────────────────
import LiveScreen from '../modules/live/screens/LiveScreen';

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

// ── TAB ICON ──────────────────────────────────────────────────
function TabIcon({ label, focused, activeColor, inactiveColor }: {
  label: string; focused: boolean; activeColor: string; inactiveColor: string;
}) {
  const icons: Record<string, { active: any; inactive: any }> = {
    Home:     { active: 'home',         inactive: 'home-outline' },
    Calorie:  { active: 'nutrition',    inactive: 'nutrition-outline' },
    Meals:    { active: 'restaurant',   inactive: 'restaurant-outline' },
    Activity: { active: 'barbell',      inactive: 'barbell-outline' },
    Social:   { active: 'people',       inactive: 'people-outline' },
    Messages: { active: 'chatbubbles',  inactive: 'chatbubbles-outline' },
  };
  const icon = icons[label];
  if (!icon) return null;
  return (
    <Ionicons
      name={focused ? icon.active : icon.inactive}
      size={22}
      color={focused ? activeColor : inactiveColor}
    />
  );
}

// ── TAB NAVIGATOR ─────────────────────────────────────────────
function TabNavigator() {
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          height: 80,
          paddingBottom: 12,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            },
            android: { elevation: 8 },
          }),
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused }) => (
          <TabIcon
            label={route.name}
            focused={focused}
            activeColor={theme.tabBarActive}
            inactiveColor={theme.tabBarInactive}
          />
        ),
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Calorie"  component={CalorieScreen} />
      <Tab.Screen name="Meals"    component={MealsScreen} />
      <Tab.Screen name="Activity" component={WorkoutScreen} />
      <Tab.Screen name="Social"   component={SocialScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
    </Tab.Navigator>
  );
}

// ── ROOT NAVIGATOR ────────────────────────────────────────────
// KEY FIX: showAuth = !user OR isOnboarding
// When a new user signs up, isOnboarding=true keeps them on the
// onboarding stack even though user is now set. The paywall sets
// isOnboarding=false when the user makes their plan choice,
// which then releases them into the main app stack.
export default function AppNavigator() {
  const { user, isOnboarding } = useAuthStore();

  // Show auth stack if no user, OR if user is mid-onboarding
  const showAuth = !user || isOnboarding;

  return (
  <NavigationContainer key={user ? `authed-${user.id}` : 'guest'}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {showAuth ? (
          // ── AUTH / ONBOARDING FLOW ────────────────────────
          <>
            <RootStack.Screen name="Welcome"      component={WelcomeScreen} />
            <RootStack.Screen name="Login"        component={LoginScreen} />
            <RootStack.Screen name="Onboarding"   component={OnboardingScreen} />
            {/* Subscription registered here so paywall can navigate to it */}
            <RootStack.Screen name="Subscription" component={SubscriptionScreen} />
          </>
        ) : (
          // ── MAIN APP ──────────────────────────────────────
          <>
            <RootStack.Screen name="Main"                component={TabNavigator} />
            <RootStack.Screen name="Settings"            component={SettingsScreen} />
            <RootStack.Screen name="Progress"            component={ProgressScreen} />
            <RootStack.Screen name="Streaks"             component={StreaksScreen} />
            <RootStack.Screen name="FoodScanner"         component={FoodScannerScreen} />
            <RootStack.Screen name="Notifications"       component={NotificationsScreen} />
            <RootStack.Screen name="EditProfile"         component={EditProfileScreen} />
            <RootStack.Screen name="Goals"               component={GoalsScreen} />
            <RootStack.Screen name="QuickStart"          component={QuickStartScreen} />
            <RootStack.Screen name="Subscription"        component={SubscriptionScreen} />
            <RootStack.Screen name="Credits"             component={CreditsScreen} />
            <RootStack.Screen name="PurchaseCredits"     component={PurchaseCreditsScreen} />
            <RootStack.Screen name="Language"            component={LanguageScreen} />
            <RootStack.Screen name="Privacy"             component={PrivacyScreen} />
            <RootStack.Screen name="DownloadData"        component={DownloadDataScreen} />
            <RootStack.Screen name="Recap"               component={RecapScreen} />
            <RootStack.Screen name="IntermittentFasting" component={IntermittentFastingScreen} />
            <RootStack.Screen name="Sleep"               component={SleepScreen} />
            <RootStack.Screen name="Coach"               component={CoachScreen} />
            <RootStack.Screen name="Profile"             component={ProfileScreen} />
            <RootStack.Screen name="Leaderboard"         component={LeaderboardScreen} />
            <RootStack.Screen name="Community"           component={CommunityScreen} />
            <RootStack.Screen name="Chat"                component={ChatScreen} />
            <RootStack.Screen name="Accountability"      component={AccountabilityScreen} />
            <RootStack.Screen name="Live"                component={LiveScreen} />
            <RootStack.Screen name="BodyMeasurements" component={BodyMeasurementsScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}