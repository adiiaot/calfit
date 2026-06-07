import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { sendInstantNotification } from '../../../services/reminderService';
import { notifyPartnerMessage } from '../../../services/notificationService';
import {
  sendMessage, sendMediaMessage, loadMessages, subscribeToMessages,
  markAsRead, uploadMedia, ChatMessage, MessageType,
} from '../services/PartnerChatService';

type RouteParams = { PartnerChat: { partnerId: string; partnerName: string } };

export default function PartnerChatScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RouteParams, 'PartnerChat'>>();
  const navigation = useNavigation();
  const { partnerId, partnerName } = route.params;
  const { colorScheme } = useThemeStore();
  const { user } = useAuthStore();
  const theme = colors[colorScheme];
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio playback
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setIsLoading(true);
      const msgs = await loadMessages(user.id, partnerId);
      setMessages(msgs);
      await markAsRead(user.id, partnerId);
      setIsLoading(false);
    };
    init();
    const cleanup = subscribeToMessages(user.id, partnerId, (msg) => {
      setMessages(prev => [...prev, msg]);
      if (user) {
        markAsRead(user.id, partnerId);
        notifyPartnerMessage(user.id, partnerName, msg.message_type);
        sendInstantNotification(partnerName, getNotifBody(msg), { type: 'partner', partnerId });
      }
    });
    return cleanup;
  }, [user, partnerId]);

  const getNotifBody = (msg: ChatMessage) => {
    const labels: Record<string, string> = { text: msg.message, image: '📷 Sent a photo', video: '🎥 Sent a video', audio: '🎤 Sent a voice note' };
    return labels[msg.message_type] ?? 'Sent a message';
  };

  const handleSendText = async () => {
    if (!input.trim() || !user || isSending) return;
    setIsSending(true);
    const text = input.trim();
    setInput('');

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`, sender_id: user.id, receiver_id: partnerId,
      message: text, message_type: 'text', created_at: new Date().toISOString(), read: false,
    };
    setMessages(prev => [...prev, tempMsg]);

    const result = await sendMessage(user.id, partnerId, text);
    if (!result.success) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInput(text);
    }
    setIsSending(false);
  };

  const pickImage = async () => {
    setShowAttach(false);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.7 });
    if (!result.canceled && result.assets[0] && user) {
      const asset = result.assets[0];
      const fileType: MessageType = asset.type === 'video' ? 'video' : 'image';
      await sendMedia(user.id, partnerId, asset.uri, fileType);
    }
  };

  const takePhoto = async () => {
    setShowAttach(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Camera access required to take photos.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0] && user) {
      await sendMedia(user.id, partnerId, result.assets[0].uri, 'image');
    }
  };

  const sendMedia = async (senderId: string, receiverId: string, uri: string, fileType: MessageType) => {
    setIsSending(true);
    const url = await uploadMedia(senderId, uri, fileType as 'image' | 'video' | 'audio');
    if (!url) {
      Alert.alert(
        'Upload failed',
        'Could not upload media. Make sure the "partner-media" storage bucket exists in Supabase Dashboard → Storage with RLS policies allowing authenticated uploads.',
        [{ text: 'OK' }]
      );
      setIsSending(false);
      return;
    }
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`, sender_id: senderId, receiver_id: receiverId,
      message: '', message_type: fileType, media_url: url, created_at: new Date().toISOString(), read: false,
    };
    setMessages(prev => [...prev, tempMsg]);
    await sendMediaMessage(senderId, receiverId, fileType, url);
    setIsSending(false);
  };

  const startRecording = async () => {
    setShowAttach(false);
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission needed', 'Microphone access required to record voice notes.'); return; }
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      recordTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch (e) { console.error('startRecording error:', e); }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || !user) return;
    try {
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (uri) await sendMedia(user.id, partnerId, uri, 'audio');
    } catch (e) { console.error('stopRecording error:', e); }
  };

  const playAudio = async (url: string) => {
    try {
      if (playingAudio === url && soundRef.current) {
        await soundRef.current.stopAsync();
        setPlayingAudio(null);
        return;
      }
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingAudio(url);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setPlayingAudio(null);
      });
    } catch (e: any) {
      console.error('playAudio error:', e?.message || e);
      const msg = (e?.message || '').includes('-1008')
        ? 'Audio file not found. The upload may have failed — check Supabase Storage bucket "partner-media" has correct RLS policies.'
        : 'Could not play this audio. The file may not have uploaded properly.';
      Alert.alert('Playback Error', msg);
    }
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const { cacheDirectory, downloadAsync } = await import('expo-file-system/legacy');
      const { shareAsync, isAvailableAsync } = await import('expo-sharing');
      const ext = url.split('.').pop() || 'jpg';
      const localUri = `${cacheDirectory}${fileName}.${ext}`;
      const result = await downloadAsync(url, localUri);
      if (await isAvailableAsync()) {
        await shareAsync(result.uri);
      } else {
        Alert.alert('Downloaded', `File saved to: ${result.uri}`);
      }
    } catch (e) {
      console.error('downloadFile error:', e);
      Alert.alert('Download Failed', 'Could not download this file.');
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.sender_id === user?.id;
    const isPlaying = playingAudio === item.media_url;
    return (
      <View style={[msg.row, isMine && msg.rowMine]}>
        <View style={[msg.bubble, isMine ? msg.bubbleMine : msg.bubbleTheir]}>
          {item.message_type === 'image' && item.media_url && (
            <TouchableOpacity onLongPress={() => downloadFile(item.media_url!, 'image')} activeOpacity={0.9}>
              <Image source={{ uri: item.media_url }} style={msg.mediaImage} resizeMode="cover" />
              <View style={msg.downloadOverlay}>
                <Ionicons name="download-outline" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
          {item.message_type === 'video' && item.media_url && (
            <TouchableOpacity onPress={() => downloadFile(item.media_url!, 'video')}
              onLongPress={() => downloadFile(item.media_url!, 'video')}
              style={msg.videoPreview}>
              <Ionicons name="play-circle" size={32} color="#fff" />
              <Text style={msg.videoLabel}>Tap to download video</Text>
            </TouchableOpacity>
          )}
          {item.message_type === 'audio' && item.media_url && (
            <TouchableOpacity onPress={() => playAudio(item.media_url!)}
              onLongPress={() => downloadFile(item.media_url!, 'audio')}
              style={msg.audioRow}>
              <View style={[msg.audioBtn, { backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }]}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color="#fff" />
              </View>
              <View style={msg.audioWave}>
                {[0, 1, 2, 3, 4].map(i => (
                  <View key={i} style={[msg.audioWaveBar, {
                    backgroundColor: isMine ? '#fff' : theme.textMuted,
                    height: isPlaying ? 16 + Math.sin(Date.now() / 200 + i) * 8 : 12 + i * 3,
                    opacity: isPlaying ? 0.8 : 0.5,
                  }]} />
                ))}
              </View>
              <Text style={[msg.audioDuration, { color: isMine ? 'rgba(255,255,255,0.6)' : theme.textMuted }]}>
                {item.media_duration ? formatDuration(item.media_duration) : '0:05'}
              </Text>
            </TouchableOpacity>
          )}
          {item.message && (
            <Text style={[msg.text, { color: isMine ? '#fff' : theme.textPrimary }]}>{item.message}</Text>
          )}
          <Text style={[msg.time, { color: isMine ? 'rgba(255,255,255,0.6)' : theme.textMuted }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
    >
      <View style={[styles.header, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: theme.textPrimary }]}>{partnerName}</Text>
          <Text style={[styles.headerStatus, { color: theme.textMuted }]}>Accountability Partner</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={theme.accent} size="large" /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No messages yet</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Send a message to {partnerName} to get started</Text>
            </View>
          }
          ListHeaderComponent={
            messages.length > 0 ? (
              <View style={styles.dateHeader}>
                <Text style={[styles.dateText, { color: theme.textMuted }]}>{formatDate(messages[0].created_at)}</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Recording indicator */}
      {isRecording && (
        <View style={[styles.recordingBar, { backgroundColor: '#FF5959' }]}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording {formatDuration(recordingDuration)}</Text>
          <TouchableOpacity onPress={stopRecording} style={styles.recordingStop}>
            <Ionicons name="stop" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Attachment menu */}
      {showAttach && (
        <View style={[styles.attachMenu, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TouchableOpacity onPress={takePhoto} style={styles.attachOption}>
            <View style={[styles.attachIcon, { backgroundColor: '#FF6B35' + '22' }]}>
              <Ionicons name="camera" size={20} color="#FF6B35" />
            </View>
            <Text style={[styles.attachLabel, { color: theme.textPrimary }]}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={styles.attachOption}>
            <View style={[styles.attachIcon, { backgroundColor: '#4A90E2' + '22' }]}>
              <Ionicons name="images" size={20} color="#4A90E2" />
            </View>
            <Text style={[styles.attachLabel, { color: theme.textPrimary }]}>Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, {
        backgroundColor: theme.card,
        borderTopColor: theme.border,
        paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.sm,
      }]}>
        <TouchableOpacity onPress={() => setShowAttach(v => !v)} style={[styles.attachBtn, { backgroundColor: showAttach ? theme.accent + '22' : 'transparent' }]}>
          <Ionicons name="add-circle" size={24} color={showAttach ? theme.accent : theme.textMuted} />
        </TouchableOpacity>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`Message ${partnerName}...`}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.bg }]}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSendText}
        />
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.micBtn, { backgroundColor: isRecording ? '#FF5959' + '22' : 'transparent' }]}
        >
          <Ionicons name={isRecording ? 'stop-circle' : 'mic'} size={20} color={isRecording ? '#FF5959' : theme.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSendText}
          disabled={!input.trim() || isSending}
          style={[styles.sendBtn, { backgroundColor: input.trim() ? theme.accent : theme.border }]}
        >
          <Ionicons name="send" size={18} color={input.trim() ? '#fff' : theme.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const msg = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.sm, paddingHorizontal: spacing.lg },
  rowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.lg, overflow: 'hidden' },
  bubbleMine: { backgroundColor: '#2DDC8C', borderBottomRightRadius: 4 },
  bubbleTheir: { backgroundColor: '#1A1D26', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  text: { fontSize: fontSize.base, lineHeight: 20 },
  time: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  mediaImage: { width: 200, height: 160, borderRadius: 10, marginBottom: 4 },
  downloadOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  videoPreview: { width: 200, height: 140, borderRadius: 10, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  videoLabel: { color: '#fff', fontSize: 11, marginTop: 4 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 160, marginBottom: 4 },
  audioBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  audioWave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3, height: 28 },
  audioWaveBar: { width: 3, borderRadius: 2 },
  audioDuration: { fontSize: 10 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: fontSize.lg, fontWeight: '800' },
  headerStatus: { fontSize: fontSize.xs },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chatList: { paddingVertical: spacing.md, paddingBottom: spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  emptySub: { fontSize: fontSize.base, textAlign: 'center', paddingHorizontal: spacing.xxl },
  dateHeader: { alignItems: 'center', marginBottom: spacing.md },
  dateText: { fontSize: fontSize.xs, fontWeight: '600' },
  recordingBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  recordingText: { flex: 1, color: '#fff', fontSize: fontSize.sm, fontWeight: '600' },
  recordingStop: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  attachMenu: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderTopWidth: 1 },
  attachOption: { alignItems: 'center', gap: spacing.xs },
  attachIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  attachLabel: { fontSize: fontSize.xs, fontWeight: '600' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: 1 },
  attachBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100, fontSize: fontSize.base },
  micBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
