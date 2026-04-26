import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform, ToastAndroid, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { supabase } from '../../services/supabase';

export default function CreditsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [balance, setBalance]             = useState(0);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [earned30d, setEarned30d]         = useState(0);
  const [points, setPoints]               = useState(0);
  const [referralStats, setReferralStats] = useState({ total: 0, paid: 0, free: 0 });
  const [walletBalance, setWalletBalance] = useState(0);
  const [copiedLink, setCopiedLink]       = useState(false);
  const [copiedCode, setCopiedCode]       = useState(false);

  const referralCode = profile?.referral_code ?? user?.id?.slice(0, 8) ?? 'calfit';
  const inviteLink   = `https://calfit.app/ref/${referralCode}`;
  // Every user gets an invite code — short uppercase version of their referral code
  const inviteCode   = referralCode.toUpperCase().replace(/-/g, '').slice(0, 8);

  useFocusEffect(useCallback(() => { loadData(); }, [user?.id]));

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const [walletRes, referralsRes, pointsRes] = await Promise.all([
        supabase.from('earnings_wallet').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('referrals').select('*').eq('referrer_id', user.id),
        supabase.from('calfit_points').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      if (walletRes.data) {
        setWalletBalance(walletRes.data.balance_usd ?? 0);
        setLifetimeEarned(walletRes.data.lifetime_earned ?? 0);
        setBalance(walletRes.data.balance_usd ?? 0);
      }
      if (referralsRes.data) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        setReferralStats({
          total: referralsRes.data.length,
          paid: referralsRes.data.filter((r: any) => r.status === 'active').length,
          free: referralsRes.data.filter((r: any) => r.status !== 'active').length,
        });
        setEarned30d(referralsRes.data.filter((r: any) => new Date(r.created_at) > thirtyDaysAgo && r.status === 'active').length * 2.5);
      }
      if (pointsRes.data) setPoints(pointsRes.data.balance ?? 0);
    } catch (e) { console.error('CreditsScreen loadData:', e); }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    setCopiedLink(true);
    if (Platform.OS === 'android') ToastAndroid.show('Referral link copied! 🎉', ToastAndroid.SHORT);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopiedCode(true);
    if (Platform.OS === 'android') ToastAndroid.show('Invite code copied!', ToastAndroid.SHORT);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on CalFit — the smartest fitness & nutrition app! 💪\n\nUse my invite code: ${inviteCode}\nOr sign up directly: ${inviteLink}\n\nTrack calories, workouts, sleep and more. Free to start!`,
        title: 'Join CalFit',
      });
    } catch {}
  };

  const handleWithdraw = () => {
    if (walletBalance < 10) {
      Alert.alert('Not enough balance', `You need at least $10 to withdraw. Keep referring friends!`);
      return;
    }
    Alert.alert('Withdraw Earnings', `Available: $${walletBalance.toFixed(2)}\n\nWithdrawal via PayPal, Stripe, or Bank Transfer will be available when your account is verified.`, [{ text: 'OK' }]);
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* Back button */}
            <TouchableOpacity
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Settings' }] })}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
            </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Credits & Earnings</Text>
        <Text style={[styles.pageSub, { color: theme.textSecondary }]}>Refer friends, earn money</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── 1. INCOME EARNED (shown first per corrections) ── */}
        <LinearGradient colors={[theme.heroCard, '#2A1F6B'] as [string, string]} style={styles.incomeHero}>
          <Text style={styles.incomeHeroLabel}>💰 Wallet Balance</Text>
          <Text style={styles.incomeHeroBig}>${walletBalance.toFixed(2)}</Text>
          <Text style={styles.incomeHeroSub}>Available for withdrawal</Text>

          {/* Earnings breakdown */}
          <View style={styles.earningsGrid}>
            {[
              { label: '30-day earnings', value: `$${earned30d.toFixed(2)}`, color: '#FFB830' },
              { label: 'Lifetime earned', value: `$${lifetimeEarned.toFixed(2)}`, color: '#0eaf16' },
            ].map((e) => (
              <View key={e.label} style={[styles.earningCell, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                <Text style={[styles.earningCellVal, { color: e.color }]}>{e.value}</Text>
                <Text style={styles.earningCellLabel}>{e.label}</Text>
              </View>
            ))}
          </View>

          {/* Referral stats */}
          <View style={styles.refStatsRow}>
            {[
              { label: 'Total invited', val: referralStats.total, color: '#fff' },
              { label: 'On paid plan', val: referralStats.paid, color: '#FFB830' },
              { label: 'On free plan', val: referralStats.free, color: 'rgba(255,255,255,0.50)' },
            ].map((s) => (
              <View key={s.label} style={styles.refStatItem}>
                <Text style={[styles.refStatVal, { color: s.color }]}>{s.val}</Text>
                <Text style={styles.refStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={handleWithdraw} activeOpacity={0.85} style={styles.withdrawBtnWrap}>
            <LinearGradient
              colors={walletBalance >= 10 ? [theme.gradStart, theme.gradMid] as [string, string] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.10)'] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.withdrawBtn}
            >
              <Ionicons name="card-outline" size={18} color="#fff" />
              <Text style={styles.withdrawBtnText}>
                {walletBalance >= 10 ? 'Withdraw Earnings' : `$${(10 - walletBalance).toFixed(2)} more to withdraw`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── 2. INVITE CODE + LINK ── */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Your Invite Code & Link</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
            Share your code or link — earn 15% of their subscription for 5 years + 5 points per signup
          </Text>

          {/* Invite CODE — prominently displayed */}
          <View style={[styles.inviteCodeBox, { backgroundColor: theme.heroCard, borderColor: theme.accent + '44' }]}>
            <View>
              <Text style={styles.inviteCodeLabel}>Your Invite Code</Text>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
            </View>
            <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.8}
              style={[styles.copyCodeBtn, { backgroundColor: theme.accent }]}>
              {copiedCode
                ? <Ionicons name="checkmark-circle" size={20} color="#fff" />
                : <Ionicons name="copy-outline" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>

          {/* Invite LINK */}
          <Text style={[styles.linkLabel, { color: theme.textMuted }]}>Your invite link</Text>
          <View style={[styles.inviteLink, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.inviteLinkText, { color: theme.textPrimary }]} numberOfLines={1}>{inviteLink}</Text>
            <TouchableOpacity onPress={handleCopyLink} style={styles.copyBtn}>
              {copiedLink
                ? <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
                : <Ionicons name="copy-outline" size={20} color={theme.accent} />}
            </TouchableOpacity>
          </View>

          {/* Share button */}
          <TouchableOpacity onPress={handleShare} activeOpacity={0.85} style={styles.shareBtnWrap}>
            <LinearGradient colors={[theme.accent, '#0A9A5E'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shareBtn}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Share Your Invite</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* How it works */}
          <View style={[styles.howItWorks, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.howTitle, { color: theme.textPrimary }]}>How it works</Text>
            {[
              { emoji: '1️⃣', text: 'Share your code or link with friends' },
              { emoji: '2️⃣', text: 'They sign up — you earn 5 CalFit Points instantly' },
              { emoji: '3️⃣', text: 'They upgrade to Pro/Premium — you earn!' },
            ].map((s) => (
              <View key={s.emoji} style={styles.howRow}>
                <Text style={styles.howEmoji}>{s.emoji}</Text>
                <Text style={[styles.howText, { color: theme.textSecondary }]}>{s.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 3. CALFIT POINTS (shown below income per corrections) ── */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.pointsHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>CalFit Points</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Earn and spend points on premium features</Text>
            </View>
            <View style={[styles.pointsBadge, { backgroundColor: '#FFB830' + '22', borderColor: '#FFB830' }]}>
              <Text style={styles.pointsBadgeStar}>✦</Text>
              <Text style={[styles.pointsBadgeVal, { color: '#FFB830' }]}>{points}</Text>
            </View>
          </View>

          {/* Earn points options */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Earn Points</Text>
          {[
            { label: 'Daily login',          points: '+1 pt',   icon: 'calendar-outline',        color: theme.accent },
            { label: 'Log a meal',           points: '+2 pts',  icon: 'restaurant-outline',      color: '#FF6B35' },
            { label: 'Complete a workout',   points: '+5 pts',  icon: 'barbell-outline',         color: '#9B6FE8' },
            { label: 'Hit calorie goal',     points: '+3 pts',  icon: 'flame-outline',           color: '#F0427C' },
            { label: 'Refer a friend',       points: '+5 pts',  icon: 'person-add-outline',      color: '#FFB830' },
          ].map((e) => (
            <View key={e.label} style={[styles.earnRow, { borderColor: theme.border }]}>
              <View style={[styles.earnIconWrap, { backgroundColor: e.color + '18' }]}>
                <Ionicons name={e.icon as any} size={16} color={e.color} />
              </View>
              <Text style={[styles.earnLabel, { color: theme.textPrimary }]}>{e.label}</Text>
              <View style={[styles.earnPill, { backgroundColor: '#FFB830' + '18', borderColor: '#FFB830' + '55' }]}>
                <Text style={[styles.earnPillText, { color: '#FFB830' }]}>{e.points}</Text>
              </View>
            </View>
          ))}

          {/* Spend points */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: spacing.md }]}>Spend Points</Text>
          {[
            { label: 'Extra AI Coach prompts (5)',  cost: 10, icon: 'chatbubble-ellipses-outline', color: theme.accent },
            { label: 'Streak freeze (1 day)',       cost: 20, icon: 'snow-outline',               color: '#4A90E2' },
            { label: 'Live stream access (1hr)',    cost: 50, icon: 'videocam-outline',            color: '#9B6FE8' },
          ].map((s) => (
            <View key={s.label} style={[styles.spendRow, { borderColor: theme.border }]}>
              <View style={[styles.earnIconWrap, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon as any} size={16} color={s.color} />
              </View>
              <Text style={[styles.earnLabel, { color: theme.textPrimary }]}>{s.label}</Text>
              <TouchableOpacity disabled={points < s.cost} activeOpacity={0.8}
                style={[styles.spendBtn, { backgroundColor: points >= s.cost ? '#FFB830' + '22' : theme.border + '44', borderColor: '#FFB830' + '55', opacity: points >= s.cost ? 1 : 0.5 }]}>
                <Text style={[styles.spendBtnText, { color: '#FFB830' }]}>✦ {s.cost}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity onPress={() => navigation.navigate('PurchaseCredits')}
            style={[styles.buyMoreBtn, { backgroundColor: '#FFB830' + '15', borderColor: '#FFB830' }]}>
            <Text style={styles.pointsStar}>✦</Text>
            <Text style={[styles.buyMoreText, { color: '#FFB830' }]}>Buy More Points</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFB830" />
          </TouchableOpacity>
        </View>

        {/* ── 4. PAYOUT METHODS ── */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Payout Methods</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Connect a payout method to withdraw your earnings</Text>
          {[
            { label: 'PayPal', icon: 'logo-paypal', color: '#003087' },
            { label: 'Bank Transfer', icon: 'business-outline', color: theme.accent },
            { label: 'Stripe', icon: 'card-outline', color: '#635BFF' },
          ].map((p) => (
            <TouchableOpacity key={p.label} activeOpacity={0.8}
              style={[styles.payoutRow, { borderColor: theme.border }]}
              onPress={() => Alert.alert('Coming Soon', 'Payout method connection will be available when your account is verified.')}>
              <View style={[styles.payoutIcon, { backgroundColor: p.color + '18' }]}>
                <Ionicons name={p.icon as any} size={20} color={p.color} />
              </View>
              <Text style={[styles.payoutLabel, { color: theme.textPrimary }]}>{p.label}</Text>
              <View style={[styles.connectBadge, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
                <Text style={[styles.connectText, { color: theme.accent }]}>Connect</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { padding: spacing.lg, paddingBottom: 0 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },
  pageSub: { fontSize: fontSize.xs, marginTop: 2 },
  scrollContent: { paddingBottom: 80 },

  // Income hero
  incomeHero: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderRadius: 20 },
  incomeHeroLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.60)', fontWeight: '600', marginBottom: 4 },
  incomeHeroBig: { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 52 },
  incomeHeroSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.50)', marginBottom: spacing.md },
  earningsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  earningCell: { flex: 1, padding: spacing.md, borderRadius: 12 },
  earningCellVal: { fontSize: fontSize.xl, fontWeight: '800' },
  earningCellLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  refStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  refStatItem: { alignItems: 'center' },
  refStatVal: { fontSize: fontSize.xl, fontWeight: '800' },
  refStatLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.50)', marginTop: 2 },
  withdrawBtnWrap: { borderRadius: 14, overflow: 'hidden' },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  withdrawBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },

  // Card
  card: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderRadius: 20, borderWidth: 1 },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '800', marginBottom: 4 },
  cardSub: { fontSize: fontSize.sm, lineHeight: 18, marginBottom: spacing.md },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },

  // Invite code
  inviteCodeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderRadius: 16, borderWidth: 1, marginBottom: spacing.md },
  inviteCodeLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)', marginBottom: 4 },
  inviteCode: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  copyCodeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  // Invite link
  linkLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: 6 },
  inviteLink: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 1, marginBottom: spacing.sm },
  inviteLinkText: { flex: 1, fontSize: fontSize.sm },
  copyBtn: { paddingLeft: spacing.sm },

  // Share button
  shareBtnWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: spacing.md },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  shareBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },

  // How it works
  howItWorks: { padding: spacing.md, borderRadius: 12, borderWidth: 1, gap: spacing.sm },
  howTitle: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: spacing.xs },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  howEmoji: { fontSize: 16, width: 24 },
  howText: { flex: 1, fontSize: fontSize.sm, lineHeight: 18 },

  // Points
  pointsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99, borderWidth: 1 },
  pointsBadgeStar: { fontSize: 14, color: '#FFB830' },
  pointsBadgeVal: { fontSize: fontSize.xl, fontWeight: '900' },
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 0.5 },
  earnIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  earnLabel: { flex: 1, fontSize: fontSize.sm },
  earnPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  earnPillText: { fontSize: fontSize.xs, fontWeight: '700' },
  spendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 0.5 },
  spendBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
  spendBtnText: { fontSize: fontSize.xs, fontWeight: '700' },
  buyMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  pointsStar: { fontSize: 16, color: '#FFB830' },
  buyMoreText: { fontSize: fontSize.base, fontWeight: '700' },

  // Payout
  payoutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 0.5 },
  payoutIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  payoutLabel: { flex: 1, fontSize: fontSize.base, fontWeight: '600' },
  connectBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
  connectText: { fontSize: fontSize.xs, fontWeight: '700' },
});