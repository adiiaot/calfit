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

  if (error) {
    console.error('loadPartners error:', error.message);
    return [];
  }
  return (data as any[]) ?? [];
};

export const addPartner = async (
  userId: string,
  partnerCalfitId: string
): Promise<{ success: boolean; message: string }> => {
  // ── Step 1: find the partner by CalFit ID ──────────────────
  const { data: partnerProfile, error: findError } = await supabase
    .from('profiles')
    .select('id, full_name, calfit_id')
    .eq('calfit_id', partnerCalfitId.toLowerCase().trim())
    .maybeSingle(); // maybeSingle returns null instead of error when not found

  if (findError) {
    console.error('addPartner find error:', findError.message);
    return { success: false, message: 'Something went wrong. Please try again.' };
  }

  if (!partnerProfile) {
    return { success: false, message: 'No user found with that CalFit ID. Check the ID and try again.' };
  }

  if (partnerProfile.id === userId) {
    return { success: false, message: 'You cannot add yourself as a partner.' };
  }

  // ── Step 2: check if already partners ─────────────────────
  const { data: existing } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', userId)
    .eq('partner_id', partnerProfile.id)
    .maybeSingle();

  if (existing) {
    return { success: false, message: `You are already partners with ${partnerProfile.full_name}.` };
  }

  // ── Step 3: insert both directions separately ──────────────
  // Inserting both rows in one .insert([...]) call can fail silently
  // if one row already exists. Doing them separately lets us catch
  // each failure independently.
  const { error: err1 } = await supabase
    .from('partners')
    .insert({ user_id: userId, partner_id: partnerProfile.id, status: 'active' });

  if (err1) {
    // Unique constraint violation (code 23505) means row already exists — not a real error
    if (err1.code !== '23505') {
      console.error('addPartner insert row 1 error:', err1.message, err1.code);
      return { success: false, message: 'Could not add partner. Please try again.' };
    }
  }

  const { error: err2 } = await supabase
    .from('partners')
    .insert({ user_id: partnerProfile.id, partner_id: userId, status: 'active' });

  if (err2 && err2.code !== '23505') {
    console.error('addPartner insert row 2 error:', err2.message, err2.code);
    // Row 1 inserted fine — partial success still works for the current user
  }

  return {
    success: true,
    message: `${partnerProfile.full_name} added as your accountability partner! 🎉`,
  };
};

export const removePartner = async (
  userId: string,
  partnerId: string
): Promise<boolean> => {
  // Remove both directions
  const { error: e1 } = await supabase
    .from('partners')
    .delete()
    .eq('user_id', userId)
    .eq('partner_id', partnerId);

  const { error: e2 } = await supabase
    .from('partners')
    .delete()
    .eq('user_id', partnerId)
    .eq('partner_id', userId);

  return !e1 && !e2;
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