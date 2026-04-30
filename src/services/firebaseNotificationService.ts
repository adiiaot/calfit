// ─────────────────────────────────────────────────────────────────────────────
// src/services/firebaseNotificationService.ts
//
// WHY THIS FILE:
//   The existing notificationService.ts uses Expo local notifications which
//   only fire when the app is open. Firebase Cloud Messaging (FCM) delivers
//   push notifications to the device even when the app is closed/killed.
//
// HOW IT WORKS:
//   1. On app launch, we register for FCM and get a device token
//   2. We save that token to Supabase (profiles.fcm_token)
//   3. When we want to notify a user, we call sendPushNotification()
//      which uses the Supabase Edge Function to send via FCM
//   4. Foreground notifications are handled here and shown as banners
//
// PLATFORM NOTES:
//   - Android: works fully with google-services.json in project root
//   - iOS: requires APNs certificate from Apple Developer account
//           Everything is wired — just needs the certificate added
// ─────────────────────────────────────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';


// ── NOTIFICATION HANDLER ──────────────────────────────────────
// Controls how notifications appear when app is in foreground
// FIXED
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:   true,
    shouldPlaySound:   true,
    shouldSetBadge:    false,
    shouldShowBanner:  true,
    shouldShowList:    true,
  }),
});



// ── REGISTER FOR PUSH ─────────────────────────────────────────
// Gets the Expo push token (which works with FCM under the hood via EAS).
// Saves it to the user's profile so we can target them from the server.
export const registerForPushNotifications = async (
  userId: string
): Promise<string | null> => {
 // Then replace Device.isDevice with:
if (!Constants.isDevice) {
  console.log('[FCM] Not a physical device — skipping push registration');
  return null;
}

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[FCM] Push notification permission denied');
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:             'CalFit Notifications',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#0DAE6C',
    });
  }

  try {
    // Get Expo push token — this wraps FCM (Android) and APNs (iOS)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    const token = tokenData.data;
    console.log('[FCM] Push token:', token);

    // Save to Supabase so server can target this device
    await supabase
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', userId);

    return token;
  } catch (e) {
    console.error('[FCM] getExpoPushTokenAsync error:', e);
    return null;
  }
};

// ── SEND PUSH NOTIFICATION ────────────────────────────────────
// Sends a notification to any CalFit user by their userId.
// Looks up their FCM token from profiles and sends via Expo Push API.
// This runs client-side for now — move to Edge Function for production
// to avoid exposing the send logic in the client bundle.
export const sendPushNotification = async (
  recipientUserId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> => {
  try {
    // Get recipient's push token
    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', recipientUserId)
      .single();

    const token = profile?.fcm_token;
    if (!token) return; // User hasn't registered for push yet

    // Send via Expo Push API (handles FCM + APNs routing)
    await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: {
        'Accept':       'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to:    token,
        title,
        body,
        data:  data ?? {},
        sound: 'default',
        badge: 1,
        channelId: 'default',
      }),
    });
  } catch (e) {
    // Silent fail — push notification failure should never crash the app
    console.error('[FCM] sendPushNotification error:', e);
  }
};

// ── NOTIFICATION LISTENERS ────────────────────────────────────
// Call setupNotificationListeners() once in App.tsx.
// Returns a cleanup function to remove listeners on unmount.
export const setupNotificationListeners = (
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) => {
  const receivedSub = Notifications.addNotificationReceivedListener(notification => {
    // App is foregrounded — notification arrived
    onNotificationReceived?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    // User tapped the notification
    onNotificationResponse?.(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
};

// ── BADGE MANAGEMENT ──────────────────────────────────────────
export const clearBadge = async () => {
  await Notifications.setBadgeCountAsync(0);
};

export const setBadgeCount = async (count: number) => {
  await Notifications.setBadgeCountAsync(count);
};