// src/components/FoodIllustration.tsx
// Pure SVG food cluster illustration — no external assets needed.
// Drop into the HomeScreen calorie hero card top-right circle.
//
// Usage:
//   import FoodIllustration from '../../components/FoodIllustration';
//   <FoodIllustration size={110} />

import Svg, {
  Circle, Ellipse, Path, Rect, G, Defs,
  LinearGradient, RadialGradient, Stop, ClipPath,
} from 'react-native-svg';

interface Props { size?: number; }

export default function FoodIllustration({ size = 110 }: Props) {
  const s = size / 110; // scale factor

  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      <Defs>
        {/* Bowl gradient */}
        <LinearGradient id="bowlGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF5E4" />
          <Stop offset="1" stopColor="#FFD9A0" />
        </LinearGradient>
        {/* Rice gradient */}
        <LinearGradient id="riceGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFDF5" />
          <Stop offset="1" stopColor="#F5EDD0" />
        </LinearGradient>
        {/* Avocado outer */}
        <LinearGradient id="avoOuter" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#4CAF50" />
          <Stop offset="1" stopColor="#2E7D32" />
        </LinearGradient>
        {/* Avocado inner */}
        <LinearGradient id="avoInner" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#C8E6C9" />
          <Stop offset="1" stopColor="#A5D6A7" />
        </LinearGradient>
        {/* Chicken */}
        <LinearGradient id="chickenGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFB74D" />
          <Stop offset="1" stopColor="#E65100" />
        </LinearGradient>
        {/* Orange */}
        <LinearGradient id="orangeGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFCC02" />
          <Stop offset="1" stopColor="#FF6D00" />
        </LinearGradient>
        {/* Broccoli */}
        <LinearGradient id="brocGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#66BB6A" />
          <Stop offset="1" stopColor="#1B5E20" />
        </LinearGradient>
        {/* Salmon */}
        <LinearGradient id="salmonGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFAB91" />
          <Stop offset="1" stopColor="#E64A19" />
        </LinearGradient>
      </Defs>

      {/* ── PLATE / BOWL BASE ───────────────────────────────── */}
      <Ellipse cx="55" cy="82" rx="36" ry="8" fill="#00000015" />
      <Path d="M22 62 Q22 82 55 82 Q88 82 88 62 L88 58 Q88 40 55 40 Q22 40 22 58 Z"
        fill="url(#bowlGrad)" />
      {/* Bowl rim highlight */}
      <Path d="M22 58 Q22 52 55 52 Q88 52 88 58"
        stroke="#FFE0A0" strokeWidth="2" fill="none" opacity={0.7} />
      {/* Bowl stripe decoration */}
      <Path d="M28 70 Q55 75 82 70" stroke="#FFCA80" strokeWidth="1.5" fill="none" opacity={0.5} />

      {/* ── RICE PILE (inside bowl) ─────────────────────────── */}
      <Ellipse cx="55" cy="56" rx="25" ry="14" fill="url(#riceGrad)" />
      {/* Rice grain texture dots */}
      {[
        [46,53],[51,50],[56,52],[61,50],[66,53],
        [48,57],[53,55],[58,56],[63,55],[49,60],[55,59],[61,60],
      ].map(([x,y], i) => (
        <Ellipse key={i} cx={x} cy={y} rx="2.5" ry="1.2"
          fill="#E8D5A0" opacity={0.8} />
      ))}

      {/* ── AVOCADO HALF (left, leaning on bowl) ───────────── */}
      <G transform="rotate(-20, 28, 48)">
        {/* Outer skin */}
        <Path d="M28 28 C20 32 16 42 18 50 C20 57 26 60 30 58 C34 56 36 48 35 40 C34 33 31 26 28 28Z"
          fill="url(#avoOuter)" />
        {/* Inner flesh */}
        <Path d="M28 31 C23 35 20 43 22 49 C24 54 28 56 30 55 C32 54 33 47 32 41 C31 35 29 29 28 31Z"
          fill="url(#avoInner)" />
        {/* Pit */}
        <Ellipse cx="27" cy="46" rx="5" ry="6" fill="#A0522D" />
        <Ellipse cx="26" cy="45" rx="2.5" ry="3" fill="#C4813B" opacity={0.6} />
      </G>

      {/* ── BROCCOLI (back left) ────────────────────────────── */}
      <G transform="translate(72, 32)">
        {/* Stem */}
        <Rect x="-2" y="12" width="4" height="10" rx="2" fill="#388E3C" />
        {/* Florets */}
        <Circle cx="0" cy="10" r="7" fill="url(#brocGrad)" />
        <Circle cx="-6" cy="13" r="5.5" fill="url(#brocGrad)" />
        <Circle cx="6" cy="13" r="5.5" fill="url(#brocGrad)" />
        <Circle cx="-3" cy="7" r="4" fill="#81C784" opacity={0.7} />
        <Circle cx="3" cy="6" r="4" fill="#81C784" opacity={0.7} />
        <Circle cx="0" cy="4" r="3.5" fill="#A5D6A7" opacity={0.5} />
      </G>

      {/* ── CHICKEN / PROTEIN PIECE (top centre) ───────────── */}
      <G transform="translate(55, 30)">
        {/* Chicken breast shape */}
        <Path d="M-14 2 C-14 -8 -6 -14 0 -14 C6 -14 14 -8 14 2 C14 10 8 14 0 16 C-8 14 -14 10 -14 2Z"
          fill="url(#chickenGrad)" />
        {/* Grill marks */}
        <Path d="M-8 -4 L8 -4" stroke="#BF360C" strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
        <Path d="M-10 0 L10 0" stroke="#BF360C" strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
        <Path d="M-8 4 L8 4" stroke="#BF360C" strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
        {/* Highlight */}
        <Ellipse cx="-4" cy="-6" rx="4" ry="3" fill="#FFCC80" opacity={0.4} />
      </G>

      {/* ── ORANGE SLICE (right side) ───────────────────────── */}
      <G transform="translate(82, 50) rotate(15)">
        {/* Outer rind */}
        <Circle cx="0" cy="0" r="13" fill="url(#orangeGrad)" />
        {/* White pith */}
        <Circle cx="0" cy="0" r="11" fill="#FFF3E0" />
        {/* Segments */}
        {[0,60,120,180,240,300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <Path key={i}
              d={`M 0 0 L ${10 * Math.cos(rad)} ${10 * Math.sin(rad)} A 10 10 0 0 1 ${10 * Math.cos(rad + Math.PI/3)} ${10 * Math.sin(rad + Math.PI/3)} Z`}
              fill="#FF9800" opacity={0.55} />
          );
        })}
        {/* Centre */}
        <Circle cx="0" cy="0" r="2" fill="#FF6D00" opacity={0.6} />
        {/* Shine */}
        <Circle cx="-3" cy="-4" r="2.5" fill="#fff" opacity={0.25} />
      </G>

      {/* ── SALMON PIECE (front right of bowl) ─────────────── */}
      <G transform="translate(70, 62) rotate(-10)">
        <Path d="M-12 0 C-12 -7 -6 -10 0 -10 C6 -10 12 -7 12 0 C12 5 6 7 0 7 C-6 7 -12 5 -12 0Z"
          fill="url(#salmonGrad)" />
        {/* Flesh lines */}
        <Path d="M-8 -2 L8 -2" stroke="#FF8A65" strokeWidth="1" opacity={0.5} />
        <Path d="M-9 1 L9 1" stroke="#FF8A65" strokeWidth="1" opacity={0.4} />
        {/* Highlight */}
        <Ellipse cx="-3" cy="-4" rx="3" ry="1.5" fill="#FFCCBC" opacity={0.5} />
      </G>

      {/* ── HERB GARNISH (tiny dots) ────────────────────────── */}
      <Circle cx="42" cy="43" r="2" fill="#66BB6A" opacity={0.8} />
      <Circle cx="46" cy="41" r="1.5" fill="#81C784" opacity={0.7} />
      <Circle cx="50" cy="42" r="1.8" fill="#66BB6A" opacity={0.75} />

      {/* ── STEAM WISPS (above bowl) ────────────────────────── */}
      <Path d="M40 36 Q38 30 40 24 Q42 18 40 12" stroke="#fff" strokeWidth="1.5"
        strokeLinecap="round" fill="none" opacity={0.18} />
      <Path d="M55 32 Q53 26 55 20 Q57 14 55 8" stroke="#fff" strokeWidth="1.5"
        strokeLinecap="round" fill="none" opacity={0.14} />
    </Svg>
  );
}