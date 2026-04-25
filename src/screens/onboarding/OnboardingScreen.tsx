import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── USERNAME VALIDATION ───────────────────────────────────────
const validateUsername = (v: string): string | null => {
  if (v.length < 3) return 'At least 3 characters required';
  if (v.length > 30) return 'Maximum 30 characters';
  if (!/^[a-z0-9._]+$/.test(v)) return 'Lowercase letters, numbers, dots and underscores only';
  if (/^[._]/.test(v) || /[._]$/.test(v)) return 'Cannot start or end with dot or underscore';
  if (/[._]{2,}/.test(v)) return 'No consecutive dots or underscores';
  return null;
};

// ── PROGRESS DOTS ─────────────────────────────────────────────
function ProgressDots({ step, total, theme }: {
  step: number; total: number; theme: typeof colors.light;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: Math.min(total, 15) }).map((_, i) => (
        <View key={i} style={[styles.dot, {
          backgroundColor: i < step ? theme.accent : theme.border,
          width: i === step - 1 ? 20 : 6,
        }]} />
      ))}
    </View>
  );
}

// ── PLAN NUDGE ────────────────────────────────────────────────
function PlanNudge({ theme, step }: { theme: typeof colors.light; step: number }) {
  const msgs = [
    'Starting your personalised plan ✨',
    'Great choice — noted ✨',
    'Building your profile ✨',
    'Calculating your targets ✨',
    'Personalising your journey ✨',
    'Adding your preferences ✨',
    'Almost there — keep going ✨',
    'Your plan is taking shape ✨',
    'Fine-tuning your programme ✨',
    'Nearly done — exciting! ✨',
    'Last few details ✨',
    'Setting up your account ✨',
  ];
  const msg = msgs[Math.min(step - 2, msgs.length - 1)];
  return (
    <View style={[styles.nudgeBar, { backgroundColor: theme.accentDim as string }]}>
      <View style={[styles.nudgeDot, { backgroundColor: theme.accent }]} />
      <Text style={[styles.nudgeText, { color: theme.accent }]}>{msg}</Text>
    </View>
  );
}

// ── HELPERS ───────────────────────────────────────────────────
function StepWrap({ children }: { children: React.ReactNode }) {
  return <View style={styles.stepContent}>{children}</View>;
}
function StepTitle({ text, theme }: { text: string; theme: typeof colors.light }) {
  return <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>{text}</Text>;
}
function StepSub({ text, theme }: { text: string; theme: typeof colors.light }) {
  return <Text style={[styles.stepSub, { color: theme.textSecondary }]}>{text}</Text>;
}
function Tile({ label, sub, icon, selected, onPress, theme, emoji }: {
  label: string; sub?: string; icon?: string; selected: boolean;
  onPress: () => void; theme: typeof colors.light; emoji?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={[styles.tile, { backgroundColor: selected ? theme.accent : theme.card, borderColor: selected ? theme.accent : theme.border }]}>
      <View style={styles.tileLeft}>
        {emoji ? <Text style={styles.tileEmoji}>{emoji}</Text>
          : icon ? <View style={[styles.tileIconWrap, { backgroundColor: selected ? 'rgba(255,255,255,0.20)' : theme.accentDim as string }]}>
              <Ionicons name={icon as any} size={20} color={selected ? '#fff' : theme.accent} />
            </View> : null}
        <View style={styles.tileTextWrap}>
          <Text style={[styles.tileLabel, { color: selected ? '#fff' : theme.textPrimary }]}>{label}</Text>
          {sub ? <Text style={[styles.tileSub, { color: selected ? 'rgba(255,255,255,0.75)' : theme.textSecondary }]}>{sub}</Text> : null}
        </View>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color="#fff" />}
    </TouchableOpacity>
  );
}
function GridTile({ label, selected, onPress, theme, emoji }: {
  label: string; selected: boolean; onPress: () => void; theme: typeof colors.light; emoji?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={[styles.gridTile, { backgroundColor: selected ? theme.accent : theme.card, borderColor: selected ? theme.accent : theme.border }]}>
      {emoji ? <Text style={styles.gridEmoji}>{emoji}</Text> : null}
      <Text style={[styles.gridLabel, { color: selected ? '#fff' : theme.textPrimary }]}>{label}</Text>
      {selected && <View style={styles.gridCheck}><Ionicons name="checkmark-circle" size={18} color="#fff" /></View>}
    </TouchableOpacity>
  );
}

// ── STEPS ─────────────────────────────────────────────────────

