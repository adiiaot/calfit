import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

// Main screens
import HomeScreen from '../screens/dashboard/HomeScreen';
import CalorieScreen from '../screens/calorie/CalorieScreen';
import MealsScreen from '../screens/meals/MealsScreen';
import WorkoutScreen from '../screens/Activity/ActivityScreen';
import SocialScreen from '../screens/social/SocialScreen';
import CoachScreen from '../screens/coach/CoachScreen';
import CreditsScreen from '../screens/earnings/CreditsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import StreaksScreen from '../screens/streaks/StreaksScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

//Profile Edit screen
import EditProfileScreen from '../screens/settings/EditProfileScreen';

// Food Scanner screen
import FoodScannerScreen from '../screens/calorie/FoodScannerScreen';

// Goals Setting Screen
import GoalsScreen from '../screens/settings/GoalsScreen';

// Quick Start Screen for Workout Screen
import QuickStartScreen from '../screens/Activity/QuickStartScreen';

// Subscription & Purchase screen
import SubscriptionScreen from '../screens/earnings/SubscriptionScreen';
import PurchaseCreditsScreen from '../screens/earnings/PurchaseCreditsScreen';

// Auth + Onboarding screens
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import LoginScreen from '../screens/onboarding/LoginScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

// ── TAB ICON ─────────────────────────────────────────────────
function TabIcon({
  label,
  focused,
  activeColor,
  inactiveColor,
}: {
  label: string;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const icons: Record<string, { active: any; inactive: any }> = {
    Home:     { active: 'home',                inactive: 'home-outline' },
    Calorie:  { active: 'nutrition',           inactive: 'nutrition-outline' },
    Meals:    { active: 'restaurant',          inactive: 'restaurant-outline' },
    Activity: { active: 'barbell',             inactive: 'barbell-outline' },
    Social:   { active: 'people',              inactive: 'people-outline' },
    Coach:    { active: 'chatbubble-ellipses', inactive: 'chatbubble-ellipses-outline' },
    Credits:  { active: 'star',                inactive: 'star-outline' },
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

// ── 7 TABS ────────────────────────────────────────────────────
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
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginTop: 2,
        },
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
      <Tab.Screen name="Coach"    component={CoachScreen} />
      <Tab.Screen name="Credits"  component={CreditsScreen} />
    </Tab.Navigator>
  );
}

// ── ROOT NAVIGATOR ────────────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // ── AUTH FLOW ──────────────────────────────────────
          // Shown when user is not logged in
         <>
          <RootStack.Screen name="Welcome"    component={WelcomeScreen} />
          <RootStack.Screen name="Login"      component={LoginScreen} />
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
          <RootStack.Screen name="Main"       component={TabNavigator} />
          <RootStack.Screen name="Settings"   component={SettingsScreen} />
          <RootStack.Screen name="Progress"   component={ProgressScreen} />
          <RootStack.Screen name="Streaks"    component={StreaksScreen} />
          <RootStack.Screen name="Community"  component={CommunityScreen} />
          <RootStack.Screen name="FoodScanner" component={FoodScannerScreen} />
          <RootStack.Screen name="Notifications" component={NotificationsScreen} />
          <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
          <RootStack.Screen name="Goals" component={GoalsScreen} />
          <RootStack.Screen name="QuickStart" component={QuickStartScreen} />
          <RootStack.Screen name="Subscription" component={SubscriptionScreen} />
<RootStack.Screen name="PurchaseCredits" component={PurchaseCreditsScreen} />
        </>
        ) : (
          // ── MAIN APP ───────────────────────────────────────
          // Shown when user is logged in
          <>
          <RootStack.Screen name="Main"      component={TabNavigator} />
          <RootStack.Screen name="Settings"  component={SettingsScreen} />
          <RootStack.Screen name="Progress"  component={ProgressScreen} />
          <RootStack.Screen name="Streaks"   component={StreaksScreen} />
          <RootStack.Screen name="Community" component={CommunityScreen} />
          <RootStack.Screen name="FoodScanner" component={FoodScannerScreen} />
          <RootStack.Screen name="Notifications" component={NotificationsScreen} />
          <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
          <RootStack.Screen name="Goals" component={GoalsScreen} />
          <RootStack.Screen name="QuickStart" component={QuickStartScreen} />
          <RootStack.Screen name="Subscription" component={SubscriptionScreen} />
<RootStack.Screen name="PurchaseCredits" component={PurchaseCreditsScreen} />
        </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
});