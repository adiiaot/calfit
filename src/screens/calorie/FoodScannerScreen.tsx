import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, Image, Modal,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { supabase } from '../../services/supabase';

// ── SCAN RESULT TYPE ──────────────────────────────────────────
interface ScanResult {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fibre: number;
  portion: string;
  confidence: number;
  withinGoal: boolean;
  caloriesRemaining: number;
}

// ── CLAUDE VISION FOOD ANALYSIS ───────────────────────────────
// Sends base64 image to Claude, gets back structured nutrition JSON.
// Why JSON: easier to parse than free text, consistent structure for logging.
async function analyseFood(base64: string, calorieGoal: number, consumed: number): Promise<ScanResult | null> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
            },
            {
              type: 'text',
              text: `You are a nutrition expert analyzing a food photo for a fitness app.

Identify all food items visible and estimate their nutritional content for a typical portion size.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "food": "food name (be specific, e.g. 'Grilled Chicken Breast with Rice')",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fats": <number in grams>,
  "fibre": <number in grams>,
  "portion": "portion description (e.g. '1 plate ~350g')",
  "confidence": <percentage 0-100>
}

If you cannot identify food in the image, respond with:
{"error": "No food detected"}`,
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    if (data.error) return null;

    const text = data.content?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    if (parsed.error) return null;

    const remaining = calorieGoal - consumed;
    return {
      ...parsed,
      withinGoal: parsed.calories <= remaining,
      caloriesRemaining: remaining,
    };
  } catch {
    return null;
  }
}

// ── LOG TO SUPABASE ───────────────────────────────────────────
async function logFoodEntry(
  userId: string,
  result: ScanResult,
  mealType: string,
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase.from('food_logs').insert({
    user_id:   userId,
    date:      today,
    meal_type: mealType.toLowerCase(),
    food_name: result.food,
    calories:  result.calories,
    protein_g: result.protein,
    carbs_g:   result.carbs,
    fats_g:    result.fats,
    logged_at: new Date().toISOString(),
  });
  return !error;
}

// ── MACRO BAR ─────────────────────────────────────────────────
function MacroBar({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={mb.wrap}>
      <Text style={[mb.label, { color: 'rgba(255,255,255,0.65)' }]}>{label}</Text>
      <Text style={[mb.value, { color }]}>{value}{unit}</Text>
    </View>
  );
}
const mb = StyleSheet.create({
  wrap:  { alignItems: 'center', flex: 1 },
  label: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  value: { fontSize: fontSize.lg, fontWeight: '800' },
});

