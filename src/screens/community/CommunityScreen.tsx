import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── TYPES ─────────────────────────────────────────────────────
interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  streak: number;
  isJoined: boolean;
  isOwner: boolean;
  emoji: string;
  workouts: GroupWorkout[];
}

interface GroupWorkout {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  daysLeft: number;
  reward: string;
  emoji: string;
  joined: boolean;
  category: string;
}

// ── AUTO GENERATED CHALLENGES ─────────────────────────────────
const AUTO_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: '30-Day Step Challenge',
    description: 'Walk 8,000 steps every day for 30 days. Track automatically with CalFit.',
    participants: 4200,
    daysLeft: 18,
    reward: '500 CalFit Points + Badge',
    emoji: '👟',
    joined: false,
    category: 'Steps',
  },
  {
    id: 'c2',
    title: 'Water Goal Week',
    description: 'Hit your daily water goal every day for 7 days straight.',
    participants: 1800,
    daysLeft: 4,
    reward: '100 CalFit Points',
    emoji: '💧',
    joined: false,
    category: 'Hydration',
  },
  {
    id: 'c3',
    title: '5-Workout Week',
    description: 'Complete 5 workouts in 7 days. Any workout type counts.',
    participants: 3100,
    daysLeft: 6,
    reward: '200 CalFit Points',
    emoji: '🏋️',
    joined: false,
    category: 'Fitness',
  },
  {
    id: 'c4',
    title: 'Calorie Consistency',
    description: 'Hit your calorie goal within 100 kcal for 14 days straight.',
    participants: 2400,
    daysLeft: 11,
    reward: '300 CalFit Points + Badge',
    emoji: '🎯',
    joined: false,
    category: 'Nutrition',
  },
  {
    id: 'c5',
    title: 'Streak Builder',
    description: 'Check in every day for 21 days to build your streak.',
    participants: 5600,
    daysLeft: 14,
    reward: '400 CalFit Points + Silver Badge',
    emoji: '🔥',
    joined: false,
    category: 'Streaks',
  },
  {
    id: 'c6',
    title: 'Morning Workout Club',
    description: 'Complete a workout before 10am every day for 2 weeks.',
    participants: 980,
    daysLeft: 9,
    reward: '250 CalFit Points',
    emoji: '🌅',
    joined: false,
    category: 'Fitness',
  },
];

