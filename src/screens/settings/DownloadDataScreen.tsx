import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';

import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

export default function DownloadDataScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);

  const exportData = async (type: 'full' | 'calories' | 'workouts' | 'profile') => {
    if (!user?.id) return;
    setIsExporting(true);
    setExportType(type);

    try {
      const { supabase } = await import('../../services/supabase');
      let csvContent = '';
      let filename = '';

      if (type === 'profile') {
        csvContent = `Name,Email,CalFit ID,Goal,Weight,Target Weight,Activity Level\n`;
        csvContent += `${profile?.full_name ?? ''},${user.email ?? ''},${profile?.calfit_id ?? ''},${profile?.goal ?? ''},${profile?.current_weight_kg ?? ''},${profile?.target_weight_kg ?? ''},${profile?.activity_level ?? ''}`;
        filename = 'calfit_profile.csv';
      }

      if (type === 'calories') {
        const { data } = await supabase
          .from('food_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false });

        csvContent = `Date,Meal,Food Name,Calories,Protein(g),Carbs(g),Fats(g)\n`;
        (data ?? []).forEach((row: any) => {
          csvContent += `${row.date},${row.meal_type},${row.food_name},${row.calories},${row.protein_g ?? 0},${row.carbs_g ?? 0},${row.fats_g ?? 0}\n`;
        });
        filename = 'calfit_food_logs.csv';
      }

      if (type === 'workouts') {
        const { data } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        csvContent = `Date,Workout Name,Duration (mins),Calories Burned\n`;
        (data ?? []).forEach((row: any) => {
          const mins = Math.floor((row.duration_seconds ?? 0) / 60);
          csvContent += `${row.completed_at?.split('T')[0]},${row.name},${mins},${row.calories_burned ?? 0}\n`;
        });
        filename = 'calfit_workouts.csv';
      }

      if (type === 'full') {
        const [foodData, workoutData, waterData] = await Promise.all([
          supabase.from('food_logs').select('*').eq('user_id', user.id),
          supabase.from('workout_sessions').select('*').eq('user_id', user.id),
          supabase.from('water_logs').select('*').eq('user_id', user.id),
        ]);

        csvContent = `=== CALFIT FULL DATA EXPORT ===\n`;
        csvContent += `Exported: ${new Date().toLocaleDateString()}\n`;
        csvContent += `User: ${profile?.full_name ?? user.email}\n\n`;

        csvContent += `=== FOOD LOGS ===\n`;
        csvContent += `Date,Meal,Food Name,Calories\n`;
        (foodData.data ?? []).forEach((row: any) => {
          csvContent += `${row.date},${row.meal_type},${row.food_name},${row.calories}\n`;
        });

        csvContent += `\n=== WORKOUTS ===\n`;
        csvContent += `Date,Name,Duration (mins),Calories Burned\n`;
        (workoutData.data ?? []).forEach((row: any) => {
          const mins = Math.floor((row.duration_seconds ?? 0) / 60);
          csvContent += `${row.completed_at?.split('T')[0]},${row.name},${mins},${row.calories_burned ?? 0}\n`;
        });

        csvContent += `\n=== WATER LOGS ===\n`;
        csvContent += `Date,Amount (ml)\n`;
        (waterData.data ?? []).forEach((row: any) => {
          csvContent += `${row.logged_at?.split('T')[0]},${row.amount_ml}\n`;
        });

        filename = 'calfit_full_export.csv';
      }

      // Share the CSV content
      await Share.share({
        message: csvContent,
        title: filename,
      });

    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const exports = [
    {
      id: 'full',
      icon: 'download-outline',
      title: 'Full Data Export',
      desc: 'All food logs, workouts, water and profile data',
      color: theme.accent,
    },
    {
      id: 'calories',
      icon: 'restaurant-outline',
      title: 'Food & Calorie Logs',
      desc: 'Every meal and food entry you have logged',
      color: theme.orange,
    },
    {
      id: 'workouts',
      icon: 'barbell-outline',
      title: 'Workout History',
      desc: 'All completed workout sessions with duration and calories',
      color: theme.accentSecond,
    },
    {
      id: 'profile',
      icon: 'person-outline',
      title: 'Profile & Goals',
      desc: 'Your profile information and fitness goals',
      color: theme.purple,
    },
  ];

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
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Download My Data</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoCard, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.accent} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Your data is exported as CSV — a universal format that can be opened in Excel, Google Sheets, or any fitness app that supports CSV import.
          </Text>
        </View>

        {exports.map((exp) => (
          <TouchableOpacity
            key={exp.id}
            onPress={() => exportData(exp.id as any)}
            disabled={isExporting}
            style={[styles.exportCard, {
              backgroundColor: theme.card,
              borderColor: theme.border,
              opacity: isExporting && exportType !== exp.id ? 0.5 : 1,
            }]}
          >
            <View style={[styles.exportIcon, { backgroundColor: exp.color + '22' }]}>
              <Ionicons name={exp.icon as any} size={22} color={exp.color} />
            </View>
            <View style={styles.exportInfo}>
              <Text style={[styles.exportTitle, { color: theme.textPrimary }]}>{exp.title}</Text>
              <Text style={[styles.exportDesc, { color: theme.textMuted }]}>{exp.desc}</Text>
            </View>
            {isExporting && exportType === exp.id ? (
              <ActivityIndicator size="small" color={exp.color} />
            ) : (
              <Ionicons name="share-outline" size={20} color={theme.textMuted} />
            )}
          </TouchableOpacity>
        ))}

        <Text style={[styles.note, { color: theme.textMuted }]}>
          Data exports include all records up to today. Your data remains in CalFit after export. To delete it, use Delete Account in Settings.
        </Text>
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

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  infoText: { fontSize: fontSize.sm, flex: 1, lineHeight: 18 },

  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  exportIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  exportInfo: { flex: 1 },
  exportTitle: { fontSize: fontSize.base, fontWeight: '700' },
  exportDesc: { fontSize: fontSize.sm, marginTop: 2 },

  note: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    lineHeight: 18,
  },
});