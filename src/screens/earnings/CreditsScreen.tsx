import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme';

export default function CreditsScreen() {
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.text, { color: theme.textPrimary }]}>
        CalFit Credits Store
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
  },
});