// ── RESULT CARD ───────────────────────────────────────────────
function ResultCard({
  result,
  onLog,
  onRescan,
}: {
  result: ScanResult;
  onLog: (mealType: string) => void;
  onRescan: () => void;
}) {
  const [showMealPicker, setShowMealPicker] = useState(false);
  const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <View style={rc.card}>
      {/* Header */}
      <View style={rc.header}>
        <View style={{ flex: 1 }}>
          <Text style={rc.foodName} numberOfLines={2}>{result.food}</Text>
          <View style={rc.confRow}>
            <Ionicons name="sparkles" size={12} color="#2DDC8C" />
            <Text style={rc.conf}>{result.confidence}% match · {result.portion}</Text>
          </View>
        </View>
        <View style={rc.calBadge}>
          <Text style={rc.calNum}>{result.calories}</Text>
          <Text style={rc.calUnit}>kcal</Text>
        </View>
      </View>

      {/* Macros */}
      <View style={rc.macros}>
        <MacroBar label="Protein" value={result.protein} unit="g" color="#6699FF" />
        <View style={rc.divider} />
        <MacroBar label="Carbs"   value={result.carbs}   unit="g" color="#FFB347" />
        <View style={rc.divider} />
        <MacroBar label="Fats"    value={result.fats}    unit="g" color="#FF6B9D" />
        <View style={rc.divider} />
        <MacroBar label="Fibre"   value={result.fibre}   unit="g" color="#2DDC8C" />
      </View>

      {/* Goal status */}
      <View style={[rc.goalRow, {
        backgroundColor: result.withinGoal ? 'rgba(45,220,140,0.12)' : 'rgba(255,89,89,0.12)',
        borderColor:     result.withinGoal ? 'rgba(45,220,140,0.30)' : 'rgba(255,89,89,0.30)',
      }]}>
        <Ionicons
          name={result.withinGoal ? 'checkmark-circle' : 'warning'}
          size={14}
          color={result.withinGoal ? '#2DDC8C' : '#FF5959'}
        />
        <Text style={[rc.goalText, { color: result.withinGoal ? '#2DDC8C' : '#FF5959' }]}>
          {result.withinGoal
            ? `Fits your plan · ${result.caloriesRemaining - result.calories} kcal remaining after logging`
            : `${result.calories - result.caloriesRemaining} kcal over your remaining budget`}
        </Text>
      </View>

      {/* Actions */}
      <View style={rc.actions}>
        <TouchableOpacity onPress={onRescan} style={rc.rescanBtn}>
          <Ionicons name="camera-outline" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={rc.rescanText}>Rescan</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowMealPicker(true)} style={rc.logBtn}>
          <LinearGradient
            colors={['#2DDC8C', '#0DAE6C'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={rc.logGrad}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={rc.logText}>Log This Food</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Meal type picker modal */}
      <Modal visible={showMealPicker} transparent animationType="fade">
        <View style={rc.pickerOverlay}>
          <View style={rc.picker}>
            <Text style={rc.pickerTitle}>Add to which meal?</Text>
            {MEAL_TYPES.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => { setShowMealPicker(false); onLog(m); }}
                style={rc.pickerRow}
              >
                <Text style={rc.pickerRowText}>{m}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowMealPicker(false)} style={rc.pickerCancel}>
              <Text style={rc.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const rc = StyleSheet.create({
  card:       { backgroundColor: 'rgba(13,10,46,0.95)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, gap: spacing.md },
  header:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  foodName:   { fontSize: fontSize.lg, fontWeight: '800', color: '#fff', flex: 1 },
  confRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  conf:       { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)' },
  calBadge:   { alignItems: 'center', backgroundColor: 'rgba(45,220,140,0.15)', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(45,220,140,0.30)' },
  calNum:     { fontSize: 26, fontWeight: '900', color: '#2DDC8C' },
  calUnit:    { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  macros:     { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: spacing.md },
  divider:    { width: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginHorizontal: 4 },
  goalRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  goalText:   { fontSize: fontSize.xs, fontWeight: '600', flex: 1 },
  actions:    { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  rescanBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  rescanText: { color: 'rgba(255,255,255,0.6)', fontSize: fontSize.sm, fontWeight: '600' },
  logBtn:     { flex: 1, borderRadius: radius.md, overflow: 'hidden' },
  logGrad:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  logText:    { color: '#fff', fontSize: fontSize.base, fontWeight: '800' },
  // Meal picker modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.xl },
  picker:        { backgroundColor: '#161820', borderRadius: 20, overflow: 'hidden' },
  pickerTitle:   { color: '#fff', fontSize: fontSize.base, fontWeight: '700', textAlign: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  pickerRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  pickerRowText: { color: '#fff', fontSize: fontSize.base, fontWeight: '600' },
  pickerCancel:  { padding: spacing.lg, alignItems: 'center' },
  pickerCancelText: { color: 'rgba(255,255,255,0.4)', fontSize: fontSize.sm },
});

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function FoodScannerScreen() {
  const navigation  = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult]             = useState<ScanResult | null>(null);
  const [capturedUri, setCapturedUri]   = useState<string | null>(null);
  const [activeMode, setActiveMode]     = useState<'Camera' | 'Gallery'>('Camera');
  const [logSuccess, setLogSuccess]     = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const calorieGoal = (profile as any)?.daily_calorie_goal ?? 2000;

  // Get today's consumed calories from Supabase for the goal check
  const getConsumedToday = async (): Promise<number> => {
    if (!user?.id) return 0;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('food_logs').select('calories')
      .eq('user_id', user.id).eq('date', today);
    return (data ?? []).reduce((sum: number, r: any) => sum + (r.calories ?? 0), 0);
  };

  // Convert image URI → base64 for Claude
  const uriToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processImage = async (uri: string) => {
    setCapturedUri(uri);
    setIsProcessing(true);
    setResult(null);
    try {
      const base64 = await uriToBase64(uri);
      const consumed = await getConsumedToday();
      const analysis = await analyseFood(base64, calorieGoal, consumed);
      if (!analysis) {
        Alert.alert(
          'No food detected',
          'Point the camera at a plate or food item and try again.',
          [{ text: 'OK', onPress: () => setCapturedUri(null) }]
        );
      } else {
        setResult(analysis);
      }
    } catch {
      Alert.alert('Scan failed', 'Could not analyse the image. Please try again.');
      setCapturedUri(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.7 });
      if (photo?.uri) await processImage(photo.uri);
    } catch {
      Alert.alert('Could not take photo', 'Please try again.');
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to scan food from your gallery.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) await processImage(res.assets[0].uri);
  };

  const handleLog = async (mealType: string) => {
    if (!result || !user?.id) return;
    const success = await logFoodEntry(user.id, result, mealType);
    if (success) {
      setLogSuccess(true);
      setTimeout(() => navigation.goBack(), 1200);
    } else {
      Alert.alert('Log failed', 'Could not save the food log. Please try again.');
    }
  };

  const handleRescan = () => {
    setResult(null);
    setCapturedUri(null);
    setLogSuccess(false);
  };

  // Permission not yet determined
  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.permissionScreen, { backgroundColor: theme.bg }]}>
        <Ionicons name="camera-outline" size={64} color={theme.textMuted} />
        <Text style={[styles.permTitle, { color: theme.textPrimary }]}>Camera Access Needed</Text>
        <Text style={[styles.permSub, { color: theme.textMuted }]}>
          CalFit needs camera access to scan your food and estimate calories using AI.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={[styles.permBtn, { backgroundColor: theme.accent }]}>
          <Text style={[styles.permBtnText, { color: theme.bg }]}>Allow Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.permBack}>
          <Text style={[styles.permBackText, { color: theme.textMuted }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safe}>

      {/* ── CAMERA / PREVIEW ── */}
      <View style={styles.cameraWrap}>
        {capturedUri ? (
          // Show captured image while processing or showing result
          <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        )}

        {/* Dark overlay when processing */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#2DDC8C" />
              <Text style={styles.processingTitle}>Analysing with Claude Vision</Text>
              <Text style={styles.processingSubtext}>Identifying food and calculating macros...</Text>
            </View>
          </View>
        )}

        {/* Success overlay */}
        {logSuccess && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <Ionicons name="checkmark-circle" size={52} color="#2DDC8C" />
              <Text style={styles.processingTitle}>Logged!</Text>
              <Text style={styles.processingSubtext}>Added to your calorie tracker</Text>
            </View>
          </View>
        )}

        {/* ── HEADER ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Ionicons name="sparkles" size={14} color="#2DDC8C" />
            <Text style={styles.topLabel}>CalFit Vision</Text>
          </View>
          <TouchableOpacity onPress={handleGallery} style={styles.topBtn}>
            <Ionicons name="images-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── VIEWFINDER BRACKETS ── */}
        {!capturedUri && !isProcessing && (
          <>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            <Text style={styles.scanHint}>Point camera at your food</Text>
          </>
        )}
      </View>

      {/* ── BOTTOM PANEL ── */}
      {result ? (
        <ResultCard result={result} onLog={handleLog} onRescan={handleRescan} />
      ) : !isProcessing ? (
        <View style={styles.bottomPanel}>
          {/* Mode toggle */}
          <View style={styles.modeTabs}>
            {(['Camera', 'Gallery'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => { setActiveMode(m); if (m === 'Gallery') handleGallery(); }}
                style={[styles.modeTab, activeMode === m && styles.modeTabActive]}
              >
                <Ionicons
                  name={m === 'Camera' ? 'camera-outline' : 'images-outline'}
                  size={16}
                  color={activeMode === m ? '#0D0A2E' : 'rgba(255,255,255,0.6)'}
                />
                <Text style={[styles.modeTabText, activeMode === m && { color: '#0D0A2E' }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Shutter */}
          <View style={styles.shutterRow}>
            <View style={{ width: 56 }} />
            <TouchableOpacity onPress={handleTakePhoto} style={styles.shutter} activeOpacity={0.8}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGallery} style={styles.galleryThumb}>
              <Ionicons name="images-outline" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <Text style={styles.bottomHint}>
            Tap the button to scan · or pick from gallery
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#000' },
  cameraWrap:{ flex: 1, position: 'relative' },

  // Top bar
  topBar:    { position: 'absolute', top: 52, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  topBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  topCenter: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99 },
  topLabel:  { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },

  // Viewfinder corners
  corner:    { position: 'absolute', width: 28, height: 28, borderColor: '#2DDC8C', borderWidth: 3 },
  tl:        { top: '30%', left: '15%', borderRightWidth: 0, borderBottomWidth: 0 },
  tr:        { top: '30%', right: '15%', borderLeftWidth: 0, borderBottomWidth: 0 },
  bl:        { bottom: '35%', left: '15%', borderRightWidth: 0, borderTopWidth: 0 },
  br:        { bottom: '35%', right: '15%', borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint:  { position: 'absolute', bottom: '32%', alignSelf: 'center', color: 'rgba(255,255,255,0.55)', fontSize: fontSize.xs, fontWeight: '600' },

  // Processing / success overlay
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center' },
  processingCard:    { alignItems: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: 'rgba(13,10,46,0.95)', borderRadius: 20, width: 260 },
  processingTitle:   { color: '#fff', fontSize: fontSize.lg, fontWeight: '800', textAlign: 'center' },
  processingSubtext: { color: 'rgba(255,255,255,0.5)', fontSize: fontSize.sm, textAlign: 'center' },

  // Bottom panel
  bottomPanel:  { backgroundColor: '#0D0A2E', paddingTop: spacing.lg, paddingBottom: 36, paddingHorizontal: spacing.lg, gap: spacing.lg },
  modeTabs:     { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: 3 },
  modeTab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 99 },
  modeTabActive:{ backgroundColor: '#2DDC8C' },
  modeTabText:  { color: 'rgba(255,255,255,0.6)', fontSize: fontSize.sm, fontWeight: '600' },
  shutterRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shutter:      { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2DDC8C' },
  galleryThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  bottomHint:   { color: 'rgba(255,255,255,0.30)', fontSize: fontSize.xs, textAlign: 'center' },

  // Permission screen
  permissionScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  permTitle:    { fontSize: fontSize.xl, fontWeight: '800', textAlign: 'center' },
  permSub:      { fontSize: fontSize.base, textAlign: 'center', lineHeight: 22 },
  permBtn:      { paddingHorizontal: 36, paddingVertical: 14, borderRadius: 99 },
  permBtnText:  { fontSize: fontSize.base, fontWeight: '800' },
  permBack:     { marginTop: spacing.sm },
  permBackText: { fontSize: fontSize.sm },
});