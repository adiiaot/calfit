import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'pt', label: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'yo', label: 'Yoruba', native: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', native: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', label: 'Hausa', native: 'Hausa', flag: '🇳🇬' },
  { code: 'sw', label: 'Swahili', native: 'Kiswahili', flag: '🌍' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
];

export default function LanguageScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const [selected, setSelected] = useState('en');

  const handleSelect = (code: string) => {
    if (code === 'en') {
      setSelected(code);
      return;
    }
    setSelected(code);
    Alert.alert(
      'Language Selected',
      `Full ${LANGUAGES.find(l => l.code === code)?.label} translation is coming in the next major update. The app will remain in English until then.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Language</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select your preferred language. Full translations are being added progressively.
        </Text>

        <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {LANGUAGES.map((lang, i) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleSelect(lang.code)}
              style={[
                styles.langRow,
                i < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <View style={styles.langInfo}>
                <Text style={[styles.langLabel, { color: theme.textPrimary }]}>{lang.label}</Text>
                <Text style={[styles.langNative, { color: theme.textMuted }]}>{lang.native}</Text>
              </View>
              {selected === lang.code ? (
                <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
              ) : (
                <View style={[styles.emptyCircle, { borderColor: theme.border }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </AndroidSafeView>
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
  subtitle: {
    fontSize: fontSize.base,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  listCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  flag: { fontSize: 24 },
  langInfo: { flex: 1 },
  langLabel: { fontSize: fontSize.base, fontWeight: '600' },
  langNative: { fontSize: fontSize.sm, marginTop: 2 },
  emptyCircle: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
  },
});