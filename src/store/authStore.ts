import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../services/profileService';

type CoachPersonality = 'balanced' | 'motivator' | 'strict' | 'calm' | 'friendly';

interface AuthState {
  user:             User | null;
  session:          Session | null;
  profile:          Profile | null;
  isLoading:        boolean;
  isAuthenticated:  boolean;
  isOnboarding:     boolean;
  userTier:         'free' | 'pro' | 'premium';
  coachPersonality: CoachPersonality;
  liveSteps:        number;

  setLiveSteps:        (steps: number) => void;
  setSession:          (session: Session | null) => void;
  setOnboarding:       (v: boolean) => void;
  loadProfile:         (userId: string) => Promise<void>;
  updateProfile:       (updates: Partial<Profile>) => void;
  setCoachPersonality: (personality: CoachPersonality) => void;
  signIn:              (email: string, password: string) => Promise<void>;
  signUp:              (email: string, password: string) => Promise<void>;
  signOut:             () => Promise<void>;
}

// ── PROFILE COMPLETENESS CHECK ────────────────────────────────
// A profile is "complete" if the user has gone through onboarding.
// We check for goal — it's set in step 2 of onboarding and is the
// earliest indicator that onboarding was completed.
// Google/Apple users who skipped onboarding will have goal = null
// from the auto-created trigger row, so they need onboarding.
// BUT: if they previously completed onboarding, goal will be set.
const isProfileComplete = (profile: Profile | null): boolean => {
  if (!profile) return false;
  // goal is set during onboarding step 2 — if it exists, onboarding was done
  return !!profile.goal;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user:             null,
  session:          null,
  profile:          null,
  isLoading:        false,
  isAuthenticated:  false,
  isOnboarding:     false,
  userTier:         'free',
  coachPersonality: 'balanced',
  liveSteps:        0,

  setLiveSteps: (steps) => set({ liveSteps: steps }),
  setOnboarding: (v) => set({ isOnboarding: v }),
  setCoachPersonality: (personality) => set({ coachPersonality: personality }),

  // ── SET SESSION ───────────────────────────────────────────
  // Called on app start (getSession) and auth state changes.
  // Determines whether to route to onboarding or main app:
  //
  //   No session          → show auth screens (Welcome/Login)
  //   Session + no profile→ show onboarding (brand new user)
  //   Session + incomplete→ show onboarding (started but didn't finish)
  //   Session + complete  → go straight to main app
  //
  // WHY loadProfile before deciding: Google/Apple sign in creates a
  // profile row via DB trigger, but it has goal = null. Email signup
  // goes through OnboardingScreen which sets goal. So checking profile.goal
  // is the reliable indicator of whether onboarding was completed.
  setSession: async (session) => {
    // If no session, clear everything and show auth screens
    if (!session) {
      set({
        session:         null,
        user:            null,
        profile:         null,
        isAuthenticated: false,
        isOnboarding:    false,
      });
      return;
    }

    // Set session immediately so UI can respond
    set({
      session,
      user:            session.user,
      isAuthenticated: true,
    });

    // Load profile to determine routing
    try {
      const { getProfile } = await import('../services/profileService');
      const profile = await getProfile(session.user.id);

      if (profile) {
        set({ profile });

        // Profile exists and is complete → go to main app
        // isOnboarding stays false (or gets cleared if it was true)
        if (isProfileComplete(profile)) {
          set({ isOnboarding: false });
        } else {
          // Profile exists but incomplete (Google/Apple new user
          // who hasn't done onboarding yet) → show onboarding
          set({ isOnboarding: true });
        }
      } else {
        // No profile at all — very new user, show onboarding
        set({ isOnboarding: true });
      }
    } catch (error) {
      console.error('[authStore] loadProfile error:', error);
      // On error, default to showing onboarding rather than crashing
      set({ isOnboarding: true });
    }
  },

  loadProfile: async (userId: string) => {
    try {
      const { getProfile } = await import('../services/profileService');
      const profile = await getProfile(userId);
      if (profile) {
        set({ profile });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  },

  updateProfile: (updates) => {
    const current = get().profile;
    if (current) {
      set({ profile: { ...current, ...updates } });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { supabase } = await import('../services/supabase');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange fires → setSession called → routes correctly
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true });
    try {
      const { supabase } = await import('../services/supabase');
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      const { supabase } = await import('../services/supabase');
      await supabase.auth.signOut();
    } catch {}
    set({
      user:            null,
      session:         null,
      profile:         null,
      isOnboarding:    false,
      isAuthenticated: false,
      userTier:        'free',
      coachPersonality:'balanced',
      liveSteps:       0,
    });
  },
}));