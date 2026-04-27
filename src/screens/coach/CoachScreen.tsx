import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useRef, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { VoiceMicButton } from '../../components/VoicemicButton';
import {
  claudeChat, claudeVision, checkUsage, incrementUsage,
  buildCoachPrompt, hasClaudeKey, isOnCooldown, getCooldownRemaining,
  PLAN_LIMITS, type UsageStatus,
} from '../../services/ClaudeService';

// ── PERSONALITIES ─────────────────────────────────────────────
const PERSONALITIES = [
  { id: 'balanced',  name: 'Balanced',      emoji: '⚖️', color: '#2DDC8C', description: 'Supportive and realistic — perfect for most people',   tone: 'You are a balanced, supportive fitness coach. Be encouraging but realistic.' },
  { id: 'hype',      name: 'Hype Coach',    emoji: '🔥', color: '#FF6B35', description: 'High energy, motivational, never lets you quit',         tone: 'You are an extremely motivational, high-energy coach. Push the user to be their best!' },
  { id: 'drill',     name: 'Drill Sergeant',emoji: '💪', color: '#F0427C', description: 'Tough love — no excuses, only results',                  tone: 'You are a strict drill sergeant coach. Be direct, no excuses. Short punchy responses.' },
  { id: 'zen',       name: 'Zen Guide',     emoji: '🧘', color: '#4A90E2', description: 'Calm and mindful — health is a lifestyle',               tone: 'You are a calm, mindful wellness guide. Focus on balance and sustainability.' },
  { id: 'scientist', name: 'The Scientist', emoji: '🔬', color: '#9B6FE8', description: 'Evidence-based — data, not feelings',                    tone: 'You are a science-based fitness coach. Reference research, give data-driven advice.' },
];

const QUICK_CHIPS = [
  '💧 How much water?', '🍽️ Meal timing tips', '💪 Best exercises for my goal',
  '😴 Sleep & recovery', '📊 Reading my macros', '🔥 Boost my metabolism',
];

interface Message { from: 'user' | 'coach'; text: string; image?: string; time: string; }

