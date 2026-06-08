# CalFit — Personal Fitness & Nutrition Coach

A React Native (Expo) mobile app for calorie tracking, workouts, sleep monitoring, intermittent fasting, AI-powered coaching & journaling, and accountability partners.

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

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81 + Expo 54 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| State | Zustand v5 |
| Backend/Auth | Supabase (Auth, PostgreSQL, Realtime, Storage) |
| AI | NVIDIA Llama 3.1 70B (chat) + Llama 3.2 90B Vision (food scanner) |
| Food DB | Open Food Facts API + local Nigerian food database |
| Notifications | expo-notifications |
| Payments | expo-iap (stubbed) |
| Voice | Deepgram STT via VoiceRecorderService |
| Icons | @expo/vector-icons (Ionicons) |
| Animations | React Native Animated + Lottie |
| Charts | Pure React Native (no external chart library) |

## Project Structure

```
calfit/
├── App.tsx                       # Root — fonts, auth init, IAP setup
├── index.ts                      # Expo entry
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx      # All routes — AuthStack + AppStack + TabNavigator
│   ├── screens/
│   │   ├── onboarding/           # Welcome, Login, Onboarding (5 steps)
│   │   ├── dashboard/            # Home screen — streak, stats, banners
│   │   ├── calorie/              # Calorie tracking + Food Scanner (AI vision)
│   │   ├── meals/                # Health overview + Intermittent Fasting
│   │   ├── nutrition/            # Notes screen
│   │   ├── Activity/             # Workout catalog + Quick Start routines
│   │   ├── progress/             # Progress charts, Recap, Body Measurements
│   │   ├── streaks/              # Streak display with milestones
│   │   ├── sleep/                # Sleep logging
│   │   ├── earnings/             # Subscription plans screen
│   │   ├── settings/             # Profile, goals, privacy, data export, etc.
│   │   └── notifications/        # Notification inbox
│   │   └── AICoachScreen.tsx     # AI Coach (Generate + Saved + Chat tabs)
│   ├── components/               # Reusable UI components
│   │   ├── ChatBubble.tsx        # Chat message bubble (user/assistant)
│   │   ├── RadialMenu.tsx        # Floating radial quick-menu
│   │   ├── MilestoneCelebration.tsx  # Streak milestone celebration overlay
│   │   └── ...                   # ExerciseCard, WorkoutForm, TrendCharts, etc.
│   ├── modules/
│   │   ├── accountability/       # Partner management + real-time chat
│   │   └── shared/               # AndroidSafeView, UserAvatar, EmptyState, ResponsiveScreens
│   ├── store/                    # Zustand stores
│   │   ├── authStore.ts          # User, session, profile, onboarding state
│   │   ├── themeStore.ts         # Dark/light theme
│   │   └── aiCoachStore.ts       # Workouts, saved, chat messages, cache
│   ├── services/                 # API and business logic
│   │   ├── supabase.ts           # Supabase client
│   │   ├── nvidia-client.ts      # NVIDIA AI — workout gen, chat, food vision scan
│   │   ├── profileService.ts     # Profile CRUD, food/water/steps queries
│   │   ├── foodSearchService.ts  # Open Food Facts + Nigerian food DB
│   │   ├── stepService.ts        # Pedometer wrapper
│   │   ├── notificationService.ts # In-app notification CRUD
│   │   ├── reminderService.ts    # Daily notification scheduling
│   │   ├── iapService.ts         # In-app purchase stubs
│   │   ├── imageService.ts       # Image picker + avatar upload
│   │   ├── personalRecordsService.ts # PR detection after workouts
│   │   └── VoiceRecorderService.ts   # Audio recording + Deepgram STT
│   ├── hooks/
│   │   └── useSteps.ts           # Centralized step tracking (pedometer polling)
│   ├── theme/                    # Design tokens (colors, typography, spacing)
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # AI prompts, JSON parser
├── assets/                       # App icons, splash screen
├── app.json                      # Expo configuration
├── package.json
└── tsconfig.json
```


## Running the App

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS) or the Expo app (Android). For development builds with native modules (camera, IAP, etc.):

```bash
npx expo run:android   # or
npx expo run:ios
```

## Subscription Tiers

| Tier | Price | Key Features |
|------|-------|-------------|
| Free | ₦0 | Basic tracking, water logging, step tracking, workout library |
| Pro | ₦1,999/mo | 20 AI Coach prompts/day, Food Scanner, accountability partners, no ads |
| Premium | ₦7,999/mo | Unlimited AI Coach, AI Meal Planner, Unlimited Food Scan logs, Unlimited Journal support |

## Key Architecture Decisions

- **Steps tracking** lives in `TabNavigator` (not HomeScreen) so the pedometer subscription survives navigation — all screens read `liveSteps` from Zustand
- **Onboarding flow** is owned entirely by `OnboardingScreen` — `authStore.setSession` never touches `isOnboarding`
- **AI cache** — workout generation results are cached for 5 minutes to avoid redundant API calls for identical params
- **Notifications** — all in-app notification types are defined in `notificationService.tsx` and stored in Supabase

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

```


```

  <h3>Support AOT Network</h3>
  <p>Love the product? Buy me a tip to support ongoing development.</p>
  <a href="https://selar.com/showlove/aotayo" class="tip-button">Buy me a coffee ☕</a>
