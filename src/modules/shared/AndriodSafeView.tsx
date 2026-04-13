import {
  View, StyleSheet, StatusBar,
  Platform, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { SAFE_TOP } from './ResponsiveScreens';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

/**
 * AndroidSafeView — drop-in replacement for SafeAreaView that properly
 * handles the Android status bar overlap issue.
 *
 * On iOS: behaves exactly like SafeAreaView (no change).
 * On Android: adds paddingTop equal to the status bar height so content
 * is never hidden behind the system status bar.
 *
 * Usage:
 *   import { AndroidSafeView } from '../../modules/shared/AndroidSafeView';
 *   <AndroidSafeView style={{ backgroundColor: theme.bg }}>
 *     ...your screen content
 *   </AndroidSafeView>
 */
export function AndroidSafeView({ children, style, backgroundColor }: Props) {
  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView style={[styles.base, { backgroundColor }, style]}>
        {children}
      </SafeAreaView>
    );
  }

  // Android — manually add status bar padding
  return (
    <View style={[
      styles.base,
      { paddingTop: SAFE_TOP, backgroundColor },
      style,
    ]}>
      <StatusBar
        backgroundColor={backgroundColor ?? 'transparent'}
        barStyle="light-content"
        translucent
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});