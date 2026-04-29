import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect, G } from 'react-native-svg';

const AnimEllipse = Animated.createAnimatedComponent(Ellipse);

// ── LOOP HOOKS ────────────────────────────────────────────────
// useNativeDriver:true — for Animated.View transforms (fast, no JS thread)
function useLoop(duration: number, easing = Easing.inOut(Easing.sin)) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, easing, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, easing, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

// useNativeDriver:false — for SVG prop animations (opacity, rx, ry)
function useLoopJS(duration: number, easing = Easing.inOut(Easing.sin)) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, easing, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration, easing, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

const lerp = (anim: Animated.Value, from: number, to: number) =>
  anim.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

// ── MUSCLE GLOW ───────────────────────────────────────────────
function MuscleGlow({ cx, cy, rx, ry, color }: { cx: number; cy: number; rx: number; ry: number; color: string }) {
  const pulse = useLoopJS(900);
  const opacity = lerp(pulse, 0.12, 0.38);
  return <AnimEllipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} opacity={opacity as any} />;
}

// ── BODY PARTS ────────────────────────────────────────────────
function Head({ cx, cy, r = 16, color }: { cx: number; cy: number; r?: number; color: string }) {
  return (
    <G>
      <Rect x={cx - 5} y={cy + r - 2} width={10} height={10} rx={4} fill={color} opacity={0.85} />
      <Ellipse cx={cx} cy={cy} rx={r} ry={r * 1.1} fill={color} opacity={0.92} />
      <Circle cx={cx - 5} cy={cy - 2} r={2.5} fill="rgba(0,0,0,0.25)" />
      <Circle cx={cx + 5} cy={cy - 2} r={2.5} fill="rgba(0,0,0,0.25)" />
    </G>
  );
}

function Torso({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <Path
      d={`M${x-14} ${y} Q${x-16} ${y+14} ${x-12} ${y+36} Q${x} ${y+40} ${x+12} ${y+36} Q${x+16} ${y+14} ${x+14} ${y} Q${x} ${y-4} ${x-14} ${y}Z`}
      fill={color} opacity={0.88}
    />
  );
}

function Foot({ x, y, flip = false, color }: { x: number; y: number; flip?: boolean; color: string }) {
  return <Ellipse cx={x + (flip ? -7 : 7)} cy={y + 2} rx={8} ry={4} fill={color} opacity={0.75} />;
}

// ── PATTERN: Each animation is a View containing multiple Svg layers ──
// Layer 0 (bottom): static background elements + MuscleGlow
// Layer 1..N: Animated.View wrappers each containing their own Svg
// This avoids AnimG entirely while keeping smooth native animations.

// ══════════════════════════════════════════════════════════════
// 1 — SQUAT  ·  Squats, Jump Squats, Wall Sit, Step Ups
// ══════════════════════════════════════════════════════════════
export function SquatAnimation({ color }: { color: string }) {
  const anim = useLoop(1100);
  const bodyY = lerp(anim, 0, 28);
  return (
    <View style={{ width: 160, height: 220 }}>
      {/* Static: feet + ground shins */}
      <Svg width={160} height={220} viewBox="0 0 160 220" style={{ position: 'absolute' }}>
        <MuscleGlow cx={80} cy={168} rx={36} ry={20} color={color} />
        <Line x1={46} y1={180} x2={46} y2={196} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
        <Line x1={114} y1={180} x2={114} y2={196} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
        <Foot x={38} y={196} color={color} />
        <Foot x={106} y={196} flip color={color} />
        <Line x1={20} y1={204} x2={140} y2={204} stroke={color} strokeWidth={2} opacity={0.12} />
      </Svg>
      {/* Animated: upper body + thighs */}
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: bodyY }] }}>
        <Svg width={160} height={220} viewBox="0 0 160 220">
          <Head cx={80} cy={34} color={color} />
          <Torso x={80} y={52} color={color} />
          <Line x1={66} y1={66} x2={30} y2={80} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.80} />
          <Line x1={94} y1={66} x2={130} y2={80} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.80} />
          <Line x1={68} y1={92} x2={42} y2={152} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={92} y1={92} x2={118} y2={152} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 2 — PUSH UP  ·  Push Ups, Wide, Decline, Diamond, Tricep, Pike
