# CalFit — Personal Fitness & Nutrition Coach

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)
[![Buy on Selar](https://img.shields.io/badge/Buy_on-Selar-5B2D90)](https://selar.com/39m7437811)

> **Built by [AOT AYO](https://github.com/adiiaot)** — Full-stack fitness & nutrition coaching platform with AI integration.

A React Native (Expo) mobile app for calorie tracking, workouts, sleep monitoring, intermittent fasting, AI-powered coaching & journaling, and accountability partners.

---

## Features

| Feature | Description |
|---------|-------------|
| **Calorie Tracking** | Log meals with macros, search Open Food Facts + Nigerian food DB, track water intake |
| **Workout & Activity** | Exercise catalog, timer/stopwatch with TTS, personal records, quick-start routines |
| **AI Coach** | Generate personalized workouts via NVIDIA Llama 3.1; conversational chat for health advice, meal plans, form tips |
| **Food Scanner** | AI vision-based food recognition using camera — auto-detect food items with nutrition info and log to meals |
| **Step Tracking** | Pedometer integration with live step count, daily goals, calorie conversion |
| **Sleep Tracking** | Log sleep hours with quality rating, 7-day history |
| **Intermittent Fasting** | Protocol selection (16:8, 18:6, 20:4, 24hr, 5:2), active timer with progress ring |
| **Streaks** | Daily check-in streaks with milestone celebrations (3–100 days) |
| **Progress Dashboard** | Period-based charts for calories, workouts, water, sleep, steps, body measurements |
| **Accountability Partners** | Add up to 3 partners by CalFit ID, compare streaks, set shared goals, real-time chat |
| **Notes** | CRUD journal for personal notes, synced to Supabase |
| **AI Coach Chat** | Conversational interface with the AI coach — ask health questions, generate meal plans, workouts, get motivation |
| **Notifications** | In-app notification inbox with filtering by type |
| **Subscription** | Free / Pro / Premium tiers (IAP stubbed for future store deployment) |
| **Data Export** | Download all user data as CSV or text report |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81 + Expo 54 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation v7 (Stack + Bottom Tabs + Radial Menu) |
| State | Zustand v5 |
| Backend/Auth | Supabase (Auth, PostgreSQL, Realtime, Storage) |
| AI | NVIDIA Llama 3.1 70B (chat) + Llama 3.2 90B Vision (food scanner) |
| Food DB | Open Food Facts API + local Nigerian food database |
| Voice | Deepgram STT (speech-to-text for AI Coach) |
| Animations | React Native Animated + Lottie |
| Charts | Pure React Native (no external chart library) |

---

## Project Structure

```
calfit/
├── App.tsx                       # Root — fonts, auth init
├── index.ts                      # Expo entry
├── src/
│   ├── navigation/               # AppNavigator — AuthStack + AppStack + TabNavigator
│   ├── screens/                  # 15+ screen groups (onboarding, dashboard, calorie, etc.)
│   ├── components/               # Reusable UI (ChatBubble, RadialMenu, WorkoutForm, etc.)
│   ├── modules/
│   │   ├── accountability/       # Partner management + real-time chat
│   │   └── shared/               # AndroidSafeView, UserAvatar, EmptyState, ResponsiveScreens
│   ├── store/                    # Zustand stores (auth, theme, aiCoach, mealPlan)
│   ├── services/                 # Supabase, NVIDIA, Deepgram, food search, etc.
│   ├── hooks/                    # useSteps, useWorkoutVoice
│   ├── theme/                    # Design tokens (colors, typography, spacing)
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # AI prompts, JSON parser, strip-markdown
├── assets/                       # App icons & splash screen
├── supabase/                     # Database migrations
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build profiles
└── package.json
```

---

## Try It Out

### Web
View the APP live on your browser with no authentication needed: [CalFit Web Version](https://dist-seven-woad-33.vercel.app/)

### Android (APK)
Download the latest APK: [Google Drive link](https://drive.google.com/drive/folders/1YOUR_FOLDER_ID) *(link will be updated after build)*

### iOS (Expo Go)
1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from the App Store
2. Scan the QR code below with your iPhone camera:

```
[QR code image will be displayed when expo start is running]
```

Or clone and run locally:

```bash
git clone https://github.com/adiiaot/calfit.git
cd calfit
npm install
npx expo start
```

---

## Running Locally

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go (iOS)** or the **Expo app (Android)**.

> **Note:** The Recap screen's image export feature requires the native `react-native-view-shot` module, which is only available in the Android APK build. On iOS (Expo Go), it falls back to text sharing.

---

## Key Architecture Decisions

- **Steps tracking** lives in `TabNavigator` (not HomeScreen) so the pedometer subscription survives navigation — all screens read `liveSteps` from Zustand
- **Onboarding flow** is owned entirely by `OnboardingScreen` — `authStore.setSession` never touches `isOnboarding`
- **AI cache** — workout generation results are cached for 5 minutes to avoid redundant API calls for identical params
- **Notifications** — all in-app notification types are defined in `notificationService.tsx` and stored in Supabase
- **Responsive design** — uses `ResponsiveScreens.ts` with `scaleX`, `scaleY`, `moderateScale` for adaptive layouts across device sizes
- **Safe area** — custom `AndroidSafeView` wrapper handles status bar, notch, and home indicator on both platforms

---

## Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| profiles | User profile, goals, body stats, preferences |
| food_logs | Daily meal entries with macros |
| water_logs | Water intake records |
| workout_sessions | Completed workout sessions |
| step_logs | Daily step counts |
| sleep_logs | Sleep duration and quality |
| fasting_logs | Intermittent fasting sessions |
| notifications | In-app notification inbox |
| ai_generated_workouts | Saved AI-generated workouts |
| ai_api_usage | AI API usage logging |
| partner_messages | Real-time accountability chat messages |
| partners | Accountability partner relationships |
| notes | User journal entries |

---

## License

This project is open-source for **personal and educational use** only.

> Commercial use (rebranding, white-label, selling to clients, app store publication) requires a paid Commercial License.
> See [LICENSE.md](LICENSE.md) for full terms.

| Use Case | Allowed |
|----------|---------|
| Viewing/forking for learning | ✅ |
| Personal projects | ✅ |
| Showcasing in portfolio | ✅ |
| Rebranding & selling to a client | ❌ Requires license |
| Publishing on App Store / Play Store | ❌ Requires license |
| Using as a foundation for a commercial product | ❌ Requires license |

**Purchase a Commercial License:**
- **Buy Full Source Code Setup on Selar**: [CalFit Licensed Source Code](https://selar.com/39m7437811)
- **Custom / Enterprise**: aotnetworklabs@gmail.com

---

## Portfolio & Verification

This app was built by **AOT AYO UNDER THE AOT Network**. Source code is available on GitHub for verification:

- **Portfolio**: [aotnetwork.vercel.app](https://aotnetwork.vercel.app)

---

## Support

[Send a tip on selar to support development](https://selar.com/39m7437811)

