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
  Image,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { pickImageFromGallery } from '../../services/imageService';

// ── UNIT CONVERSION HELPERS ───────────────────────────────────
const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
const lbsToKg = (lbs: number) => Math.round(lbs / 2.20462 * 10) / 10;
const cmToInches = (cm: number) => Math.round(cm / 2.54 * 10) / 10;
const inchesToCm = (inches: number) => Math.round(inches * 2.54 * 10) / 10;

// ── USERNAME VALIDATION ───────────────────────────────────────
const validateUsername = (value: string): string | null => {
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (value.length > 30) return 'Username must be 30 characters or less';
  if (!/^[a-z0-9._]+$/.test(value)) return 'Only lowercase letters, numbers, dots and underscores allowed';
  if (value.startsWith('.') || value.startsWith('_')) return 'Username cannot start with a dot or underscore';
  if (value.endsWith('.') || value.endsWith('_')) return 'Username cannot end with a dot or underscore';
  if (/[._]{2,}/.test(value)) return 'No consecutive dots or underscores';
  return null;
};

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile, updateProfile } = useAuthStore();
  const theme = colors[colorScheme];

  // Units state — drives conversions
  const [units, setUnits] = useState<'metric' | 'imperial'>(
    profile?.units === 'imperial' ? 'imperial' : 'metric'
  );

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [calfitId, setCalfitId] = useState(profile?.calfit_id ?? '');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Store weight and height internally always in metric (kg, cm)
  // Display values are converted based on units selection
  const [weightKg, setWeightKg] = useState(profile?.current_weight_kg ?? 0);
  const [targetWeightKg, setTargetWeightKg] = useState(profile?.target_weight_kg ?? 0);
  const [heightCm, setHeightCm] = useState(profile?.height_cm ?? 0);

  // Display strings — what the user sees in the input fields
  const [weightDisplay, setWeightDisplay] = useState(
    profile?.current_weight_kg
      ? (units === 'imperial'
        ? kgToLbs(profile.current_weight_kg).toString()
        : profile.current_weight_kg.toString())
      : ''
  );
  const [targetWeightDisplay, setTargetWeightDisplay] = useState(
    profile?.target_weight_kg
      ? (units === 'imperial'
        ? kgToLbs(profile.target_weight_kg).toString()
        : profile.target_weight_kg.toString())
      : ''
  );
  const [heightDisplay, setHeightDisplay] = useState(
    profile?.height_cm
      ? (units === 'imperial'
        ? cmToInches(profile.height_cm).toString()
        : profile.height_cm.toString())
      : ''
  );

  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // ── UNIT SWITCH ───────────────────────────────────────────
  const handleUnitSwitch = (newUnit: 'metric' | 'imperial') => {
    if (newUnit === units) return;
    setUnits(newUnit);

    if (newUnit === 'imperial') {
      // Convert stored kg/cm values to display as lbs/inches
      if (weightKg) setWeightDisplay(kgToLbs(weightKg).toString());
      if (targetWeightKg) setTargetWeightDisplay(kgToLbs(targetWeightKg).toString());
      if (heightCm) setHeightDisplay(cmToInches(heightCm).toString());
    } else {
      // Convert back to metric
      if (weightKg) setWeightDisplay(weightKg.toString());
      if (targetWeightKg) setTargetWeightDisplay(targetWeightKg.toString());
      if (heightCm) setHeightDisplay(heightCm.toString());
    }
  };

  // ── WEIGHT INPUT ──────────────────────────────────────────
  const handleWeightChange = (val: string) => {
    setWeightDisplay(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setWeightKg(units === 'imperial' ? lbsToKg(num) : num);
    }
  };

  const handleTargetWeightChange = (val: string) => {
    setTargetWeightDisplay(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setTargetWeightKg(units === 'imperial' ? lbsToKg(num) : num);
    }
  };

  const handleHeightChange = (val: string) => {
    setHeightDisplay(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setHeightCm(units === 'imperial' ? inchesToCm(num) : num);
    }
  };

  // ── USERNAME INPUT ────────────────────────────────────────
  const handleUsernameChange = (val: string) => {
    // Strip capitals and spaces immediately as user types
    const cleaned = val.toLowerCase().replace(/\s/g, '');
    setCalfitId(cleaned);
    setUsernameError(validateUsername(cleaned));
  };

  // ── PHOTO UPLOAD ──────────────────────────────────────────
  const handleChangePhoto = async () => {
    const uri = await pickImageFromGallery();
    if (!uri) return;

    setAvatarUri(uri);
    setIsUploadingPhoto(true);

    try {
      const { uploadAvatarToSupabase } = await import('../../services/imageService');
      const publicUrl = await uploadAvatarToSupabase(uri, user?.id ?? '');

      if (publicUrl) {
        setAvatarUri(publicUrl);
        const { supabase } = await import('../../services/supabase');
        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user?.id);
        updateProfile({ avatar_url: publicUrl });
      } else {
        Alert.alert('Upload Failed', 'Could not upload your photo. Please try again.');
        setAvatarUri(profile?.avatar_url ?? null);
      }
    } catch {
      Alert.alert('Error', 'Photo upload failed. Please try again.');
      setAvatarUri(profile?.avatar_url ?? null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // ── SAVE ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user?.id) return;
    if (!fullName.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }
    if (calfitId && usernameError) {
      Alert.alert('Invalid Username', usernameError);
      return;
    }

    setIsSaving(true);
    try {
      const { supabase } = await import('../../services/supabase');
      const updates: Record<string, any> = {
        full_name: fullName.trim(),
        calfit_id: calfitId.trim() || null,
        units,
        current_weight_kg: weightKg || null,
        target_weight_kg: targetWeightKg || null,
        height_cm: heightCm || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      updateProfile(updates);

      Alert.alert('Saved ✓', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const firstName = fullName || user?.email?.split('@')[0] || 'U';
  const weightSuffix = units === 'imperial' ? 'lbs' : 'kg';
  const heightSuffix = units === 'imperial' ? 'in' : 'cm';

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
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Edit Profile</Text>
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleChangePhoto} disabled={isUploadingPhoto}>
            <View style={[styles.avatarWrap, { borderColor: theme.accent }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, {
                  backgroundColor: theme.accentDim as string,
                }]}>
                  <Text style={[styles.avatarInitial, { color: theme.accent }]}>
                    {firstName[0]?.toUpperCase() ?? 'U'}
                  </Text>
                </View>
              )}
              <View style={[styles.avatarOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={22} color="#fff" />
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[styles.changePhotoText, { color: theme.accent }]}>
            {isUploadingPhoto ? 'Uploading...' : 'Tap to change photo'}
          </Text>
        </View>

        {/* Units — put at TOP so user picks units before entering values */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Units</Text>
        <View style={styles.unitsRow}>
          {(['metric', 'imperial'] as const).map((u) => (
            <TouchableOpacity
              key={u}
              onPress={() => handleUnitSwitch(u)}
              style={[styles.unitBtn, {
                backgroundColor: units === u ? theme.accent : theme.card,
                borderColor: units === u ? theme.accent : theme.border,
              }]}
            >
              <Text style={[styles.unitBtnText, {
                color: units === u ? theme.bg : theme.textSecondary,
                fontWeight: units === u ? '700' : '400',
              }]}>
                {u === 'metric' ? '🌍  Metric (kg, cm)' : '🇺🇸  Imperial (lbs, in)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
          Switching units converts your existing measurements automatically.
        </Text>

        {/* Full Name */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Full Name</Text>
        <View style={[styles.fieldWrap, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <Ionicons name="person-outline" size={18} color={theme.textMuted} />
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            autoCorrect={false}
          />
        </View>

        {/* CalFit ID / Username */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CalFit ID (Username)</Text>
        <View style={[styles.fieldWrap, {
          backgroundColor: theme.card,
          borderColor: usernameError ? theme.red : theme.border,
        }]}>
          <Text style={[styles.atSign, { color: theme.textMuted }]}>@</Text>
          <TextInput
            value={calfitId}
            onChangeText={handleUsernameChange}
            placeholder="your_calfit_id"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {calfitId.length > 0 && (
            <Ionicons
              name={usernameError ? 'close-circle' : 'checkmark-circle'}
              size={18}
              color={usernameError ? theme.red : theme.accent}
            />
          )}
        </View>
        {usernameError ? (
          <Text style={[styles.fieldHint, { color: theme.red }]}>{usernameError}</Text>
        ) : (
          <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
            Lowercase letters, numbers, dots and underscores only. No spaces or capitals.
          </Text>
        )}

        {/* Body Stats */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Body Stats</Text>

        <View style={styles.bodyStatsRow}>
          {[
            {
              label: `Current Weight (${weightSuffix})`,
              value: weightDisplay,
              onChange: handleWeightChange,
              suffix: weightSuffix,
              placeholder: units === 'imperial' ? '154' : '70',
            },
            {
              label: `Target Weight (${weightSuffix})`,
              value: targetWeightDisplay,
              onChange: handleTargetWeightChange,
              suffix: weightSuffix,
              placeholder: units === 'imperial' ? '143' : '65',
            },
          ].map((f) => (
            <View key={f.label} style={styles.bodyStatField}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginHorizontal: 0 }]}>
                {f.label}
              </Text>
              <View style={[styles.bodyStatInput, {
                backgroundColor: theme.card,
                borderColor: theme.border,
              }]}>
                <TextInput
                  value={f.value}
                  onChangeText={f.onChange}
                  placeholder={f.placeholder}
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  style={[styles.bodyStatText, { color: theme.textPrimary }]}
                />
                <Text style={[styles.bodyStatSuffix, { color: theme.textMuted }]}>
                  {f.suffix}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
          Height ({heightSuffix})
        </Text>
        <View style={[styles.fieldWrap, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <Ionicons name="resize-outline" size={18} color={theme.textMuted} />
          <TextInput
            value={heightDisplay}
            onChangeText={handleHeightChange}
            placeholder={units === 'imperial' ? '69' : '175'}
            placeholderTextColor={theme.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, { color: theme.textPrimary }]}
          />
          <Text style={[styles.atSign, { color: theme.textMuted }]}>{heightSuffix}</Text>
        </View>
        <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
          {units === 'imperial'
            ? 'Enter height in inches (e.g. 5\'9\" = 69 inches)'
            : 'Enter height in centimetres'}
        </Text>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveFullBtn, { backgroundColor: theme.accent }]}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.bg} />
          ) : (
            <Text style={[styles.saveFullBtnText, { color: theme.bg }]}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: spacing.sm },

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

  avatarSection: { alignItems: 'center', marginVertical: spacing.xl },
  avatarWrap: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, overflow: 'hidden', position: 'relative',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 40, fontWeight: '800' },
  avatarOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 36, alignItems: 'center', justifyContent: 'center',
  },
  changePhotoText: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.sm },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },

  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: fontSize.lg },
  atSign: { fontSize: fontSize.lg, fontWeight: '600' },
  fieldHint: { fontSize: fontSize.xs, marginHorizontal: spacing.lg, marginTop: 4, lineHeight: 16 },

  bodyStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  bodyStatField: { flex: 1 },
  bodyStatInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bodyStatText: { flex: 1, fontSize: fontSize.xl, fontWeight: '700' },
  bodyStatSuffix: { fontSize: fontSize.base, fontWeight: '600' },

  unitsRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg },
  unitBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  unitBtnText: { fontSize: fontSize.sm },

  saveFullBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  saveFullBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});