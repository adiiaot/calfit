import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { PartnerCard } from '../components/PartnerCard';
import { PartnerInviteSheet } from '../components/PartnerInviteSheet';
import { SharedDashboardCard } from '../components/SharedDashboardCard';
import { EmptyState } from '../../shared/EmptyState';
import { usePartner } from '../hooks/usePartner';
import { getOrCreateConversation } from '../../chat/services/chatServices';

const MAX_PARTNERS = 3;

export default function AccountabilityScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [showInvite, setShowInvite] = useState(false);
  const { partners, isLoading, isAdding, add, remove } = usePartner(user?.id ?? '');

  const handleAdd = async (calfitId: string) => {
    const result = await add(calfitId);
    if (result.success) {
      setShowInvite(false);
      Alert.alert('Partner Added! 🎉', result.message);
    } else {
      Alert.alert('Could not add partner', result.message);
    }
  };

  const handleMessage = async (partnerId: string, partnerData: any) => {
    if (!user?.id) return;
    const convId = await getOrCreateConversation(user.id, partnerId);
    if (convId) {
      navigation.navigate('Chat', {
        conversationId: convId,
        otherUserId: partnerId,
        otherUserName: partnerData?.full_name ?? 'Partner',
        otherUserCalfitId: partnerData?.calfit_id ?? '',
        otherUserAvatar: partnerData?.avatar_url ?? null,
        otherUserGoal: partnerData?.goal ?? '',
        otherUserStreak: partnerData?.streak_count ?? 0,
      });
    }
  };

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'You';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Accountability</Text>
        {partners.length < MAX_PARTNERS ? (
          <TouchableOpacity
            onPress={() => setShowInvite(true)}
            style={[styles.addBtn, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="add" size={18} color={theme.bg} />
            <Text style={[styles.addBtnText, { color: theme.bg }]}>Add</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Info bar */}
      <View style={[styles.infoBar, {
        backgroundColor: theme.accentDim as string,
        borderColor: theme.accent,
      }]}>
        <Ionicons name="people-outline" size={13} color={theme.accent} />
        <Text style={[styles.infoText, { color: theme.accent }]}>
          {partners.length}/{MAX_PARTNERS} partners · Only fitness progress is shared
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {partners.length === 0 ? (
            <EmptyState
              theme={theme}
              icon="people-outline"
              title="No partners yet"
              subtitle="Add up to 3 accountability partners by their CalFit ID. You'll share workout streaks and keep each other on track."
              buttonLabel="Add a Partner"
              onButtonPress={() => setShowInvite(true)}
            />
          ) : (
            <>
              {/* Shared dashboard for first partner */}
              <SharedDashboardCard
                theme={theme}
                myName={userName}
                myStreak={(profile as any)?.streak_count ?? 0}
                myCalories={(profile as any)?.calories_today ?? 0}
                myCalorieGoal={(profile as any)?.daily_calorie_goal ?? 2000}
                myWater={(profile as any)?.water_today ?? 0}
                myWaterGoal={(profile as any)?.daily_water_goal ?? 2.5}
                partnerName={partners[0]?.partner_profile?.full_name ?? 'Partner'}
                partnerStreak={partners[0]?.partner_profile?.streak_count ?? 0}
              />

              {/* Partner cards */}
              {partners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  theme={theme}
                  currentUserId={user?.id ?? ''}
                  onMessage={() =>
                    handleMessage(
                      partner.partner_id,
                      partner.partner_profile
                    )
                  }
                  onRemove={() => remove(partner.partner_id)}
                  onProfilePress={() =>
                    navigation.navigate('Profile', {
                      userId: partner.partner_id,
                    })
                  }
                />
              ))}

              {/* Add more */}
              {partners.length < MAX_PARTNERS && (
                <TouchableOpacity
                  onPress={() => setShowInvite(true)}
                  style={[styles.addMoreBtn, {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  }]}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.textMuted} />
                  <Text style={[styles.addMoreText, { color: theme.textMuted }]}>
                    Add another partner ({partners.length}/{MAX_PARTNERS})
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      )}

      <PartnerInviteSheet
        theme={theme}
        visible={showInvite}
        isAdding={isAdding}
        onClose={() => setShowInvite(false)}
        onAdd={handleAdd}
      />
    </SafeAreaView>
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
  title: { fontSize: fontSize.lg, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  addBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  infoText: { fontSize: fontSize.xs, fontWeight: '600' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  addMoreText: { fontSize: fontSize.base, fontWeight: '600' },
});