// ══════════════════════════════════════════════════════════════
export function PushUpAnimation({ color }: { color: string }) {
  const anim = useLoop(1000);
  const bodyY = lerp(anim, 0, 20);
  return (
    <View style={{ width: 220, height: 120 }}>
      <Svg width={220} height={120} viewBox="0 0 220 120" style={{ position: 'absolute' }}>
        <MuscleGlow cx={90} cy={58} rx={42} ry={16} color={color} />
        <Line x1={10} y1={96} x2={210} y2={96} stroke={color} strokeWidth={2} opacity={0.12} />
        <Ellipse cx={60} cy={92} rx={8} ry={4} fill={color} opacity={0.62} />
        <Ellipse cx={96} cy={92} rx={8} ry={4} fill={color} opacity={0.62} />
        <Line x1={148} y1={50} x2={196} y2={56} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
        <Ellipse cx={202} cy={58} rx={9} ry={5} fill={color} opacity={0.70} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: bodyY }] }}>
        <Svg width={220} height={120} viewBox="0 0 220 120">
          <Head cx={22} cy={38} r={14} color={color} />
          <Path d="M36 40 Q90 34 148 42 Q148 54 90 58 Q36 54 36 40Z" fill={color} opacity={0.88} />
          <Line x1={64} y1={44} x2={60} y2={72} stroke={color} strokeWidth={8} strokeLinecap="round" opacity={0.85} />
          <Line x1={98} y1={46} x2={96} y2={72} stroke={color} strokeWidth={8} strokeLinecap="round" opacity={0.85} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 3 — PULL UP  ·  Pull Ups, Chin Ups, Inverted Rows
// ══════════════════════════════════════════════════════════════
export function PullUpAnimation({ color }: { color: string }) {
  const anim = useLoop(1200);
  const bodyY = lerp(anim, 22, 0);
  return (
    <View style={{ width: 160, height: 230 }}>
      <Svg width={160} height={230} viewBox="0 0 160 230" style={{ position: 'absolute' }}>
        <MuscleGlow cx={80} cy={108} rx={30} ry={22} color={color} />
        <Rect x={20} y={18} width={120} height={8} rx={4} fill={color} opacity={0.42} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: bodyY }] }}>
        <Svg width={160} height={230} viewBox="0 0 160 230">
          <Line x1={66} y1={82} x2={56} y2={44} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
          <Line x1={94} y1={82} x2={104} y2={44} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
          <Head cx={80} cy={62} color={color} />
          <Torso x={80} y={80} color={color} />
          <Line x1={70} y1={120} x2={62} y2={162} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={62} y1={162} x2={58} y2={200} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
          <Line x1={90} y1={120} x2={98} y2={162} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={98} y1={162} x2={102} y2={200} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
          <Foot x={44} y={202} color={color} />
          <Foot x={94} y={202} flip color={color} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 4 — CRUNCH  ·  Crunches, Bicycle Crunches, V-Ups, Dead Bug
// ══════════════════════════════════════════════════════════════
export function CrunchAnimation({ color }: { color: string }) {
  const anim = useLoop(950);
  const torsoY = lerp(anim, 0, -24);
  return (
    <View style={{ width: 200, height: 160 }}>
      <Svg width={200} height={160} viewBox="0 0 200 160" style={{ position: 'absolute' }}>
        <MuscleGlow cx={100} cy={92} rx={36} ry={16} color={color} />
        <Line x1={10} y1={140} x2={190} y2={140} stroke={color} strokeWidth={2} opacity={0.12} />
        <Line x1={80} y1={116} x2={44} y2={138} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
        <Line x1={80} y1={116} x2={130} y2={138} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
        <Foot x={30} y={138} color={color} />
        <Foot x={116} y={138} flip color={color} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: torsoY }] }}>
        <Svg width={200} height={160} viewBox="0 0 200 160">
          <Head cx={90} cy={62} color={color} />
          <Torso x={90} y={80} color={color} />
          <Line x1={76} y1={90} x2={50} y2={108} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.80} />
          <Line x1={104} y1={90} x2={128} y2={108} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.80} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 5 — PLANK  ·  Plank, Mountain Climbers
