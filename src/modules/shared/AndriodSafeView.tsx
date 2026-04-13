import { Platform, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

/**
 * AndroidSafeView — properly handles safe areas on both iOS and Android.
 * 
 * On iOS: uses SafeAreaView from react-native-safe-area-context
 *         which handles notch, Dynamic Island and home indicator.
 * 
 * On Android: uses useSafeAreaInsets to get the real status bar
 *             height and applies it as paddingTop. This is the
 *             correct fix for content rendering behind the status bar.
 */
export function AndroidSafeView({ children, style, backgroundColor }: Props) {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView
        style={[{ flex: 1, backgroundColor }, style]}
      >
        {children}
      </SafeAreaView>
    );
  }

  // Android — use real inset values from the device
  return (
    <View style={[{
      flex: 1,
      backgroundColor,
      paddingTop: insets.top,
    }, style]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      {children}
    </View>
  );
}