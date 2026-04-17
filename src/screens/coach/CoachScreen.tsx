import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { PERSONALITIES } from './PersonalitySelector';

// ── MESSAGE BUBBLE ───────────────────────────────────────────
function MessageBubble({
  message,
  theme,
}: {
  message: { from: 'coach' | 'user'; text: string; time: string };
  theme: typeof colors.dark;
}) {
  const isCoach = message.from === 'coach';
  return (
    <View style={[
      styles.bubbleWrap,
      { alignItems: isCoach ? 'flex-start' : 'flex-end' },
    ]}>
      <View style={[
        styles.bubble,
        {
          backgroundColor: isCoach ? theme.card : theme.accent,
          borderColor: isCoach ? theme.border : theme.accent,
          borderWidth: isCoach ? 1 : 0,
        },
      ]}>
        <Text style={[
          styles.bubbleText,
          { color: isCoach ? theme.textPrimary : theme.bg },
        ]}>
          {message.text}
        </Text>
      </View>
      <Text style={[styles.bubbleTime, { color: theme.textMuted }]}>
        {message.time}
      </Text>
    </View>
  );
}

// ── QUICK CHIPS ──────────────────────────────────────────────
function QuickChips({
  theme,
  onSelect,
}: {
  theme: typeof colors.dark;
  onSelect: (text: string) => void;
}) {
  const chips = ['Plan my meals', 'Analyse my sleep', 'Start workout', 'My macros today'];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      {chips.map((chip) => (
        <TouchableOpacity
          key={chip}
          onPress={() => onSelect(chip)}
          style={[styles.chip, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}
        >
          <Text style={[styles.chipText, { color: theme.textSecondary }]}>{chip}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── WEEKLY NUDGE CARD ────────────────────────────────────────
function WeeklyNudge({ theme }: { theme: typeof colors.dark }) {
  return (
    <View style={[styles.nudgeCard, {
      backgroundColor: theme.accentDim as string,
      borderColor: theme.accent,
    }]}>
      <View style={styles.nudgeLeft}>
        <Text style={[styles.nudgeTitle, { color: theme.accent }]}>
          Week 14 Feedback Ready
        </Text>
        <Text style={[styles.nudgeBody, { color: theme.textPrimary }]}>
          You averaged 128g protein/day. Sleep dipped mid-week — let's fix that.
        </Text>
      </View>
      <TouchableOpacity>
        <Text style={[styles.nudgeArrow, { color: theme.accent }]}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function CoachScreen() {
  const { colorScheme } = useThemeStore();
  const { user, profile, coachPersonality, setCoachPersonality } = useAuthStore();
  const theme = colors[colorScheme];
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const firstName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'there';
  const activePersonality =
    PERSONALITIES.find((p) => p.id === coachPersonality) ?? PERSONALITIES[0];

  const [showPersonality, setShowPersonality] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'coach' as const,
      text: `Good morning ${firstName}! Your readiness score is 78/100 today. Sleep was solid at 7.2hrs. Ready to crush your workout? 💪`,
      time: '8:02 AM',
    },
    {
      from: 'user' as const,
      text: 'Yes! What should I eat before my workout?',
      time: '8:45 AM',
    },
    {
      from: 'coach' as const,
      text: 'For a pre-workout meal 60–90 mins before, I suggest oats with a banana and a scoop of protein. That gives you ~320 kcal, 28g protein and slow-release carbs for energy.',
      time: '8:45 AM',
    },
    {
      from: 'user' as const,
      text: 'Perfect. Can you add it to my meal plan?',
      time: '8:46 AM',
    },
    {
      from: 'coach' as const,
      text: "Done! I've added Pre-Workout Oats to your Breakfast slot today. Your updated plan now hits 2,080 kcal with 142g protein. Good luck with the session! 💪",
      time: '8:46 AM',
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const buildSystemPrompt = () =>
    `${activePersonality.tone}

The user's name is ${firstName}.
Their fitness goal is: ${(profile as any)?.goal ?? 'general fitness'}.
Their current streak is: ${(profile as any)?.streak_count ?? 0} days.
Current calorie goal: ${(profile as any)?.daily_calorie_goal ?? 2000} kcal/day.

Always be helpful, safe, and never recommend anything dangerous.
Keep responses concise and actionable. Max 3 sentences unless the user asks for more detail.`;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      from: 'user' as const,
      text: input.trim(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsTyping(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.from === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      conversationHistory.push({ role: 'user', content: userInput });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: conversationHistory,
        }),
      });

      const data = await response.json();
      const replyText =
        data?.content?.[0]?.text ??
        "I'm here to help! Could you rephrase that?";

      setMessages((prev) => [...prev, {
        from: 'coach' as const,
        text: replyText,
        time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit',
        }),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        from: 'coach' as const,
        text: "I'm analysing your data now. Based on your current progress, you're doing great — keep it consistent!",
        time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit',
        }),
      }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={[styles.safe, {
      backgroundColor: theme.bg,
      paddingTop: insets.top,
      // KEY FIX: no paddingBottom on root — keyboard offset handled by
      // marginBottom on the bottom container instead
      marginBottom: keyboardHeight > 0 ? keyboardHeight : 0,
    }]}>

      {/* COACH HEADER */}
      <View style={[styles.coachHeader, {
        backgroundColor: theme.bg,
        borderBottomColor: theme.border,
      }]}>
        <View style={[styles.coachAvatar, {
          backgroundColor: theme.accentDim as string,
          borderColor: theme.accent,
        }]}>
          <Text style={[styles.coachAvatarText, { color: theme.accent }]}>C</Text>
        </View>
        <View style={styles.coachInfo}>
          <Text style={[styles.coachName, { color: theme.textPrimary }]}>
            My CalFit Coach
          </Text>
          <Text style={[styles.coachSub, { color: theme.textSecondary }]}>
            {activePersonality.name} · {activePersonality.emoji}
          </Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={[styles.onlineDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.onlineText, { color: theme.accent }]}>Online</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowPersonality(true)}
          style={[styles.personalityBtn, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}
        >
          <Text style={styles.personalityEmoji}>{activePersonality.emoji}</Text>
        </TouchableOpacity>
      </View>

      {/* MESSAGES */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        <WeeklyNudge theme={theme} />

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} theme={theme} />
        ))}

        {isTyping && (
          <View style={[styles.bubbleWrap, { alignItems: 'flex-start' }]}>
            <View style={[styles.bubble, {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1,
            }]}>
              <Text style={[styles.bubbleText, { color: theme.textMuted }]}>
                {activePersonality.emoji} Coach is typing...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* CHIPS + INPUT grouped together — no gap between them */}
      <View style={[styles.bottomContainer, {
        backgroundColor: theme.bg,
        borderTopColor: theme.border,
      }]}>
        {/* QUICK CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {['Plan my meals', 'Analyse my sleep', 'Start workout', 'My macros today'].map((chip) => (
            <TouchableOpacity
              key={chip}
              onPress={() => setInput(chip)}
              style={[styles.chip, {
                backgroundColor: theme.card,
                borderColor: theme.border,
              }]}
            >
              <Text style={[styles.chipText, { color: theme.textSecondary }]}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* INPUT BAR */}
        <View style={styles.inputRow}>
          <View style={[styles.inputField, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask your coach anything..."
              placeholderTextColor={theme.textMuted}
              style={[styles.inputText, { color: theme.textPrimary }]}
              multiline
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity>
              <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim()}
            style={[styles.sendBtn, {
              backgroundColor: input.trim() ? theme.accent : theme.border,
            }]}
          >
            <Text style={[styles.sendBtnText, {
              color: input.trim() ? theme.bg : theme.textMuted,
            }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PERSONALITY SELECTOR MODAL */}
      <Modal
        visible={showPersonality}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPersonality(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismiss}
            onPress={() => setShowPersonality(false)}
          />
          <View style={[styles.modalSheet, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <View style={[styles.modalSheetHeader, {
              borderBottomColor: theme.border,
            }]}>
              <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                Coach Personality
              </Text>
              <TouchableOpacity onPress={() => setShowPersonality(false)}>
                <Text style={[styles.modalSheetClose, { color: theme.textMuted }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalSheetContent}
            >
              <Text style={[styles.modalSheetSub, { color: theme.textMuted }]}>
                Choose how your CalFit Coach speaks to you. Takes effect on your next message.
              </Text>

              {PERSONALITIES.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    setCoachPersonality(p.id as any);
                    setShowPersonality(false);
                  }}
                  style={[styles.personalityCard, {
                    backgroundColor: coachPersonality === p.id
                      ? p.color + '18'
                      : theme.bg,
                    borderColor: coachPersonality === p.id
                      ? p.color
                      : theme.border,
                    borderWidth: coachPersonality === p.id ? 2 : 1,
                  }]}
                >
                  <Text style={styles.personalityCardEmoji}>{p.emoji}</Text>
                  <View style={styles.personalityCardInfo}>
                    <Text style={[styles.personalityCardName, {
                      color: coachPersonality === p.id
                        ? p.color
                        : theme.textPrimary,
                    }]}>
                      {p.name}
                    </Text>
                    <Text style={[styles.personalityCardDesc, {
                      color: theme.textMuted,
                    }]}>
                      {p.description}
                    </Text>
                  </View>
                  {coachPersonality === p.id && (
                    <Text style={[styles.personalityCheck, { color: p.color }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  coachAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, flexShrink: 0,
  },
  coachAvatarText: { fontSize: fontSize.xl, fontWeight: '700' },
  coachInfo: { flex: 1 },
  coachName: { fontSize: fontSize.base, fontWeight: '700' },
  coachSub: { fontSize: fontSize.xs, marginTop: 2 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontSize: fontSize.sm, fontWeight: '600' },
  personalityBtn: {
    width: 38, height: 38,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  personalityEmoji: { fontSize: 20 },

  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
    // No flexGrow — this was causing the stretch gap
  },

  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  nudgeLeft: { flex: 1 },
  nudgeTitle: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: 4 },
  nudgeBody: { fontSize: fontSize.sm, lineHeight: 18 },
  nudgeArrow: { fontSize: fontSize.xl, fontWeight: '700' },

  bubbleWrap: { marginBottom: spacing.sm },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  bubbleText: { fontSize: fontSize.base, lineHeight: 20 },
  bubbleTime: { fontSize: fontSize.xs, marginTop: 2 },

  // KEY FIX: chips and input bar are now ONE container — no gap possible
  bottomContainer: {
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },

  chipsRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    paddingTop: 2,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
  },
  chipText: { fontSize: fontSize.xs, fontWeight: '500' },

  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  inputField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 48,
  },
  inputText: { flex: 1, fontSize: fontSize.base, maxHeight: 100 },
  micIcon: { fontSize: 20, marginBottom: 2 },
  sendBtn: {
    width: 48, height: 48,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnText: { fontSize: fontSize.xxl, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalDismiss: { flex: 1 },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '80%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalSheetTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  modalSheetClose: { fontSize: fontSize.base, fontWeight: '600' },
  modalSheetContent: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: 48,
  },
  modalSheetSub: { fontSize: fontSize.sm, lineHeight: 18, marginBottom: spacing.xs },
  personalityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  personalityCardEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  personalityCardInfo: { flex: 1 },
  personalityCardName: { fontSize: fontSize.base, fontWeight: '700' },
  personalityCardDesc: { fontSize: fontSize.sm, marginTop: 2, lineHeight: 18 },
  personalityCheck: { fontSize: fontSize.xl, fontWeight: '800', flexShrink: 0 },
});