// ── USAGE BAR ─────────────────────────────────────────────────
function UsageBar({ status, theme }: { status: UsageStatus | null; theme: typeof colors.dark }) {
  if (!status || status.messagesLimit === 0) return null;
  const pct = Math.min(status.messagesUsed / status.messagesLimit, 1);
  const color = pct >= 0.9 ? '#FF5959' : pct >= 0.7 ? '#FFB347' : theme.accent;
  return (
    <View style={[ub.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[ub.label, { color: theme.textMuted }]}>
        {status.messagesUsed}/{status.messagesLimit} messages today
      </Text>
      <View style={[ub.track, { backgroundColor: theme.border }]}>
        <View style={[ub.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}
const ub = StyleSheet.create({
  wrap:  { marginHorizontal: spacing.lg, marginBottom: spacing.xs, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, gap: 4 },
  label: { fontSize: 10, fontWeight: '600' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 2 },
});

// ── PAYWALL CARD ──────────────────────────────────────────────
function PaywallCard({ theme, onUpgrade }: { theme: typeof colors.dark; onUpgrade: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
      <LinearGradient colors={['#2DDC8C22', '#6699FF22'] as [string, string]} style={pw.card}>
        <Text style={pw.emoji}>🤖</Text>
        <Text style={[pw.title, { color: theme.textPrimary }]}>CalFit Coach</Text>
        <Text style={[pw.sub, { color: theme.textMuted }]}>
          Get personalised fitness and nutrition guidance powered by AI. Available on Pro and Premium plans.
        </Text>
        <View style={pw.features}>
          {['💪 Workout advice', '🥗 Nutrition guidance', '📷 Food photo analysis', '🎤 Voice questions'].map(f => (
            <Text key={f} style={[pw.feature, { color: theme.textSecondary }]}>{f}</Text>
          ))}
        </View>
        <TouchableOpacity onPress={onUpgrade} style={[pw.btn, { backgroundColor: theme.accent }]}>
          <Text style={[pw.btnText, { color: theme.bg }]}>Upgrade to Pro</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}
const pw = StyleSheet.create({
  card:     { borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.md, width: '100%' },
  emoji:    { fontSize: 48 },
  title:    { fontSize: fontSize.xl, fontWeight: '800' },
  sub:      { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  features: { gap: spacing.sm, alignSelf: 'stretch' },
  feature:  { fontSize: fontSize.sm, fontWeight: '500' },
  btn:      { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 99, marginTop: spacing.sm },
  btnText:  { fontSize: fontSize.base, fontWeight: '800' },
});

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function CoachScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { profile, userTier, coachPersonality, setCoachPersonality, user } = useAuthStore();
  const theme = colors[colorScheme];

  const firstName      = profile?.full_name?.split(' ')[0] ?? 'there';
  const activeP        = PERSONALITIES.find(p => p.id === coachPersonality) ?? PERSONALITIES[0];
  const isFree         = false; // TESTING: bypassed — restore before release: !userTier || userTier === 'free'

  const scrollRef = useRef<ScrollView>(null);
  const hasLoaded = useRef(false);

  const WELCOME: Message = {
    from: 'coach',
    text: `Hey ${firstName}! 👋 I'm your CalFit Coach.\n\nAsk me anything about nutrition, workouts, or your progress. You can also send a food photo for calorie analysis!`,
    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };

  const [messages, setMessages]               = useState<Message[]>([WELCOME]);
  const [input, setInput]                     = useState('');
  const [isTyping, setIsTyping]               = useState(false);
  const [showPersonality, setShowPersonality] = useState(false);
  const [usage, setUsage]                     = useState<UsageStatus | null>(null);
  const [cooldown, setCooldown]               = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ── LOAD HISTORY + USAGE ON FOCUS ────────────────────────
  // Uses a ref so history only loads once per mount, not on every focus.
  // Usage refreshes every focus to keep the count accurate.
  useFocusEffect(useCallback(() => {
    if (user?.id && !isFree) {
      checkUsage(user.id, 'premium').then(setUsage); // TESTING: restore userTier ?? 'pro'
    }
    if (user?.id && !hasLoaded.current) {
      hasLoaded.current = true;
      loadHistory();
    }
  }, [user?.id, userTier]));

  const loadHistory = async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase
        .from('coach_messages')
        .select('from_role, text, image_uri, time_label, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data && data.length > 0) {
        const loaded: Message[] = data.map((r: any) => ({
          from:  r.from_role as 'user' | 'coach',
          text:  r.text,
          image: r.image_uri ?? undefined,
          time:  r.time_label ?? '',
        }));
        setMessages(loaded);
        // Scroll to bottom after loading
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 150);
      }
    } catch {}
    finally { setIsLoadingHistory(false); }
  };

  const saveMessage = async (msg: Message) => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      await supabase.from('coach_messages').insert({
        user_id:    user.id,
        from_role:  msg.from,
        text:       msg.text,
        image_uri:  msg.image ?? null,
        time_label: msg.time,
      });
    } catch {}
  };

  // Cooldown countdown
  const startCooldown = () => {
    setCooldown(getCooldownRemaining());
    const t = setInterval(() => {
      const rem = getCooldownRemaining();
      setCooldown(rem);
      if (rem <= 0) clearInterval(t);
    }, 1000);
  };

  const buildPrompt = (isSoft = false) =>
    buildCoachPrompt(
      (profile as any)?.goal ?? 'general fitness',
      (profile as any)?.streak_count ?? 0,
      (profile as any)?.daily_calorie_goal ?? 2000,
      activeP.tone,
      isSoft
    );

  const sendMessage = async (text?: string, imageBase64?: string) => {
    const msgText = text ?? input.trim();
    if (!msgText && !imageBase64) return;
    if (!user?.id) return;

    // Usage gate
    const status = await checkUsage(user.id, 'premium'); // TESTING: using premium — restore: userTier ?? 'pro'
    setUsage(status);

    if (!status.allowed) {
      if (status.reason === 'free_plan') return;
      if (status.reason === 'cooldown') {
        Alert.alert('Please wait', `Send another message in ${getCooldownRemaining()}s`);
        return;
      }
      if (status.reason === 'limit_reached') {
        Alert.alert('Daily limit reached', `You've used all ${PLAN_LIMITS.pro} messages for today. Resets at midnight.\n\nUpgrade to Premium for more.`);
        return;
      }
    }

    const userMsg: Message = {
      from: 'user',
      text: msgText || '📷 Image sent',
      image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    saveMessage(userMsg);  // persist to Supabase
    setInput('');
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      let reply: string | null = null;

      if (imageBase64) {
        reply = await claudeVision(
          buildPrompt(status.isSoftLimit),
          imageBase64,
          msgText || 'Analyse this food image — estimate calories and macros.'
        );
      } else {
        // Only pass last 4 messages (2 exchanges) to control cost
        const history = messages.slice(-4).map(m => ({
          role: m.from === 'user' ? 'user' as const : 'assistant' as const,
          content: m.text,
        }));
        reply = await claudeChat(buildPrompt(status.isSoftLimit), history, msgText, status.isSoftLimit);
      }

      const coachMsg: Message = {
        from: 'coach',
        text: reply ?? (hasClaudeKey()
          ? "I didn't catch that. Could you rephrase?"
          : "AI Coach isn't connected yet. Add your Anthropic API key to activate it."),
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, coachMsg]);
      saveMessage(coachMsg);  // persist to Supabase

      // Track usage and start cooldown
      await incrementUsage(user.id);
      setUsage(prev => prev ? { ...prev, messagesUsed: prev.messagesUsed + 1 } : prev);
      startCooldown();

    } catch {
      setMessages(prev => [...prev, {
        from: 'coach',
        text: "Having trouble connecting right now. Please try again.",
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to send images.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.6 });
    if (!result.canceled && result.assets[0].base64) {
      await sendMessage('Analyse this food image — estimate calories and macros.', result.assets[0].base64);
    }
  };

  const handleCameraImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 });
    if (!result.canceled && result.assets[0].base64) {
      await sendMessage('Analyse this food and estimate calories and macros.', result.assets[0].base64);
    }
  };

  const canSend = input.trim().length > 0 && !isTyping && cooldown === 0;

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* Header */}
      <LinearGradient colors={[theme.heroCard ?? '#1A1445', theme.heroCard + 'EE'] as [string, string]}
        style={[styles.header, { borderBottomColor: 'rgba(255,255,255,0.10)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.coachAvatar, { backgroundColor: activeP.color + '33', borderColor: activeP.color }]}>
            <Text style={{ fontSize: 16 }}>{activeP.emoji}</Text>
          </View>
          <View>
            <Text style={styles.coachName}>CalFit Coach</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: '#2DDC8C' }]} />
              <Text style={[styles.onlineSub, { color: '#2DDC8C' }]}>{activeP.name} · Online</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Clear Chat', 'Delete all messages with your coach?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: async () => {
                  if (!user?.id) return;
                  const { supabase } = await import('../../services/supabase');
                  await supabase.from('coach_messages').delete().eq('user_id', user.id);
                  hasLoaded.current = false;
                  setMessages([WELCOME]);
                }},
              ]);
            }}
            style={[styles.personalityBtn, { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)' }]}>
            <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.70)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPersonality(true)}
            style={[styles.personalityBtn, { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)' }]}>
            <Text style={{ fontSize: 18 }}>{activeP.emoji}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Free tier paywall */}
      {isFree ? (
        <PaywallCard theme={theme} onUpgrade={() => navigation.navigate('Subscription' as never)} />
      ) : (
        <>
          <UsageBar status={usage} theme={theme} />

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
            {isLoadingHistory && (
              <View style={[styles.historyLoader, { backgroundColor: theme.bg }]}>
                <ActivityIndicator color={theme.accent} />
                <Text style={[styles.historyLoaderText, { color: theme.textMuted }]}>Loading conversation...</Text>
              </View>
            )}
            <ScrollView ref={scrollRef} style={styles.messageList} contentContainerStyle={styles.messageListContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>

              {messages.map((msg, i) => {
                const isUser = msg.from === 'user';
                return (
                  <View key={i} style={[styles.bubbleWrap, isUser ? styles.bubbleWrapUser : styles.bubbleWrapCoach]}>
                    {!isUser && (
                      <View style={[styles.coachAvatarSmall, { backgroundColor: activeP.color + '22', borderColor: activeP.color + '44' }]}>
                        <Text style={{ fontSize: 12 }}>{activeP.emoji}</Text>
                      </View>
                    )}
                    <View style={[styles.bubble,
                      isUser
                        ? { backgroundColor: theme.accent }
                        : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }
                    ]}>
                      {msg.image && <Image source={{ uri: msg.image }} style={styles.bubbleImage} resizeMode="cover" />}
                      {msg.text ? <Text style={[styles.bubbleText, { color: isUser ? '#fff' : theme.textPrimary }]}>{msg.text}</Text> : null}
                      <Text style={[styles.bubbleTime, { color: isUser ? 'rgba(255,255,255,0.60)' : theme.textMuted }]}>{msg.time}</Text>
                    </View>
                  </View>
                );
              })}

              {isTyping && (
                <View style={[styles.bubbleWrap, styles.bubbleWrapCoach]}>
                  <View style={[styles.coachAvatarSmall, { backgroundColor: activeP.color + '22', borderColor: activeP.color + '44' }]}>
                    <Text style={{ fontSize: 12 }}>{activeP.emoji}</Text>
                  </View>
                  <View style={[styles.bubble, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={[styles.bubbleText, { color: theme.textMuted }]}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bottom bar */}
            <View style={[styles.bottomContainer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
              {/* Quick chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {QUICK_CHIPS.map(chip => (
                  <TouchableOpacity key={chip} onPress={() => sendMessage(chip)} activeOpacity={0.8}
                    style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.chipText, { color: theme.textSecondary }]}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Input row */}
              <View style={styles.inputRow}>
                <TouchableOpacity onPress={handleCameraImage} activeOpacity={0.8}
                  style={[styles.mediaBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Ionicons name="camera-outline" size={20} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}
                  style={[styles.mediaBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Ionicons name="image-outline" size={20} color={theme.accent} />
                </TouchableOpacity>

                <View style={[styles.inputField, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <TextInput
                    value={input} onChangeText={setInput}
                    placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : 'Ask your coach anything...'}
                    placeholderTextColor={theme.textMuted}
                    style={[styles.inputText, { color: theme.textPrimary }]}
                    multiline maxLength={300}
                    editable={cooldown === 0}
                    onSubmitEditing={() => canSend && sendMessage()}
                  />
                </View>

                <VoiceMicButton theme={theme} size={40}
                  onTranscribed={(text) => { setInput(text); sendMessage(text); }} />

                <TouchableOpacity onPress={() => sendMessage()} disabled={!canSend}
                  activeOpacity={0.85} style={styles.sendBtnWrap}>
                  <LinearGradient
                    colors={canSend ? [theme.accent, '#0A9A5E'] as [string, string] : [theme.border, theme.border] as [string, string]}
                    style={styles.sendBtn}>
                    <Ionicons name="send" size={18} color={canSend ? '#fff' : theme.textMuted} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <Text style={[styles.imageHint, { color: theme.textMuted }]}>
                📷 Send a food photo for calorie analysis
              </Text>
            </View>
          </KeyboardAvoidingView>
        </>
      )}

      {/* Personality modal */}
      <Modal visible={showPersonality} transparent animationType="slide" onRequestClose={() => setShowPersonality(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPersonality(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Coach Personality</Text>
              <TouchableOpacity onPress={() => setShowPersonality(false)}>
                <Text style={[styles.modalDone, { color: theme.accent }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: theme.textMuted }]}>Takes effect on your next message.</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.personalityList}>
              {PERSONALITIES.map(p => (
                <TouchableOpacity key={p.id} onPress={() => { setCoachPersonality(p.id as any); setShowPersonality(false); }}
                  style={[styles.personalityCard, {
                    backgroundColor: coachPersonality === p.id ? p.color + '18' : theme.bg,
                    borderColor: coachPersonality === p.id ? p.color : theme.border,
                    borderWidth: coachPersonality === p.id ? 2 : 1,
                  }]}>
                  <Text style={[styles.pEmoji]}>{p.emoji}</Text>
                  <View style={styles.pInfo}>
                    <Text style={[styles.pName, { color: coachPersonality === p.id ? p.color : theme.textPrimary }]}>{p.name}</Text>
                    <Text style={[styles.pDesc, { color: theme.textMuted }]}>{p.description}</Text>
                  </View>
                  {coachPersonality === p.id && <Ionicons name="checkmark-circle" size={20} color={p.color} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  coachAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  coachName: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineSub: { fontSize: fontSize.xs, fontWeight: '600' },
  personalityBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  messageList: { flex: 1 },
  messageListContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg },
  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.xs },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  bubbleWrapCoach: { justifyContent: 'flex-start' },
  coachAvatarSmall: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  bubble: { maxWidth: '78%', padding: spacing.md, borderRadius: 16, gap: 4 },
  bubbleImage: { width: '100%', height: 180, borderRadius: 10, marginBottom: spacing.xs },
  bubbleText: { fontSize: fontSize.base, lineHeight: 22 },
  bubbleTime: { fontSize: fontSize.xs, marginTop: 2 },
  bottomContainer: { borderTopWidth: 1 },
  chipsRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  chipText: { fontSize: fontSize.xs, fontWeight: '500' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  mediaBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  inputField: { flex: 1, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100 },
  inputText: { fontSize: fontSize.base, lineHeight: 22 },
  sendBtnWrap: { borderRadius: 20, overflow: 'hidden', flexShrink: 0 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  imageHint: { fontSize: fontSize.xs, textAlign: 'center', paddingBottom: spacing.sm },
  historyLoader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  historyLoaderText: { fontSize: fontSize.xs, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1 },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  modalDone: { fontSize: fontSize.base, fontWeight: '600' },
  modalSub: { fontSize: fontSize.sm, lineHeight: 18, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  personalityList: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: 48 },
  personalityCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg },
  pEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  pInfo: { flex: 1 },
  pName: { fontSize: fontSize.base, fontWeight: '700' },
  pDesc: { fontSize: fontSize.sm, marginTop: 2, lineHeight: 18 },
});