import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── AVATAR SECTION ────────────────────────────────────────────
function AvatarSection({
  theme,
  initial,
}: {
  theme: typeof colors.dark;
  initial: string;
}) {
  return (
    <View style={styles.avatarSection}>
      <View style={[styles.avatarWrap, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}>
        <Text style={[styles.avatarInitial, { color: theme.accent }]}>
          {initial}
        </Text>
      </View>
      <TouchableOpacity style={[styles.changePhotoBtn, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        <Ionicons name="camera-outline" size={16} color={theme.accent} />
        <Text style={[styles.changePhotoText, { color: theme.accent }]}>
          Change Photo
        </Text>
      </TouchableOpacity>
      <Text style={[styles.photoNote, { color: theme.textMuted }]}>
        JPG, PNG · Max 5MB
      </Text>
    </View>
  );
}

// ── INPUT FIELD ───────────────────────────────────────────────
function InputField({
  theme,
  label,
  value,
  onChange,
  placeholder,
  icon,
  keyboardType,
  suffix,
}: {
  theme: typeof colors.dark;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: string;
  keyboardType?: any;
  suffix?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <View style={[styles.inputRow, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        <Ionicons name={icon as any} size={18} color={theme.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.textPrimary }]}
          keyboardType={keyboardType || 'default'}
        />
        {suffix && (
          <Text style={[styles.inputSuffix, { color: theme.textMuted }]}>
            {suffix}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── UNIT TOGGLE ───────────────────────────────────────────────
function UnitToggle({
  theme,
  unit,
  onToggle,
}: {
  theme: typeof colors.dark;
  unit: 'metric' | 'imperial';
  onToggle: () => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
        Units
      </Text>
      <View style={[styles.unitToggle, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        {(['metric', 'imperial'] as const).map((u) => (
          <TouchableOpacity
            key={u}
            onPress={onToggle}
            style={[styles.unitBtn, {
              backgroundColor: unit === u ? theme.accent : 'transparent',
            }]}
          >
            <Text style={[styles.unitBtnText, {
              color: unit === u ? theme.bg : theme.textMuted,
              fontWeight: unit === u ? '700' : '400',
            }]}>
              {u === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, ft)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile, updateProfile: updateStore } = useAuthStore();
  const theme = colors[colorScheme];

  const firstName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Favour';

  const [fullName, setFullName] = useState(profile?.full_name ?? firstName);
  const [username, setUsername] = useState(profile?.calfit_id ?? firstName.toLowerCase());
  const [age, setAge] = useState(profile?.age?.toString() ?? '');
  const [height, setHeight] = useState(profile?.height_cm?.toString() ?? '');
  const [weight, setWeight] = useState(profile?.current_weight_kg?.toString() ?? '');
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight_kg?.toString() ?? '');
  const [unit, setUnit] = useState<'metric' | 'imperial'>(
    (profile?.units as 'metric' | 'imperial') ?? 'metric'
  );
  const [isSaving, setIsSaving] = useState(false);

  const heightSuffix = unit === 'metric' ? 'cm' : 'ft';
  const weightSuffix = unit === 'metric' ? 'kg' : 'lbs';

  const handleSave = async () => {
    if (!fullName || !username) {
      Alert.alert('Missing fields', 'Name and username are required.');
      return;
    }

    setIsSaving(true);
    try {
      const { updateProfile } = await import('../../services/profileService');
      const userId = user?.id;

      if (!userId) throw new Error('Not logged in');

      const updates = {
        full_name: fullName,
        calfit_id: username,
        age: parseInt(age) || null,
        height_cm: parseFloat(height) || null,
        current_weight_kg: parseFloat(weight) || null,
        target_weight_kg: parseFloat(targetWeight) || null,
        units: unit,
      };

      const success = await updateProfile(userId, updates);

      if (success) {
        // Update local store so changes reflect immediately everywhere
        updateStore(updates);
        Alert.alert('Profile Updated ✓', 'Your profile has been saved.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error('Save failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>
            Settings
          </Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Text style={[styles.saveBtn, { color: theme.accent }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar */}
        <AvatarSection
          theme={theme}
          initial={firstName[0].toUpperCase()}
        />

        {/* Identity */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Identity
        </Text>
        <View style={[styles.section, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <InputField
            theme={theme}
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Your full name"
            icon="person-outline"
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InputField
            theme={theme}
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="calfit_username"
            icon="at-outline"
          />
          <View style={styles.availableRow}>
            <Ionicons name="checkmark-circle" size={14} color={theme.accent} />
            <Text style={[styles.availableText, { color: theme.accent }]}>
              calfit.app/@{username || 'username'} is available
            </Text>
          </View>
        </View>

        {/* Body Stats */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Body Stats
        </Text>
        <View style={[styles.section, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <UnitToggle
            theme={theme}
            unit={unit}
            onToggle={() => setUnit(unit === 'metric' ? 'imperial' : 'metric')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InputField
            theme={theme}
            label="Age"
            value={age}
            onChange={setAge}
            placeholder="25"
            icon="calendar-outline"
            keyboardType="number-pad"
            suffix="years"
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InputField
            theme={theme}
            label="Height"
            value={height}
            onChange={setHeight}
            placeholder={unit === 'metric' ? '175' : '5.9'}
            icon="resize-outline"
            keyboardType="decimal-pad"
            suffix={heightSuffix}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InputField
            theme={theme}
            label="Current Weight"
            value={weight}
            onChange={setWeight}
            placeholder={unit === 'metric' ? '75' : '165'}
            icon="scale-outline"
            keyboardType="decimal-pad"
            suffix={weightSuffix}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InputField
            theme={theme}
            label="Target Weight"
            value={targetWeight}
            onChange={setTargetWeight}
            placeholder={unit === 'metric' ? '70' : '154'}
            icon="flag-outline"
            keyboardType="decimal-pad"
            suffix={weightSuffix}
          />
        </View>

        {/* Info card */}
        <View style={[styles.infoCard, {
          backgroundColor: theme.accentDim as string,
          borderColor: theme.accent,
        }]}>
          <Ionicons name="information-circle-outline" size={18} color={theme.accent} />
          <Text style={[styles.infoText, { color: theme.textPrimary }]}>
            Profile photo upload will be fully active in the next update.
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveFullBtn, { backgroundColor: theme.accent }]}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.bg} />
          ) : (
            <Text style={[styles.saveFullBtnText, { color: theme.bg }]}>
              Save Profile
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  saveBtn: { fontSize: fontSize.lg, fontWeight: '700' },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  avatarWrap: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarInitial: { fontSize: 40, fontWeight: '800' },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  changePhotoText: { fontSize: fontSize.base, fontWeight: '600' },
  photoNote: { fontSize: fontSize.xs },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  section: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.lg,
    gap: spacing.md,
  },
  divider: { height: 1 },

  inputGroup: { gap: 6 },
  inputLabel: { fontSize: fontSize.sm, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: fontSize.lg },
  inputSuffix: { fontSize: fontSize.base, fontWeight: '600' },

  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -spacing.xs,
  },
  availableText: { fontSize: fontSize.xs, fontWeight: '600' },

  unitToggle: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 3,
    gap: 3,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  unitBtnText: { fontSize: fontSize.sm },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  infoText: { fontSize: fontSize.sm, flex: 1, lineHeight: 18 },

  saveFullBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  saveFullBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});