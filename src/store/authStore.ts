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

  setLiveSteps:        (steps) => set({ liveSteps: steps }),
  setOnboarding:       (v) => set({ isOnboarding: v }),
  setCoachPersonality: (personality) => set({ coachPersonality: personality }),

  // ── SET SESSION ───────────────────────────────────────────
  // KEPT SYNCHRONOUS so onAuthStateChange can call it safely.
  // Profile is loaded separately in loadProfile().
  //
  // Routing rules:
  //  - No session → auth screens (Welcome/Login)
  //  - Has session, isOnboarding already true → don't touch it
  //    (OnboardingScreen owns the flag mid-flow)
  //  - Has session, isOnboarding false → stay false (go to home)
  //    loadProfile() runs after and will set isOnboarding=true
  //    only if profile has no goal (brand new OAuth user)
  setSession: (session) => {
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

    // Don't override isOnboarding if OnboardingScreen set it
    const currentlyOnboarding = get().isOnboarding;

    set({
      session,
      user:            session.user,
      isAuthenticated: true,
      // Only clear isOnboarding if it wasn't deliberately set
      // by OnboardingScreen. If it was set, leave it alone.
      ...(currentlyOnboarding ? {} : { isOnboarding: false }),
    });

    // Load profile async — this may flip isOnboarding for new OAuth users
    // but won't interfere with the OnboardingScreen flow
    if (!currentlyOnboarding) {
      get().loadProfile(session.user.id);
    }
  },

  // ── LOAD PROFILE ─────────────────────────────────────────
  // Loads profile and determines if user needs onboarding.
  // Called after setSession for non-onboarding flows.
  loadProfile: async (userId: string) => {
    try {
      const { getProfile } = await import('../services/profileService');
      const profile = await getProfile(userId);

      if (profile) {
        set({ profile });
        // New OAuth user has profile (from trigger) but goal = null
        // → send to onboarding to complete setup
        // Returning user has goal set → stay on home screen
        const needsOnboarding = !profile.goal;
        if (needsOnboarding && !get().isOnboarding) {
          set({ isOnboarding: true });
        }
      } else {
        // No profile at all — needs onboarding
        if (!get().isOnboarding) {
          set({ isOnboarding: true });
        }
      }
    } catch (error) {
      console.error('[authStore] loadProfile error:', error);
    }
  },

  updateProfile: (updates) => {
    const current = get().profile;
    if (current) set({ profile: { ...current, ...updates } });
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { supabase } = await import('../services/supabase');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange fires → setSession called → loadProfile runs
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
      user:             null,
      session:          null,
      profile:          null,
      isOnboarding:     false,
      isAuthenticated:  false,
      userTier:         'free',
      coachPersonality: 'balanced',
      liveSteps:        0,
    });
  },
}));