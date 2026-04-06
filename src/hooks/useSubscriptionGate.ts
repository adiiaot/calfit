import { useAuthStore } from '../store/authStore';

type Tier = 'free' | 'pro' | 'premium';

// Define which tier is needed for each feature
const featureGates: Record<string, Tier> = {
  foodScanner: 'pro',
  aiMealPlan: 'premium',
  liveStreaming: 'premium',
  earningsWallet: 'premium',
  yearlyRecap: 'premium',
  accountabilityPartner: 'pro',
  communityGroups: 'pro',
  advancedAnalytics: 'pro',
};

const tierHierarchy: Record<Tier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

export const useSubscriptionGate = () => {
  const { userTier } = useAuthStore();

  // Check if user can access a feature
  const canAccess = (feature: string): boolean => {
    const requiredTier = featureGates[feature];
    if (!requiredTier) return true; // no gate = open to all
    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  };

  // Check AI Coach prompt limits
  const coachPromptsPerDay: Record<Tier, number> = {
    free: 5,
    pro: 20,
    premium: Infinity,
  };

  const dailyPromptLimit = coachPromptsPerDay[userTier];

  return {
    userTier,
    canAccess,
    dailyPromptLimit,
    isPro: tierHierarchy[userTier] >= 1,
    isPremium: tierHierarchy[userTier] >= 2,
    isFree: userTier === 'free',
  };
};