// ══════════════════════════════════════════════════════════════
export function PlankAnimation({ color }: { color: string }) {
  const anim = useLoop(1300);
  const kneeY = lerp(anim, 0, -20);
  return (
    <View style={{ width: 220, height: 120 }}>
      <Svg width={220} height={120} viewBox="0 0 220 120" style={{ position: 'absolute' }}>
        <MuscleGlow cx={100} cy={62} rx={44} ry={14} color={color} />
        <Line x1={10} y1={86} x2={210} y2={86} stroke={color} strokeWidth={2} opacity={0.12} />
        <Head cx={22} cy={42} r={14} color={color} />
        <Path d="M36 44 Q100 38 156 46 Q156 58 100 60 Q36 58 36 44Z" fill={color} opacity={0.88} />
        <Line x1={52} y1={48} x2={50} y2={78} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
        <Line x1={36} y1={78} x2={66} y2={78} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.72} />
        <Line x1={86} y1={48} x2={84} y2={78} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
        <Line x1={70} y1={78} x2={100} y2={78} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.72} />
        <Line x1={190} y1={52} x2={202} y2={80} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
        <Ellipse cx={205} cy={82} rx={9} ry={5} fill={color} opacity={0.70} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: kneeY }] }}>
        <Svg width={220} height={120} viewBox="0 0 220 120">
          <Line x1={156} y1={50} x2={172} y2={68} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={172} y1={68} x2={190} y2={50} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 6 — RUN  ·  High Knees, Running in Place, Burpees
// ══════════════════════════════════════════════════════════════
export function RunAnimation({ color }: { color: string }) {
  const anim = useLoop(520);
  const lKnee = lerp(anim, 0, -38);
  const rKnee = lerp(anim, -38, 0);
  const lArm  = lerp(anim, 0, 18);
  const rArm  = lerp(anim, 18, 0);
  return (
    <View style={{ width: 160, height: 230 }}>
      <Svg width={160} height={230} viewBox="0 0 160 230" style={{ position: 'absolute' }}>
        <MuscleGlow cx={80} cy={148} rx={28} ry={18} color={color} />
        <Head cx={80} cy={32} color={color} />
        <Torso x={80} y={50} color={color} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: lArm }] }}>
        <Svg width={160} height={230} viewBox="0 0 160 230">
          <Line x1={66} y1={62} x2={40} y2={98} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: rArm }] }}>
        <Svg width={160} height={230} viewBox="0 0 160 230">
          <Line x1={94} y1={62} x2={120} y2={98} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: lKnee }] }}>
        <Svg width={160} height={230} viewBox="0 0 160 230">
          <Line x1={70} y1={90} x2={58} y2={136} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={58} y1={136} x2={52} y2={175} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: rKnee }] }}>
        <Svg width={160} height={230} viewBox="0 0 160 230">
          <Line x1={90} y1={90} x2={102} y2={136} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={102} y1={136} x2={108} y2={175} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 7 — JUMPING JACK  ·  Jumping Jacks, Star Jumps, Box Jumps, Jump Rope
// ══════════════════════════════════════════════════════════════
export function JumpingJackAnimation({ color }: { color: string }) {
  const anim = useLoop(700);
  const armUp   = lerp(anim, 0, -28);
  const legOut  = lerp(anim, 0, 24);
  return (
    <View style={{ width: 200, height: 220 }}>
      <Svg width={200} height={220} viewBox="0 0 200 220" style={{ position: 'absolute' }}>
        <MuscleGlow cx={100} cy={100} rx={40} ry={30} color={color} />
        <Head cx={100} cy={32} color={color} />
        <Torso x={100} y={50} color={color} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: armUp }] }}>
        <Svg width={200} height={220} viewBox="0 0 200 220">
          <Line x1={86} y1={66} x2={42} y2={90} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
          <Line x1={114} y1={66} x2={158} y2={90} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', transform: [{ translateX: Animated.multiply(legOut, -1) }] }}>
        <Svg width={200} height={220} viewBox="0 0 200 220">
          <Line x1={90} y1={90} x2={70} y2={150} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={70} y1={150} x2={60} y2={192} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
          <Foot x={52} y={192} color={color} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', transform: [{ translateX: legOut }] }}>
        <Svg width={200} height={220} viewBox="0 0 200 220">
          <Line x1={110} y1={90} x2={130} y2={150} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={130} y1={150} x2={140} y2={192} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
          <Foot x={132} y={192} flip color={color} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 8 — CURL  ·  Bicep Curls, Lateral Raises