// ── GROUP WORKOUT CARD ────────────────────────────────────────
function GroupWorkoutCard({
  workout,
  theme,
  isOwner,
  onDelete,
  onComplete,
}: {
  workout: GroupWorkout;
  theme: typeof colors.dark;
  isOwner: boolean;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const diffColor = {
    beginner: theme.accent,
    intermediate: theme.orange,
    advanced: theme.red,
  }[workout.difficulty];

  return (
    <View style={[styles.workoutCard, {
      backgroundColor: workout.completed ? theme.accent + '15' : theme.bg,
      borderColor: workout.completed ? theme.accent : theme.border,
    }]}>
      <View style={styles.workoutCardLeft}>
        <Text style={[styles.workoutName, { color: theme.textPrimary }]}>{workout.name}</Text>
        <Text style={[styles.workoutDesc, { color: theme.textMuted }]} numberOfLines={1}>
          {workout.description}
        </Text>
        <View style={styles.workoutMeta}>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
            <Text style={[styles.diffBadgeText, { color: diffColor }]}>
              {workout.difficulty}
            </Text>
          </View>
          <Text style={[styles.workoutDuration, { color: theme.textMuted }]}>
            ⏱ {workout.duration}
          </Text>
        </View>
      </View>
      <View style={styles.workoutCardRight}>
        {workout.completed ? (
          <View style={[styles.completedBadge, { backgroundColor: theme.accent }]}>
            <Ionicons name="checkmark" size={16} color={theme.bg} />
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onComplete(workout.id)}
            style={[styles.completeBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.completeBtnText, { color: theme.bg }]}>Done</Text>
          </TouchableOpacity>
        )}
        {isOwner && (
          <TouchableOpacity
            onPress={() => onDelete(workout.id)}
            style={styles.deleteWorkoutBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={14} color={theme.red} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── GROUP DETAIL MODAL ────────────────────────────────────────
function GroupDetailModal({
  theme,
  group,
  visible,
  onClose,
  onAddWorkout,
  onDeleteWorkout,
  onCompleteWorkout,
  onDeleteGroup,
}: {
  theme: typeof colors.dark;
  group: Group | null;
  visible: boolean;
  onClose: () => void;
  onAddWorkout: (groupId: string, workout: Omit<GroupWorkout, 'id' | 'completed'>) => void;
  onDeleteWorkout: (groupId: string, workoutId: string) => void;
  onCompleteWorkout: (groupId: string, workoutId: string) => void;
  onDeleteGroup: (groupId: string) => void;
}) {
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDesc, setWorkoutDesc] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutDifficulty, setWorkoutDifficulty] = useState<GroupWorkout['difficulty']>('beginner');

  if (!group) return null;

  const handleAddWorkout = () => {
    if (!workoutName.trim() || !workoutDuration.trim()) {
      Alert.alert('Missing info', 'Please enter workout name and duration.');
      return;
    }
    onAddWorkout(group.id, {
      name: workoutName.trim(),
      description: workoutDesc.trim(),
      duration: workoutDuration.trim(),
      difficulty: workoutDifficulty,
    });
    setWorkoutName('');
    setWorkoutDesc('');
    setWorkoutDuration('');
    setWorkoutDifficulty('beginner');
    setShowAddWorkout(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalDismiss} onPress={onClose} />
        <View style={[styles.groupDetailSheet, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.sheetHeaderLeft}>
              <Text style={styles.groupDetailEmoji}>{group.emoji}</Text>
              <View>
                <Text style={[styles.groupDetailName, { color: theme.textPrimary }]}>
                  {group.name}
                </Text>
                <Text style={[styles.groupDetailMeta, { color: theme.textMuted }]}>
                  {group.members} members · 🔥 {group.streak}d streak
                </Text>
              </View>
            </View>
            <View style={styles.sheetHeaderRight}>
              {group.isOwner && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Delete Group',
                      'This will permanently delete the group and all its workouts.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            onDeleteGroup(group.id);
                            onClose();
                          },
                        },
                      ]
                    );
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.red} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.groupDetailScroll}>
            {/* Description */}
            <Text style={[styles.groupDetailDesc, { color: theme.textSecondary }]}>
              {group.description}
            </Text>

            {/* Workouts header */}
            <View style={styles.workoutsHeader}>
              <Text style={[styles.workoutsTitle, { color: theme.textPrimary }]}>
                Group Workouts
              </Text>
              {group.isOwner && (
                <TouchableOpacity
                  onPress={() => setShowAddWorkout(!showAddWorkout)}
                  style={[styles.addWorkoutBtn, { backgroundColor: theme.accent }]}
                >
                  <Ionicons name="add" size={16} color={theme.bg} />
                  <Text style={[styles.addWorkoutBtnText, { color: theme.bg }]}>
                    Add Workout
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Add workout form */}
            {showAddWorkout && group.isOwner && (
              <View style={[styles.addWorkoutForm, {
                backgroundColor: theme.bg,
                borderColor: theme.accent,
              }]}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Workout Name
                </Text>
                <View style={[styles.formInput, {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }]}>
                  <TextInput
                    value={workoutName}
                    onChangeText={setWorkoutName}
                    placeholder="e.g. Morning Push Circuit"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.formInputText, { color: theme.textPrimary }]}
                  />
                </View>

                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Description (optional)
                </Text>
                <View style={[styles.formInput, {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }]}>
                  <TextInput
                    value={workoutDesc}
                    onChangeText={setWorkoutDesc}
                    placeholder="What does this workout involve?"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.formInputText, { color: theme.textPrimary }]}
                  />
                </View>

                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Duration
                </Text>
                <View style={[styles.formInput, {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }]}>
                  <TextInput
                    value={workoutDuration}
                    onChangeText={setWorkoutDuration}
                    placeholder="e.g. 20 mins, 45 mins"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.formInputText, { color: theme.textPrimary }]}
                  />
                </View>

                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Difficulty
                </Text>
                <View style={styles.diffRow}>
                  {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setWorkoutDifficulty(d)}
                      style={[styles.diffPill, {
                        backgroundColor: workoutDifficulty === d
                          ? theme.accent
                          : theme.card,
                        borderColor: workoutDifficulty === d
                          ? theme.accent
                          : theme.border,
                      }]}
                    >
                      <Text style={[styles.diffPillText, {
                        color: workoutDifficulty === d ? theme.bg : theme.textSecondary,
                      }]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleAddWorkout}
                  style={[styles.saveWorkoutBtn, { backgroundColor: theme.accent }]}
                >
                  <Text style={[styles.saveWorkoutBtnText, { color: theme.bg }]}>
                    Save Workout
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Workout list */}
            {group.workouts.length === 0 ? (
              <View style={styles.noWorkouts}>
                <Ionicons name="barbell-outline" size={32} color={theme.textMuted} />
                <Text style={[styles.noWorkoutsText, { color: theme.textMuted }]}>
                  {group.isOwner
                    ? 'Add workouts for your group members to complete.'
                    : 'No workouts added yet. Check back soon.'}
                </Text>
              </View>
            ) : (
              group.workouts.map((workout) => (
                <GroupWorkoutCard
                  key={workout.id}
                  workout={workout}
                  theme={theme}
                  isOwner={group.isOwner}
                  onDelete={(wId) => onDeleteWorkout(group.id, wId)}
                  onComplete={(wId) => onCompleteWorkout(group.id, wId)}
                />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── GROUP CARD ────────────────────────────────────────────────
function GroupCard({
  group,
  theme,
  onJoin,
  onOpen,
  onDelete,
}: {
  group: Group;
  theme: typeof colors.dark;
  onJoin: (id: string) => void;
  onOpen: (group: Group) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onOpen(group)}
      style={[styles.groupCard, {
        backgroundColor: theme.card,
        borderColor: group.isOwner ? theme.accent : theme.border,
        borderWidth: group.isOwner ? 2 : 1,
      }]}
    >
      <View style={[styles.groupEmoji, { backgroundColor: theme.accentDim as string }]}>
        <Text style={styles.groupEmojiText}>{group.emoji}</Text>
      </View>
      <View style={styles.groupInfo}>
        <View style={styles.groupNameRow}>
          <Text style={[styles.groupName, { color: theme.textPrimary }]}>{group.name}</Text>
          {group.isOwner && (
            <View style={[styles.ownerBadge, { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}>
              <Text style={[styles.ownerBadgeText, { color: theme.accent }]}>Owner</Text>
            </View>
          )}
        </View>
        <Text style={[styles.groupDesc, { color: theme.textMuted }]} numberOfLines={1}>
          {group.description}
        </Text>
        <View style={styles.groupMeta}>
          <View style={styles.groupMetaItem}>
            <Ionicons name="people-outline" size={12} color={theme.textMuted} />
            <Text style={[styles.groupMetaText, { color: theme.textMuted }]}>
              {group.members} members
            </Text>
          </View>
          {group.streak > 0 && (
            <View style={styles.groupMetaItem}>
              <Text>🔥</Text>
              <Text style={[styles.groupMetaText, { color: theme.accent }]}>
                {group.streak}d
              </Text>
            </View>
          )}
          {group.workouts.length > 0 && (
            <View style={styles.groupMetaItem}>
              <Ionicons name="barbell-outline" size={12} color={theme.textMuted} />
              <Text style={[styles.groupMetaText, { color: theme.textMuted }]}>
                {group.workouts.length} workouts
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.groupCardRight}>
        {group.isOwner ? (
          <TouchableOpacity
            onPress={() => Alert.alert(
              'Delete Group',
              'Delete this group permanently?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(group.id) },
              ]
            )}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.red} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => onJoin(group.id)}
            style={[styles.joinBtn, {
              backgroundColor: group.isJoined ? theme.card : theme.accent,
              borderColor: group.isJoined ? theme.border : theme.accent,
              borderWidth: 1,
            }]}
          >
            <Text style={[styles.joinBtnText, {
              color: group.isJoined ? theme.textSecondary : theme.bg,
            }]}>
              {group.isJoined ? 'Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── CHALLENGE CARD ────────────────────────────────────────────
function ChallengeCard({
  challenge,
  theme,
  onJoin,
}: {
  challenge: Challenge;
  theme: typeof colors.dark;
  onJoin: (id: string) => void;
}) {
  const categoryColors: Record<string, string> = {
    Steps: theme.accentSecond,
    Hydration: '#60A5FA',
    Fitness: theme.orange,
    Nutrition: theme.accent,
    Streaks: theme.red,
  };
  const catColor = categoryColors[challenge.category] ?? theme.accent;

  return (
    <View style={[styles.challengeCard, {
      backgroundColor: theme.card,
      borderColor: challenge.joined ? theme.accent : theme.border,
      borderWidth: challenge.joined ? 2 : 1,
    }]}>
      {/* Auto-generated badge */}
      <View style={[styles.autoGenBadge, { backgroundColor: theme.accentDim as string }]}>
        <Ionicons name="flash" size={10} color={theme.accent} />
        <Text style={[styles.autoGenText, { color: theme.accent }]}>Auto Challenge</Text>
      </View>

      <View style={styles.challengeHeader}>
        <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
        <View style={styles.challengeHeaderInfo}>
          <View style={styles.challengeTitleRow}>
            <Text style={[styles.challengeTitle, { color: theme.textPrimary }]}>
              {challenge.title}
            </Text>
            <View style={[styles.catBadge, { backgroundColor: catColor + '22' }]}>
              <Text style={[styles.catBadgeText, { color: catColor }]}>
                {challenge.category}
              </Text>
            </View>
          </View>
          <Text style={[styles.challengeDesc, { color: theme.textMuted }]} numberOfLines={2}>
            {challenge.description}
          </Text>
        </View>
      </View>

      <View style={styles.challengeStats}>
        {[
          { icon: 'people-outline', value: `${challenge.participants.toLocaleString()} joined`, color: theme.accentSecond },
          { icon: 'time-outline', value: `${challenge.daysLeft}d left`, color: theme.orange },
          { icon: 'gift-outline', value: challenge.reward, color: theme.gold },
        ].map((s) => (
          <View key={s.value} style={styles.challengeStat}>
            <Ionicons name={s.icon as any} size={12} color={s.color} />
            <Text style={[styles.challengeStatText, { color: s.color }]}>{s.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => onJoin(challenge.id)}
        style={[styles.joinChallengeBtn, {
          backgroundColor: challenge.joined ? theme.border : theme.accent,
        }]}
      >
        <Text style={[styles.joinChallengeBtnText, {
          color: challenge.joined ? theme.textMuted : theme.bg,
        }]}>
          {challenge.joined ? '✓ Joined' : 'Join Challenge'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── CREATE GROUP SHEET ────────────────────────────────────────
function CreateGroupSheet({
  theme,
  onClose,
  onCreate,
  canCreate,
  userTier,
}: {
  theme: typeof colors.dark;
  onClose: () => void;
  onCreate: (name: string, desc: string, category: string) => void;
  canCreate: boolean;
  userTier: string;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Fitness');
  const categories = ['Fitness', 'Nutrition', 'Weight Loss', 'Muscle Gain', 'Running', 'Mental Health'];

  if (!canCreate) {
    return (
      <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Create a Group</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={styles.upgradePrompt}>
          <Ionicons name="lock-closed" size={36} color={theme.textMuted} />
          <Text style={[styles.upgradeTitle, { color: theme.textPrimary }]}>
            Group Limit Reached
          </Text>
          <Text style={[styles.upgradeSub, { color: theme.textMuted }]}>
            Free users can create 1 group. Upgrade to Pro or Premium to create unlimited groups and add more members.
          </Text>
          <View style={[styles.tierInfo, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
            <Text style={[styles.tierInfoText, { color: theme.accent }]}>
              Free: 1 group · Pro: 5 groups · Premium: Unlimited
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
        <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Create a Group</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
        <Text style={[styles.sheetLabel, { color: theme.textSecondary }]}>Group Name</Text>
        <View style={[styles.sheetInput, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning Warriors"
            placeholderTextColor={theme.textMuted}
            style={[styles.sheetInputText, { color: theme.textPrimary }]}
          />
        </View>

        <Text style={[styles.sheetLabel, { color: theme.textSecondary }]}>Description</Text>
        <View style={[styles.sheetInput, {
          backgroundColor: theme.bg,
          borderColor: theme.border,
          height: 80, alignItems: 'flex-start',
        }]}>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="What is this group about?"
            placeholderTextColor={theme.textMuted}
            style={[styles.sheetInputText, { color: theme.textPrimary, flex: 1 }]}
            multiline
          />
        </View>

        <Text style={[styles.sheetLabel, { color: theme.textSecondary }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryPills}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.categoryPill, {
                  backgroundColor: category === c ? theme.accent : theme.bg,
                  borderColor: category === c ? theme.accent : theme.border,
                }]}
              >
                <Text style={[styles.categoryPillText, {
                  color: category === c ? theme.bg : theme.textSecondary,
                }]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          onPress={() => {
            if (!name.trim()) {
              Alert.alert('Missing name', 'Please enter a group name.');
              return;
            }
            onCreate(name, desc, category);
            onClose();
          }}
          style={[styles.createBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.createBtnText, { color: theme.bg }]}>Create Group</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile, userTier } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'My Groups' | 'Discover' | 'Challenges'>('My Groups');
  const [showCreate, setShowCreate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([
    {
      id: 'd1', name: 'Morning Warriors',
      description: 'Early risers who crush workouts before 8am',
      members: 1240, category: 'Fitness', streak: 14,
      isJoined: false, isOwner: false, emoji: '🌅',
      workouts: [
        { id: 'w1', name: '5AM Cardio Blast', description: '20 min HIIT', duration: '20 mins', difficulty: 'intermediate', completed: false },
        { id: 'w2', name: 'Core Activation', description: 'Plank and ab circuit', duration: '15 mins', difficulty: 'beginner', completed: false },
      ],
    },
    {
      id: 'd2', name: 'Clean Eaters Nigeria',
      description: 'Healthy Nigerian food and calorie tracking',
      members: 892, category: 'Nutrition', streak: 7,
      isJoined: false, isOwner: false, emoji: '🥗',
      workouts: [],
    },
    {
      id: 'd3', name: 'Weight Loss Warriors',
      description: 'Accountability for sustainable weight loss',
      members: 3400, category: 'Weight Loss', streak: 30,
      isJoined: false, isOwner: false, emoji: '⚡',
      workouts: [
        { id: 'w3', name: 'Fat Burn Circuit', description: 'Full body burn', duration: '30 mins', difficulty: 'intermediate', completed: false },
      ],
    },
    {
      id: 'd4', name: 'Muscle & Macros',
      description: 'Bodybuilding, protein tracking and progressive overload',
      members: 2100, category: 'Muscle Gain', streak: 21,
      isJoined: false, isOwner: false, emoji: '💪',
      workouts: [],
    },
    {
      id: 'd5', name: 'Mental Wellness Circle',
      description: 'Mindfulness and stress management',
      members: 660, category: 'Mental Health', streak: 5,
      isJoined: false, isOwner: false, emoji: '🧘',
      workouts: [],
    },
  ]);

  const [challenges, setChallenges] = useState<Challenge[]>(AUTO_CHALLENGES);

  // Group creation limit based on tier
  const getGroupLimit = () => {
    if (userTier === 'premium') return Infinity;
    if (userTier === 'pro') return 5;
    return 1;
  };

  const ownedGroups = myGroups.filter((g) => g.isOwner);
  const canCreateGroup = ownedGroups.length < getGroupLimit();

  const handleJoinGroup = (id: string) => {
    const isDiscover = discoverGroups.some((g) => g.id === id);

    if (isDiscover) {
      setDiscoverGroups((prev) => prev.map((g) =>
        g.id === id
          ? { ...g, isJoined: !g.isJoined, members: g.isJoined ? g.members - 1 : g.members + 1 }
          : g
      ));
      const group = discoverGroups.find((g) => g.id === id);
      if (group && !group.isJoined) {
        setMyGroups((prev) => [...prev, { ...group, isJoined: true }]);
      } else {
        setMyGroups((prev) => prev.filter((g) => g.id !== id));
      }
    } else {
      setMyGroups((prev) => prev.map((g) =>
        g.id === id ? { ...g, isJoined: !g.isJoined } : g
      ));
    }
  };

  const handleDeleteGroup = (id: string) => {
    setMyGroups((prev) => prev.filter((g) => g.id !== id));
    setDiscoverGroups((prev) => prev.filter((g) => g.id !== id));
    setShowGroupDetail(false);
    setSelectedGroup(null);
  };

  const handleOpenGroup = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupDetail(true);
  };

  const handleAddWorkout = (groupId: string, workout: Omit<GroupWorkout, 'id' | 'completed'>) => {
    const newWorkout: GroupWorkout = {
      id: Date.now().toString(),
      completed: false,
      ...workout,
    };

    const updateGroups = (groups: Group[]) =>
      groups.map((g) => g.id === groupId
        ? { ...g, workouts: [...g.workouts, newWorkout] }
        : g
      );

    setMyGroups(updateGroups);
    setDiscoverGroups(updateGroups);
    setSelectedGroup((prev) => prev?.id === groupId
      ? { ...prev, workouts: [...prev.workouts, newWorkout] }
      : prev
    );
  };

  const handleDeleteWorkout = (groupId: string, workoutId: string) => {
    const updateGroups = (groups: Group[]) =>
      groups.map((g) => g.id === groupId
        ? { ...g, workouts: g.workouts.filter((w) => w.id !== workoutId) }
        : g
      );

    setMyGroups(updateGroups);
    setDiscoverGroups(updateGroups);
    setSelectedGroup((prev) => prev?.id === groupId
      ? { ...prev, workouts: prev.workouts.filter((w) => w.id !== workoutId) }
      : prev
    );
  };

  const handleCompleteWorkout = (groupId: string, workoutId: string) => {
    const updateGroups = (groups: Group[]) =>
      groups.map((g) => g.id === groupId
        ? { ...g, workouts: g.workouts.map((w) => w.id === workoutId ? { ...w, completed: true } : w) }
        : g
      );

    setMyGroups(updateGroups);
    setDiscoverGroups(updateGroups);
    setSelectedGroup((prev) => prev?.id === groupId
      ? { ...prev, workouts: prev.workouts.map((w) => w.id === workoutId ? { ...w, completed: true } : w) }
      : prev
    );
    Alert.alert('Workout Complete! 💪', 'Logged to your group progress.');
  };

  const handleCreateGroup = async (name: string, desc: string, category: string) => {
    if (!user?.id) return;

    const emojis = ['✨', '🔥', '💪', '🏋️', '🥗', '🧘', '⚡', '🌟'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const newGroup: Group = {
      id: Date.now().toString(),
      name, description: desc, category,
      members: 1, streak: 0,
      isJoined: true, isOwner: true,
      emoji, workouts: [],
    };

    try {
      const { supabase } = await import('../../services/supabase');
      const { data } = await supabase
        .from('groups')
        .insert({
          name, description: desc, category,
          creator_id: user.id, member_count: 1,
        })
        .select()
        .single();

      if (data) newGroup.id = data.id;
    } catch (error) {
      // Proceed with local state even if DB fails
    }

    setMyGroups((prev) => [newGroup, ...prev]);
    Alert.alert('Group Created! 🎉', `${name} is ready. Add workouts for your members.`);
  };

  const handleJoinChallenge = (id: string) => {
    setChallenges((prev) => prev.map((c) =>
      c.id === id
        ? { ...c, joined: !c.joined, participants: c.joined ? c.participants - 1 : c.participants + 1 }
        : c
    ));
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

        {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Social</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Community</Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={[styles.createGroupBtn, { backgroundColor: theme.accent }]}
        >
          <Ionicons name="add" size={18} color={theme.bg} />
          <Text style={[styles.createGroupBtnText, { color: theme.bg }]}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Tier info bar */}
      <View style={[styles.tierBar, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        <Ionicons name="people-outline" size={14} color={theme.textMuted} />
        <Text style={[styles.tierBarText, { color: theme.textMuted }]}>
          {userTier === 'free'
            ? `Free: ${ownedGroups.length}/1 group created`
            : userTier === 'pro'
            ? `Pro: ${ownedGroups.length}/5 groups created`
            : 'Premium: Unlimited groups'}
        </Text>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        {(['My Groups', 'Discover', 'Challenges'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && {
              borderBottomColor: theme.accent,
              borderBottomWidth: 2,
            }]}
          >
            <Text style={[styles.tabText, {
              color: activeTab === tab ? theme.textPrimary : theme.textMuted,
              fontWeight: activeTab === tab ? '700' : '400',
            }]}>
              {tab}{tab === 'My Groups' && myGroups.length > 0 ? ` (${myGroups.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {}}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* My Groups */}
        {activeTab === 'My Groups' && (
          myGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No groups yet</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                Create a group or join one from Discover. Add workouts for members to complete together.
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab('Discover')}
                style={[styles.emptyBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={[styles.emptyBtnText, { color: theme.bg }]}>Browse Groups</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                theme={theme}
                onJoin={handleJoinGroup}
                onOpen={handleOpenGroup}
                onDelete={handleDeleteGroup}
              />
            ))
          )
        )}

        {/* Discover */}
        {activeTab === 'Discover' && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Popular Groups
            </Text>
            {discoverGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                theme={theme}
                onJoin={handleJoinGroup}
                onOpen={handleOpenGroup}
                onDelete={handleDeleteGroup}
              />
            ))}
          </>
        )}

        {/* Challenges */}
        {activeTab === 'Challenges' && (
          <>
            <View style={[styles.challengesBanner, {
              backgroundColor: theme.accentDim as string,
              borderColor: theme.accent,
            }]}>
              <Ionicons name="flash" size={18} color={theme.accent} />
              <Text style={[styles.challengesBannerText, { color: theme.accent }]}>
                Challenges are auto-generated by CalFit and updated regularly. Complete them to earn CalFit Points and badges.
              </Text>
            </View>
            {challenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                theme={theme}
                onJoin={handleJoinChallenge}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Create Group Sheet */}
      {showCreate && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowCreate(false)} />
          <CreateGroupSheet
            theme={theme}
            onClose={() => setShowCreate(false)}
            onCreate={handleCreateGroup}
            canCreate={canCreateGroup}
            userTier={userTier ?? 'free'}
          />
        </View>
      )}

      {/* Group Detail Modal */}
      <GroupDetailModal
        theme={theme}
        group={selectedGroup}
        visible={showGroupDetail}
        onClose={() => { setShowGroupDetail(false); setSelectedGroup(null); }}
        onAddWorkout={handleAddWorkout}
        onDeleteWorkout={handleDeleteWorkout}
        onCompleteWorkout={handleCompleteWorkout}
        onDeleteGroup={handleDeleteGroup}
      />
    </AndroidSafeView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },
  pageTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  createGroupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  createGroupBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  tierBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  tierBarText: { fontSize: fontSize.xs },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: fontSize.sm },

  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm, marginTop: spacing.xs,
  },

  // Group card
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  groupEmoji: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  groupEmojiText: { fontSize: 24 },
  groupInfo: { flex: 1 },
  groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  groupName: { fontSize: fontSize.base, fontWeight: '700' },
  ownerBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radius.sm, borderWidth: 1,
  },
  ownerBadgeText: { fontSize: 9, fontWeight: '700' },
  groupDesc: { fontSize: fontSize.xs, marginTop: 2 },
  groupMeta: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  groupMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  groupMetaText: { fontSize: fontSize.xs },
  groupCardRight: { alignItems: 'flex-end', gap: spacing.sm, flexShrink: 0 },
  joinBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  joinBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  // Challenge card
  challengeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  autoGenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  autoGenText: { fontSize: 9, fontWeight: '700' },
  challengeHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  challengeEmoji: { fontSize: 32 },
  challengeHeaderInfo: { flex: 1 },
  challengeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  challengeTitle: { fontSize: fontSize.base, fontWeight: '700' },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  catBadgeText: { fontSize: 9, fontWeight: '700' },
  challengeDesc: { fontSize: fontSize.sm, marginTop: 4, lineHeight: 18 },
  challengeStats: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  challengeStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  challengeStatText: { fontSize: fontSize.xs, fontWeight: '600' },
  joinChallengeBtn: {
    padding: spacing.md, borderRadius: radius.md, alignItems: 'center',
  },
  joinChallengeBtnText: { fontSize: fontSize.base, fontWeight: '700' },

  challengesBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  challengesBannerText: { flex: 1, fontSize: fontSize.xs, lineHeight: 16, fontWeight: '600' },

  // Create sheet
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    maxHeight: '80%',
  },
  sheetScroll: { padding: spacing.lg },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  sheetLabel: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.md, marginBottom: 4 },
  sheetInput: {
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: 4,
  },
  sheetInputText: { fontSize: fontSize.base },
  categoryPills: { flexDirection: 'row', gap: spacing.sm, marginTop: 4, marginBottom: spacing.md },
  categoryPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1,
  },
  categoryPillText: { fontSize: fontSize.sm, fontWeight: '600' },
  createBtn: {
    padding: spacing.lg, borderRadius: radius.lg,
    alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xxxl,
  },
  createBtnText: { fontSize: fontSize.lg, fontWeight: '700' },

  // Upgrade prompt
  upgradePrompt: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  upgradeTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  upgradeSub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
  tierInfo: {
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1,
    marginTop: spacing.sm,
  },
  tierInfoText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Group detail modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalDismiss: { flex: 1 },
  groupDetailSheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    maxHeight: '90%',
  },
  sheetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  sheetHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  groupDetailEmoji: { fontSize: 28 },
  groupDetailName: { fontSize: fontSize.lg, fontWeight: '700' },
  groupDetailMeta: { fontSize: fontSize.xs, marginTop: 2 },
  groupDetailScroll: { padding: spacing.lg },
  groupDetailDesc: { fontSize: fontSize.base, lineHeight: 20, marginBottom: spacing.md },

  // Workouts
  workoutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  workoutsTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  addWorkoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  addWorkoutBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  addWorkoutForm: {
    padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 2, marginBottom: spacing.md, gap: 4,
  },
  formLabel: { fontSize: fontSize.xs, fontWeight: '600', marginTop: spacing.sm },
  formInput: {
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1,
  },
  formInputText: { fontSize: fontSize.base },
  diffRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4, marginBottom: spacing.sm },
  diffPill: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm,
    borderWidth: 1, alignItems: 'center',
  },
  diffPillText: { fontSize: fontSize.xs, fontWeight: '600' },
  saveWorkoutBtn: {
    padding: spacing.md, borderRadius: radius.md, alignItems: 'center',
  },
  saveWorkoutBtnText: { fontSize: fontSize.base, fontWeight: '700' },

  workoutCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, marginBottom: spacing.sm, gap: spacing.md,
  },
  workoutCardLeft: { flex: 1 },
  workoutName: { fontSize: fontSize.base, fontWeight: '700' },
  workoutDesc: { fontSize: fontSize.xs, marginTop: 2 },
  workoutMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  diffBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm },
  diffBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  workoutDuration: { fontSize: fontSize.xs },
  workoutCardRight: { alignItems: 'center', gap: spacing.xs, flexShrink: 0 },
  completedBadge: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  completeBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  completeBtnText: { fontSize: fontSize.xs, fontWeight: '700' },
  deleteWorkoutBtn: { padding: 4 },

  noWorkouts: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  noWorkoutsText: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 18 },

  // Empty states
  emptyState: {
    alignItems: 'center', paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl, gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  emptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: radius.lg, marginTop: spacing.sm,
  },
  emptyBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});