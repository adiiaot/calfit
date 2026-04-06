import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

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
          <Text style={[styles.chipText, { color: theme.textSecondary }]}>
            {chip}
          </Text>
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
  const { user } = useAuthStore();
  const theme = colors[colorScheme];
  const scrollRef = useRef<ScrollView>(null);

  const firstName = user?.email?.split('@')[0] ?? 'Favour';

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
    setInput('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulate coach response — we'll replace this with real Claude API in Phase 3
    setTimeout(() => {
      const coachReply = {
        from: 'coach' as const,
        text: "Great question! I'm analysing your data now. Based on your current macros and activity level, here's what I recommend...",
        time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, coachReply]);
      setIsTyping(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const handleChipSelect = (text: string) => {
    setInput(text);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={120}
      >
        {/* COACH HEADER */}
        <View style={[styles.coachHeader, {
          backgroundColor: theme.surface,
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
              CalFit Coach
            </Text>
            <Text style={[styles.coachSub, { color: theme.textSecondary }]}>
              Personalised to you · Always on
            </Text>
          </View>
          <View style={styles.onlineBadge}>
            <View style={[styles.onlineDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.onlineText, { color: theme.accent }]}>Online</Text>
          </View>
        </View>

        {/* MESSAGES */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {/* Weekly nudge */}
          <WeeklyNudge theme={theme} />

          {/* Messages */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} theme={theme} />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <View style={[styles.bubbleWrap, { alignItems: 'flex-start' }]}>
              <View style={[styles.bubble, {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
              }]}>
                <Text style={[styles.bubbleText, { color: theme.textMuted }]}>
                  Coach is typing...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* QUICK CHIPS */}
        <View style={{ backgroundColor: 'transparent' }}>
          <QuickChips theme={theme} onSelect={handleChipSelect} />
        </View>

        {/* INPUT BAR */}
        <View style={[styles.inputBar, {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        }]}>
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
            style={[styles.sendBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  // Coach header
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  coachAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  coachAvatarText: { fontSize: fontSize.xl, fontWeight: '700' },
  coachInfo: { flex: 1 },
  coachName: { fontSize: fontSize.lg, fontWeight: '700' },
  coachSub: { fontSize: fontSize.sm, marginTop: 2 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Messages
  messagesScroll: { flex: 1, minHeight: 0,},
  messagesContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl, flexGrow: 1,},

  // Nudge card
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

  // Bubbles
  bubbleWrap: { marginBottom: spacing.sm },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  bubbleText: { fontSize: fontSize.base, lineHeight: 20 },
  bubbleTime: { fontSize: fontSize.xs, marginTop: 2 },

// Chips
chipsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
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
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  inputField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    height: 48,
  },
  inputText: { flex: 1, fontSize: fontSize.base, maxHeight: 100 },
  micIcon: { fontSize: 20 },
  sendBtn: {
    width: 48, height: 48,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { fontSize: fontSize.xxl, fontWeight: '700', color: '#0C0D10' },
});