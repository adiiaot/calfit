import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { colors } from '../theme';

// Screens
import HomeScreen from '../screens/dashboard/HomeScreen';
import CalorieScreen from '../screens/calorie/CalorieScreen';
import MealsScreen from '../screens/meals/MealsScreen';
import WorkoutScreen from '../screens/workout//WorkoutScreen';
import SocialScreen from '../screens/social/SocialScreen';
import CoachScreen from '../screens/coach/CoachScreen';
import CreditsScreen from '../screens/earnings/CreditsScreen';

const Tab = createBottomTabNavigator();

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
  const icons: Record<string, string> = {
    Home: '⌂',
    Calorie: '◉',
    Meals: '☰',
    Workout: '◈',
    Social: '☷',
    Coach: '◎',
    Credits: '✦',
  };

  return (
    <View style={styles.iconWrap}>
      <Text style={[
        styles.icon,
        { color: focused ? activeColor : inactiveColor }
      ]}>
        {icons[label]}
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  return (
    <NavigationContainer>
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
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Calorie" component={CalorieScreen} />
        <Tab.Screen name="Meals" component={MealsScreen} />
        <Tab.Screen name="Workout" component={WorkoutScreen} />
        <Tab.Screen name="Social" component={SocialScreen} />
        <Tab.Screen name="Coach" component={CoachScreen} />
        <Tab.Screen name="Credits" component={CreditsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
});