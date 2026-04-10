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

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile, updateProfile } = useAuthStore();
  const theme = colors[colorScheme];

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [calfitId, setCalfitId] = useState(profile?.calfit_id ?? '');
  const [currentWeight, setCurrentWeight] = useState(
    profile?.current_weight_kg?.toString() ?? ''
  );
  const [targetWeight, setTargetWeight] = useState(
    profile?.target_weight_kg?.toString() ?? ''
  );
  const [height, setHeight] = useState(profile?.height_cm?.toString() ?? '');
  const [units, setUnits] = useState<'metric' | 'imperial'>(
    profile?.units === 'imperial' ? 'imperial' : 'metric'
  );
  const [avatarUri, setAvatarUri] = useState<string | null>(
    profile?.avatar_url ?? null
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

 const handleChangePhoto = async () => {
  const uri = await pickImageFromGallery();
  if (!uri) return;

  // Show preview immediately
  setAvatarUri(uri);
  setIsUploadingPhoto(true);

  try {
    const { uploadAvatarToSupabase } = await import('../../services/imageService');
    const publicUrl = await uploadAvatarToSupabase(uri, user?.id ?? '');

    if (publicUrl) {
      setAvatarUri(publicUrl);

      // Save URL to Supabase profiles table
      const { supabase } = await import('../../services/supabase');
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      // Update local store so it reflects everywhere instantly
      updateProfile({ avatar_url: publicUrl });
    } else {
      Alert.alert(
        'Upload Failed',
        'Could not upload your photo. Please check your connection and try again.'
      );
      setAvatarUri(profile?.avatar_url ?? null);
    }
  } catch (error) {
    Alert.alert('Error', 'Photo upload failed. Please try again.');
    setAvatarUri(profile?.avatar_url ?? null);
  } finally {
    setIsUploadingPhoto(false);
  }
};

  const handleSave = async () => {
    if (!user?.id) return;
    if (!fullName.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }

    setIsSaving(true);
    try {
      const { supabase } = await import('../../services/supabase');
      const updates: Record<string, any> = {
        full_name: fullName.trim(),
        calfit_id: calfitId.trim() || null,
        units,
      };

      if (currentWeight) updates.current_weight_kg = parseFloat(currentWeight);
      if (targetWeight) updates.target_weight_kg = parseFloat(targetWeight);
      if (height) updates.height_cm = parseFloat(height);

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

              {/* Upload overlay */}
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

        {/* Name */}
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

        {/* CalFit ID */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CalFit ID</Text>
        <View style={[styles.fieldWrap, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <Text style={[styles.atSign, { color: theme.textMuted }]}>@</Text>
          <TextInput
            value={calfitId}
            onChangeText={(t) => setCalfitId(t.toLowerCase().replace(/\s+/g, ''))}
            placeholder="your_calfit_id"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
          Your unique ID on CalFit. Others can find you with this.
        </Text>

        {/* Body Stats */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Body Stats</Text>

        <View style={styles.bodyStatsRow}>
          {[
            { label: 'Current Weight', value: currentWeight, onChange: setCurrentWeight, suffix: units === 'metric' ? 'kg' : 'lbs', placeholder: '70' },
            { label: 'Target Weight', value: targetWeight, onChange: setTargetWeight, suffix: units === 'metric' ? 'kg' : 'lbs', placeholder: '65' },
          ].map((f) => (
            <View key={f.label} style={styles.bodyStatField}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{f.label}</Text>
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

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Height</Text>
        <View style={[styles.fieldWrap, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <Ionicons name="resize-outline" size={18} color={theme.textMuted} />
          <TextInput
            value={height}
            onChangeText={setHeight}
            placeholder={units === 'metric' ? '175' : '69'}
            placeholderTextColor={theme.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, { color: theme.textPrimary }]}
          />
          <Text style={[styles.atSign, { color: theme.textMuted }]}>
            {units === 'metric' ? 'cm' : 'in'}
          </Text>
        </View>

        {/* Units */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Units</Text>
        <View style={styles.unitsRow}>
          {(['metric', 'imperial'] as const).map((u) => (
            <TouchableOpacity
              key={u}
              onPress={() => setUnits(u)}
              style={[styles.unitBtn, {
                backgroundColor: units === u ? theme.accent : theme.card,
                borderColor: units === u ? theme.accent : theme.border,
              }]}
            >
              <Text style={[styles.unitBtnText, {
                color: units === u ? theme.bg : theme.textSecondary,
                fontWeight: units === u ? '700' : '400',
              }]}>
                {u === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, ft)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save button at bottom */}
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

  // Avatar
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

  // Fields
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
  fieldHint: { fontSize: fontSize.xs, marginHorizontal: spacing.lg, marginTop: 4 },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },

  // Body stats
  bodyStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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

  // Units
  unitsRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg },
  unitBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  unitBtnText: { fontSize: fontSize.base },

  saveFullBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  saveFullBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});