// ══════════════════════════════════════════════════════════════
export function CurlAnimation({ color }: { color: string }) {
  const anim = useLoop(850);
  const forearmY = lerp(anim, 0, -44);
  return (
    <View style={{ width: 160, height: 230 }}>
      <Svg width={160} height={230} viewBox="0 0 160 230" style={{ position: 'absolute' }}>
        <MuscleGlow cx={112} cy={110} rx={22} ry={18} color={color} />
        <Head cx={80} cy={32} color={color} />
        <Torso x={80} y={50} color={color} />
        <Line x1={66} y1={62} x2={44} y2={90} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.52} />
        <Line x1={44} y1={90} x2={40} y2={120} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.46} />
        <Line x1={94} y1={62} x2={114} y2={90} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
        <Line x1={72} y1={90} x2={64} y2={152} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
        <Line x1={64} y1={152} x2={60} y2={196} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
        <Line x1={88} y1={90} x2={96} y2={152} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
        <Line x1={96} y1={152} x2={100} y2={196} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
        <Foot x={46} y={196} color={color} />
        <Foot x={90} y={196} flip color={color} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: forearmY }] }}>
        <Svg width={160} height={230} viewBox="0 0 160 230">
          <Line x1={114} y1={90} x2={118} y2={132} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
          <Ellipse cx={122} cy={136} rx={8} ry={5} fill={color} opacity={0.55} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 9 — DIPS  ·  Tricep Dips, Chest Dips
// ══════════════════════════════════════════════════════════════
export function DipsAnimation({ color }: { color: string }) {
  const anim = useLoop(1000);
  const bodyY = lerp(anim, 0, 24);
  return (
    <View style={{ width: 180, height: 220 }}>
      <Svg width={180} height={220} viewBox="0 0 180 220" style={{ position: 'absolute' }}>
        <MuscleGlow cx={90} cy={78} rx={32} ry={20} color={color} />
        <Rect x={18} y={50} width={18} height={80} rx={6} fill={color} opacity={0.26} />
        <Rect x={144} y={50} width={18} height={80} rx={6} fill={color} opacity={0.26} />
        <Rect x={12} y={46} width={30} height={10} rx={5} fill={color} opacity={0.40} />
        <Rect x={138} y={46} width={30} height={10} rx={5} fill={color} opacity={0.40} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: bodyY }] }}>
        <Svg width={180} height={220} viewBox="0 0 180 220">
          <Head cx={90} cy={28} color={color} />
          <Torso x={90} y={46} color={color} />
          <Line x1={76} y1={56} x2={36} y2={50} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
          <Line x1={36} y1={50} x2={30} y2={26} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.78} />
          <Line x1={104} y1={56} x2={144} y2={50} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
          <Line x1={144} y1={50} x2={150} y2={26} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.78} />
          <Line x1={76} y1={86} x2={68} y2={142} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={68} y1={142} x2={64} y2={182} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
          <Line x1={104} y1={86} x2={112} y2={142} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={112} y1={142} x2={116} y2={182} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
          <Foot x={50} y={182} color={color} />
          <Foot x={108} y={182} flip color={color} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 10 — GLUTE BRIDGE  ·  Glute Bridges, Donkey Kicks
