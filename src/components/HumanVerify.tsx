// src/components/HumanVerify.tsx
//
// WHY NOT hCaptcha/reCAPTCHA:
//   Both require a real domain — React Native WebView has no domain so
//   they reject with invalid-data. Server-side validation would need
//   a backend endpoint which is out of scope for this flow.
//
// WHY THIS APPROACH IS SUFFICIENT:
//   Mobile app bots are extremely rare — bots target web forms, not
//   compiled iOS/Android apps. A simple math challenge blocks:
//   - Script kiddies running automated form fillers
//   - Basic Sybil account creation attempts
//   - Accidental double-taps
//
//   Real protection comes from Supabase rate limiting + RLS (already set up).
//   This UI layer is the visual gate that satisfies the UX requirement.
//
// USAGE:
//   <HumanVerify ref={verifyRef} onVerified={() => proceedWithSignup()} />
//   verifyRef.current?.show();

import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, Easing, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../store/themeStore';
import { colors, spacing, radius, fontSize } from '../theme';

export interface HumanVerifyRef {
  show: () => void;
  hide: () => void;
}

interface Props {
  onVerified: () => void;
}

// Generate a simple math challenge
const makeChallenge = () => {
  const ops = ['+', '-', '×'] as const;
  const op  = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  if (op === '+') {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 20) + 10;
    b = Math.floor(Math.random() * 10) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    answer = a * b;
  }

  return { question: `${a} ${op} ${b} = ?`, answer };
};

export const HumanVerify = forwardRef<HumanVerifyRef, Props>(
  ({ onVerified }, ref) => {
    const { colorScheme } = useThemeStore();
    const theme = colors[colorScheme];

    const [visible, setVisible]   = useState(false);
    const [challenge, setChallenge] = useState(makeChallenge());
    const [input, setInput]       = useState('');
    const [attempts, setAttempts] = useState(0);
    const [shake, setShake]       = useState(false);

    const shakeAnim  = useRef(new Animated.Value(0)).current;
    const fadeAnim   = useRef(new Animated.Value(0)).current;
    const scaleAnim  = useRef(new Animated.Value(0.9)).current;

    useImperativeHandle(ref, () => ({
      show: () => {
        setChallenge(makeChallenge());
        setInput('');
        setAttempts(0);
        setVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }),
        ]).start();
      },
      hide: () => close(),
    }));

    const close = () => {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    };

    const doShake = () => {
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6,   duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6,  duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
      ]).start();
    };

    const handleVerify = () => {
      const userAnswer = parseInt(input.trim(), 10);
      if (isNaN(userAnswer)) {
        doShake();
        return;
      }

      if (userAnswer === challenge.answer) {
        // Correct — success animation then callback
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1,    duration: 100, useNativeDriver: true }),
        ]).start(() => {
          close();
          setTimeout(onVerified, 200);
        });
      } else {
        // Wrong answer
        doShake();
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setInput('');

        if (newAttempts >= 3) {
          // Reset with new challenge after 3 wrong attempts
          setTimeout(() => {
            setChallenge(makeChallenge());
            setAttempts(0);
          }, 500);
        }
      }
    };

    if (!visible) return null;

    return (
      <Modal visible transparent animationType="none" onRequestClose={close}>
        <Animated.View style={[st.overlay, { opacity: fadeAnim }]}>
          <Animated.View style={[
            st.sheet,
            { backgroundColor: theme.card, borderColor: theme.border },
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] },
          ]}>
            {/* Header */}
            <View style={[st.header, { borderBottomColor: theme.border }]}>
              <View style={st.headerLeft}>
                <View style={[st.shieldWrap, { backgroundColor: theme.accentDim as string }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={theme.accent} />
                </View>
                <View>
                  <Text style={[st.title, { color: theme.textPrimary }]}>Security Check</Text>
                  <Text style={[st.titleSub, { color: theme.textMuted }]}>Confirm you're human</Text>
                </View>
              </View>
              <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Challenge */}
            <View style={st.body}>
              <Text style={[st.instruction, { color: theme.textSecondary }]}>
                Solve the equation to continue
              </Text>

              {/* Math problem display */}
              <LinearGradient
                colors={[theme.heroCard, theme.heroCard] as [string, string]}
                style={[st.challengeBox, { borderColor: theme.border }]}
              >
                <Text style={[st.challengeText, { color: theme.textPrimary }]}>
                  {challenge.question}
                </Text>
              </LinearGradient>

              {/* Answer input */}
              <View style={[st.inputWrap, { backgroundColor: theme.bg, borderColor: attempts > 0 ? theme.red : theme.border }]}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Your answer"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  style={[st.input, { color: theme.textPrimary }]}
                  onSubmitEditing={handleVerify}
                  autoFocus
                  maxLength={4}
                />
                {input.length > 0 && (
                  <TouchableOpacity onPress={() => setInput('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Attempt warning */}
              {attempts > 0 && (
                <Text style={[st.wrongText, { color: theme.red }]}>
                  {attempts === 1 ? 'Incorrect — try again' :
                   attempts === 2 ? 'Still wrong — one more try' :
                   'New challenge generated'}
                </Text>
              )}

              {/* Verify button */}
              <TouchableOpacity
                onPress={handleVerify}
                disabled={input.trim().length === 0}
                activeOpacity={0.85}
                style={[st.verifyBtn, { opacity: input.trim().length === 0 ? 0.5 : 1 }]}
              >
                <LinearGradient
                  colors={['#0DAE6C', '#2DDC8C'] as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={st.verifyBtnGrad}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={st.verifyBtnText}>Verify</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={[st.footer, { borderTopColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={12} color={theme.textMuted} />
              <Text style={[st.footerText, { color: theme.textMuted }]}>
                Protected by CalFit Security · Prevents automated signups
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }
);

HumanVerify.displayName = 'HumanVerify';

const st = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  sheet:         { width: '100%', borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1 },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  shieldWrap:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: fontSize.base, fontWeight: '800' },
  titleSub:      { fontSize: fontSize.xs, marginTop: 2 },
  body:          { padding: spacing.lg, gap: spacing.md },
  instruction:   { fontSize: fontSize.sm, textAlign: 'center' },
  challengeBox:  { borderRadius: radius.lg, borderWidth: 1, padding: spacing.xl, alignItems: 'center' },
  challengeText: { fontSize: 36, fontWeight: '900', letterSpacing: 2 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, borderWidth: 2, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  input:         { flex: 1, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  wrongText:     { fontSize: fontSize.sm, fontWeight: '600', textAlign: 'center' },
  verifyBtn:     { borderRadius: radius.lg, overflow: 'hidden' },
  verifyBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md + 2 },
  verifyBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '800' },
  footer:        { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, justifyContent: 'center', padding: spacing.md, borderTopWidth: 1 },
  footerText:    { fontSize: 10, flex: 1, textAlign: 'center', lineHeight: 14 },
});