function Step1Welcome({ theme }: { theme: typeof colors.light }) {
  return (
    <StepWrap>
      <View style={styles.splashWrap}>
        <LinearGradient colors={[theme.heroCard, theme.accent + '33'] as [string, string]} style={styles.splashHero}>
          <View style={styles.splashLogoCircle}><Text style={styles.splashLogoText}>CF</Text></View>
          <View style={styles.splashIconsRow}>
            {[{ name: 'flame', color: '#FF6B35' }, { name: 'barbell', color: theme.accent }, { name: 'nutrition', color: '#2BBCB0' }].map((ic) => (
              <View key={ic.name} style={[styles.splashIconBubble, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Ionicons name={ic.name as any} size={22} color={ic.color} />
              </View>
            ))}
          </View>
          <View style={styles.splashIconsRow}>
            {[{ name: 'water', color: '#4A90E2' }, { name: 'heart', color: '#F0427C' }].map((ic) => (
              <View key={ic.name} style={[styles.splashIconBubble, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Ionicons name={ic.name as any} size={20} color={ic.color} />
              </View>
            ))}
          </View>
        </LinearGradient>
        <Text style={[styles.splashTitle, { color: theme.textPrimary }]}>Your fitness,{'\n'}<Text style={{ color: theme.accent }}>personalised.</Text></Text>
        <Text style={[styles.splashSub, { color: theme.textSecondary }]}>Answer a few questions and CalFit builds a plan made just for you — calories, macros, meals and workouts.</Text>
        <View style={[styles.statsRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {[{ num: '2M+', label: 'Members' }, { num: '98%', label: 'Hit goals' }, { num: '4.9★', label: 'Rating' }].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statNum, { color: theme.accent }]}>{s.num}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </StepWrap>
  );
}

function Step2Goal({ theme, selected, onSelect }: { theme: typeof colors.light; selected: string; onSelect: (g: string) => void }) {
  const goals = [{ label: 'Lose Weight', emoji: '🔥' }, { label: 'Build Muscle', emoji: '💪' }, { label: 'Get Fit', emoji: '⚡' }, { label: 'Maintain Weight', emoji: '⚖️' }, { label: 'Gain Weight', emoji: '📈' }, { label: 'Improve Diet', emoji: '🥗' }];
  return (<StepWrap><StepTitle text={`What's your\nprimary goal?`} theme={theme} /><StepSub text="We'll build your entire plan around this." theme={theme} /><View style={styles.gridRow}>{goals.map((g) => <GridTile key={g.label} label={g.label} emoji={g.emoji} selected={selected === g.label} onPress={() => onSelect(g.label)} theme={theme} />)}</View></StepWrap>);
}

function Step3Gender({ theme, selected, onSelect }: { theme: typeof colors.light; selected: string; onSelect: (g: string) => void }) {
  return (<StepWrap><StepTitle text="Which best describes you?" theme={theme} /><StepSub text="This helps us calculate your calorie needs accurately." theme={theme} /><View style={styles.levelList}>{[{ label: 'Male', emoji: '♂️' }, { label: 'Female', emoji: '♀️' }, { label: 'Other', emoji: '⚧️' }].map((o) => <Tile key={o.label} label={o.label} emoji={o.emoji} selected={selected === o.label} onPress={() => onSelect(o.label)} theme={theme} />)}</View></StepWrap>);
}

function Step4Age({ theme, value, onChange }: { theme: typeof colors.light; value: string; onChange: (v: string) => void }) {
  return (<StepWrap><StepTitle text="How old are you?" theme={theme} /><StepSub text="Your metabolism and calorie targets depend on this." theme={theme} /><View style={styles.bigInputWrap}><TextInput value={value} onChangeText={onChange} placeholder="25" placeholderTextColor={theme.textMuted} keyboardType="number-pad" maxLength={3} style={[styles.bigInput, { color: theme.textPrimary, borderColor: value ? theme.accent : theme.border }]} /><Text style={[styles.bigInputSuffix, { color: theme.textSecondary }]}>years</Text></View></StepWrap>);
}

function Step5Stats({ theme, height, setHeight, weight, setWeight }: { theme: typeof colors.light; height: string; setHeight: (v: string) => void; weight: string; setWeight: (v: string) => void }) {
  return (
    <StepWrap>
      <StepTitle text={`Your height\n& weight`} theme={theme} />
      <StepSub text="Used to calculate your BMR and daily calorie target." theme={theme} />
      <View style={styles.fieldsWrap}>
        {[{ label: 'Height', value: height, onChange: setHeight, suffix: 'cm', placeholder: '175', icon: 'resize-outline' }, { label: 'Current Weight', value: weight, onChange: setWeight, suffix: 'kg', placeholder: '75', icon: 'scale-outline' }].map((f) => (
          <View key={f.label}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{f.label}</Text>
            <View style={[styles.fieldInput, { backgroundColor: theme.card, borderColor: f.value ? theme.accent : theme.border }]}>
              <Ionicons name={f.icon as any} size={18} color={theme.textMuted} />
              <TextInput value={f.value} onChangeText={f.onChange} placeholder={f.placeholder} placeholderTextColor={theme.textMuted} keyboardType="decimal-pad" style={[styles.fieldTextInput, { color: theme.textPrimary }]} />
              <Text style={[styles.fieldSuffix, { color: theme.textMuted }]}>{f.suffix}</Text>
            </View>
          </View>
        ))}
      </View>
    </StepWrap>
  );
}

function Step6Target({ theme, value, onChange }: { theme: typeof colors.light; value: string; onChange: (v: string) => void }) {
  return (<StepWrap><StepTitle text="What's your goal weight?" theme={theme} /><StepSub text="We'll track your progress toward this milestone." theme={theme} /><View style={styles.bigInputWrap}><TextInput value={value} onChangeText={onChange} placeholder="70" placeholderTextColor={theme.textMuted} keyboardType="decimal-pad" maxLength={5} style={[styles.bigInput, { color: theme.textPrimary, borderColor: value ? theme.accent : theme.border }]} /><Text style={[styles.bigInputSuffix, { color: theme.textSecondary }]}>kg</Text></View></StepWrap>);
}

function Step7Activity({ theme, selected, onSelect }: { theme: typeof colors.light; selected: string; onSelect: (a: string) => void }) {
  const levels = [{ label: 'Sedentary', sub: 'Desk job, little exercise', icon: 'bed-outline' }, { label: 'Lightly Active', sub: '1–3 days of exercise/week', icon: 'walk-outline' }, { label: 'Moderately Active', sub: '3–5 days of exercise/week', icon: 'bicycle-outline' }, { label: 'Very Active', sub: '6–7 days of hard training', icon: 'barbell-outline' }, { label: 'Athlete', sub: 'Training twice a day', icon: 'trophy-outline' }];
  return (<StepWrap><StepTitle text={`How active are\nyou right now?`} theme={theme} /><StepSub text="Be honest — we'll calibrate your calorie burn from this." theme={theme} /><View style={styles.levelList}>{levels.map((l) => <Tile key={l.label} label={l.label} sub={l.sub} icon={l.icon} selected={selected === l.label} onPress={() => onSelect(l.label)} theme={theme} />)}</View></StepWrap>);
}

function Step8Experience({ theme, selected, onSelect }: { theme: typeof colors.light; selected: string; onSelect: (e: string) => void }) {
  return (<StepWrap><StepTitle text="Your fitness experience?" theme={theme} /><StepSub text="We'll match workout difficulty and progression to your level." theme={theme} /><View style={styles.levelList}>{[{ label: 'Beginner', sub: 'New to structured training', emoji: '🌱' }, { label: 'Intermediate', sub: 'Training for 1–2 years', emoji: '💪' }, { label: 'Advanced', sub: 'Serious athlete / 3+ years', emoji: '🏆' }].map((l) => <Tile key={l.label} label={l.label} sub={l.sub} emoji={l.emoji} selected={selected === l.label} onPress={() => onSelect(l.label)} theme={theme} />)}</View></StepWrap>);
}

function Step9Equipment({ theme, selected, onSelect }: { theme: typeof colors.light; selected: string; onSelect: (e: string) => void }) {
  return (<StepWrap><StepTitle text="Where do you work out?" theme={theme} /><StepSub text="We'll build workouts that fit your setup." theme={theme} /><View style={styles.levelList}>{[{ label: 'Gym', sub: 'Full equipment access', emoji: '🏋️' }, { label: 'Home', sub: 'Bodyweight or basic gear', emoji: '🏠' }, { label: 'Both', sub: 'Gym some days, home others', emoji: '🔄' }, { label: 'Outdoors', sub: 'Running, cycling, parks', emoji: '🌳' }].map((o) => <Tile key={o.label} label={o.label} sub={o.sub} emoji={o.emoji} selected={selected === o.label} onPress={() => onSelect(o.label)} theme={theme} />)}</View></StepWrap>);
}

function Step10Track({ theme, selected, onToggle }: { theme: typeof colors.light; selected: string[]; onToggle: (i: string) => void }) {
  const options = [{ label: 'Calories', emoji: '🔥' }, { label: 'Water Intake', emoji: '💧' }, { label: 'Workouts', emoji: '🏋️' }, { label: 'Steps', emoji: '👟' }, { label: 'Sleep', emoji: '😴' }, { label: 'Macros', emoji: '🥗' }, { label: 'Accountability', emoji: '🤝' }, { label: 'Fasting', emoji: '⏱️' }];
  return (<StepWrap><StepTitle text={`What do you\nwant to track?`} theme={theme} /><StepSub text="Choose as many as you like — you can change this anytime." theme={theme} /><View style={styles.gridRow}>{options.map((o) => <GridTile key={o.label} label={o.label} emoji={o.emoji} selected={selected.includes(o.label)} onPress={() => onToggle(o.label)} theme={theme} />)}</View></StepWrap>);
}

function Step11Diet({ theme, selected, onToggle, other, setOther }: { theme: typeof colors.light; selected: string[]; onToggle: (i: string) => void; other: string; setOther: (v: string) => void }) {
  const diets = [{ label: 'No Preference', emoji: '🍽️' }, { label: 'Vegan', emoji: '🌱' }, { label: 'Vegetarian', emoji: '🥦' }, { label: 'Keto', emoji: '🥑' }, { label: 'Halal', emoji: '☪️' }, { label: 'Paleo', emoji: '🥩' }, { label: 'Gluten Free', emoji: '🌾' }, { label: 'Pescatarian', emoji: '🐟' }];
  return (
    <StepWrap>
      <StepTitle text={`Any dietary\npreferences?`} theme={theme} />
      <StepSub text="We'll filter meals and food suggestions around this." theme={theme} />
      <View style={styles.gridRow}>{diets.map((d) => <GridTile key={d.label} label={d.label} emoji={d.emoji} selected={selected.includes(d.label)} onPress={() => onToggle(d.label)} theme={theme} />)}</View>
      <View style={[styles.otherWrap, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Ionicons name="create-outline" size={18} color={theme.textMuted} />
        <TextInput value={other} onChangeText={setOther} placeholder="Other (type your preference)" placeholderTextColor={theme.textMuted} style={[styles.otherInput, { color: theme.textPrimary }]} />
      </View>
    </StepWrap>
  );
}

function Step12Fasting({ theme, selected, onSelect }: { theme: typeof colors.light; selected: string; onSelect: (f: string) => void }) {
  return (<StepWrap><StepTitle text={`Intermittent\nfasting?`} theme={theme} /><StepSub text="CalFit can integrate IF into your daily nutrition plan." theme={theme} /><View style={styles.levelList}>{[{ label: 'Yes, guide me', sub: "We'll build IF into your daily plan", emoji: '⏱️' }, { label: 'I already do it', sub: "We'll respect your existing protocol", emoji: '✅' }, { label: 'No thanks', sub: 'Stick to regular meal timing', emoji: '🍽️' }].map((o) => <Tile key={o.label} label={o.label} sub={o.sub} emoji={o.emoji} selected={selected === o.label} onPress={() => onSelect(o.label)} theme={theme} />)}</View></StepWrap>);
}

function Step12bProtocol({ theme, selected, onSelect }: { theme: typeof colors.light; selected: string; onSelect: (p: string) => void }) {
  return (
    <StepWrap>
      <StepTitle text="Choose your fasting style" theme={theme} />
      <StepSub text="We'll integrate this into your daily plan and reminders." theme={theme} />
      <View style={styles.levelList}>{[{ label: '16:8', sub: '16h fast, 8h eating window', emoji: '🕐' }, { label: '18:6', sub: '18h fast, 6h eating window', emoji: '🕕' }, { label: '20:4', sub: '20h fast, 4h eating window', emoji: '🕗' }, { label: 'Custom', sub: "I'll set my own window", emoji: '⚙️' }].map((p) => <Tile key={p.label} label={p.label} sub={p.sub} emoji={p.emoji} selected={selected === p.label} onPress={() => onSelect(p.label)} theme={theme} />)}</View>
      <View style={[styles.ifNote, { backgroundColor: theme.accentDim as string }]}>
        <Ionicons name="information-circle-outline" size={16} color={theme.accent} />
        <Text style={[styles.ifNoteText, { color: theme.accent }]}>We'll integrate this into your daily plan.</Text>
      </View>
    </StepWrap>
  );
}

function Step13Sleep({ theme, selected, onSelect }: { theme: typeof colors.light; selected: string; onSelect: (s: string) => void }) {
  return (<StepWrap><StepTitle text="How much sleep do you get?" theme={theme} /><StepSub text="Sleep affects recovery, hunger hormones and fat loss. We track it." theme={theme} /><View style={styles.levelList}>{[{ label: 'Less than 6h', emoji: '😫' }, { label: '6–7 hours', emoji: '😴' }, { label: '7–8 hours', emoji: '😊' }, { label: '8+ hours', emoji: '🌟' }].map((o) => <Tile key={o.label} label={o.label} emoji={o.emoji} selected={selected === o.label} onPress={() => onSelect(o.label)} theme={theme} />)}</View></StepWrap>);
}

function Step14CalfitId({ theme, value, onChange }: { theme: typeof colors.light; value: string; onChange: (v: string) => void }) {
  const error = value.length > 0 ? validateUsername(value) : null;
  return (
    <StepWrap>
      <StepTitle text={`Choose your\nCalFit ID`} theme={theme} />
      <StepSub text="Your unique handle. Others can find and add you as a partner." theme={theme} />
      <View style={[styles.fieldInput, { backgroundColor: theme.card, borderColor: error ? theme.red : value.length > 0 ? theme.accent : theme.border, borderWidth: 2, marginBottom: spacing.sm }]}>
        <Text style={[styles.atSign, { color: theme.accent }]}>@</Text>
        <TextInput value={value} onChangeText={(v) => onChange(v.toLowerCase().replace(/\s/g, ''))} placeholder="your_username" placeholderTextColor={theme.textMuted} autoCapitalize="none" autoCorrect={false} style={[styles.fieldTextInput, { color: theme.textPrimary }]} />
        {value.length > 0 && <Ionicons name={error ? 'close-circle' : 'checkmark-circle'} size={20} color={error ? theme.red : theme.accent} />}
      </View>
      {error ? <Text style={[styles.errorText, { color: theme.red }]}>{error}</Text>
        : value.length >= 3 ? <View style={styles.availRow}><Ionicons name="checkmark-circle" size={16} color={theme.accent} /><Text style={[styles.availText, { color: theme.accent }]}>calfit.app/@{value} looks good!</Text></View>
        : null}
      <Text style={[styles.fieldNote, { color: theme.textMuted }]}>Lowercase letters, numbers, dots and underscores only.</Text>
    </StepWrap>
  );
}

function Step15Account({ theme, email, setEmail, password, setPassword }: {
  theme: typeof colors.light; email: string; setEmail: (v: string) => void; password: string; setPassword: (v: string) => void;
}) {
  const [showPwd, setShowPwd] = useState(false);
  return (
    <StepWrap>
      <StepTitle text={`Almost there!\nCreate your account`} theme={theme} />
      <StepSub text="Your plan is ready. Set your email and password to save it." theme={theme} />
      <TouchableOpacity style={[styles.socialAuthBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.socialAuthIcon}>G</Text>
        <Text style={[styles.socialAuthText, { color: theme.textPrimary }]}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.socialAuthBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="logo-apple" size={20} color={theme.textPrimary} />
        <Text style={[styles.socialAuthText, { color: theme.textPrimary }]}>Continue with Apple</Text>
      </TouchableOpacity>
      <View style={styles.orRow}>
        <View style={[styles.orLine, { backgroundColor: theme.border }]} />
        <Text style={[styles.orText, { color: theme.textMuted }]}>or</Text>
        <View style={[styles.orLine, { backgroundColor: theme.border }]} />
      </View>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email</Text>
      <View style={[styles.fieldInput, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: spacing.md }]}>
        <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
        <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={theme.textMuted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={[styles.fieldTextInput, { color: theme.textPrimary }]} />
      </View>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Password</Text>
      <View style={[styles.fieldInput, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: spacing.md }]}>
        <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Min. 8 characters" placeholderTextColor={theme.textMuted} secureTextEntry={!showPwd} autoCorrect={false} style={[styles.fieldTextInput, { color: theme.textPrimary }]} />
        <TouchableOpacity onPress={() => setShowPwd(!showPwd)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={[styles.privacyCard, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={theme.accent} />
        <Text style={[styles.privacyText, { color: theme.textPrimary }]}>Your data is encrypted and never sold. Delete your account anytime from Settings.</Text>
      </View>
    </StepWrap>
  );
}

// ── STEP 16 — GENERATING ──────────────────────────────────────
function Step16Generating({ theme, onComplete }: { theme: typeof colors.light; onComplete: () => void }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [currentCheck, setCurrentCheck] = useState(0);
  const checks = [
    'Analysing your goals',
    'Calculating calorie targets',
    'Building your macro split',
    'Personalising your meal plan',
    'Creating your workout programme',
    'Finalising your plan',
  ];

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setCurrentCheck(i);
      if (i >= checks.length) {
        clearInterval(interval);
        setTimeout(onComplete, 800);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.generatingWrap}>
      <View style={styles.spinnerWrap}>
        <Animated.View style={[styles.spinnerOuter, { transform: [{ rotate: spin }] }]}>
          <LinearGradient
            colors={[theme.gradStart, theme.gradMid, theme.accent] as [string, string, string]}
            style={styles.spinnerGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        <View style={[styles.spinnerInner, { backgroundColor: theme.bg }]}>
          <Text style={styles.spinnerEmoji}>⚡</Text>
        </View>
      </View>
      <Text style={[styles.generatingTitle, { color: theme.textPrimary }]}>Building your plan...</Text>
      <Text style={[styles.generatingSub, { color: theme.textSecondary }]}>
        Calculating your calorie targets, macro split, meal plan and workout programme.
      </Text>
      <View style={styles.checkList}>
        {checks.map((c, i) => (
          <View key={c} style={styles.checkRow}>
            {i < currentCheck
              ? <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
              : <View style={[styles.checkEmpty, { borderColor: theme.border }]} />}
            <Text style={[styles.checkText, {
              color: i < currentCheck ? theme.textPrimary : theme.textMuted,
              fontWeight: i < currentCheck ? '600' : '400',
            }]}>{c}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── STEP 17 — PAYWALL ─────────────────────────────────────────
function Step17Paywall({ theme, calorieGoal, onPayNow, onTrial, onSkip }: {
  theme: typeof colors.light; calorieGoal: number;
  onPayNow: () => void; onTrial: () => void; onSkip: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const features = [
    'Full personalised meal plan',
    'CalFit AI Coach (unlimited)',
    'Advanced macro & calorie tracking',
    'Workout programme & routines',
    'Intermittent fasting integration',
    'Leaderboard & accountability features',
    'Priority support',
  ];

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <StepWrap>
        <View style={[styles.planReadyCard, { backgroundColor: theme.heroCard }]}>
          <Text style={styles.planReadyEmoji}>🎉</Text>
          <Text style={styles.planReadyTitle}>Your Plan is Ready!</Text>
          <Text style={styles.planReadySub}>Based on your answers, we've built a personalised programme just for you.</Text>
          <View style={styles.planStats}>
            {[
              { label: 'Daily Calories', value: `${calorieGoal.toLocaleString()} kcal` },
              { label: 'Protein Target', value: `${Math.round(calorieGoal * 0.075)}g` },
              { label: 'Weekly Workouts', value: '4 sessions' },
            ].map((s) => (
              <View key={s.label} style={styles.planStat}>
                <Text style={styles.planStatValue}>{s.value}</Text>
                <Text style={styles.planStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.paywallHeading, { color: theme.textPrimary }]}>
          We want you to experience CalFit Pro for free
        </Text>
        <Text style={[styles.paywallSub, { color: theme.textSecondary }]}>
          Unlock everything — meals, workouts, AI coach, and more. No charge for 3 full days.
        </Text>

        {features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <View style={[styles.featureCheck, { backgroundColor: theme.accent }]}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
            <Text style={[styles.featureText, { color: theme.textPrimary }]}>{f}</Text>
          </View>
        ))}

        {/* OPTION 1 — 3-Day Free Trial */}
        <TouchableOpacity onPress={onTrial} activeOpacity={0.85} style={[styles.trialBtnWrap, { marginTop: 28 }]}>
          <LinearGradient
            colors={[theme.gradStart, theme.gradMid] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.trialBtn}
          >
            <Text style={styles.trialBtnLabel}>Start 3-Day Free Trial</Text>
            <Text style={styles.trialBtnNote}>Then ₦4,999/month · Cancel anytime</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* OPTION 2 — Subscribe Now */}
        <TouchableOpacity onPress={onPayNow} activeOpacity={0.85}
          style={[styles.payNowBtn, { borderColor: theme.accent }]}>
          <Text style={[styles.payNowText, { color: theme.accent }]}>Subscribe Now — ₦4,999/month</Text>
          <Text style={[styles.payNowNote, { color: theme.textMuted }]}>No trial, start immediately</Text>
        </TouchableOpacity>

        {/* OPTION 3 — Do Later */}
        <TouchableOpacity onPress={onSkip} activeOpacity={0.7} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: theme.textMuted }]}>
            Continue with Free plan — I'll upgrade later
          </Text>
        </TouchableOpacity>

        <View style={[styles.freeNoteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
          <Text style={[styles.freeNoteText, { color: theme.textSecondary }]}>
            Free plan includes basic calorie tracking, water logging, and community access. Pro features will show a subscription prompt when tapped.
          </Text>
        </View>

        <Text style={[styles.paywallDisclaimer, { color: theme.textMuted }]}>
          Free trial requires payment details. You will not be charged until day 4. Cancel anytime in Settings or your App Store account.
        </Text>
        <View style={{ height: 40 }} />
      </StepWrap>
    </Animated.View>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { setOnboarding } = useAuthStore();
  const theme = colors[colorScheme];

  const [step, setStep]                       = useState(1);
  const [goal, setGoal]                       = useState('');
  const [gender, setGender]                   = useState('');
  const [age, setAge]                         = useState('');
  const [height, setHeight]                   = useState('');
  const [weight, setWeight]                   = useState('');
  const [targetWeight, setTargetWeight]       = useState('');
  const [activity, setActivity]               = useState('');
  const [experience, setExperience]           = useState('');
  const [equipment, setEquipment]             = useState('');
  const [tracking, setTracking]               = useState<string[]>(['Calories', 'Water Intake', 'Workouts']);
  const [diet, setDiet]                       = useState<string[]>(['No Preference']);
  const [dietOther, setDietOther]             = useState('');
  const [fasting, setFasting]                 = useState('');
  const [fastingProtocol, setFastingProtocol] = useState('');
  const [sleepGoal, setSleepGoal]             = useState('');
  const [calfitId, setCalfitId]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [isLoading, setIsLoading]             = useState(false);

  const showIfProtocol = fasting === 'Yes, guide me' || fasting === 'I already do it';
  const accountStep    = showIfProtocol ? 16 : 15;
  const generatingStep = showIfProtocol ? 17 : 16;
  const paywallStep    = showIfProtocol ? 18 : 17;

  const estimatedCalories = (() => {
    const w = parseFloat(weight) || 75;
    const h = parseFloat(height) || 175;
    const a = parseInt(age) || 25;
    const bmr = gender === 'Female'
      ? 10 * w + 6.25 * h - 5 * a - 161
      : 10 * w + 6.25 * h - 5 * a + 5;
    const mult = activity === 'Sedentary' ? 1.2
      : activity === 'Lightly Active' ? 1.375
      : activity === 'Moderately Active' ? 1.55
      : activity === 'Very Active' ? 1.725 : 1.9;
    return Math.round(bmr * mult);
  })();

  const getStepComponent = () => {
    switch (step) {
      case 1:  return <Step1Welcome theme={theme} />;
      case 2:  return <Step2Goal theme={theme} selected={goal} onSelect={setGoal} />;
      case 3:  return <Step3Gender theme={theme} selected={gender} onSelect={setGender} />;
      case 4:  return <Step4Age theme={theme} value={age} onChange={setAge} />;
      case 5:  return <Step5Stats theme={theme} height={height} setHeight={setHeight} weight={weight} setWeight={setWeight} />;
      case 6:  return <Step6Target theme={theme} value={targetWeight} onChange={setTargetWeight} />;
      case 7:  return <Step7Activity theme={theme} selected={activity} onSelect={setActivity} />;
      case 8:  return <Step8Experience theme={theme} selected={experience} onSelect={setExperience} />;
      case 9:  return <Step9Equipment theme={theme} selected={equipment} onSelect={setEquipment} />;
      case 10: return <Step10Track theme={theme} selected={tracking} onToggle={(i) => setTracking((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i])} />;
      case 11: return <Step11Diet theme={theme} selected={diet} onToggle={(i) => setDiet((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i])} other={dietOther} setOther={setDietOther} />;
      case 12: return <Step12Fasting theme={theme} selected={fasting} onSelect={setFasting} />;
      case 13: return showIfProtocol
        ? <Step12bProtocol theme={theme} selected={fastingProtocol} onSelect={setFastingProtocol} />
        : <Step13Sleep theme={theme} selected={sleepGoal} onSelect={setSleepGoal} />;
      case 14: return showIfProtocol
        ? <Step13Sleep theme={theme} selected={sleepGoal} onSelect={setSleepGoal} />
        : <Step14CalfitId theme={theme} value={calfitId} onChange={setCalfitId} />;
      case 15: return showIfProtocol
        ? <Step14CalfitId theme={theme} value={calfitId} onChange={setCalfitId} />
        : <Step15Account theme={theme} email={email} setEmail={setEmail} password={password} setPassword={setPassword} />;
      case 16: return showIfProtocol
        ? <Step15Account theme={theme} email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
        : <Step16Generating theme={theme} onComplete={() => setStep(paywallStep)} />;
      case 17: return showIfProtocol
        ? <Step16Generating theme={theme} onComplete={() => setStep(paywallStep)} />
        : <Step17Paywall theme={theme} calorieGoal={estimatedCalories} onPayNow={handlePayNow} onTrial={handleTrial} onSkip={handleSkip} />;
      case 18: return <Step17Paywall theme={theme} calorieGoal={estimatedCalories} onPayNow={handlePayNow} onTrial={handleTrial} onSkip={handleSkip} />;
      default: return null;
    }
  };

  const isGenerating = step === generatingStep;
  const isPaywall    = step === paywallStep;
  const showHeader   = !isGenerating && !isPaywall;
  const showDots     = step > 1 && !isGenerating && !isPaywall;
  const showNudge    = step > 1 && !isGenerating && !isPaywall;
  const showCTA      = !isGenerating && !isPaywall;

  const handleNext = async () => {
    if (step === 2 && !goal)                { Alert.alert('Pick a goal', 'Select your primary goal to continue.'); return; }
    if (step === 3 && !gender)              { Alert.alert('Required', 'Please select an option.'); return; }
    if (step === 4 && !age)                 { Alert.alert('Required', 'Please enter your age.'); return; }
    if (step === 5 && (!height || !weight)) { Alert.alert('Required', 'Please enter your height and weight.'); return; }

    if (step === accountStep) {
      if (!email || !password) { Alert.alert('Almost there!', 'Please enter your email and password.'); return; }
      if (password.length < 8) { Alert.alert('Weak password', 'Password must be at least 8 characters.'); return; }
      try {
        setIsLoading(true);
        const { supabase } = await import('../../services/supabase');
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          // KEY FIX: Set isOnboarding=true BEFORE profile upsert
          // This prevents the auth listener from redirecting to main app
          setOnboarding(true);

          await supabase.from('profiles').upsert({
            id: data.user.id,
            calfit_id: calfitId || null,
            goal: goal || null,
            gender: gender || null,
            activity_level: activity || null,
            experience_level: experience || null,
            equipment_preference: equipment || null,
            dietary_preference: diet,
            dietary_other: dietOther || null,
            tracking_preferences: tracking,
            fasting_protocol: fastingProtocol || null,
            sleep_goal: sleepGoal || null,
            age: parseInt(age) || null,
            height_cm: parseFloat(height) || null,
            current_weight_kg: parseFloat(weight) || null,
            target_weight_kg: parseFloat(targetWeight) || null,
          });
        }
        // Advance to generating animation
        setStep(generatingStep);
      } catch (err: any) {
        setOnboarding(false); // reset if signup fails
        Alert.alert('Sign Up Failed', err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setStep((s) => s + 1);
  };

  // All three paywall exits must call setOnboarding(false)
  // so AppNavigator releases to the main app stack
  const handleTrial = () => {
    setOnboarding(false);
    navigation.navigate('Subscription', { plan: 'pro', trial: true });
  };

  const handlePayNow = () => {
    setOnboarding(false);
    navigation.navigate('Subscription', { plan: 'pro', trial: false });
  };

  const handleSkip = () => {
    // Release to main app on free plan
    // Auth listener already has the session — setting isOnboarding=false
    // causes AppNavigator to switch to the main stack automatically
    setOnboarding(false);
  };

  const handleBack = () => {
    if (isGenerating || isPaywall) return;
    if (step > 1) setStep((s) => s - 1);
    else navigation.goBack();
  };

  const btnLabel = isLoading ? ''
    : step === 1 ? "Let's get started →"
    : step === accountStep ? 'Create My Account'
    : 'Continue →';

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      {showHeader && (
        <View style={styles.header}>
          {step > 1
            ? <TouchableOpacity onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
              </TouchableOpacity>
            : <View style={{ width: 26 }} />}
          <Text style={[styles.logo, { color: theme.accent }]}>CalFit</Text>
          {step > 1
            ? <Text style={[styles.stepCounter, { color: theme.textMuted }]}>{step - 1}/{accountStep - 1}</Text>
            : <View style={{ width: 40 }} />}
        </View>
      )}

      {showDots && <ProgressDots step={step - 1} total={accountStep - 1} theme={theme} />}
      {showNudge && <PlanNudge theme={theme} step={step} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isGenerating && styles.scrollCenter]}
        keyboardShouldPersistTaps="handled"
      >
        {getStepComponent()}
      </ScrollView>

      {showCTA && (
        <View style={[styles.bottomBar, { backgroundColor: theme.bg }]}>
          <TouchableOpacity onPress={handleNext} disabled={isLoading} activeOpacity={0.85} style={styles.ctaBtnWrap}>
            <LinearGradient
              colors={step === 1
                ? [theme.accent, theme.accent] as [string, string]
                : [theme.gradStart, theme.gradMid] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.ctaBtnText}>{btnLabel}</Text>}
            </LinearGradient>
          </TouchableOpacity>
          {step === 1 && (
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.signInRow}>
              <Text style={[styles.signInText, { color: theme.textMuted }]}>
                Already have an account?{' '}
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  scrollCenter: { flexGrow: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  logo: { fontSize: fontSize.xl, fontWeight: '800' },
  stepCounter: { fontSize: fontSize.sm, fontWeight: '600' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  dot: { height: 6, borderRadius: 3 },
  nudgeBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 99 },
  nudgeDot: { width: 6, height: 6, borderRadius: 3 },
  nudgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  stepContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  stepTitle: { fontSize: 30, fontWeight: '800', marginBottom: spacing.sm, lineHeight: 36 },
  stepSub: { fontSize: fontSize.base, marginBottom: 24, lineHeight: 22 },
  splashWrap: { alignItems: 'center', paddingTop: spacing.md },
  splashHero: { width: SCREEN_W - spacing.lg * 2, height: 200, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 12 },
  splashLogoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
  splashLogoText: { fontSize: 28, fontWeight: '900', color: '#fff' },
  splashIconsRow: { flexDirection: 'row', gap: 12 },
  splashIconBubble: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  splashTitle: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 12, lineHeight: 38 },
  splashSub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 12 },
  statsRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, paddingVertical: 16, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: fontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xs, marginTop: 2 },
  tile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: 16, borderWidth: 1.5, marginBottom: spacing.sm },
  tileLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  tileEmoji: { fontSize: 24, width: 36, textAlign: 'center' },
  tileIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tileTextWrap: { flex: 1 },
  tileLabel: { fontSize: fontSize.base, fontWeight: '700' },
  tileSub: { fontSize: fontSize.sm, marginTop: 2 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridTile: { width: '47%', padding: spacing.md, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', gap: spacing.sm, minHeight: 90, justifyContent: 'center', position: 'relative' },
  gridEmoji: { fontSize: 28 },
  gridLabel: { fontSize: fontSize.sm, fontWeight: '700', textAlign: 'center' },
  gridCheck: { position: 'absolute', top: 8, right: 8 },
  levelList: { gap: spacing.sm },
  bigInputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  bigInput: { fontSize: 56, fontWeight: '800', borderBottomWidth: 3, paddingBottom: 8, minWidth: 120, textAlign: 'center' },
  bigInputSuffix: { fontSize: fontSize.xl, fontWeight: '600' },
  fieldsWrap: { gap: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  fieldInput: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: 12, borderWidth: 1.5, marginBottom: spacing.sm },
  fieldTextInput: { flex: 1, fontSize: fontSize.lg, paddingVertical: 2 },
  fieldSuffix: { fontSize: fontSize.base, fontWeight: '600' },
  atSign: { fontSize: fontSize.xl, fontWeight: '700' },
  fieldNote: { fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 18 },
  otherWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: 12, borderWidth: 1, marginTop: spacing.sm },
  otherInput: { flex: 1, fontSize: fontSize.base },
  ifNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: 12, marginTop: spacing.md },
  ifNoteText: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  errorText: { fontSize: fontSize.xs, fontWeight: '600', marginTop: 4 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  availText: { fontSize: fontSize.sm, fontWeight: '600' },
  socialAuthBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 16, borderWidth: 1.5, marginBottom: spacing.sm },
  socialAuthIcon: { fontSize: 18, fontWeight: '900', color: '#4285F4' },
  socialAuthText: { fontSize: fontSize.base, fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: fontSize.sm, fontWeight: '600' },
  privacyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: 12, borderWidth: 1, marginTop: spacing.sm },
  privacyText: { fontSize: fontSize.sm, flex: 1, lineHeight: 18 },
  generatingWrap: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 48 },
  spinnerWrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  spinnerOuter: { position: 'absolute', width: 100, height: 100, borderRadius: 50 },
  spinnerGradient: { width: 100, height: 100, borderRadius: 50 },
  spinnerInner: { position: 'absolute', width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  spinnerEmoji: { fontSize: 32 },
  generatingTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  generatingSub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  checkList: { width: '100%', gap: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkEmpty: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
  checkText: { fontSize: fontSize.base },
  planReadyCard: { padding: 20, borderRadius: 20, marginBottom: 24 },
  planReadyEmoji: { fontSize: 32, marginBottom: 8 },
  planReadyTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  planReadySub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 16, lineHeight: 20 },
  planStats: { flexDirection: 'row', justifyContent: 'space-between' },
  planStat: { alignItems: 'center' },
  planStatValue: { fontSize: fontSize.base, fontWeight: '800', color: '#fff' },
  planStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  paywallHeading: { fontSize: 22, fontWeight: '800', marginBottom: 8, lineHeight: 28 },
  paywallSub: { fontSize: fontSize.base, lineHeight: 22, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  featureCheck: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureText: { fontSize: fontSize.base, fontWeight: '500' },
  trialBtnWrap: { borderRadius: 20, overflow: 'hidden' },
  trialBtn: { padding: 18, alignItems: 'center' },
  trialBtnLabel: { fontSize: fontSize.lg, fontWeight: '800', color: '#fff' },
  trialBtnNote: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.80)', marginTop: 4 },
  payNowBtn: { marginTop: 12, padding: 16, borderRadius: 20, borderWidth: 2, alignItems: 'center' },
  payNowText: { fontSize: fontSize.base, fontWeight: '700' },
  payNowNote: { fontSize: fontSize.xs, marginTop: 4 },
  skipBtn: { padding: 16, alignItems: 'center' },
  skipText: { fontSize: fontSize.sm, fontWeight: '600', textDecorationLine: 'underline' },
  freeNoteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  freeNoteText: { fontSize: fontSize.xs, flex: 1, lineHeight: 17 },
  paywallDisclaimer: { fontSize: fontSize.xs, textAlign: 'center', lineHeight: 16, paddingHorizontal: 16, marginTop: 16 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, paddingBottom: 36 },
  ctaBtnWrap: { borderRadius: 20, overflow: 'hidden' },
  ctaBtn: { padding: 18, alignItems: 'center', borderRadius: 20 },
  ctaBtnText: { fontSize: fontSize.lg, fontWeight: '800', color: '#fff' },
  signInRow: { alignItems: 'center', marginTop: spacing.md },
  signInText: { fontSize: fontSize.sm },
});