import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── FOOD LABEL TAG ────────────────────────────────────────────
function FoodLabelTag({
  label,
  x,
  y,
}: {
  label: string;
  x: number;
  y: number;
}) {
  return (
    <View style={[styles.labelTag, { left: x, top: y }]}>
      <Text style={styles.labelTagText}>{label}</Text>
    </View>
  );
}

// ── SCAN RESULT CARD ──────────────────────────────────────────
function ScanResultCard({
  theme,
  result,
  onLog,
  onDismiss,
}: {
  theme: typeof colors.dark;
  result: {
    food: string;
    confidence: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    withinGoal: boolean;
    remaining: number;
  };
  onLog: (mealType: string) => void;
  onDismiss: () => void;
}) {
  const [showMealPicker, setShowMealPicker] = useState(false);
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <View style={styles.resultCard}>
      {/* Food name + confidence */}
      <View style={styles.resultHeader}>
        <View>
          <Text style={styles.resultFood}>{result.food}</Text>
          <Text style={[styles.resultConf, { color: colors.dark.accent }]}>
            {result.confidence}% confidence · Claude Vision AI
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss}>
          <Ionicons name="close-circle" size={22} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      {/* Calories */}
      <Text style={[styles.resultCal, { color: colors.dark.accent }]}>
        {result.calories} kcal
      </Text>

      {/* Macros */}
      <View style={styles.resultMacros}>
        {[
          { label: 'Protein', value: `${result.protein}g` },
          { label: 'Carbs', value: `${result.carbs}g` },
          { label: 'Fats', value: `${result.fats}g` },
        ].map((m) => (
          <View key={m.label} style={styles.macroItem}>
            <Text style={styles.macroValue}>{m.value}</Text>
            <Text style={styles.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Goal warning or OK */}
      <View style={[styles.goalRow, {
        backgroundColor: result.withinGoal
          ? 'rgba(45,220,140,0.1)'
          : 'rgba(255,89,89,0.1)',
      }]}>
        <Ionicons
          name={result.withinGoal ? 'checkmark-circle' : 'warning'}
          size={16}
          color={result.withinGoal ? colors.dark.accent : colors.dark.red}
        />
        <Text style={[styles.goalText, {
          color: result.withinGoal ? colors.dark.accent : colors.dark.red,
        }]}>
          {result.withinGoal
            ? `Within your daily goal — ${result.remaining} kcal remaining`
            : `Exceeds goal by ${Math.abs(result.remaining)} kcal — consider a smaller portion`
          }
        </Text>
      </View>

      {/* Log button */}
      {!showMealPicker ? (
        <TouchableOpacity
          onPress={() => setShowMealPicker(true)}
          style={[styles.logBtn, { backgroundColor: colors.dark.accent }]}
        >
          <Ionicons name="add-circle" size={18} color={colors.dark.bg} />
          <Text style={[styles.logBtnText, { color: colors.dark.bg }]}>
            Log as Meal
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.mealPicker}>
          <Text style={styles.mealPickerLabel}>Choose meal type:</Text>
          <View style={styles.mealPickerBtns}>
            {mealTypes.map((mt) => (
              <TouchableOpacity
                key={mt}
                onPress={() => onLog(mt)}
                style={[styles.mealPickerBtn, {
                  borderColor: colors.dark.accent,
                }]}
              >
                <Text style={[styles.mealPickerBtnText, {
                  color: colors.dark.accent,
                }]}>
                  {mt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function FoodScannerScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  const [activeMode, setActiveMode] = useState<'Scan Food' | 'Barcode' | 'Food Label'>('Scan Food');
  const [flashOn, setFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<null | {
    food: string;
    confidence: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    withinGoal: boolean;
    remaining: number;
  }>(null);

  const modes = ['Scan Food', 'Barcode', 'Food Label'] as const;

  // Simulate scan — will be replaced with real Claude Vision API in Phase 3
  const handleScan = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setResult({
        food: 'Caesar Salad',
        confidence: 92,
        calories: 380,
        protein: 18,
        carbs: 28,
        fats: 22,
        withinGoal: true,
        remaining: 600,
      });
      setIsProcessing(false);
    }, 2000);
  };

  const handleLog = (mealType: string) => {
    // Will connect to food_logs table in Phase 2
    console.log(`Logging ${result?.food} as ${mealType}`);
    navigation.goBack();
  };

  return (
    <View style={styles.safe}>
      {/* Status bar area */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41</Text>
      </View>

      {/* Top controls */}
      <SafeAreaView style={styles.topControls}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        <Text style={[styles.topLogo, { color: colors.dark.accent }]}>CalFit</Text>

        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="help-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Camera viewfinder */}
      <View style={styles.viewfinder}>
        {/* Corner brackets */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Food label tags — shown after scan */}
        {result && (
          <>
            <FoodLabelTag label="Lettuce" x={30} y={80} />
            <FoodLabelTag label="Parmesan" x={220} y={60} />
            <FoodLabelTag label="Cherry Tomatoes" x={20} y={220} />
            <FoodLabelTag label="Croutons" x={200} y={240} />
          </>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={colors.dark.accent} />
            <Text style={styles.processingText}>
              Analysing with Claude Vision...
            </Text>
          </View>
        )}

        {/* Tap to scan prompt */}
        {!result && !isProcessing && (
          <TouchableOpacity
            onPress={handleScan}
            style={styles.tapToScan}
          >
            <View style={styles.tapToScanCircle}>
              <Ionicons name="camera" size={32} color={colors.dark.accent} />
            </View>
            <Text style={styles.tapToScanText}>
              Tap to scan
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Result card */}
      {result && (
        <ScanResultCard
          theme={theme}
          result={result}
          onLog={handleLog}
          onDismiss={() => setResult(null)}
        />
      )}

      {/* Bottom controls */}
      {!result && (
        <View style={styles.bottomControls}>
          {/* Scan mode tabs */}
          <View style={styles.modeTabs}>
            {modes.map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setActiveMode(mode)}
                style={[styles.modeTab, {
                  backgroundColor: activeMode === mode
                    ? colors.dark.accent
                    : 'rgba(255,255,255,0.1)',
                }]}
              >
                <Text style={[styles.modeTabText, {
                  color: activeMode === mode ? colors.dark.bg : 'white',
                  fontWeight: activeMode === mode ? '700' : '400',
                }]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Flash + Gallery */}
          <View style={styles.utilRow}>
            <TouchableOpacity
              onPress={() => setFlashOn(!flashOn)}
              style={styles.utilBtn}
            >
              <Ionicons
                name={flashOn ? 'flash' : 'flash-outline'}
                size={20}
                color={flashOn ? colors.dark.gold : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.utilText, {
                color: flashOn ? colors.dark.gold : 'rgba(255,255,255,0.6)',
              }]}>
                Flash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.utilBtn}>
              <Ionicons
                name="images-outline"
                size={20}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.utilText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  statusBar: {
    height: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  statusTime: { fontSize: 13, fontWeight: '600', color: 'white' },

  // Top controls
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#111',
  },
  closeBtn: { padding: 4 },
  topLogo: { fontSize: fontSize.xl, fontWeight: '700' },
  helpBtn: { padding: 4 },

  // Viewfinder
  viewfinder: {
    flex: 1,
    backgroundColor: '#111',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Corners
  corner: {
    position: 'absolute',
    width: 24, height: 24,
    borderColor: 'white',
    borderStyle: 'solid',
  },
  cornerTL: { top: 20, left: 20, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 20, right: 20, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 20, left: 20, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 20, right: 20, borderBottomWidth: 3, borderRightWidth: 3 },

  // Food label tags
  labelTag: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  labelTagText: { fontSize: 10, fontWeight: '600', color: 'white' },

  // Processing
  processingOverlay: {
    alignItems: 'center',
    gap: spacing.md,
  },
  processingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.base,
    fontWeight: '500',
  },

  // Tap to scan
  tapToScan: {
    alignItems: 'center',
    gap: spacing.md,
  },
  tapToScanCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(45,220,140,0.15)',
    borderWidth: 2,
    borderColor: colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToScanText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.base,
    fontWeight: '500',
  },

  // Result card
  resultCard: {
    backgroundColor: '#1a1f24',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultFood: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: 'white',
  },
  resultConf: { fontSize: fontSize.sm, marginTop: 2 },
  resultCal: {
    fontSize: 28,
    fontWeight: '800',
  },
  resultMacros: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  macroItem: { alignItems: 'flex-start' },
  macroValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  macroLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  goalText: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },

  // Log button
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  logBtnText: { fontSize: fontSize.lg, fontWeight: '700' },

  // Meal picker
  mealPicker: { gap: spacing.sm },
  mealPickerLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  mealPickerBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  mealPickerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  mealPickerBtnText: { fontSize: fontSize.base, fontWeight: '600' },

  // Bottom controls
  bottomControls: {
    backgroundColor: '#111',
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  modeTabText: { fontSize: fontSize.sm },
  utilRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  utilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  utilText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
});