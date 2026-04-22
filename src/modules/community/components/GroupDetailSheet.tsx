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
  id: string; group_id: string; name: string; description: string;
  duration: string; difficulty: Difficulty; created_by: string;
  completed_by: string[]; category?: string; calories_per_minute?: number;
}
interface CatalogueExercise {
  id: string; name: string; category: string; calories_per_minute: number;
}
interface GroupMember {
  user_id: string; role: string; full_name: string;
  calfit_id: string; streak_count: number;
}
interface GroupMessage {
  id: string; user_id: string; content: string;
  created_at: string; sender_name: string; sender_calfit_id: string;
}
interface Props {
  group: GroupData; theme: typeof colors.dark; visible: boolean;
  currentUserId: string; currentUserName: string; onClose: () => void;
}

const CATEGORIES = ['All','Cardio','Chest','Back','Core','Legs','Shoulders','Arms','Flexibility'];

// ── EXERCISE PICKER ───────────────────────────────────────────
function ExercisePickerModal({ theme, visible, groupId, currentUserId, onClose, onAdded }: {
  theme: typeof colors.dark; visible: boolean; groupId: string;
  currentUserId: string; onClose: () => void; onAdded: (w: GroupWorkout) => void;
}) {
  const [exercises, setExercises] = useState<CatalogueExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selected, setSelected] = useState<CatalogueExercise | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [duration, setDuration] = useState('30 min');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) load(); }, [visible]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('exercises')
      .select('id, name, category, calories_per_minute').order('category');
    if (data) setExercises(data as CatalogueExercise[]);
    setLoading(false);
  };

  const filtered = activeCategory === 'All'
    ? exercises : exercises.filter(e => e.category === activeCategory);

  const handleAdd = async () => {
    if (!selected) return;
    setSaving(true);
    const description = `${sets} sets × ${reps} reps · ${selected.category}`;
    const { data, error } = await supabase.from('group_workouts').insert({
      group_id: groupId, name: selected.name, description, duration, difficulty,
      created_by: currentUserId, completed_by: [],
      category: selected.category, calories_per_minute: selected.calories_per_minute,
    }).select().single();
    setSaving(false);
    if (error) { Alert.alert('Error', 'Could not add exercise. Please try again.'); return; }
    onAdded(data as GroupWorkout);
    setSelected(null); setSets('3'); setReps('12'); onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={selected ? () => setSelected(null) : onClose}>
              <Ionicons name={selected ? 'chevron-back' : 'close'} size={22} color={theme.textMuted} />
            </TouchableOpacity>
            <Text style={[styles.groupName, { color: theme.textPrimary }]}>
              {selected ? selected.name : 'Pick Exercise'}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          {!selected ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
                    style={[styles.catPill, {
                      backgroundColor: activeCategory === cat ? theme.accent : theme.card,
                      borderColor: activeCategory === cat ? theme.accent : theme.border,
                    }]}>
                    <Text style={[styles.catPillText, {
                      color: activeCategory === cat ? theme.bg : theme.textSecondary,
                    }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {loading ? <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.xl }} /> : (
                <FlatList data={filtered} keyExtractor={i => i.id}
                  contentContainerStyle={styles.exerciseList}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setSelected(item)}
                      style={[styles.exerciseRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                      <View style={styles.exerciseInfo}>
                        <Text style={[styles.exerciseName, { color: theme.textPrimary }]}>{item.name}</Text>
                        <Text style={[styles.exerciseMeta, { color: theme.textMuted }]}>
                          {item.category} · ~{item.calories_per_minute} kcal/min
                        </Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
                    </TouchableOpacity>
                  )} />
              )}
            </>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.configLabel, { color: theme.textSecondary }]}>
                {selected.category} · ~{selected.calories_per_minute} kcal/min
              </Text>
              {[
                { label: 'Sets', values: ['1','2','3','4','5'], val: sets, set: setSets },
                { label: 'Reps', values: ['8','10','12','15','20'], val: reps, set: setReps },
                { label: 'Duration', values: ['15 min','20 min','30 min','45 min','60 min'], val: duration, set: setDuration },
              ].map(field => (
                <View key={field.label}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{field.label}</Text>
                  <View style={styles.setsRow}>
                    {field.values.map(v => (
                      <TouchableOpacity key={v} onPress={() => field.set(v)}
                        style={[styles.setPill, {
                          backgroundColor: field.val === v ? theme.accent : theme.bg,
                          borderColor: field.val === v ? theme.accent : theme.border,
                        }]}>
                        <Text style={[styles.setPillText, {
                          color: field.val === v ? theme.bg : theme.textSecondary,
                        }]}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Difficulty</Text>
              <View style={styles.diffRow}>
                {(['beginner','intermediate','advanced'] as Difficulty[]).map(d => (
                  <TouchableOpacity key={d} onPress={() => setDifficulty(d)}
                    style={[styles.diffPill, {
                      backgroundColor: difficulty === d ? theme.accent : theme.bg,
                      borderColor: difficulty === d ? theme.accent : theme.border,
                      flex: 1,
                    }]}>
                    <Text style={[styles.diffPillText, {
                      color: difficulty === d ? theme.bg : theme.textSecondary,
                    }]}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={handleAdd} disabled={saving}
                style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
                {saving ? <ActivityIndicator color={theme.bg} />
                  : <Text style={[styles.saveBtnText, { color: theme.bg }]}>Add to Group</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── WORKOUT CARD ──────────────────────────────────────────────
function WorkoutCard({ workout, theme, isOwner, currentUserId, onComplete, onDelete }: {
  workout: GroupWorkout; theme: typeof colors.dark; isOwner: boolean;
  currentUserId: string; onComplete: () => void; onDelete: () => void;
}) {
  const isCompleted = workout.completed_by?.includes(currentUserId);
  const diffColor = { beginner: theme.accent, intermediate: (theme as any).orange, advanced: (theme as any).red }[workout.difficulty];
  return (
    <View style={[styles.workoutCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <View style={styles.workoutCardTop}>
        <View style={styles.workoutCardInfo}>
          <Text style={[styles.workoutName, { color: theme.textPrimary }]}>{workout.name}</Text>
          <Text style={[styles.workoutDesc, { color: theme.textMuted }]} numberOfLines={2}>{workout.description}</Text>
          <View style={styles.workoutMeta}>
            <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
              <Text style={[styles.diffText, { color: diffColor }]}>{workout.difficulty}</Text>
            </View>
            <Text style={[styles.workoutDuration, { color: theme.textMuted }]}>⏱ {workout.duration}</Text>
            <Text style={[styles.completedCount, { color: theme.textMuted }]}>✅ {workout.completed_by?.length ?? 0} done</Text>
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={16} color={(theme as any).red} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={onComplete} disabled={isCompleted}
        style={[styles.completeBtn, {
          backgroundColor: isCompleted ? theme.card : theme.accent,
          borderColor: isCompleted ? theme.border : theme.accent,
        }]}>
        <Ionicons name={isCompleted ? 'checkmark-circle' : 'play-circle-outline'} size={16}
          color={isCompleted ? theme.textMuted : theme.bg} />
        <Text style={[styles.completeBtnText, { color: isCompleted ? theme.textMuted : theme.bg }]}>
          {isCompleted ? 'Completed' : 'Mark Complete'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export function GroupDetailSheet({ group, theme, visible, currentUserId, currentUserName, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Workouts');
  const [workouts, setWorkouts] = useState<GroupWorkout[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) return;
    loadWorkouts(); loadMembers(); loadMessages();

    // Clean up old channel, create new one with unique name
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`grp_${group.id}_${Date.now()}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${group.id}` },
        async (payload) => {
          const msg = payload.new as any;
          if (msg.user_id === currentUserId) return; // own messages added optimistically
          const { data: prof } = await supabase.from('profiles')
            .select('full_name, calfit_id').eq('id', msg.user_id).single();
          const newMsg: GroupMessage = {
            id: msg.id, user_id: msg.user_id, content: msg.content,
            created_at: msg.created_at,
            sender_name: prof?.full_name ?? 'CalFit User',
            sender_calfit_id: prof?.calfit_id ?? '',
          };
          setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
          setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();
    channelRef.current = channel;

    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, [visible, group.id]);

  const loadWorkouts = async () => {
    setLoadingWorkouts(true);
    const { data } = await supabase.from('group_workouts').select('*')
      .eq('group_id', group.id).order('created_at', { ascending: true });
    if (data) setWorkouts(data as GroupWorkout[]);
    setLoadingWorkouts(false);
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    const { data } = await supabase.from('group_members')
      .select('user_id, role, profiles:user_id (full_name, calfit_id, streak_count)')
      .eq('group_id', group.id);
    if (data) setMembers((data as any[]).map(m => ({
      user_id: m.user_id, role: m.role,
      full_name: m.profiles?.full_name ?? 'CalFit User',
      calfit_id: m.profiles?.calfit_id ?? '',
      streak_count: m.profiles?.streak_count ?? 0,
    })));
    setLoadingMembers(false);
  };

  const loadMessages = async () => {
    setLoadingChat(true);
    const { data } = await supabase.from('group_messages')
      .select('id, user_id, content, created_at, profiles:user_id (full_name, calfit_id)')
      .eq('group_id', group.id).order('created_at', { ascending: true }).limit(100);
    if (data) setMessages((data as any[]).map(m => ({
      id: m.id, user_id: m.user_id, content: m.content, created_at: m.created_at,
      sender_name: m.profiles?.full_name ?? 'CalFit User',
      sender_calfit_id: m.profiles?.calfit_id ?? '',
    })));
    setLoadingChat(false);
    setTimeout(() => chatListRef.current?.scrollToEnd({ animated: false }), 200);
  };

  const handleComplete = async (workoutId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout || workout.completed_by?.includes(currentUserId)) return;
    const updatedCompleted = [...(workout.completed_by ?? []), currentUserId];
    const { error } = await supabase.from('group_workouts')
      .update({ completed_by: updatedCompleted }).eq('id', workoutId);
    if (!error) setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, completed_by: updatedCompleted } : w));
  };

  const handleDeleteWorkout = (workoutId: string) => {
    Alert.alert('Remove Exercise', 'Remove this exercise from the group?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await supabase.from('group_workouts').delete().eq('id', workoutId);
        setWorkouts(prev => prev.filter(w => w.id !== workoutId));
      }},
    ]);
  };

  // ── CHAT: optimistic send so message appears immediately ──
  const handleSendMessage = async () => {
    const content = chatInput.trim();
    if (!content || sendingMsg) return;
    setSendingMsg(true);
    setChatInput('');

    const optimisticId = `opt_${Date.now()}`;
    const optimistic: GroupMessage = {
      id: optimisticId, user_id: currentUserId, content,
      created_at: new Date().toISOString(),
      sender_name: currentUserName, sender_calfit_id: '',
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 50);

    const { data, error } = await supabase.from('group_messages')
      .insert({ group_id: group.id, user_id: currentUserId, content })
      .select().single();

    setSendingMsg(false);
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      Alert.alert('Error', 'Could not send message. Please try again.');
      return;
    }
    if (data) {
      setMessages(prev => prev.map(m =>
        m.id === optimisticId ? { ...optimistic, id: data.id, created_at: data.created_at } : m
      ));
    }
  };

  const formatTime = (dateStr: string) => new Date(dateStr)
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.dismiss} onPress={onClose} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View style={styles.headerLeft}>
                <Text style={styles.groupEmoji}>{group.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.groupName, { color: theme.textPrimary }]} numberOfLines={1}>{group.name}</Text>
                  <Text style={[styles.groupMeta, { color: theme.textMuted }]}>
                    {group.member_count} member{group.member_count !== 1 ? 's' : ''} · 🔥 {group.streak}d
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
              {(['Workouts','Members','Chat'] as Tab[]).map(tab => (
                <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
                  style={[styles.tab, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: theme.accent }]}>
                  <Text style={[styles.tabText, {
                    color: activeTab === tab ? theme.accent : theme.textMuted,
                    fontWeight: activeTab === tab ? '700' : '400',
                  }]}>
                    {tab}{tab === 'Members' ? ` (${group.member_count})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* WORKOUTS */}
            {activeTab === 'Workouts' && (
              <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                {group.is_owner && (
                  <TouchableOpacity onPress={() => setShowPicker(true)}
                    style={[styles.addWorkoutBtn, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
                    <Ionicons name="add" size={16} color={theme.accent} />
                    <Text style={[styles.addWorkoutBtnText, { color: theme.accent }]}>Add Exercise from Catalogue</Text>
                  </TouchableOpacity>
                )}
                {loadingWorkouts ? <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.xl }} />
                  : workouts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="barbell-outline" size={32} color={theme.textMuted} />
                      <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                        {group.is_owner ? 'Tap "Add Exercise" to pick from the catalogue.' : 'No exercises added yet.'}
                      </Text>
                    </View>
                  ) : workouts.map(w => (
                    <WorkoutCard key={w.id} workout={w} theme={theme}
                      isOwner={group.is_owner ?? false} currentUserId={currentUserId}
                      onComplete={() => handleComplete(w.id)}
                      onDelete={() => handleDeleteWorkout(w.id)} />
                  ))}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}

            {/* MEMBERS */}
            {activeTab === 'Members' && (
              <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                {loadingMembers ? <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.xl }} />
                  : members.map(m => (
                    <View key={m.user_id} style={[styles.memberRow, { borderBottomColor: theme.border }]}>
                      <View style={[styles.memberAvatar, { backgroundColor: theme.accentDim as string }]}>
                        <Text style={[styles.memberAvatarText, { color: theme.accent }]}>
                          {(m.full_name || 'C').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberNameRow}>
                          <Text style={[styles.memberName, { color: theme.textPrimary }]}>{m.full_name}</Text>
                          {m.role === 'creator' && (
                            <View style={[styles.ownerBadge, { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}>
                              <Text style={[styles.ownerBadgeText, { color: theme.accent }]}>Owner</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.memberCalfitId, { color: theme.textMuted }]}>@{m.calfit_id}</Text>
                      </View>
                      <View style={styles.memberStreak}>
                        <Text style={{ fontSize: 12 }}>🔥</Text>
                        <Text style={[styles.memberStreakText, { color: theme.accent }]}>{m.streak_count}</Text>
                      </View>
                    </View>
                  ))}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}

            {/* CHAT */}
            {activeTab === 'Chat' && (
              <View style={styles.chatContainer}>
                {loadingChat ? <View style={styles.chatLoading}><ActivityIndicator color={theme.accent} /></View>
                  : (
                    <FlatList ref={chatListRef} data={messages} keyExtractor={item => item.id}
                      contentContainerStyle={styles.chatList} showsVerticalScrollIndicator={false}
                      ListEmptyComponent={
                        <View style={styles.emptyState}>
                          <Ionicons name="chatbubbles-outline" size={32} color={theme.textMuted} />
                          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No messages yet. Say hello! 👋</Text>
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
                            <View style={[styles.msgBubble, {
                              backgroundColor: isMe ? theme.accent : theme.bg,
                              borderColor: isMe ? theme.accent : theme.border,
                            }]}>
                              {!isMe && <Text style={[styles.msgSender, { color: theme.accent }]}>{item.sender_name}</Text>}
                              <Text style={[styles.msgContent, { color: isMe ? theme.bg : theme.textPrimary }]}>{item.content}</Text>
                              <Text style={[styles.msgTime, { color: isMe ? theme.bg + 'AA' : theme.textMuted }]}>
                                {formatTime(item.created_at)}
                              </Text>
                            </View>
                          </View>
                        );
                      }} />
                  )}
                <View style={[styles.chatInputRow, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                  <View style={[styles.chatInput, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <TextInput value={chatInput} onChangeText={setChatInput}
                      placeholder="Message the group..." placeholderTextColor={theme.textMuted}
                      style={[styles.chatInputText, { color: theme.textPrimary }]}
                      multiline maxLength={500} onSubmitEditing={handleSendMessage} />
                  </View>
                  <TouchableOpacity onPress={handleSendMessage} disabled={sendingMsg || !chatInput.trim()}
                    style={[styles.sendBtn, { backgroundColor: chatInput.trim() ? theme.accent : theme.border }]}>
                    {sendingMsg ? <ActivityIndicator size="small" color={theme.bg} />
                      : <Ionicons name="send" size={18} color={theme.bg} />}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ExercisePickerModal theme={theme} visible={showPicker}
        groupId={group.id} currentUserId={currentUserId}
        onClose={() => setShowPicker(false)}
        onAdded={workout => { setWorkouts(prev => [...prev, workout]); setShowPicker(false); }} />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  dismiss: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    maxHeight: '92%', minHeight: '60%',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  groupEmoji: { fontSize: 28 },
  groupName: { fontSize: fontSize.lg, fontWeight: '700' },
  groupMeta: { fontSize: fontSize.xs, marginTop: 2 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabText: { fontSize: fontSize.sm },
  tabContent: { flex: 1, padding: spacing.lg },
  addWorkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, marginBottom: spacing.md,
  },
  addWorkoutBtnText: { fontSize: fontSize.base, fontWeight: '700' },
  workoutCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1,
  },
  completeBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, gap: spacing.md },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: fontSize.lg, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberName: { fontSize: fontSize.base, fontWeight: '600' },
  memberCalfitId: { fontSize: fontSize.xs, marginTop: 2 },
  memberStreak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  memberStreakText: { fontSize: fontSize.sm, fontWeight: '700' },
  ownerBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.xs, borderWidth: 1 },
  ownerBadgeText: { fontSize: 9, fontWeight: '700' },
  chatContainer: { flex: 1 },
  chatLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chatList: { padding: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  msgRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarText: { fontSize: fontSize.sm, fontWeight: '700' },
  msgBubble: { maxWidth: '75%', padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, gap: 2 },
  msgSender: { fontSize: 10, fontWeight: '700' },
  msgContent: { fontSize: fontSize.base, lineHeight: 20 },
  msgTime: { fontSize: 9, alignSelf: 'flex-end', marginTop: 2 },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1 },
  chatInput: { flex: 1, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100 },
  chatInputText: { fontSize: fontSize.base },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  categoryScroll: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, maxHeight: 52 },
  catPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, marginRight: spacing.xs },
  catPillText: { fontSize: fontSize.sm, fontWeight: '600' },
  exerciseList: { padding: spacing.lg, gap: spacing.sm },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: fontSize.base, fontWeight: '600' },
  exerciseMeta: { fontSize: fontSize.xs, marginTop: 2 },
  configLabel: { fontSize: fontSize.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', marginHorizontal: spacing.lg, marginBottom: spacing.xs, marginTop: spacing.md },
  setsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, flexWrap: 'wrap' },
  setPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1, minWidth: 48, alignItems: 'center' },
  setPillText: { fontSize: fontSize.base, fontWeight: '700' },
  diffRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  diffPill: { paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center' },
  diffPillText: { fontSize: fontSize.xs, fontWeight: '600' },
  saveBtn: { margin: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.base, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { fontSize: fontSize.sm, textAlign: 'center', maxWidth: 220 },
});