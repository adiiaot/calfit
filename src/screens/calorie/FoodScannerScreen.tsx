// src/screens/calorie/FoodScannerScreen.tsx
// ─────────────────────────────────────────────────────────────
// CalFit Food Scanner Screen
//
// Uses FoodVisionService — Google Vision → Nigerian DB → FatSecret → Claude
// Source badge tells user exactly where nutrition data came from.
// ─────────────────────────────────────────────────────────────

import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image, Modal,
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
import { analyseFood, FoodScanResult, DataSource } from '../../services/FoodVisionService';

// ── LOG TO SUPABASE ───────────────────────────────────────────
async function logFoodEntry(
  userId: string,
  result: FoodScanResult,
  mealType: string
): Promise<boolean> {
  const { error } = await supabase.from('food_logs').insert({
    user_id:    userId,
    date:       new Date().toISOString().split('T')[0],
    meal_type:  mealType.toLowerCase(),
    food_name:  result.food,
    calories:   result.calories,
    protein_g:  result.protein,
    carbs_g:    result.carbs,
    fats_g:     result.fats,
    logged_at:  new Date().toISOString(),
  });
  return !error;
}

// ── SOURCE BADGE ──────────────────────────────────────────────
// Tells the user where the nutrition data came from.
// Verified sources (Nigerian DB + FatSecret) = green
// AI estimate (Claude fallback) = amber warning

const SOURCE_CONFIG: Record<DataSource, { label: string; color: string; icon: string; bg: string }> = {
  nigerian_db:    { label: 'Verified — Nigerian food database', color: '#2DDC8C', icon: 'checkmark-circle', bg: 'rgba(45,220,140,0.12)' },
  fatsecret:      { label: 'Verified — FatSecret database',    color: '#2DDC8C', icon: 'checkmark-circle', bg: 'rgba(45,220,140,0.12)' },
  claude_estimate:{ label: 'AI estimate — verify portion',     color: '#F59E0B', icon: 'information-circle', bg: 'rgba(245,158,11,0.12)' },
};

