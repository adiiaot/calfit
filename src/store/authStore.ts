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
  // ROUTING LOGIC:
  //
  // isOnboarding is used as a LOCK by OnboardingScreen.
  // When isOnboarding = true, AppNavigator shows auth stack
  // regardless of whether user is authenticated.
  //
  // setSession must NEVER flip isOnboarding to false when the
  // OnboardingScreen has explicitly set it to true — that would
  // interrupt the onboarding flow mid-way.
  //
  // setSession ONLY sets isOnboarding = true for brand new users
  // (no profile at all). For returning users it always sets false.
  // OnboardingScreen manages its own lock via setOnboarding().
  setSession: async (session) => {
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

    // Set auth state immediately
    set({
      session,
      user:            session.user,
      isAuthenticated: true,
    });

    // Load profile
    try {
      const { getProfile } = await import('../services/profileService');
      const profile = await getProfile(session.user.id);

      if (profile) {
        set({ profile });

        // ── KEY ROUTING DECISION ──────────────────────────
        // Only change isOnboarding if it is currently false.
        // If OnboardingScreen set it to true (mid-flow), we
        // NEVER override it here — that would reset the flow.
        //
        // For returning users (profile exists with goal set):
        //   isOnboarding stays false → goes to home screen
        //
        // For brand new OAuth users (profile exists, goal null):
        //   isOnboarding = true → goes to onboarding
        //   BUT only if it wasn't already set to true by OnboardingScreen

        const currentlyOnboarding = get().isOnboarding;

        if (!currentlyOnboarding) {
          // Not in onboarding flow — decide based on profile completeness
          const profileComplete = !!profile.goal;
          if (!profileComplete) {
            // Brand new OAuth user — needs onboarding
            set({ isOnboarding: true });
          }
          // Returning user with complete profile → isOnboarding stays false → home
        }
        // If currentlyOnboarding = true, don't touch it — OnboardingScreen owns it

      } else {
        // No profile at all — only set onboarding if not already set
        if (!get().isOnboarding) {
          set({ isOnboarding: true });
        }
      }
    } catch (error) {
      console.error('[authStore] setSession error:', error);
    }
  },

  loadProfile: async (userId: string) => {
    try {
      const { getProfile } = await import('../services/profileService');
      const profile = await getProfile(userId);
      if (profile) set({ profile });
    } catch (error) {
      console.error('Failed to load profile:', error);
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