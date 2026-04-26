import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform,
  Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useRef, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── PERSONALITIES ─────────────────────────────────────────────
const PERSONALITIES = [
  { id: 'balanced',    name: 'Balanced',     emoji: '⚖️', color: '#2DDC8C', description: 'Supportive and realistic — perfect for most people', tone: 'You are a balanced, supportive fitness coach. Be encouraging but realistic. Give practical advice.' },
  { id: 'hype',        name: 'Hype Coach',   emoji: '🔥', color: '#FF6B35', description: 'High energy, motivational, never lets you quit',       tone: 'You are an extremely motivational, high-energy coach. Use energy and enthusiasm. Push the user to be their best!' },
  { id: 'drill',       name: 'Drill Sergeant', emoji: '💪', color: '#F0427C', description: 'Tough love — no excuses, only results',              tone: 'You are a strict drill sergeant coach. Be direct, tough, no excuses. Short, punchy responses.' },
  { id: 'zen',         name: 'Zen Guide',    emoji: '🧘', color: '#4A90E2', description: 'Calm and mindful — health is a lifestyle',             tone: 'You are a calm, mindful wellness guide. Focus on balance, sustainability, and mental wellbeing alongside physical health.' },
  { id: 'scientist',   name: 'The Scientist', emoji: '🔬', color: '#9B6FE8', description: 'Evidence-based — data, not feelings',                 tone: 'You are a science-based fitness coach. Reference research, explain the why, give data-driven advice.' },
];

const QUICK_CHIPS = [
  '💧 How much water?', '🍽️ Meal timing tips', '💪 Best exercises for my goal',
  '😴 Sleep & recovery', '📊 Reading my macros', '🔥 Boost my metabolism',
];

interface Message {
  from: 'user' | 'coach';
  text: string;
  image?: string; // base64 or uri for image messages
  time: string;
}