function SourceBadge({ source }: { source: DataSource }) {
  const cfg = SOURCE_CONFIG[source];
  return (
    <View style={[sb.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={[sb.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12 },
  text:  { fontSize: 11, fontWeight: '600' },
});

// ── MACRO ROW ─────────────────────────────────────────────────
function MacroRow({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={mr.row}>
      <View style={[mr.dot, { backgroundColor: color }]} />
      <Text style={mr.label}>{label}</Text>
      <Text style={mr.value}>{value}{unit}</Text>
    </View>
  );
}
const mr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot:   { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  value: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

// ── RESULT CARD ───────────────────────────────────────────────
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

function ResultCard({
  result, onLog, onRescan,
}: {
  result: FoodScanResult;
  onLog: (mealType: string) => void;
  onRescan: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={rc.card}>
      <Text style={rc.name}>{result.food}</Text>
      <SourceBadge source={result.source} />

      {/* Calorie headline */}
      <View style={rc.calorieRow}>
        <Text style={rc.calorieNum}>{result.calories}</Text>
        <Text style={rc.calorieUnit}>kcal</Text>
        <View style={rc.portionPill}>
          <Text style={rc.portionText}>{result.portion}</Text>
        </View>
      </View>

      {/* Macros */}
      <View style={rc.macros}>
        <MacroRow label="Protein" value={result.protein} unit="g" color="#2DDC8C" />
        <MacroRow label="Carbs"   value={result.carbs}   unit="g" color="#60A5FA" />
        <MacroRow label="Fats"    value={result.fats}    unit="g" color="#F59E0B" />
        {result.fibre > 0 && (
          <MacroRow label="Fibre"  value={result.fibre}   unit="g" color="#A78BFA" />
        )}
      </View>

      {/* Goal check */}
      <View style={[rc.goalBanner, {
        backgroundColor: result.withinGoal ? 'rgba(45,220,140,0.1)' : 'rgba(239,68,68,0.1)',
      }]}>
        <Ionicons
          name={result.withinGoal ? 'checkmark-circle-outline' : 'warning-outline'}
          size={16}
          color={result.withinGoal ? '#2DDC8C' : '#EF4444'}
        />
        <Text style={[rc.goalText, { color: result.withinGoal ? '#2DDC8C' : '#EF4444' }]}>
          {result.withinGoal
            ? `Fits your goal — ${result.caloriesRemaining} kcal remaining`
            : `Over your remaining budget by ${result.calories - result.caloriesRemaining} kcal`}
        </Text>
      </View>

      {/* Confidence bar */}
      <View style={rc.confRow}>
        <Text style={rc.confLabel}>Match confidence</Text>
        <View style={rc.confTrack}>
          <View style={[rc.confFill, { width: `${result.confidence}%` }]} />
        </View>
        <Text style={rc.confNum}>{result.confidence}%</Text>
      </View>

      {/* Actions */}
      <TouchableOpacity style={rc.logBtn} onPress={() => setShowPicker(true)} activeOpacity={0.85}>
        <LinearGradient colors={['#2DDC8C', '#0DAE6C']} style={rc.logGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={rc.logText}>Log This Food</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={onRescan} style={rc.rescanBtn} activeOpacity={0.7}>
        <Text style={rc.rescanText}>Scan Different Food</Text>
      </TouchableOpacity>

      {/* Meal type picker */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <View style={mp.overlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPicker(false)} />
          <View style={mp.sheet}>
            <Text style={mp.title}>Add to which meal?</Text>
            {MEAL_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={mp.row}
                onPress={() => { setShowPicker(false); onLog(type); }}
                activeOpacity={0.7}
              >
                <Text style={mp.rowText}>{type}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowPicker(false)} style={mp.cancel}>
              <Text style={mp.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const rc = StyleSheet.create({
  card:       { backgroundColor: '#161820', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40 },
  name:       { color: '#fff', fontSize: fontSize.lg, fontWeight: '800', marginBottom: 8 },
  calorieRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 16 },
  calorieNum: { color: '#2DDC8C', fontSize: 40, fontWeight: '800' },
  calorieUnit:{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginRight: 8 },
  portionPill:{ backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  portionText:{ color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  macros:     { marginBottom: 16 },
  goalBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  goalText:   { fontSize: 13, fontWeight: '600', flex: 1 },
  confRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  confLabel:  { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  confTrack:  { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  confFill:   { height: '100%', backgroundColor: '#2DDC8C', borderRadius: 2 },
  confNum:    { color: '#2DDC8C', fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
  logBtn:     { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  logGrad:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  logText:    { color: '#fff', fontSize: fontSize.base, fontWeight: '800' },
  rescanBtn:  { alignItems: 'center', paddingVertical: 12 },
  rescanText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});

const mp = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#161820', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  title:      { color: '#fff', fontSize: fontSize.base, fontWeight: '700', textAlign: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowText:    { color: '#fff', fontSize: fontSize.base, fontWeight: '600' },
  cancel:     { padding: spacing.lg, alignItems: 'center' },
  cancelText: { color: 'rgba(255,255,255,0.4)', fontSize: fontSize.sm },
});

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function FoodScannerScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme }  = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [result, setResult]             = useState<FoodScanResult | null>(null);
  const [capturedUri, setCapturedUri]   = useState<string | null>(null);
  const [logSuccess, setLogSuccess]     = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const calorieGoal = (profile as any)?.daily_calorie_goal ?? 2000;

  // ── HELPERS ──────────────────────────────────────────────────

  const getConsumedToday = async (): Promise<number> => {
    if (!user?.id) return 0;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('food_logs').select('calories')
      .eq('user_id', user.id).eq('date', today);
    return (data ?? []).reduce((sum: number, r: any) => sum + (r.calories ?? 0), 0);
  };

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

  // ── PROCESS IMAGE ─────────────────────────────────────────────
  const processImage = async (uri: string) => {
    setIsProcessing(true);
    setCapturedUri(uri);
    setProcessingStep('Detecting food with Google Vision...');

    try {
      const base64   = await uriToBase64(uri);
      const consumed = await getConsumedToday();

      // Show step updates so user knows what's happening
      // Small delay so the step text is readable
      const stepTimer = setTimeout(() => {
        setProcessingStep('Searching nutrition database...');
      }, 2000);

      const scanResult = await analyseFood(base64, calorieGoal, consumed);
      clearTimeout(stepTimer);

      if (!scanResult) {
        Alert.alert(
          'No food detected',
          'Could not identify food in this image. Try better lighting or move closer.',
          [{ text: 'Try Again', onPress: handleRescan }]
        );
        setIsProcessing(false);
        setCapturedUri(null);
        return;
      }

      setResult(scanResult);
    } catch (e) {
      console.error('[FoodScannerScreen] processImage error:', e);
      Alert.alert('Scan failed', 'Something went wrong. Please try again.');
      setCapturedUri(null);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // ── CAPTURE ──────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      if (photo?.uri) await processImage(photo.uri);
    } catch {
      Alert.alert('Camera error', 'Could not take photo. Please try again.');
    }
  };

  // ── GALLERY ──────────────────────────────────────────────────
  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to select food images.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!picked.canceled && picked.assets[0]?.uri) {
      await processImage(picked.assets[0].uri);
    }
  };

  // ── LOG ───────────────────────────────────────────────────────
  const handleLog = async (mealType: string) => {
    if (!result || !user?.id) return;
    const success = await logFoodEntry(user.id, result, mealType);
    if (success) {
      setLogSuccess(true);
      setTimeout(() => navigation.goBack(), 1500);
    } else {
      Alert.alert('Log failed', 'Could not save this entry. Please try again.');
    }
  };

  // ── RESCAN ────────────────────────────────────────────────────
  const handleRescan = () => {
    setResult(null);
    setCapturedUri(null);
    setLogSuccess(false);
    setProcessingStep('');
  };

  // ── PERMISSION GATE ───────────────────────────────────────────
  if (!permission?.granted) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center', gap: 16, padding: spacing.xl }]}>
        <Ionicons name="camera-outline" size={56} color="#2DDC8C" />
        <Text style={{ color: '#fff', fontSize: fontSize.lg, fontWeight: '700', textAlign: 'center' }}>Camera Access Needed</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 }}>CalFit needs camera access to scan your food and calculate nutrition.</Text>
        <TouchableOpacity onPress={requestPermission} style={[styles.permBtn, { backgroundColor: theme.accent }]}>
          <Text style={[styles.permBtnText, { color: theme.bg }]}>Allow Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: theme.textMuted, fontSize: 14, paddingVertical: 12 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <View style={styles.safe}>
      <View style={styles.cameraWrap}>
        {capturedUri
          ? <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />}

        {/* Processing overlay — shows current step */}
        {isProcessing && (
          <View style={styles.overlay}>
            <View style={styles.overlayCard}>
              <ActivityIndicator size="large" color="#2DDC8C" />
              <Text style={styles.overlayTitle}>Analysing food</Text>
              <Text style={styles.overlaySub}>{processingStep}</Text>
            </View>
          </View>
        )}

        {/* Success overlay */}
        {logSuccess && (
          <View style={styles.overlay}>
            <View style={styles.overlayCard}>
              <Ionicons name="checkmark-circle" size={52} color="#2DDC8C" />
              <Text style={styles.overlayTitle}>Logged!</Text>
              <Text style={styles.overlaySub}>Added to your calorie tracker</Text>
            </View>
          </View>
        )}

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Ionicons name="scan-outline" size={14} color="#2DDC8C" />
            <Text style={styles.topLabel}>CalFit Scanner</Text>
          </View>
          <TouchableOpacity onPress={handleGallery} style={styles.topBtn}>
            <Ionicons name="images-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scan frame corners */}
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

      {/* Result card or capture button */}
      {result ? (
        <ResultCard result={result} onLog={handleLog} onRescan={handleRescan} />
      ) : !isProcessing ? (
        <View style={styles.captureBar}>
          <TouchableOpacity onPress={handleCapture} style={styles.captureBtn} activeOpacity={0.85}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#0C0E13' },
  cameraWrap:  { flex: 1, position: 'relative' },
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  overlayCard: { backgroundColor: '#161820', borderRadius: 20, padding: 32, alignItems: 'center', gap: 12, marginHorizontal: 40 },
  overlayTitle:{ color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  overlaySub:  { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' },
  topBar:      { position: 'absolute', top: 60, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  topBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  topCenter:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  topLabel:    { color: '#fff', fontSize: 13, fontWeight: '600' },
  corner:      { position: 'absolute', width: 24, height: 24, borderColor: '#2DDC8C', borderWidth: 3 },
  tl:          { top: '35%', left: '20%', borderRightWidth: 0, borderBottomWidth: 0 },
  tr:          { top: '35%', right: '20%', borderLeftWidth: 0, borderBottomWidth: 0 },
  bl:          { top: '65%', left: '20%', borderRightWidth: 0, borderTopWidth: 0 },
  br:          { top: '65%', right: '20%', borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint:    { position: 'absolute', bottom: 20, alignSelf: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  captureBar:  { height: 120, justifyContent: 'center', alignItems: 'center' },
  captureBtn:  { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#2DDC8C', justifyContent: 'center', alignItems: 'center' },
  captureInner:{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#2DDC8C' },
  permBtn:     { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  permBtnText: { fontWeight: '700', fontSize: 16 },
});