// ══════════════════════════════════════════════════════════════
export function GluteBridgeAnimation({ color }: { color: string }) {
  const anim = useLoop(1050);
  const hipY = lerp(anim, 0, -28);
  return (
    <View style={{ width: 220, height: 150 }}>
      <Svg width={220} height={150} viewBox="0 0 220 150" style={{ position: 'absolute' }}>
        <MuscleGlow cx={110} cy={82} rx={40} ry={18} color={color} />
        <Line x1={10} y1={128} x2={210} y2={128} stroke={color} strokeWidth={2} opacity={0.12} />
        <Head cx={28} cy={106} r={14} color={color} />
        <Line x1={42} y1={110} x2={82} y2={114} stroke={color} strokeWidth={12} strokeLinecap="round" opacity={0.85} />
        <Foot x={64} y={124} color={color} />
        <Foot x={152} y={124} flip color={color} />
        <Line x1={72} y1={108} x2={72} y2={124} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
        <Line x1={160} y1={108} x2={160} y2={124} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: hipY }] }}>
        <Svg width={220} height={150} viewBox="0 0 220 150">
          <Path d="M80 110 Q110 104 150 110 Q150 124 110 126 Q80 124 80 110Z" fill={color} opacity={0.88} />
          <Line x1={80} y1={112} x2={72} y2={132} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={150} y1={112} x2={160} y2={132} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 11 — LUNGE  ·  Lunges, Step Ups
// ══════════════════════════════════════════════════════════════
export function LungeAnimation({ color }: { color: string }) {
  const anim = useLoop(1100);
  const bodyY = lerp(anim, 0, 20);
  return (
    <View style={{ width: 180, height: 230 }}>
      <Svg width={180} height={230} viewBox="0 0 180 230" style={{ position: 'absolute' }}>
        <MuscleGlow cx={78} cy={155} rx={34} ry={18} color={color} />
        <Foot x={32} y={196} color={color} />
        <Foot x={128} y={196} flip color={color} />
        <Line x1={40} y1={160} x2={40} y2={196} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
        <Line x1={136} y1={178} x2={136} y2={196} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: bodyY }] }}>
        <Svg width={180} height={230} viewBox="0 0 180 230">
          <Head cx={80} cy={32} color={color} />
          <Torso x={80} y={50} color={color} />
          <Line x1={66} y1={64} x2={46} y2={84} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.78} />
          <Line x1={94} y1={64} x2={114} y2={84} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.78} />
          <Line x1={70} y1={90} x2={40} y2={148} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={90} y1={90} x2={128} y2={148} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={128} y1={148} x2={136} y2={178} stroke={color} strokeWidth={8} strokeLinecap="round" opacity={0.85} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 12 — LEG RAISE  ·  Leg Raises, Russian Twists
// ══════════════════════════════════════════════════════════════
export function LegRaiseAnimation({ color }: { color: string }) {
  const anim = useLoop(1000);
  const legY = lerp(anim, 0, -44);
  return (
    <View style={{ width: 220, height: 150 }}>
      <Svg width={220} height={150} viewBox="0 0 220 150" style={{ position: 'absolute' }}>
        <MuscleGlow cx={100} cy={92} rx={40} ry={14} color={color} />
        <Line x1={10} y1={130} x2={210} y2={130} stroke={color} strokeWidth={2} opacity={0.12} />
        <Head cx={22} cy={108} r={14} color={color} />
        <Path d="M36 110 Q100 106 152 112 Q152 124 100 126 Q36 124 36 110Z" fill={color} opacity={0.88} />
        <Line x1={60} y1={118} x2={50} y2={128} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.68} />
        <Line x1={100} y1={118} x2={90} y2={128} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.68} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: legY }] }}>
        <Svg width={220} height={150} viewBox="0 0 220 150">
          <Line x1={152} y1={112} x2={178} y2={112} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={178} y1={112} x2={205} y2={112} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
          <Ellipse cx={210} cy={112} rx={8} ry={5} fill={color} opacity={0.70} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 13 — SUPERMAN  ·  Superman Hold
