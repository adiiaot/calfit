# CalFit — Project Overview

Fitness + nutrition coach (React Native + Expo, Supabase backend, NVIDIA AI via secure proxy).
Target users: individuals tracking calories, workouts, sleep, fasting, steps; accountability pairs.
Features: onboarding, calorie/food/water, food scanner, workouts, steps, sleep, fasting, streaks, progress charts, AI coach + meal plans, partners + chat, notes, notifications, export, themes. Subscription screen is a stub.
Boundaries: no BMR engine, no tonnage, no wearables sync, no store IAP, no real delete-account yet.
Decisions: Zustand over Redux; proxy keeps AI keys server-side; steps hook mounted once in TabNavigator; RLS per-user.
Limitations: see KNOWN_ISSUES.md. Future: lock ai-proxy, private avatars, real delete, chart overhaul, a11y pass, Jest suite, device QA, preview APK.
