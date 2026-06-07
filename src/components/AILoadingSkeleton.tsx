import { View, Animated, StyleSheet, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, spacing, radius } from '../theme';
import { useThemeStore } from '../store/themeStore';

export function AILoadingSkeleton() {
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.titleLine, { backgroundColor: theme.border, opacity }]}
      />
      <Animated.View
        style={[styles.descLine, { backgroundColor: theme.border, opacity }]}
      />
      <Animated.View
        style={[styles.descLine2, { backgroundColor: theme.border, opacity }]}
      />

      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Animated.View
            style={[styles.exName, { backgroundColor: theme.border, opacity }]}
          />
          <Animated.View
            style={[styles.exMeta, { backgroundColor: theme.border, opacity }]}
          />
          <Animated.View
            style={[styles.exTip, { backgroundColor: theme.border, opacity }]}
          />
        </View>
      ))}

      <Animated.View
        style={[styles.cooldownLine, { backgroundColor: theme.border, opacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  titleLine: {
    width: '60%',
    height: 24,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  descLine: {
    width: '90%',
    height: 14,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  descLine2: {
    width: '70%',
    height: 14,
    borderRadius: radius.sm,
    marginBottom: spacing.xxl,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  exName: {
    width: '50%',
    height: 18,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  exMeta: {
    width: '40%',
    height: 14,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  exTip: {
    width: '30%',
    height: 14,
    borderRadius: radius.sm,
  },
  cooldownLine: {
    width: '50%',
    height: 14,
    borderRadius: radius.sm,
    marginTop: spacing.lg,
  },
});
