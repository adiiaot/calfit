import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/dashboard/HomeScreen';
import CalorieScreen from '../screens/calorie/CalorieScreen';
import MealsScreen from '../screens/meals/MealsScreen';
import WorkoutScreen from '../screens/Activity/ActivityScreen';
import SocialScreen from '../screens/social/SocialScreen';
import CoachScreen from '../screens/coach/CoachScreen';
import CreditsScreen from '../screens/earnings/CreditsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';

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
    Social:   { active: 'people',             inactive: 'people-outline' },
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

// ── 7 TAB NAVIGATOR — no Profile tab ─────────────────────────
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

// ── ROOT STACK — tabs + settings + progress ───────────────────
// Settings and Progress are NOT tabs
// They are full screen pages accessible via navigation.navigate()
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'card',
        }}
      >
        {/* Main app with 7 tabs */}
        <RootStack.Screen name="Tabs" component={TabNavigator} />

        {/* Settings — opened by tapping F avatar on Home */}
        <RootStack.Screen name="Settings" component={SettingsScreen} />

        {/* Progress — opened from Settings */}
        <RootStack.Screen name="Progress" component={ProgressScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
});