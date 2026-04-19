# CalFit — Payment Setup Guide
### FABS Development (fabsdevelopment.com)
### Stack: React Native + Expo + react-native-iap

---

## Overview

CalFit uses **Apple In-App Purchases (IAP)** for iOS and **Google Play Billing** for Android.
Stripe was removed. All subscription payments go through the native store payment processors.

**Why native billing:**
- Apple and Google require it for digital subscription apps
- Apps that bypass it (using Stripe for subscriptions) get removed from stores
- Apple takes 30% (15% for apps earning under $1M/year via Small Business Program)
- Google takes 30% (15% for first $1M/year)

---

## Subscription Tiers

| Tier    | Price      | Product ID |
|---------|------------|------------|
| Free    | $0         | N/A — default |
| Pro     | $9.99/month | `com.fabsdevelopment.calfit.pro.monthly` |
| Premium | $19.99/month | `com.fabsdevelopment.calfit.premium.monthly` |

> **IMPORTANT:** These product IDs must match EXACTLY in:
> - App Store Connect (iOS)
> - Google Play Console (Android)
> - `src/services/iapService.ts` in the codebase

---

## Files Already Built

```
src/services/iapService.ts          — IAP connection, purchase, restore logic
src/screens/earnings/SubscriptionScreen.tsx  — UI for choosing a plan
App.tsx                             — IAP listeners wired in on user login
```

---

## Step 1 — Install the Package

```bash
npm install react-native-iap
npx expo install expo-modules-core
```

---

## Step 2 — Update app.json Bundle ID

Make sure `app.json` has the correct bundle ID before submitting to either store:

```json
{
  "expo": {
    "name": "CalFit",
    "slug": "calfit",
    "scheme": "calfit",
    "ios": {
      "bundleIdentifier": "com.fabsdevelopment.calfit",
      "usesAppleSignIn": true
    },
    "android": {
      "package": "com.fabsdevelopment.calfit"
    }
  }
}
```

---

## Step 3 — Google Play Setup ($25 one-time fee)

### 3a — Create Developer Account
1. Go to `play.google.com/console`
2. Sign in with the FABS Development Google account (`@fabsdevelopment.com`)
3. Pay the **$25 one-time** developer registration fee
4. Fill in developer profile — use **FABS Development** as the developer name
5. Complete account verification (takes 1–2 business days)

### 3b — Create the App
1. In Play Console click **Create app**
2. App name: **CalFit**
3. Default language: English
4. App or Game: **App**
5. Free or Paid: **Free** (subscriptions are handled in-app)
6. Accept declarations and click **Create app**

### 3c — Create Subscription Products
1. In the left menu go to **Monetize → Subscriptions**
2. Click **Create subscription**
3. Create the first subscription:
   - **Product ID:** `com.fabsdevelopment.calfit.pro.monthly`
   - **Name:** CalFit Pro
   - **Billing period:** Monthly
   - **Price:** $9.99 USD
   - **Free trial:** Optional (7 days recommended)
   - Click **Save**
4. Create the second subscription:
   - **Product ID:** `com.fabsdevelopment.calfit.premium.monthly`
   - **Name:** CalFit Premium
   - **Billing period:** Monthly
   - **Price:** $19.99 USD
   - **Free trial:** Optional (7 days recommended)
   - Click **Save**
5. **Activate** both subscriptions (they must be Active not Draft)

### 3d — Add AOT as Admin
1. Go to **Users and permissions** in Play Console
2. Click **Invite new users**
3. Enter AOT's email address
4. Set role to **Admin**
5. Click **Send invitation**

### 3e — Get google-services.json
1. Go to `console.firebase.google.com`
2. Create a new project or use existing one
3. Add an Android app with package name: `com.fabsdevelopment.calfit`
4. Download `google-services.json`
5. Place it in the **root of the CalFit project folder**

---

## Step 4 — Apple App Store Setup ($99/year fee)

### 4a — Create Developer Account
1. Go to `developer.apple.com`
2. Sign in with the FABS Development Apple ID
3. Enroll in the **Apple Developer Program**
4. Pay the **$99/year** fee
5. Verification takes 24–48 hours

### 4b — Create the App in App Store Connect
1. Go to `appstoreconnect.apple.com`
2. Click the **+** button → **New App**
3. Fill in:
   - **Platform:** iOS
   - **Name:** CalFit
   - **Primary Language:** English
   - **Bundle ID:** `com.fabsdevelopment.calfit` (must match app.json)
   - **SKU:** `calfit-ios-001` (any unique string)
4. Click **Create**

### 4c — Create Subscription Products
1. Inside the CalFit app page go to **Features → In-App Purchases**
2. Click **Manage** next to In-App Purchases
3. Click the **+** button
4. Select **Auto-Renewable Subscription**
5. Create a **Subscription Group:**
   - Group name: **CalFit Subscriptions**
   - Reference name: `calfit-subscriptions`
6. Inside the group add the first subscription:
   - **Reference name:** CalFit Pro Monthly
   - **Product ID:** `com.fabsdevelopment.calfit.pro.monthly`
   - Click **Create**
   - Set **Price:** $9.99 USD
   - Add **Localization** (English):
     - Display name: CalFit Pro
     - Description: 20 AI Coach prompts, food scanner, no ads, up to 5 groups
   - **Subscription Duration:** 1 Month
   - Click **Save**
