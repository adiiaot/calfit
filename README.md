# Fitness Space — AI-Powered Fitness & Nutrition App

> Developed by [AOT](https://github.com/adiiaot) under the AOT NETWORK

[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=flat&logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-51-000020?style=flat&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_+_DB-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![Claude API](https://img.shields.io/badge/Claude_API-Anthropic-CC785C?style=flat)](https://anthropic.com)
[![License](https://img.shields.io/badge/License-Private-red?style=flat)]()

---

## Overview

Fitness Space is a comprehensive health and fitness tracking mobile application built for iOS and Android using React Native and Expo. It combines calorie, steps and sleep tracking for recovery, workout logging, and streaks system into a single, beautifully designed platform.
---

## Live Prototype

> Interactive design prototype — all 14 screens with dark/light mode toggle

**[View Figma Design File →](https://www.figma.com/design/AXHKZdGTk9LThEY242VLgw/CalFit-%E2%80%93-App-UI-Design)**

---

## Screens

| Screen | Description |
|--------|-------------|
| Welcome | Brand intro, feature highlights, sign up / login CTAs |
| Login | Google, Apple, email/password |
| Onboarding | 7-step personalisation flow — goal, body stats, activity, tracking, diet, CalFit ID, preferences | TO BE EDITED
| Home Dashboard | Readiness score, calorie donut ring, streak day dots, friends ticker, mood check-in |
| Calorie Tracker | Donut ring summary, Claude Vision food scanner, water intake, meal sections |
| Food Scanner | AI food detection via Claude Vision — Scan Food / Barcode / Food Label modes | TO BE REMOVED
| Meal Planner | 1–30 day plans, manual or AI-generated with Coach preference questions | TO BE REMOVED
| Workout | Today / Calories / Steps / History tabs — exercises, step bar chart, activity timeline |
| Social Feed | Stories, posts, kudos reactions, discovery + following tabs | TO BE REMOVED
| Streaks | Personal streak with day dots + gold badge, partner streak, group streak, milestone badges |
| Earnings | Wallet balance, CalFit Points store, referral summary, payout methods | TO BE REMOVED
| Community | Group cards, challenges with progress bars, create group | TO BE REMOVED
| My Progress | Weight chart, stats grid, streak progress, body measurements |
| Settings | Profile, preferences, connected apps, privacy controls |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile | React Native + Expo | Single codebase for iOS and Android |
| Language | TypeScript | Type safety across the entire codebase |
| Navigation | React Navigation v6 | 6-tab bottom nav + stack navigation |
| State | Zustand | Lightweight global state management |
| Backend | Node.js + Express | REST API layer |
| Database | PostgreSQL + Prisma | Relational data with type-safe queries |
| Auth | Supabase Auth | JWT, social login, session management |
| Real-time | Supabase Realtime | Live feed, friends ticker, partner chat |
| AI Coach | Anthropic Claude API | Conversational coach + food vision scanning |
| Food DB | Open Food Facts + Nutritionix | Global food coverage, barcode lookup |
| Media | Cloudinary | Videos, photos, stories — CDN delivered |
| Notifications | Expo + Firebase FCM | Cross-platform push alerts |
| Subscriptions | Stripe + Stripe Connect | Billing, plan management, referral payouts |
| Advertising | Google AdMob | Banner, interstitial, rewarded ads for Free tier |
| Voice | Expo Speech + Whisper API | Voice-to-text for food logging and coach |
| Steps | Expo Sensors | Native step counting + Apple Health / Google Fit |
| Streaming | Agora / Livekit | Live streaming — Premium tier (Phase 2) |

---

## Subscription Tiers

```
Free          →  Basic tracking · 5 AI Coach prompts/day · Ads shown
Pro  $9.99    →  No ads · 20 prompts/day · Food scanner · Manual meal planner
Premium $19.99 → Unlimited Coach · AI meal plans · Live streaming · Earnings wallet
```

### CalFit Points Store
Users earn CalFit Points by watching rewarded ads, daily logins, and hitting goals. Points can be spent on live stream access, extra Coach prompts, streak freezes, and selected premium features — giving Free users a path to premium content without upgrading.

---

## Project Structure

```
calfit/
├── src/
│   ├── screens/                  # One folder per feature screen
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── calorie/
│   │   ├── meals/
│   │   ├── workout/
│   │   ├── social/               # Modular — reusable across BigCut apps
│   │   ├── coach/
│   │   ├── streaks/
│   │   ├── earnings/
│   │   ├── community/
│   │   ├── progress/
│   │   └── settings/
│   ├── components/               # Reusable UI components
│   │   ├── social/               # Social/chat module — white-label ready
│   │   ├── charts/               # Donut rings, bar charts, progress bars
│   │   ├── cards/                # Stat cards, meal cards, exercise rows
│   │   └── common/               # Buttons, inputs, badges, modals
│   ├── navigation/               # All route configuration
│   ├── store/                    # Zustand global state slices
│   ├── services/                 # API call functions
│   │   ├── supabase.ts           # Supabase client
│   │   ├── claude.ts             # Claude API — coach + food scanner
│   │   ├── stripe.ts             # Subscription billing
│   │   └── admob.ts              # Ad serving
│   ├── hooks/                    # Custom React hooks
│   ├── theme/                    # Design tokens
│   │   ├── colors.ts             # Dark + light mode color tokens
│   │   ├── typography.ts         # Plus Jakarta Sans font config
│   │   └── spacing.ts            # Spacing and border radius constants
│   ├── middleware/               # Subscription gating, auth guards
│   └── utils/                   # Helper functions
├── apps/
│   └── api/                     # Node.js + Express backend
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── services/
│       │   └── prisma/
│       └── .env
├── packages/
│   └── social-module/           # Standalone social/chat package
│       ├── components/          # Feed, chat, stories, reactions
│       ├── hooks/               # useFeed, useChat, useStories
│       ├── services/            # Real-time Supabase integration
│       └── README.md            # Integration guide for white-label apps
├── .env                         # Never committed — see .env.example
├── .env.example                 # Template for environment variables
├── .gitignore
├── app.json
├── package.json
└── README.md
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Identity, goals, body stats, calorie targets, preferences |
| `subscriptions` | Plan tier, billing cycle, Stripe subscription ID, renewal dates |
| `calfit_points` | User Points balance and lifetime earned |
| `points_transactions` | Every earn and spend with source tracking |
| `food_logs` | Daily entries by meal type with full macro breakdown |
| `water_logs` | Water intake with amount and timestamp |
| `sleep_logs` | Sleep sessions — duration, quality score |
| `workout_sessions` | Workout instances — status, duration, calories burned |
| `workout_exercises` | Sets, reps, weight, completion state per exercise |
| `step_logs` | Daily step counts with calorie conversion |
| `mood_logs` | Daily mood check-ins feeding AI Coach context |
| `streaks` | Personal, partner, and group streaks with freeze logic |
| `posts` | Social feed content with engagement counts |
| `referrals` | 15% recurring commission per referred user for 5 years |
| `earnings_wallet` | Balance, period earnings, withdrawal history |

---

## Build Phases

| Phase | Timeline | Focus |
|-------|----------|-------|
| 1 | Days 1–2 | Foundation — Expo, navigation, auth, subscription gating |
| 2 | Days 3–4 | Core tracking — calories, food scanner, water, sleep, steps |
| 3 | Days 5–6 | Workouts + Coach — Claude AI, voice logging, meal planner |
| 4 | Days 7–8 | Social + Streaks — feed, stories, community, notifications |
| 5 | Days 9–10 | Monetisation — Stripe billing, AdMob, CalFit Points store |
| 6 | Days 11–12 | Polish + Deploy — QA, Play Store + App Store submission |

---

## Modular Social System

The social and chat features are built as a standalone module located in `packages/social-module`. This module is fully decoupled from CalFit-specific logic and can be integrated into any future BigCut white-label partner application by installing it as a local package.

```bash
# In any BigCut white-label app
npm install ../packages/social-module
```

The module includes:
- Scrollable social feed with algorithm-driven discovery
- Real-time chat — text, images, video
- Audio and video calls via WebRTC
- Stories (24-hour posts)
- Reactions and kudos system
- Follow / unfollow system
- Group chat and community feeds

---

## Environment Variables

Never committing secrets. Copy `.env.example` to `.env` and fill in your values.

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_ANTHROPIC_API_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_ADMOB_APP_ID=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FIREBASE_SERVER_KEY=
WHISPER_API_KEY=
```

---

## Security Standards

- GitHub repository is **private** — BigCut LLC added as Maintainer
- `main` branch is **protected** — only AOT merges and deploys
- All secrets stored as **environment variables** — never committed to the codebase
- Authentication via **JWT** with Supabase Auth and refresh token rotation
- **Rate limiting** on all public API endpoints
- **Input validation** on every endpoint via Zod schema validation
- **SQL injection** prevented natively by Prisma parameterised queries
- Subscription tier checked **server-side** on every gated API call — cannot be bypassed client-side

---

## Repository Rules

- `main` — production only. Protected. AOT merges only.
- `develop` — active development branch
- `feature/*` — one branch per feature
- `fix/*` — bug fixes
- Pull requests required for all merges into `develop`

---

## White-Label Architecture

CalFit is built with BigCut's white-label partner deployments in mind. The modular component architecture means partner apps can be spun up by:

1. Cloning the base CalFit codebase
2. Swapping the theme tokens in `src/theme/`
3. Updating `app.json` with partner branding
4. Importing the `social-module` package
5. Connecting to a separate Supabase project per partner

Each white-label deployment maintains its own database, auth, and storage — fully isolated from other partners.

---

## Client

**BigCut LLC**
- Contact: @bigcutllc.com
- Engagement: 12-Month Contract
- Deployment: Google Play Store + Apple App Store

---

## Developer

**Oluwadare Taye Ayo (AOT)**
Contract Developer — BigCut LLC
- UI/UX Design
- Mobile Development (React Native + Expo)
- Backend Architecture (Node.js + PostgreSQL)
- Technical Documentation

---

*This repository is private and confidential. All code and assets are the intellectual property of BigCut LLC. Unauthorised access, distribution, or reproduction is strictly prohibited.*
