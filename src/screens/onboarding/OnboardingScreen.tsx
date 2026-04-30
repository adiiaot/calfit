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
import * as WebBrowser from 'expo-web-browser';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { supabase } from '../../services/supabase';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

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
function ProgressDots({ step, total, theme }: { step: number; total: number; theme: typeof colors.light }) {
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

function PlanNudge({ theme, step }: { theme: typeof colors.light; step: number }) {
  const msgs = [
    'Starting your personalised plan ✨', 'Great choice — noted ✨', 'Building your profile ✨',
    'Calculating your targets ✨', 'Personalising your journey ✨', 'Adding your preferences ✨',
    'Almost there — keep going ✨', 'Your plan is taking shape ✨', 'Fine-tuning your programme ✨',
    'Nearly done — exciting! ✨', 'Last few details ✨', 'Setting up your account ✨',
  ];
  return (
    <View style={[styles.nudgeBar, { backgroundColor: theme.accentDim as string }]}>
      <View style={[styles.nudgeDot, { backgroundColor: theme.accent }]} />
      <Text style={[styles.nudgeText, { color: theme.accent }]}>{msgs[Math.min(step - 2, msgs.length - 1)]}</Text>
    </View>
  );
}

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

// ── STEP 1 — WELCOME ──────────────────────────────────────────
function Step1Welcome({ theme }: { theme: typeof colors.light }) {
  const cards = [
    { icon: 'camera-outline',              title: 'Track Calories',          sub: 'Scan food, log meals,\ntrack macros & stay hydrated.' },
    { icon: 'chatbubble-ellipses-outline', title: 'CalFit Coach',            sub: 'Personalized guidance\nwhenever you need it.' },
    { icon: 'barbell-outline',             title: 'Workouts & Sleep',        sub: 'Track workouts, sleep\nquality & daily steps.' },
    { icon: 'timer-outline',              title: 'Intermittent Fasting',    sub: 'Plan, track & optimize\nyour fasting windows.' },
    { icon: 'people-outline',             title: 'Social & Accountability', sub: 'Connect, share progress\n& stay accountable.' },
    { icon: 'star-outline',               title: 'Rewards & Referrals',     sub: 'Earn CalFit Points & unlock\nexciting rewards.' },
  ];
  return (
    <View style={styles.welcomeWrap}>
      <View style={styles.welcomeGlow} />
      <Text style={styles.welcomeLogo}>CALFIT</Text>
      <Text style={styles.welcomeTagline}>
        Your <Text style={{ color: theme.accent }}>personal</Text> fitness and{' '}
        <Text style={{ color: theme.accent }}>nutrition</Text> coach
      </Text>
      <View style={styles.featureGrid}>
        {cards.map((c, i) => (
          <View key={c.title} style={[styles.featureCard, i === 0 && styles.featureCardActive]}>
            <View style={[styles.featureIconWrap, { borderColor: i === 0 ? theme.accent : 'rgba(45,220,140,0.25)' }]}>
              <Ionicons name={c.icon as any} size={26} color={theme.accent} />
            </View>
            <Text style={styles.featureCardTitle}>{c.title}</Text>
            <Text style={styles.featureCardSub}>{c.sub}</Text>
            <View style={[styles.featureCardLine, { backgroundColor: i === 0 ? theme.accent : 'rgba(45,220,140,0.30)' }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

function FactScreen({ theme, factIndex }: { theme: typeof colors.light; factIndex: number }) {
  const facts = [
    { emoji: '🔥', headline: 'Did you know?', stat: 'People who track calories lose\n2x more weight', body: 'Studies show that consistent calorie logging doubles fat loss results compared to dieting without tracking. CalFit makes it instant.', source: 'Journal of the Academy of Nutrition and Dietetics' },
    { emoji: '💪', headline: 'Did you know?', stat: '80% of fitness results\ncome from nutrition', body: 'Exercise matters — but what you eat drives most of your body composition changes. CalFit tracks both so you never miss the full picture.', source: 'American Council on Exercise' },
    { emoji: '⏱️', headline: 'Did you know?', stat: 'Intermittent fasting can boost\nmetabolism by up to 14%', body: 'Short-term fasting increases norepinephrine levels, accelerating fat burning. CalFit will integrate your fasting window into your daily plan.', source: 'National Institutes of Health' },
  ];
  const fact = facts[factIndex % facts.length];
  return (
    <View style={[styles.factWrap, { backgroundColor: theme.heroCard }]}>
      <View style={styles.factGlow} />
      <Text style={styles.factEmoji}>{fact.emoji}</Text>
      <Text style={[styles.factHeadline, { color: theme.accent }]}>{fact.headline}</Text>
      <Text style={styles.factStat}>{fact.stat}</Text>
      <Text style={[styles.factBody, { color: 'rgba(255,255,255,0.70)' }]}>{fact.body}</Text>
      <View style={[styles.factSourceRow, { borderColor: 'rgba(255,255,255,0.12)' }]}>
        <Ionicons name="document-text-outline" size={12} color="rgba(255,255,255,0.40)" />
        <Text style={styles.factSource}>{fact.source}</Text>
      </View>
      <View style={[styles.factContinueHint, { borderColor: 'rgba(45,220,140,0.30)' }]}>
        <Text style={[styles.factContinueText, { color: theme.accent }]}>We're building your plan as you answer ✨</Text>
      </View>
    </View>
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

// ── STEP 15 — ACCOUNT ─────────────────────────────────────────
// FIX: Google/Apple buttons now have working onPress handlers
// They save onboarding data first, then trigger OAuth
function Step15Account({ theme, email, setEmail, password, setPassword, onGoogleSignUp, onAppleSignUp }: {
  theme: typeof colors.light;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  onGoogleSignUp: () => void;
  onAppleSignUp: () => void;
}) {
  const [showPwd, setShowPwd] = useState(false);
  return (
    <StepWrap>
      <StepTitle text={`Almost there!\nCreate your account`} theme={theme} />
      <StepSub text="Your plan is ready. Set your email and password to save it." theme={theme} />

      {/* Google — now wired */}
      <TouchableOpacity onPress={onGoogleSignUp} style={[styles.socialAuthBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.socialAuthIcon}>G</Text>
        <Text style={[styles.socialAuthText, { color: theme.textPrimary }]}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Apple — now wired */}
      <TouchableOpacity onPress={onAppleSignUp} style={[styles.socialAuthBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
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

// ── GENERATING ────────────────────────────────────────────────
function StepGenerating({ theme, onComplete }: { theme: typeof colors.light; onComplete: () => void }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [currentCheck, setCurrentCheck] = useState(0);
  const checks = ['Analysing your goals', 'Calculating calorie targets', 'Building your macro split', 'Personalising your meal plan', 'Creating your workout programme', 'Finalising your plan'];
  useEffect(() => {
    Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })).start();
    let i = 0;
    const interval = setInterval(() => {
      i += 1; setCurrentCheck(i);
      if (i >= checks.length) { clearInterval(interval); setTimeout(onComplete, 800); }
    }, 500);
    return () => clearInterval(interval);
  }, []);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={styles.generatingWrap}>
      <View style={styles.spinnerWrap}>
        <Animated.View style={[styles.spinnerOuter, { transform: [{ rotate: spin }] }]}>
          <LinearGradient colors={[theme.gradStart, theme.gradMid, theme.accent] as [string, string, string]} style={styles.spinnerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        </Animated.View>
        <View style={[styles.spinnerInner, { backgroundColor: theme.bg }]}>
          <Text style={styles.spinnerEmoji}>⚡</Text>
        </View>
      </View>
      <Text style={[styles.generatingTitle, { color: theme.textPrimary }]}>Building your plan...</Text>
      <Text style={[styles.generatingSub, { color: theme.textSecondary }]}>Calculating your calorie targets, macro split, meal plan and workout programme.</Text>
      <View style={styles.checkList}>
        {checks.map((c, i) => (
          <View key={c} style={styles.checkRow}>
            {i < currentCheck ? <Ionicons name="checkmark-circle" size={20} color={theme.accent} /> : <View style={[styles.checkEmpty, { borderColor: theme.border }]} />}
            <Text style={[styles.checkText, { color: i < currentCheck ? theme.textPrimary : theme.textMuted, fontWeight: i < currentCheck ? '600' : '400' }]}>{c}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── PAYWALL ───────────────────────────────────────────────────
function StepPaywall({ theme, calorieGoal, onPayNow, onTrial, onSkip }: {
  theme: typeof colors.light; calorieGoal: number; onPayNow: () => void; onTrial: () => void; onSkip: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(); }, []);
  const features = ['Full personalised meal plan', 'CalFit AI Coach (unlimited)', 'Advanced macro & calorie tracking', 'Workout programme & routines', 'Intermittent fasting integration', 'Leaderboard & accountability features', 'Priority support'];
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <StepWrap>
        <View style={[styles.planReadyCard, { backgroundColor: theme.heroCard }]}>
          <Text style={styles.planReadyEmoji}>🎉</Text>
          <Text style={styles.planReadyTitle}>Your Plan is Ready!</Text>
          <Text style={styles.planReadySub}>Based on your answers, we've built a personalised programme just for you.</Text>
          <View style={styles.planStats}>
            {[{ label: 'Daily Calories', value: `${calorieGoal.toLocaleString()} kcal` }, { label: 'Protein Target', value: `${Math.round(calorieGoal * 0.075)}g` }, { label: 'Weekly Workouts', value: '4 sessions' }].map((s) => (
              <View key={s.label} style={styles.planStat}>
                <Text style={styles.planStatValue}>{s.value}</Text>
                <Text style={styles.planStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={[styles.paywallHeading, { color: theme.textPrimary }]}>We want you to experience CalFit Pro for free</Text>
        <Text style={[styles.paywallSub, { color: theme.textSecondary }]}>Unlock everything — meals, workouts, AI coach, and more. No charge for 3 full days.</Text>
        {features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <View style={[styles.featureCheck, { backgroundColor: theme.accent }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>
            <Text style={[styles.featureText, { color: theme.textPrimary }]}>{f}</Text>
          </View>
        ))}
        <TouchableOpacity onPress={onTrial} activeOpacity={0.85} style={[styles.trialBtnWrap, { marginTop: 28 }]}>
          <LinearGradient colors={[theme.gradStart, theme.gradMid] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.trialBtn}>
            <Text style={styles.trialBtnLabel}>Start 3-Day Free Trial</Text>
            <Text style={styles.trialBtnNote}>Then ₦4,999/month · Cancel anytime</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPayNow} activeOpacity={0.85} style={[styles.payNowBtn, { borderColor: theme.accent }]}>
          <Text style={[styles.payNowText, { color: theme.accent }]}>Subscribe Now — ₦4,999/month</Text>
          <Text style={[styles.payNowNote, { color: theme.textMuted }]}>No trial, start immediately</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip} activeOpacity={0.7} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: theme.textMuted }]}>Continue with Free plan — I'll upgrade later</Text>
        </TouchableOpacity>
        <View style={[styles.freeNoteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
          <Text style={[styles.freeNoteText, { color: theme.textSecondary }]}>Free plan includes basic calorie tracking, water logging, and community access. Pro features will show a subscription prompt when tapped.</Text>
        </View>
        <Text style={[styles.paywallDisclaimer, { color: theme.textMuted }]}>Free trial requires payment details. You will not be charged until day 4. Cancel anytime in Settings or your App Store account.</Text>
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

  type StepKey = 'welcome' | 'goal' | 'gender' | 'age' | 'fact1' | 'stats' | 'target'
    | 'activity' | 'experience' | 'fact2' | 'equipment' | 'track' | 'diet'
    | 'fasting' | 'ifprotocol' | 'fact3' | 'sleep' | 'calfitid' | 'account'
    | 'generating' | 'paywall';

  const baseFlow: StepKey[] = ['welcome', 'goal', 'gender', 'age', 'fact1', 'stats', 'target', 'activity', 'experience', 'fact2', 'equipment', 'track', 'diet', 'fasting'];

  const [step, setStep]                       = useState<StepKey>('welcome');
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

  const getFullFlow = (): StepKey[] => {
    const flow: StepKey[] = [...baseFlow];
    if (showIfProtocol) flow.push('ifprotocol');
    flow.push('fact3', 'sleep', 'calfitid', 'account', 'generating', 'paywall');
    return flow;
  };

  const fullFlow     = getFullFlow();
  const currentIndex = fullFlow.indexOf(step);
  const totalQuestionSteps   = fullFlow.filter(s => !['welcome', 'fact1', 'fact2', 'fact3', 'generating', 'paywall'].includes(s)).length;
  const questionStepsSoFar   = fullFlow.slice(0, currentIndex + 1).filter(s => !['welcome', 'fact1', 'fact2', 'fact3', 'generating', 'paywall'].includes(s)).length;

  const isWelcome    = step === 'welcome';
  const isGenerating = step === 'generating';
  const isPaywall    = step === 'paywall';
  const isFact       = step === 'fact1' || step === 'fact2' || step === 'fact3';

  const showHeader = !isWelcome && !isGenerating && !isPaywall;
  const showDots   = !isWelcome && !isGenerating && !isPaywall && !isFact;
  const showNudge  = !isWelcome && !isGenerating && !isPaywall && !isFact;
  const showCTA    = !isGenerating && !isPaywall;

  const estimatedCalories = (() => {
    const w = parseFloat(weight) || 75;
    const h = parseFloat(height) || 175;
    const a = parseInt(age) || 25;
    const bmr = gender === 'Female' ? 10 * w + 6.25 * h - 5 * a - 161 : 10 * w + 6.25 * h - 5 * a + 5;
    const mult = activity === 'Sedentary' ? 1.2 : activity === 'Lightly Active' ? 1.375 : activity === 'Moderately Active' ? 1.55 : activity === 'Very Active' ? 1.725 : 1.9;
    return Math.round(bmr * mult);
  })();

  const goNext = () => { const next = fullFlow[currentIndex + 1]; if (next) setStep(next); };
  const goPrev = () => {
    if (isGenerating || isPaywall) return;
    const prev = fullFlow[currentIndex - 1];
    if (prev) setStep(prev); else navigation.goBack();
  };

  // ── SAVE PROFILE DATA ─────────────────────────────────────
  // Used by both email signup and OAuth signup to persist onboarding answers
  const saveProfileData = async (userId: string) => {
    await supabase.from('profiles').upsert({
      id:                  userId,
      calfit_id:           calfitId           || null,
      goal:                goal               || null,
      gender:              gender             || null,
      activity_level:      activity           || null,
      experience_level:    experience         || null,
      equipment_preference:equipment         || null,
      dietary_preference:  diet,
      dietary_other:       dietOther          || null,
      tracking_preferences:tracking,
      fasting_protocol:    fastingProtocol    || null,
      sleep_goal:          sleepGoal          || null,
      age:                 parseInt(age)      || null,
      height_cm:           parseFloat(height) || null,
      current_weight_kg:   parseFloat(weight) || null,
      target_weight_kg:    parseFloat(targetWeight) || null,
    });
  };

  // ── GOOGLE SIGN UP FROM ONBOARDING ───────────────────────
  // Opens browser → OAuth → returns → saves profile data → goes to generating
  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      setOnboarding(true); // lock nav so auth listener doesn't redirect mid-flow

      const redirectTo = __DEV__ ? 'exp+calfit://' : 'com.bigcutstore.calfit://';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
        showInRecents: false, createTask: false,
      });

      if (result.type !== 'success' || !(result as any).url) {
        setOnboarding(false);
        setIsLoading(false);
        return;
      }

      // Parse tokens from callback URL
      const callbackUrl = (result as any).url as string;
      let accessToken: string | null  = null;
      let refreshToken: string | null = null;

      if (callbackUrl.includes('#')) {
        const params = new URLSearchParams(callbackUrl.split('#')[1]);
        accessToken  = params.get('access_token');
        refreshToken = params.get('refresh_token');
      }

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken, refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;

        if (sessionData.user) {
          await saveProfileData(sessionData.user.id);
        }
      }

      // Proceed to generating screen
      setStep('generating');
    } catch (e: any) {
      setOnboarding(false);
      Alert.alert('Google Sign Up Failed', e.message ?? 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── APPLE SIGN UP FROM ONBOARDING ────────────────────────
  // Same pattern as Google — wired and ready for when Apple Dev account arrives
  const handleAppleSignUp = async () => {
    setIsLoading(true);
    try {
      setOnboarding(true);
      const redirectTo = __DEV__ ? 'exp+calfit://' : 'com.bigcutstore.calfit://';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
        showInRecents: false, createTask: false,
      });

      if (result.type !== 'success' || !(result as any).url) {
        setOnboarding(false); setIsLoading(false); return;
      }

      const callbackUrl = (result as any).url as string;
      if (callbackUrl.includes('#')) {
        const params    = new URLSearchParams(callbackUrl.split('#')[1]);
        const at        = params.get('access_token');
        const rt        = params.get('refresh_token');
        if (at && rt) {
          const { data: sd } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          if (sd.user) await saveProfileData(sd.user.id);
        }
      }
      setStep('generating');
    } catch (e: any) {
      setOnboarding(false);
      Alert.alert('Apple Sign Up Failed', e.message ?? 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 'goal'   && !goal)                  { Alert.alert('Pick a goal', 'Select your primary goal to continue.'); return; }
    if (step === 'gender' && !gender)                { Alert.alert('Required', 'Please select an option.'); return; }
    if (step === 'age'    && !age)                   { Alert.alert('Required', 'Please enter your age.'); return; }
    if (step === 'stats'  && (!height || !weight))   { Alert.alert('Required', 'Please enter your height and weight.'); return; }

    if (step === 'account') {
      if (!email || !password) { Alert.alert('Almost there!', 'Please enter your email and password.'); return; }
      if (password.length < 8) { Alert.alert('Weak password', 'Password must be at least 8 characters.'); return; }
      try {
        setIsLoading(true);
        setOnboarding(true); // lock before signUp

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) { setOnboarding(false); throw error; }

        if (data.user) {
          await saveProfileData(data.user.id);
        }

        // FIX: proceed to generating regardless of email confirmation status.
        // If email confirmation is required, data.session will be null but
        // data.user exists. We still show the generating + paywall flow.
        // The user will confirm email in background — they can use the app
        // immediately on free tier. Supabase will gate certain actions until confirmed.
        setStep('generating');
      } catch (err: any) {
        setOnboarding(false);
        Alert.alert('Sign Up Failed', err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    goNext();
  };

  // FIX: paywall handlers now call setOnboarding(false) AFTER navigating
  // so the user lands on the main app when they come back from SubscriptionScreen
  const handleTrial = () => {
    setOnboarding(false); // release lock first
    navigation.navigate('Subscription', { plan: 'pro', trial: true, fromOnboarding: true });
  };

  const handlePayNow = () => {
    setOnboarding(false); // release lock first
    navigation.navigate('Subscription', { plan: 'pro', trial: false, fromOnboarding: true });
  };

  const handleSkip = () => {
    setOnboarding(false); // releases to main app via AppNavigator
  };

  const btnLabel = isLoading ? ''
    : step === 'welcome' ? 'Start Your Journey  →'
    : isFact ? "Got it, let's go! 🚀"
    : step === 'account' ? 'Create My Account'
    : 'Continue →';

  const getStepComponent = () => {
    switch (step) {
      case 'welcome':    return <Step1Welcome theme={theme} />;
      case 'goal':       return <Step2Goal theme={theme} selected={goal} onSelect={setGoal} />;
      case 'gender':     return <Step3Gender theme={theme} selected={gender} onSelect={setGender} />;
      case 'age':        return <Step4Age theme={theme} value={age} onChange={setAge} />;
      case 'fact1':      return <FactScreen theme={theme} factIndex={0} />;
      case 'stats':      return <Step5Stats theme={theme} height={height} setHeight={setHeight} weight={weight} setWeight={setWeight} />;
      case 'target':     return <Step6Target theme={theme} value={targetWeight} onChange={setTargetWeight} />;
      case 'activity':   return <Step7Activity theme={theme} selected={activity} onSelect={setActivity} />;
      case 'experience': return <Step8Experience theme={theme} selected={experience} onSelect={setExperience} />;
      case 'fact2':      return <FactScreen theme={theme} factIndex={1} />;
      case 'equipment':  return <Step9Equipment theme={theme} selected={equipment} onSelect={setEquipment} />;
      case 'track':      return <Step10Track theme={theme} selected={tracking} onToggle={(i) => setTracking((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i])} />;
      case 'diet':       return <Step11Diet theme={theme} selected={diet} onToggle={(i) => setDiet((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i])} other={dietOther} setOther={setDietOther} />;
      case 'fasting':    return <Step12Fasting theme={theme} selected={fasting} onSelect={setFasting} />;
      case 'ifprotocol': return <Step12bProtocol theme={theme} selected={fastingProtocol} onSelect={setFastingProtocol} />;
      case 'fact3':      return <FactScreen theme={theme} factIndex={2} />;
      case 'sleep':      return <Step13Sleep theme={theme} selected={sleepGoal} onSelect={setSleepGoal} />;
      case 'calfitid':   return <Step14CalfitId theme={theme} value={calfitId} onChange={setCalfitId} />;
      case 'account':    return <Step15Account theme={theme} email={email} setEmail={setEmail} password={password} setPassword={setPassword} onGoogleSignUp={handleGoogleSignUp} onAppleSignUp={handleAppleSignUp} />;
      case 'generating': return <StepGenerating theme={theme} onComplete={() => setStep('paywall')} />;
      case 'paywall':    return <StepPaywall theme={theme} calorieGoal={estimatedCalories} onPayNow={handlePayNow} onTrial={handleTrial} onSkip={handleSkip} />;
      default: return null;
    }
  };

  return (
    <AndroidSafeView backgroundColor={isWelcome ? '#080A0F' : theme.bg} style={styles.safe}>
      {showHeader && (
        <View style={styles.header}>
          <TouchableOpacity onPress={goPrev} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.logo, { color: theme.accent }]}>CalFit</Text>
          {!isFact
            ? <Text style={[styles.stepCounter, { color: theme.textMuted }]}>{questionStepsSoFar}/{totalQuestionSteps}</Text>
            : <View style={{ width: 40 }} />}
        </View>
      )}
      {showDots  && <ProgressDots step={questionStepsSoFar} total={totalQuestionSteps} theme={theme} />}
      {showNudge && <PlanNudge theme={theme} step={questionStepsSoFar + 1} />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, (isGenerating || isWelcome) && styles.scrollCenter, isFact && styles.scrollFact]}
        keyboardShouldPersistTaps="handled"
      >
        {getStepComponent()}
      </ScrollView>
      {showCTA && (
        <View style={[styles.bottomBar, { backgroundColor: isWelcome ? '#080A0F' : theme.bg }]}>
          <TouchableOpacity onPress={handleNext} disabled={isLoading} activeOpacity={0.85} style={styles.ctaBtnWrap}>
            <LinearGradient colors={[theme.accent, '#0DAE6C'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtn}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaBtnText}>{btnLabel}</Text>}
            </LinearGradient>
          </TouchableOpacity>
          {step === 'welcome' && (
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.signInRow}>
              <Text style={[styles.signInText, { color: 'rgba(255,255,255,0.50)' }]}>
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
  scrollFact: { flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  logo: { fontSize: fontSize.xl, fontWeight: '800' },
  stepCounter: { fontSize: fontSize.sm, fontWeight: '600' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  dot: { height: 6, borderRadius: 3 },
  nudgeBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 99 },
  nudgeDot: { width: 6, height: 6, borderRadius: 3 },
  nudgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  welcomeWrap: { flex: 1, backgroundColor: '#080A0F', paddingHorizontal: spacing.lg, paddingTop: 48, paddingBottom: 20, alignItems: 'center' },
  welcomeGlow: { position: 'absolute', top: 20, width: 280, height: 120, backgroundColor: 'rgba(45,220,140,0.08)', borderRadius: 140 },
  welcomeLogo: { fontSize: 52, fontWeight: '900', color: '#2DDC8C', letterSpacing: 10, marginBottom: 12, textAlign: 'center' },
  welcomeTagline: { fontSize: fontSize.base, color: 'rgba(255,255,255,0.60)', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' },
  featureCard: { width: (SCREEN_W - spacing.lg * 2 - 12) / 2, backgroundColor: '#111318', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(45,220,140,0.15)' },
  featureCardActive: { borderColor: 'rgba(45,220,140,0.50)', backgroundColor: '#131a15' },
  featureIconWrap: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: 'rgba(45,220,140,0.08)' },
  featureCardTitle: { fontSize: 13, fontWeight: '800', color: '#fff', marginBottom: 6 },
  featureCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 15 },
  featureCardLine: { height: 2, width: 24, borderRadius: 1, marginTop: 12 },
  factWrap: { flex: 1, minHeight: SCREEN_H * 0.7, margin: spacing.lg, borderRadius: 24, padding: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  factGlow: { position: 'absolute', top: -60, width: 200, height: 200, backgroundColor: 'rgba(45,220,140,0.08)', borderRadius: 100 },
  factEmoji: { fontSize: 52, marginBottom: 16 },
  factHeadline: { fontSize: fontSize.base, fontWeight: '700', marginBottom: 12, letterSpacing: 0.5 },
  factStat: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 32, marginBottom: 16 },
  factBody: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  factSourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, paddingTop: 12, width: '100%', justifyContent: 'center' },
  factSource: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' },
  factContinueHint: { marginTop: 20, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, borderWidth: 1 },
  factContinueText: { fontSize: fontSize.xs, fontWeight: '600', textAlign: 'center' },
  stepContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  stepTitle: { fontSize: 30, fontWeight: '800', marginBottom: spacing.sm, lineHeight: 36 },
  stepSub: { fontSize: fontSize.base, marginBottom: 24, lineHeight: 22 },
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