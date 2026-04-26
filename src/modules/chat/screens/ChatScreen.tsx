import {
  View, StyleSheet, Text, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, fontSize, radius } from '../../../theme';
import { MessageBubble } from '../components/MessageBubble';
import { UserAvatar } from '../../shared/UserAvatar';
import { ProgressSnapshot } from '../components/progressSnapshot';
import { useChat } from '../hooks/useChat';

// Prefix so message bubbles can detect image messages vs plain text
const IMAGE_PREFIX = '__IMAGE__:';

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();
  const { colorScheme } = useThemeStore();
  const { user }   = useAuthStore();
  const theme      = colors[colorScheme];

  const {
    conversationId, otherUserName, otherUserCalfitId,
    otherUserAvatar, otherUserGoal, otherUserStreak,
  } = route.params ?? {};

  const { messages, isLoading, send } = useChat(conversationId, user?.id ?? '');
  const [inputText, setInputText]     = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Send plain text
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    await send(text);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Send image — stores URI with prefix so bubble renders it as <Image>
  const sendImageUri = async (uri: string) => {
    await send(`${IMAGE_PREFIX}${uri}`);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSendImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to send images.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled) await sendImageUri(result.assets[0].uri);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) await sendImageUri(result.assets[0].uri);
  };

  const handleAudioCall = () =>
    Alert.alert('Audio Call', `Calling ${otherUserName}...\n\nAudio calling requires microphone permission and will be fully enabled in Settings once you're ready to test it.`);

  const handleVideoCall = () =>
    Alert.alert('Video Call', `Video calling ${otherUserName}...\n\nVideo calling requires camera permission and will be fully enabled in Settings once you're ready to test it.`);

  const handleVoiceRecord = () =>
    Alert.alert('Voice Message', 'Voice messages are coming soon. Hold to record when the feature is enabled.');

  // Render each message — detects image vs text
  const renderMessage = (msg: any) => {
    const isMe    = msg.sender_id === user?.id;
    const isImage = typeof msg.content === 'string' && msg.content.startsWith(IMAGE_PREFIX);
    const imgUri  = isImage ? msg.content.replace(IMAGE_PREFIX, '') : null;
    const time    = formatTime(msg.created_at);

    if (isImage && imgUri) {
      return (
        <View key={msg.id} style={[styles.bubbleWrap, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <View style={[styles.imageBubble, { backgroundColor: isMe ? theme.accent : theme.card, borderColor: theme.border }]}>
            <Image source={{ uri: imgUri }} style={styles.bubbleImage} resizeMode="cover" />
            <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.65)' : theme.textMuted }]}>{time}</Text>
          </View>
        </View>
      );
    }

    return (
      <View key={msg.id} style={styles.bubbleWrap}>
        <MessageBubble content={msg.content} time={time} isMe={isMe} theme={theme} />
      </View>
    );
  };

  return (
    // paddingTop from insets directly on the root View — no AndroidSafeView
    // so there's no double safe area gap at the top
    <View style={[styles.safe, { backgroundColor: theme.bg, paddingTop: insets.top }]}>

      {/* Header */}
      <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <UserAvatar uri={otherUserAvatar} name={otherUserName ?? 'User'} size={36} theme={theme} />
          <View>
            <Text style={styles.headerName}>{otherUserName}</Text>
            <Text style={styles.headerId}>@{otherUserCalfitId}</Text>
          </View>
        </View>

        <View style={styles.callBtns}>
          <TouchableOpacity onPress={handleAudioCall} activeOpacity={0.8} style={styles.callBtn}>
            <Ionicons name="call-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleVideoCall} activeOpacity={0.8} style={styles.callBtn}>
            <Ionicons name="videocam-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Progress snapshot */}
      <ProgressSnapshot
        theme={theme} name={otherUserName ?? 'User'} calfitId={otherUserCalfitId ?? ''}
        goal={otherUserGoal ?? ''} streakCount={otherUserStreak ?? 0} avatarUrl={otherUserAvatar}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        {isLoading ? (
          <View style={styles.loading}><ActivityIndicator color={theme.accent} /></View>
        ) : (
          <ScrollView ref={scrollRef} style={styles.messageList} contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {messages.length === 0 && (
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubbles-outline" size={40} color={theme.textMuted} />
                <Text style={[styles.emptyChatText, { color: theme.textMuted }]}>
                  Start a conversation about workouts and goals!
                </Text>
              </View>
            )}
            {messages.map(renderMessage)}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, {
          backgroundColor: theme.bg, borderTopColor: theme.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
        }]}>
          {/* Camera */}
          <TouchableOpacity onPress={handleCamera} activeOpacity={0.8}
            style={[styles.mediaBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="camera-outline" size={20} color={theme.accent} />
          </TouchableOpacity>

          {/* Gallery */}
          <TouchableOpacity onPress={handleSendImage} activeOpacity={0.8}
            style={[styles.mediaBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="image-outline" size={20} color={theme.accent} />
          </TouchableOpacity>

          {/* Text input */}
          <View style={[styles.textInputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message about workouts and goals..."
              placeholderTextColor={theme.textMuted}
              style={[styles.textInput, { color: theme.textPrimary }]}
              multiline
              maxLength={500}
              blurOnSubmit={false}
            />
          </View>

          {/* Voice */}
          <TouchableOpacity onPress={handleVoiceRecord} activeOpacity={0.8}
            style={[styles.mediaBtn, {
              backgroundColor: isRecording ? theme.gradStart + '22' : theme.card,
              borderColor: isRecording ? theme.gradStart : theme.border,
            }]}>
            <Ionicons name={isRecording ? 'stop-circle' : 'mic-outline'} size={20}
              color={isRecording ? theme.gradStart : theme.accent} />
          </TouchableOpacity>

          {/* ── SEND BUTTON ────────────────────────────────── */}
          <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()}
            activeOpacity={0.85} style={styles.sendBtnWrap}>
            <LinearGradient
              colors={inputText.trim()
                ? [theme.accent, '#0A9A5E'] as [string, string]
                : [theme.border, theme.border] as [string, string]}
              style={styles.sendBtn}
            >
              <Ionicons name="send" size={18} color={inputText.trim() ? '#fff' : theme.textMuted} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  backBtn: { width: 36 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, justifyContent: 'center' },
  headerName: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  headerId: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)' },
  callBtns: { flexDirection: 'row', gap: spacing.sm },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { flex: 1 },
  messageListContent: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  emptyChat: { alignItems: 'center', paddingVertical: 60, gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyChatText: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },

  bubbleWrap: { marginBottom: spacing.xs },
  bubbleMe: { alignItems: 'flex-end' },
  bubbleThem: { alignItems: 'flex-start' },
  imageBubble: { maxWidth: '75%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, padding: 4 },
  bubbleImage: { width: 220, height: 165, borderRadius: 12 },
  bubbleTime: { fontSize: fontSize.xs, paddingHorizontal: 6, paddingTop: 4, textAlign: 'right' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, gap: spacing.xs,
  },
  mediaBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  textInputWrap: { flex: 1, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100, minHeight: 38, justifyContent: 'center' },
  textInput: { fontSize: fontSize.base, lineHeight: 20 },
  sendBtnWrap: { flexShrink: 0, borderRadius: 19, overflow: 'hidden' },
  sendBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
});