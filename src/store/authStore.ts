import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../services/profileService';

type CoachPersonality = 'balanced' | 'motivator' | 'strict' | 'calm' | 'friendly';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarding: boolean;
  userTier: 'free' | 'pro' | 'premium';
  coachPersonality: CoachPersonality;
  setSession: (session: Session | null) => void;
  setOnboarding: (v: boolean) => void;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
  setCoachPersonality: (personality: CoachPersonality) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
  isOnboarding: false,
  userTier: 'free',
  coachPersonality: 'balanced',

  setOnboarding: (v) => set({ isOnboarding: v }),

  setCoachPersonality: (personality) => set({ coachPersonality: personality }),

  setSession: async (session) => {
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
    });
    if (session?.user) {
      get().loadProfile(session.user.id);
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

  updateProfile: (updates: Partial<Profile>) => {
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
    set({
      user: null,
      session: null,
      profile: null,
      isOnboarding: false,
      userTier: 'free',
      coachPersonality: 'balanced',
    });
  },
}));