7. Add the second subscription:
   - **Reference name:** CalFit Premium Monthly
   - **Product ID:** `com.fabsdevelopment.calfit.premium.monthly`
   - Click **Create**
   - Set **Price:** $19.99 USD
   - Add **Localization** (English):
     - Display name: CalFit Premium
     - Description: Unlimited AI Coach, AI Meal Planner, live streaming, referral earnings
   - **Subscription Duration:** 1 Month
   - Click **Save**
8. Both products need to be **submitted for review** — Apple reviews IAP products separately
9. Status must show **Approved** before payments work in production

### 4d — Add AOT as Admin
1. In App Store Connect go to **Users and Access**
2. Click the **+** button to invite a user
3. Enter AOT's email address
4. Set role to **Admin**
5. Click **Invite**

### 4e — Get GoogleService-Info.plist (for iOS push notifications)
1. Go to `console.firebase.google.com`
2. Add an iOS app with bundle ID: `com.fabsdevelopment.calfit`
3. Download `GoogleService-Info.plist`
4. Add it to the project (AOT handles this)

---

## Step 5 — Google OAuth Credentials (for Google Sign In)

1. Go to `console.cloud.google.com`
2. Create a new project named **CalFit**
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **iOS** → Bundle ID: `com.fabsdevelopment.calfit`
6. Create another for **Android** → Package: `com.fabsdevelopment.calfit`
7. Copy the **Client IDs** and share with AOT
8. In Supabase dashboard → Authentication → Providers → Google:
   - Enable Google
   - Paste the Client ID and Client Secret
   - Add Supabase callback URL to Google Cloud Console

---

## Step 6 — Apple Sign In Credentials

1. In Apple Developer portal go to **Identifiers**
2. Find or create the `com.fabsdevelopment.calfit` identifier
3. Enable **Sign In with Apple** capability
4. Go to **Keys → Create a Key**
5. Enable **Sign In with Apple**
6. Download the `.p8` private key file
7. In Supabase dashboard → Authentication → Providers → Apple:
   - Enable Apple
   - Enter the Key ID, Team ID, and paste the `.p8` key content
8. Add Supabase callback URL to Apple Developer portal

---

## Step 7 — Supabase Migration to FABS Development Account

When FABS Development has their Supabase account ready:

1. FABS Development creates account at `supabase.com` with `@fabsdevelopment.com` email
2. FABS Development creates a new **Organisation** in their account
3. AOT exports a complete SQL migration file from current project
4. FABS Development creates a new Supabase **Project**
5. AOT runs the migration SQL in the new project SQL editor
6. AOT migrates Storage buckets (avatars, posts-media)
7. AOT re-deploys the `delete-user` Edge Function with the new service role key
8. AOT updates `.env` with new:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
9. Rebuild with EAS and run full end-to-end test

---

## Step 8 — EAS Build & Submission

Once all accounts are set up:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login with FABS Development Expo account
eas login

# Configure EAS
eas build:configure

# Build for Android (APK for testing)
eas build --platform android --profile preview

# Build for iOS (TestFlight)
eas build --platform ios --profile preview

# Submit to Google Play
eas submit --platform android

# Submit to App Store
eas submit --platform ios
```

---

## Revenue Split Summary

| Store | AOT Cut | Store Cut | Net to FABS |
|-------|---------|-----------|-------------|
| Apple App Store | — | 30% (15% if <$1M/year) | 70% of subscription |
| Google Play | — | 30% (15% if <$1M/year) | 70% of subscription |

To qualify for the 15% reduced fee:
- **Apple:** Apply for Small Business Program at `developer.apple.com/app-store/small-business-program`
- **Google:** Automatically applied for first $1M/year in earnings

---

## IAP Code Reference

### Product IDs (must match stores exactly)
```typescript
com.fabsdevelopment.calfit.pro.monthly      // $9.99/month
com.fabsdevelopment.calfit.premium.monthly  // $19.99/month
```

### Key files
```
src/services/iapService.ts                  // All IAP logic
src/screens/earnings/SubscriptionScreen.tsx // Purchase UI
App.tsx                                     // Purchase listeners
```

### How it works
1. User taps upgrade on SubscriptionScreen
2. `purchaseSubscription(productId)` calls native store payment sheet
3. User pays through Apple/Google — CalFit never sees card details
4. `purchaseUpdatedListener` in App.tsx receives successful purchase
5. `updateUserTierInDB` updates the user's tier in Supabase
6. `finishTransaction` is called — CRITICAL or Apple/Google refunds after 3 days
7. User's CalFit experience upgrades immediately

### Restore purchases (required by Apple)
- Users can tap "Restore previous purchases" on SubscriptionScreen
- `restorePurchases` checks `getAvailablePurchases` from the store
- If found, re-activates the tier in Supabase

---

## Checklist Before Launch

- [ ] Google Play developer account created and verified
- [ ] Google Play subscription products created and Active
- [ ] Apple Developer account created and verified  
- [ ] App Store Connect app created with correct bundle ID
- [ ] Apple IAP subscription products created and Approved
- [ ] Google OAuth credentials created and added to Supabase
- [ ] Apple Sign In credentials created and added to Supabase
- [ ] `google-services.json` added to project root (Android)
- [ ] `GoogleService-Info.plist` added to project (iOS)
- [ ] Supabase migrated to FABS Development account
- [ ] `.env` updated with new Supabase credentials
- [ ] EAS build generated for both platforms
- [ ] TestFlight build tested on iOS
- [ ] Internal test track tested on Android
- [ ] IAP purchase flow tested end to end
- [ ] Restore purchases tested
- [ ] App submitted for App Store review
- [ ] App submitted to Google Play