// ══════════════════════════════════════════════════════════════
export function SupermanAnimation({ color }: { color: string }) {
  const anim = useLoop(1200);
  const liftY = lerp(anim, 0, -16);
  return (
    <View style={{ width: 220, height: 120 }}>
      <Svg width={220} height={120} viewBox="0 0 220 120" style={{ position: 'absolute' }}>
        <MuscleGlow cx={110} cy={68} rx={52} ry={14} color={color} />
        <Line x1={10} y1={94} x2={210} y2={94} stroke={color} strokeWidth={2} opacity={0.12} />
        <Path d="M48 70 Q110 64 170 70 Q170 82 110 84 Q48 82 48 70Z" fill={color} opacity={0.88} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: liftY }] }}>
        <Svg width={220} height={120} viewBox="0 0 220 120">
          <Line x1={48} y1={70} x2={24} y2={66} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
          <Line x1={24} y1={66} x2={8} y2={62} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.78} />
          <Head cx={54} cy={62} r={14} color={color} />
          <Line x1={170} y1={70} x2={194} y2={70} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
          <Line x1={194} y1={70} x2={212} y2={70} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
          <Ellipse cx={216} cy={70} rx={8} ry={4} fill={color} opacity={0.70} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 14 — CALF RAISE  ·  Calf Raises, Wall Sit
// ══════════════════════════════════════════════════════════════
export function CalfRaiseAnimation({ color }: { color: string }) {
  const anim = useLoop(800);
  const heelY = lerp(anim, 0, -16);
  return (
    <View style={{ width: 160, height: 230 }}>
      <Svg width={160} height={230} viewBox="0 0 160 230" style={{ position: 'absolute' }}>
        <MuscleGlow cx={80} cy={185} rx={24} ry={14} color={color} />
        <Head cx={80} cy={32} color={color} />
        <Torso x={80} y={50} color={color} />
        <Line x1={66} y1={64} x2={52} y2={92} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.72} />
        <Line x1={94} y1={64} x2={108} y2={92} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.72} />
        <Line x1={72} y1={90} x2={64} y2={150} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
        <Line x1={88} y1={90} x2={96} y2={150} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
        <Line x1={30} y1={208} x2={130} y2={208} stroke={color} strokeWidth={2} opacity={0.12} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: heelY }] }}>
        <Svg width={160} height={230} viewBox="0 0 160 230">
          <Line x1={64} y1={150} x2={60} y2={196} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
          <Line x1={96} y1={150} x2={100} y2={196} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.82} />
          <Foot x={46} y={196} color={color} />
          <Foot x={90} y={196} flip color={color} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// 15 — STRETCH  ·  Cat Cow, Child's Pose, Hamstring, Hip Flexor
// ══════════════════════════════════════════════════════════════
export function StretchAnimation({ color }: { color: string }) {
  const anim = useLoop(1600);
  const archY = lerp(anim, 0, 14);
  return (
    <View style={{ width: 210, height: 160 }}>
      <Svg width={210} height={160} viewBox="0 0 210 160" style={{ position: 'absolute' }}>
        <MuscleGlow cx={100} cy={88} rx={50} ry={16} color={color} />
        <Line x1={10} y1={130} x2={200} y2={130} stroke={color} strokeWidth={2} opacity={0.12} />
        <Line x1={28} y1={96} x2={28} y2={128} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.70} />
        <Ellipse cx={28} cy={128} rx={8} ry={4} fill={color} opacity={0.60} />
        <Line x1={70} y1={88} x2={70} y2={128} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.70} />
        <Ellipse cx={70} cy={128} rx={8} ry={4} fill={color} opacity={0.60} />
        <Line x1={176} y1={90} x2={174} y2={128} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.88} />
        <Ellipse cx={173} cy={129} rx={10} ry={5} fill={color} opacity={0.62} />
      </Svg>
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: archY }] }}>
        <Svg width={210} height={160} viewBox="0 0 210 160">
          <Path d="M28 90 Q70 68 110 70 Q150 72 178 84 Q150 98 110 96 Q70 102 28 90Z" fill={color} opacity={0.88} />
          <Head cx={26} cy={74} r={14} color={color} />
        </Svg>
      </Animated.View>
    </View>
  );
}