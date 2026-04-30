// ─────────────────────────────────────────────────────────────────────────────
// src/services/oauthService.ts
//
// Google Sign In:  Works on Android + iOS with EAS build
//                  Uses @react-native-google-signin/google-signin
//                  Requires google-services.json (Android) and
//                  GoogleService-Info.plist (iOS) in project root
//
// Apple Sign In:   iOS only, requires Apple Developer account
//                  Uses expo-apple-authentication
//                  Stubbed and ready — activates when entitlement is added
//
// Both flows:
//   1. Get OAuth token from provider
//   2. Pass token to Supabase signInWithIdToken
//   3. Supabase creates/logs in the user and returns a session
//   4. setSession() updates Zustand — app navigates automatically
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import { supabase } from './supabase';

// ── GOOGLE SIGN IN ────────────────────────────────────────────
// Lazy require so it doesn't crash Expo Go at startup
const getGoogleSignin = () => {
  try {
    return require('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
};

// Web Client ID from Firebase Console → Authentication → Google provider
// This is the OAuth 2.0 client ID for the web — NOT the Android/iOS client ID
const GOOGLE_WEB_CLIENT_ID = '127329835469-ckgq0pbr0nk0mp6g76d5ks7ku9dhtcii.apps.googleusercontent.com';

export const configureGoogleSignIn = () => {
  const gs = getGoogleSignin();
  if (!gs) return;

  gs.GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // scopes: ['profile', 'email'], // default — no extra scopes needed
    offlineAccess: false,
  });
};

export const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
  const gs = getGoogleSignin();

  if (!gs) {
    return {
      success: false,
      error: 'Google Sign In requires a dev client build — not available in Expo Go.',
    };
  }

  try {
    // Check Google Play Services (Android only)
    await gs.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Trigger Google sign in flow
    const userInfo = await gs.GoogleSignin.signIn();
    const idToken = userInfo?.data?.idToken ?? userInfo?.idToken;

    if (!idToken) throw new Error('No ID token returned from Google');

    // Pass token to Supabase — it verifies and creates/logs in the user
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token:    idToken,
    });

    if (error) throw error;

    return { success: true };
  } catch (e: any) {
    const code = e.code ?? '';

    // User cancelled — not an error worth showing
    if (code === gs.statusCodes?.SIGN_IN_CANCELLED ||
        code === 'SIGN_IN_CANCELLED') {
      return { success: false };
    }

    console.error('[OAuth] Google sign in error:', e);
    return {
      success: false,
      error: e.message ?? 'Google Sign In failed. Please try again.',
    };
  }
};

export const signOutGoogle = async () => {
  const gs = getGoogleSignin();
  if (!gs) return;
  try {
    await gs.GoogleSignin.signOut();
  } catch {}
};

// ── APPLE SIGN IN ─────────────────────────────────────────────
// Requires: Apple Developer account + Sign In with Apple capability
// expo-apple-authentication handles the native prompt
// Currently stubbed — will activate once entitlement is provisioned

const getAppleAuth = () => {
  try {
    return require('expo-apple-authentication');
  } catch {
    return null;
  }
};

export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  const aa = getAppleAuth();
  if (!aa) return false;
  try {
    return await aa.isAvailableAsync();
  } catch {
    return false;
  }
};

export const signInWithApple = async (): Promise<{ success: boolean; error?: string }> => {
  const aa = getAppleAuth();

  if (!aa) {
    return {
      success: false,
      error: 'Apple Sign In requires an EAS build with Apple Developer entitlements.',
    };
  }

  try {
    const credential = await aa.signInAsync({
      requestedScopes: [
        aa.AppleAuthenticationScope.FULL_NAME,
        aa.AppleAuthenticationScope.EMAIL,
      ],
    });

    const idToken = credential.identityToken;
    if (!idToken) throw new Error('No identity token from Apple');

    // Pass to Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token:    idToken,
    });

    if (error) throw error;

    return { success: true };
  } catch (e: any) {
    // User cancelled
    if (e.code === 'ERR_REQUEST_CANCELED') {
      return { success: false };
    }

    console.error('[OAuth] Apple sign in error:', e);
    return {
      success: false,
      error: e.message ?? 'Apple Sign In failed. Please try again.',
    };
  }
};