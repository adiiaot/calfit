import { supabase } from '../../../services/supabase';

export interface PartnerData {
  id: string;
  partner_id: string;
  shared_goal: string | null;
  partner_streak: number;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  partner_profile: {
    id: string;
    full_name: string;
    calfit_id: string;
    avatar_url: string | null;
    goal: string;
    streak_count: number;
    current_weight_kg: number | null;
  } | null;
}

export const loadPartners = async (userId: string): Promise<PartnerData[]> => {
  const { data, error } = await supabase
    .from('partners')
    .select(`
      id, partner_id, shared_goal, partner_streak, status, created_at,
      partner_profile:partner_id (
        id, full_name, calfit_id, avatar_url, goal,
        streak_count, current_weight_kg
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error || !data) return [];
  return data as any[];
};

export const addPartner = async (
  userId: string,
  partnerCalfitId: string
): Promise<{ success: boolean; message: string }> => {
  // Find partner by CalFit ID
  const { data: partnerProfile, error: findError } = await supabase
    .from('profiles')
    .select('id, full_name, calfit_id')
    .eq('calfit_id', partnerCalfitId)
    .single();

  if (findError || !partnerProfile) {
    return { success: false, message: 'User not found. Check the CalFit ID and try again.' };
  }

  if (partnerProfile.id === userId) {
    return { success: false, message: 'You cannot add yourself as a partner.' };
  }

  // Check if already partners
  const { data: existing } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', userId)
    .eq('partner_id', partnerProfile.id)
    .maybeSingle();

  if (existing) {
    return { success: false, message: 'You are already partners with this user.' };
  }

  // Add partnership both ways
  const { error } = await supabase
    .from('partners')
    .insert([
      { user_id: userId, partner_id: partnerProfile.id, status: 'active' },
      { user_id: partnerProfile.id, partner_id: userId, status: 'active' },
    ]);

  if (error) {
    return { success: false, message: 'Could not add partner. Please try again.' };
  }

  return {
    success: true,
    message: `${partnerProfile.full_name} added as your accountability partner!`,
  };
};

export const removePartner = async (
  userId: string,
  partnerId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('partners')
    .delete()
    .or(
      `and(user_id.eq.${userId},partner_id.eq.${partnerId}),` +
      `and(user_id.eq.${partnerId},partner_id.eq.${userId})`
    );
  return !error;
};

export const updateSharedGoal = async (
  userId: string,
  partnerId: string,
  goal: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('partners')
    .update({ shared_goal: goal })
    .eq('user_id', userId)
    .eq('partner_id', partnerId);
  return !error;
};