export default function CoachScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { profile, coachPersonality, setCoachPersonality } = useAuthStore();
  const theme = colors[colorScheme];

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const activePersonality = PERSONALITIES.find((p) => p.id === coachPersonality) ?? PERSONALITIES[0];

  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: 'coach',
      text: `Hey ${firstName}! 👋 I'm your CalFit Coach — here to help you hit your goals.\n\nAsk me anything about nutrition, workouts, sleep, or your progress. You can also send me a photo of your food and I'll analyse it for you!`,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    },
  ]);
  const [input, setInput]                 = useState('');
  const [isTyping, setIsTyping]           = useState(false);
  const [showPersonality, setShowPersonality] = useState(false);
  const [pendingImage, setPendingImage]   = useState<string | null>(null);

  const buildSystemPrompt = () =>
    `${activePersonality.tone}
The user's name is ${firstName}.
Their fitness goal is: ${(profile as any)?.goal ?? 'general fitness'}.
Their current streak is: ${(profile as any)?.streak_count ?? 0} days.
Current calorie goal: ${(profile as any)?.daily_calorie_goal ?? 2000} kcal/day.
Always be helpful, safe, and never recommend anything dangerous.
Keep responses concise and actionable. Max 3 sentences unless asked for more.`;

  const sendMessage = async (text?: string, imageBase64?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText && !imageBase64) return;

    const userMsg: Message = {
      from: 'user',
      text: messageText || (imageBase64 ? '📷 Image sent' : ''),
      image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setPendingImage(null);
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.from === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      }));

      // Build content for this message — text + optional image (Claude Vision)
      let userContent: any;
      if (imageBase64) {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: messageText || 'Please analyse this image and provide nutritional information and fitness advice.' },
        ];
      } else {
        userContent = messageText;
      }

      conversationHistory.push({ role: 'user', content: userContent });

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
      const replyText = data?.content?.[0]?.text ?? "I'm here to help! Could you rephrase that?";

      setMessages((prev) => [...prev, {
        from: 'coach',
        text: replyText,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        from: 'coach',
        text: "I'm analysing your data now. Based on your current progress, you're doing great — keep it consistent!",
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to send images to your coach.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      await sendMessage('Please analyse this food image and tell me the estimated calories and macros.', result.assets[0].base64);
    }
  };

  const handleCameraImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to scan food with your coach.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].base64) {
      await sendMessage('Please analyse this food and estimate the calories and macros.', result.assets[0].base64);
    }
  };

  return (
   <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <LinearGradient colors={[theme.heroCard, theme.heroCard + 'EE'] as [string, string]} style={[styles.header, { borderBottomColor: 'rgba(255,255,255,0.10)' }]}>
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Coach identity */}
        <View style={styles.headerCenter}>
          <View style={[styles.coachAvatar, { backgroundColor: theme.accent + '33', borderColor: theme.accent }]}>
            <Text style={[styles.coachAvatarEmoji]}>{activePersonality.emoji}</Text>
          </View>
          <View>
            {/* CHANGED: "CalFit Coach" not "AI Coach powered by Claude API" */}
            <Text style={styles.coachName}>CalFit Coach</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.onlineSub, { color: theme.accent }]}>{activePersonality.name} · Online</Text>
            </View>
          </View>
        </View>

        {/* Personality selector */}
        <TouchableOpacity onPress={() => setShowPersonality(true)}
          style={[styles.personalityBtn, { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)' }]}>
          <Text style={styles.personalityEmoji}>{activePersonality.emoji}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── MESSAGES ───────────────────────────────────────── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <ScrollView ref={scrollRef} style={styles.messageList} contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>

          {messages.map((msg, i) => {
            const isUser = msg.from === 'user';
            return (
              <View key={i} style={[styles.bubbleWrap, isUser ? styles.bubbleWrapUser : styles.bubbleWrapCoach]}>
                {!isUser && (
                  <View style={[styles.coachAvatarSmall, { backgroundColor: theme.accent + '22', borderColor: theme.accent + '44' }]}>
                    <Text style={{ fontSize: 12 }}>{activePersonality.emoji}</Text>
                  </View>
                )}
                <View style={[
                  styles.bubble,
                  isUser
                    ? { backgroundColor: theme.accent }
                    : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
                ]}>
                  {msg.image && (
                    <Image source={{ uri: msg.image }} style={styles.bubbleImage} resizeMode="cover" />
                  )}
                  {msg.text ? (
                    <Text style={[styles.bubbleText, { color: isUser ? '#fff' : theme.textPrimary }]}>{msg.text}</Text>
                  ) : null}
                  <Text style={[styles.bubbleTime, { color: isUser ? 'rgba(255,255,255,0.60)' : theme.textMuted }]}>{msg.time}</Text>
                </View>
              </View>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <View style={[styles.bubbleWrap, styles.bubbleWrapCoach]}>
              <View style={[styles.coachAvatarSmall, { backgroundColor: theme.accent + '22', borderColor: theme.accent + '44' }]}>
                <Text style={{ fontSize: 12 }}>{activePersonality.emoji}</Text>
              </View>
              <View style={[styles.bubble, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                <Text style={[styles.bubbleText, { color: theme.textMuted }]}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── BOTTOM BAR ─────────────────────────────────────── */}
        <View style={[styles.bottomContainer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          {/* Quick chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {QUICK_CHIPS.map((chip) => (
              <TouchableOpacity key={chip} onPress={() => sendMessage(chip)} activeOpacity={0.8}
                style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.chipText, { color: theme.textSecondary }]}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input row */}
          <View style={styles.inputRow}>
            {/* Camera button — sends image to Claude Vision */}
            <TouchableOpacity onPress={handleCameraImage} activeOpacity={0.8}
              style={[styles.mediaBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="camera-outline" size={20} color={theme.accent} />
            </TouchableOpacity>

            {/* Gallery button */}
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}
              style={[styles.mediaBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="image-outline" size={20} color={theme.accent} />
            </TouchableOpacity>

            {/* Text input */}
            <View style={[styles.inputField, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask your coach anything..."
                placeholderTextColor={theme.textMuted}
                style={[styles.inputText, { color: theme.textPrimary }]}
                multiline
                maxLength={500}
                onSubmitEditing={() => sendMessage()}
              />
            </View>

            {/* Send button */}
            <TouchableOpacity onPress={() => sendMessage()} disabled={!input.trim() && !isTyping}
              activeOpacity={0.85} style={styles.sendBtnWrap}>
              <LinearGradient
                colors={input.trim() ? [theme.accent, '#0A9A5E'] as [string, string] : [theme.border, theme.border] as [string, string]}
                style={styles.sendBtn}
              >
                <Ionicons name="send" size={18} color={input.trim() ? '#fff' : theme.textMuted} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Image hint */}
          <Text style={[styles.imageHint, { color: theme.textMuted }]}>
            📷 Send a food photo — coach will estimate calories & macros
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* ── PERSONALITY MODAL ───────────────────────────────── */}
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
            <Text style={[styles.modalSub, { color: theme.textMuted }]}>Choose how your CalFit Coach speaks to you. Takes effect on your next message.</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.personalityList}>
              {PERSONALITIES.map((p) => (
                <TouchableOpacity key={p.id} onPress={() => { setCoachPersonality(p.id as any); setShowPersonality(false); }} activeOpacity={0.8}
                  style={[styles.personalityCard, {
                    backgroundColor: coachPersonality === p.id ? p.color + '18' : theme.bg,
                    borderColor: coachPersonality === p.id ? p.color : theme.border,
                    borderWidth: coachPersonality === p.id ? 2 : 1,
                  }]}>
                  <Text style={styles.pEmoji}>{p.emoji}</Text>
                  <View style={styles.pInfo}>
                    <Text style={[styles.pName, { color: coachPersonality === p.id ? p.color : theme.textPrimary }]}>{p.name}</Text>
                    <Text style={[styles.pDesc, { color: theme.textMuted }]}>{p.description}</Text>
                  </View>
                  {coachPersonality === p.id && <Ionicons name="checkmark-circle" size={22} color={p.color} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, justifyContent: 'center' },
  coachAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, flexShrink: 0 },
  coachAvatarEmoji: { fontSize: 20 },
  coachName: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineSub: { fontSize: fontSize.xs, fontWeight: '600' },
  personalityBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  personalityEmoji: { fontSize: 18 },

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
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  chipText: { fontSize: fontSize.xs, fontWeight: '500' },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  mediaBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  inputField: { flex: 1, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100 },
  inputText: { fontSize: fontSize.base, lineHeight: 22 },
  sendBtnWrap: { borderRadius: 20, overflow: 'hidden', flexShrink: 0 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  imageHint: { fontSize: fontSize.xs, textAlign: 'center', paddingBottom: spacing.sm },

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