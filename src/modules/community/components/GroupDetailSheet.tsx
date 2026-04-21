import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, FlatList, Alert,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { GroupData } from '../services/groupService';
import { supabase } from '../../../services/supabase';

type Tab = 'Workouts' | 'Members' | 'Chat';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface GroupWorkout {
  id: string;
  group_id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: Difficulty;
  created_by: string;
  completed_by: string[];
}

interface GroupMember {
  user_id: string;
  role: string;
  full_name: string;
  calfit_id: string;
  avatar_url: string | null;
  streak_count: number;
}

interface GroupMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  sender_calfit_id: string;
}

interface Props {
  group: GroupData;
  theme: typeof colors.dark;
  visible: boolean;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}

// ── GROUP WORKOUT CARD ────────────────────────────────────────
function WorkoutCard({
  workout,
  theme,
  isOwner,
  currentUserId,
  onComplete,
  onDelete,
}: {
  workout: GroupWorkout;
  theme: typeof colors.dark;
  isOwner: boolean;
  currentUserId: string;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const isCompleted = workout.completed_by?.includes(currentUserId);
  const diffColor = {
    beginner: theme.accent,
    intermediate: (theme as any).orange,
    advanced: (theme as any).red,
  }[workout.difficulty];

  return (
    <View style={[styles.workoutCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <View style={styles.workoutCardTop}>
        <View style={styles.workoutCardInfo}>
          <Text style={[styles.workoutName, { color: theme.textPrimary }]}>{workout.name}</Text>
          <Text style={[styles.workoutDesc, { color: theme.textMuted }]} numberOfLines={2}>
            {workout.description}
          </Text>
          <View style={styles.workoutMeta}>
            <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
              <Text style={[styles.diffText, { color: diffColor }]}>
                {workout.difficulty}
              </Text>
            </View>
            <Text style={[styles.workoutDuration, { color: theme.textMuted }]}>
              ⏱ {workout.duration}
            </Text>
            <Text style={[styles.completedCount, { color: theme.textMuted }]}>
              ✅ {workout.completed_by?.length ?? 0} done
            </Text>
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={16} color={(theme as any).red} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        onPress={onComplete}
        disabled={isCompleted}
        style={[styles.completeBtn, {
          backgroundColor: isCompleted ? theme.card : theme.accent,
          borderColor: isCompleted ? theme.border : theme.accent,
        }]}
      >
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'play-circle-outline'}
          size={16}
          color={isCompleted ? theme.textMuted : theme.bg}
        />
        <Text style={[styles.completeBtnText, {
          color: isCompleted ? theme.textMuted : theme.bg,
        }]}>
          {isCompleted ? 'Completed' : 'Mark Complete'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export function GroupDetailSheet({
  group,
  theme,
  visible,
  currentUserId,
  currentUserName,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Workouts');

  // ── Workouts state ─────────────────────────────────────────
  const [workouts, setWorkouts] = useState<GroupWorkout[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDesc, setWorkoutDesc] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutDifficulty, setWorkoutDifficulty] = useState<Difficulty>('beginner');
  const [savingWorkout, setSavingWorkout] = useState(false);

  // ── Members state ──────────────────────────────────────────
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // ── Chat state ─────────────────────────────────────────────
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible) return;
    loadWorkouts();
    loadMembers();
    loadMessages();

    // Subscribe to real-time group messages
    const channel = supabase
      .channel(`group_chat_${group.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${group.id}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, calfit_id')
            .eq('id', msg.user_id)
            .single();

          const newMsg: GroupMessage = {
            id: msg.id,
            user_id: msg.user_id,
            content: msg.content,
            created_at: msg.created_at,
            sender_name: profile?.full_name ?? 'CalFit User',
            sender_calfit_id: profile?.calfit_id ?? '',
          };
          setMessages((prev) => [...prev, newMsg]);
          setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visible, group.id]);

  // ── Load workouts from Supabase ────────────────────────────
  const loadWorkouts = async () => {
    setLoadingWorkouts(true);
    const { data, error } = await supabase
      .from('group_workouts')
      .select('*')
      .eq('group_id', group.id)
      .order('created_at', { ascending: true });

    if (!error && data) setWorkouts(data as any[]);
    setLoadingWorkouts(false);
  };

  // ── Load members ───────────────────────────────────────────
  const loadMembers = async () => {
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        user_id, role,
        profiles:user_id (full_name, calfit_id, avatar_url, streak_count)
      `)
      .eq('group_id', group.id);

    if (!error && data) {
      setMembers(
        (data as any[]).map((m) => ({
          user_id: m.user_id,
          role: m.role,
          full_name: m.profiles?.full_name ?? 'CalFit User',
          calfit_id: m.profiles?.calfit_id ?? '',
          avatar_url: m.profiles?.avatar_url ?? null,
          streak_count: m.profiles?.streak_count ?? 0,
        }))
      );
    }
    setLoadingMembers(false);
  };

  // ── Load group chat messages ───────────────────────────────
  const loadMessages = async () => {
    setLoadingChat(true);
    const { data, error } = await supabase
      .from('group_messages')
      .select(`
        id, user_id, content, created_at,
        profiles:user_id (full_name, calfit_id)
      `)
      .eq('group_id', group.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(
        (data as any[]).map((m) => ({
          id: m.id,
          user_id: m.user_id,
          content: m.content,
          created_at: m.created_at,
          sender_name: m.profiles?.full_name ?? 'CalFit User',
          sender_calfit_id: m.profiles?.calfit_id ?? '',
        }))
      );
    }
    setLoadingChat(false);
    setTimeout(() => chatListRef.current?.scrollToEnd({ animated: false }), 200);
  };

  // ── Add workout ────────────────────────────────────────────
  const handleAddWorkout = async () => {
    if (!workoutName.trim()) return;
    setSavingWorkout(true);
    const { data, error } = await supabase
      .from('group_workouts')
      .insert({
        group_id: group.id,
        name: workoutName.trim(),
        description: workoutDesc.trim(),
        duration: workoutDuration.trim() || '30 min',
        difficulty: workoutDifficulty,
        created_by: currentUserId,
        completed_by: [],
      })
      .select()
      .single();

    if (!error && data) {
      setWorkouts((prev) => [...prev, data as any]);
      setWorkoutName('');
      setWorkoutDesc('');
      setWorkoutDuration('');
      setWorkoutDifficulty('beginner');
      setShowAddWorkout(false);
    }
    setSavingWorkout(false);
  };

  // ── Complete workout ───────────────────────────────────────
  const handleComplete = async (workoutId: string) => {
    const workout = workouts.find((w) => w.id === workoutId);
    if (!workout) return;
    if (workout.completed_by?.includes(currentUserId)) return;

    const updatedCompleted = [...(workout.completed_by ?? []), currentUserId];
    const { error } = await supabase
      .from('group_workouts')
      .update({ completed_by: updatedCompleted })
      .eq('id', workoutId);

    if (!error) {
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === workoutId ? { ...w, completed_by: updatedCompleted } : w
        )
      );
    }
  };

  // ── Delete workout ─────────────────────────────────────────
  const handleDeleteWorkout = (workoutId: string) => {
    Alert.alert('Delete Workout', 'Remove this workout from the group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('group_workouts').delete().eq('id', workoutId);
          setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
        },
      },
    ]);
  };

  // ── Send chat message ──────────────────────────────────────
  const handleSendMessage = async () => {
    const content = chatInput.trim();
    if (!content) return;
    setSendingMsg(true);
    setChatInput('');

    await supabase.from('group_messages').insert({
      group_id: group.id,
      user_id: currentUserId,
      content,
    });
    // Real-time subscription handles adding to messages list
    setSendingMsg(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const tabs: Tab[] = ['Workouts', 'Members', 'Chat'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismiss} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          {/* ── Header ────────────────────────────────────── */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <Text style={styles.groupEmoji}>{group.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {group.name}
                </Text>
                <Text style={[styles.groupMeta, { color: theme.textMuted }]}>
                  {group.member_count} member{group.member_count !== 1 ? 's' : ''} · 🔥 {group.streak}d streak
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Tabs ──────────────────────────────────────── */}
          <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && {
                  borderBottomWidth: 2,
                  borderBottomColor: theme.accent,
                }]}
              >
                <Text style={[styles.tabText, {
                  color: activeTab === tab ? theme.accent : theme.textMuted,
                  fontWeight: activeTab === tab ? '700' : '400',
                }]}>
                  {tab}
                  {tab === 'Members' ? ` (${group.member_count})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── WORKOUTS TAB ───────────────────────────────── */}
          {activeTab === 'Workouts' && (
            <ScrollView
              style={styles.tabContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Add workout form — owners only */}
              {group.is_owner && (
                <TouchableOpacity
                  onPress={() => setShowAddWorkout(!showAddWorkout)}
                  style={[styles.addWorkoutBtn, {
                    backgroundColor: theme.accentDim as string,
                    borderColor: theme.accent,
                  }]}
                >
                  <Ionicons name={showAddWorkout ? 'chevron-up' : 'add'} size={16} color={theme.accent} />
                  <Text style={[styles.addWorkoutBtnText, { color: theme.accent }]}>
                    {showAddWorkout ? 'Cancel' : 'Add Workout'}
                  </Text>
                </TouchableOpacity>
              )}

              {showAddWorkout && group.is_owner && (
                <View style={[styles.addForm, { backgroundColor: theme.bg, borderColor: theme.accent }]}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Workout name *</Text>
                  <View style={[styles.formInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TextInput
                      value={workoutName}
                      onChangeText={setWorkoutName}
                      placeholder="e.g. 20-min HIIT Circuit"
                      placeholderTextColor={theme.textMuted}
                      style={[styles.formInputText, { color: theme.textPrimary }]}
                      autoFocus
                    />
                  </View>

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Description</Text>
                  <View style={[styles.formInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TextInput
                      value={workoutDesc}
                      onChangeText={setWorkoutDesc}
                      placeholder="Describe the workout..."
                      placeholderTextColor={theme.textMuted}
                      style={[styles.formInputText, { color: theme.textPrimary }]}
                      multiline
                    />
                  </View>

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Duration</Text>
                  <View style={[styles.formInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TextInput
                      value={workoutDuration}
                      onChangeText={setWorkoutDuration}
                      placeholder="e.g. 30 min"
                      placeholderTextColor={theme.textMuted}
                      style={[styles.formInputText, { color: theme.textPrimary }]}
                    />
                  </View>

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Difficulty</Text>
                  <View style={styles.diffRow}>
                    {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => setWorkoutDifficulty(d)}
                        style={[styles.diffPill, {
                          backgroundColor: workoutDifficulty === d ? theme.accent : theme.card,
                          borderColor: workoutDifficulty === d ? theme.accent : theme.border,
                        }]}
                      >
                        <Text style={[styles.diffPillText, {
                          color: workoutDifficulty === d ? theme.bg : theme.textSecondary,
                        }]}>
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={handleAddWorkout}
                    disabled={savingWorkout || !workoutName.trim()}
                    style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                  >
                    {savingWorkout
                      ? <ActivityIndicator color={theme.bg} />
                      : <Text style={[styles.saveBtnText, { color: theme.bg }]}>Add Workout</Text>
                    }
                  </TouchableOpacity>
                </View>
              )}

              {loadingWorkouts ? (
                <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.xl }} />
              ) : workouts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="barbell-outline" size={32} color={theme.textMuted} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    {group.is_owner
                      ? 'Add your first group workout above.'
                      : 'No workouts added yet. Check back soon.'}
                  </Text>
                </View>
              ) : (
                workouts.map((w) => (
                  <WorkoutCard
                    key={w.id}
                    workout={w}
                    theme={theme}
                    isOwner={group.is_owner ?? false}
                    currentUserId={currentUserId}
                    onComplete={() => handleComplete(w.id)}
                    onDelete={() => handleDeleteWorkout(w.id)}
                  />
                ))
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* ── MEMBERS TAB ────────────────────────────────── */}
          {activeTab === 'Members' && (
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
              {loadingMembers ? (
                <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.xl }} />
              ) : members.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={32} color={theme.textMuted} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>No members yet</Text>
                </View>
              ) : (
                members.map((m) => (
                  <View
                    key={m.user_id}
                    style={[styles.memberRow, { borderBottomColor: theme.border }]}
                  >
                    <View style={[styles.memberAvatar, { backgroundColor: theme.accentDim as string }]}>
                      <Text style={[styles.memberAvatarText, { color: theme.accent }]}>
                        {(m.full_name || 'C').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={[styles.memberName, { color: theme.textPrimary }]}>
                          {m.full_name}
                        </Text>
                        {m.role === 'creator' && (
                          <View style={[styles.ownerBadge, {
                            backgroundColor: theme.accent + '22',
                            borderColor: theme.accent,
                          }]}>
                            <Text style={[styles.ownerBadgeText, { color: theme.accent }]}>Owner</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.memberCalfitId, { color: theme.textMuted }]}>
                        @{m.calfit_id}
                      </Text>
                    </View>
                    <View style={styles.memberStreak}>
                      <Text style={{ fontSize: 12 }}>🔥</Text>
                      <Text style={[styles.memberStreakText, { color: theme.accent }]}>
                        {m.streak_count}
                      </Text>
                    </View>
                  </View>
                ))
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* ── CHAT TAB ───────────────────────────────────── */}
          {activeTab === 'Chat' && (
            <View style={styles.chatContainer}>
              {loadingChat ? (
                <View style={styles.chatLoading}>
                  <ActivityIndicator color={theme.accent} />
                </View>
              ) : (
                <FlatList
                  ref={chatListRef}
                  data={messages}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.chatList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Ionicons name="chatbubbles-outline" size={32} color={theme.textMuted} />
                      <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                        No messages yet. Say hello! 👋
                      </Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const isMe = item.user_id === currentUserId;
                    return (
                      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                        {!isMe && (
                          <View style={[styles.msgAvatar, { backgroundColor: theme.accentDim as string }]}>
                            <Text style={[styles.msgAvatarText, { color: theme.accent }]}>
                              {(item.sender_name || 'C').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={[
                          styles.msgBubble,
                          {
                            backgroundColor: isMe ? theme.accent : theme.bg,
                            borderColor: isMe ? theme.accent : theme.border,
                          },
                        ]}>
                          {!isMe && (
                            <Text style={[styles.msgSender, { color: theme.accent }]}>
                              {item.sender_name}
                            </Text>
                          )}
                          <Text style={[styles.msgContent, {
                            color: isMe ? theme.bg : theme.textPrimary,
                          }]}>
                            {item.content}
                          </Text>
                          <Text style={[styles.msgTime, {
                            color: isMe ? theme.bg + 'AA' : theme.textMuted,
                          }]}>
                            {formatTime(item.created_at)}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                />
              )}

              {/* Chat input */}
              <View style={[styles.chatInputRow, {
                backgroundColor: theme.card,
                borderTopColor: theme.border,
              }]}>
                <View style={[styles.chatInput, {
                  backgroundColor: theme.bg,
                  borderColor: theme.border,
                }]}>
                  <TextInput
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Message the group..."
                    placeholderTextColor={theme.textMuted}
                    style={[styles.chatInputText, { color: theme.textPrimary }]}
                    multiline
                    maxLength={500}
                    returnKeyType="send"
                    onSubmitEditing={handleSendMessage}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={sendingMsg || !chatInput.trim()}
                  style={[styles.sendBtn, {
                    backgroundColor: chatInput.trim() ? theme.accent : theme.border,
                  }]}
                >
                  {sendingMsg
                    ? <ActivityIndicator size="small" color={theme.bg} />
                    : <Ionicons name="send" size={18} color={theme.bg} />
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  dismiss: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '92%',
    minHeight: '60%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  groupEmoji: { fontSize: 28 },
  groupName: { fontSize: fontSize.lg, fontWeight: '700' },
  groupMeta: { fontSize: fontSize.xs, marginTop: 2 },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabText: { fontSize: fontSize.sm },

  tabContent: { flex: 1, padding: spacing.lg },

  // Workouts
  addWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  addWorkoutBtnText: { fontSize: fontSize.base, fontWeight: '700' },

  addForm: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    marginBottom: spacing.md,
    gap: 4,
  },
  formLabel: { fontSize: fontSize.xs, fontWeight: '600', marginTop: spacing.sm },
  formInput: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  formInputText: { fontSize: fontSize.base },
  diffRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  diffPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  diffPillText: { fontSize: fontSize.xs, fontWeight: '600' },
  saveBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { fontSize: fontSize.base, fontWeight: '700' },

  workoutCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  workoutCardTop: { flexDirection: 'row', gap: spacing.sm },
  workoutCardInfo: { flex: 1 },
  workoutName: { fontSize: fontSize.base, fontWeight: '700' },
  workoutDesc: { fontSize: fontSize.sm, lineHeight: 18, marginTop: 2 },
  workoutMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs, flexWrap: 'wrap' },
  diffBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.xs },
  diffText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  workoutDuration: { fontSize: fontSize.xs },
  completedCount: { fontSize: fontSize.xs },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  completeBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: { fontSize: fontSize.sm, textAlign: 'center', maxWidth: 220 },

  // Members
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontSize: fontSize.lg, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberName: { fontSize: fontSize.base, fontWeight: '600' },
  memberCalfitId: { fontSize: fontSize.xs, marginTop: 2 },
  memberStreak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  memberStreakText: { fontSize: fontSize.sm, fontWeight: '700' },
  ownerBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  ownerBadgeText: { fontSize: 9, fontWeight: '700' },

  // Chat
  chatContainer: { flex: 1 },
  chatLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chatList: { padding: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  msgRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  msgAvatarText: { fontSize: fontSize.sm, fontWeight: '700' },
  msgBubble: {
    maxWidth: '75%',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
  },
  msgSender: { fontSize: 10, fontWeight: '700' },
  msgContent: { fontSize: fontSize.base, lineHeight: 20 },
  msgTime: { fontSize: 9, alignSelf: 'flex-end', marginTop: 2 },

  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  chatInputText: { fontSize: fontSize.base },
  sendBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});