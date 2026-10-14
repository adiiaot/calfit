# CalFit — Feature Inventory (verified from source, 2026-10-14)

| Feature | Screens / Components | Real vs placeholder | Storage | Failure modes | How to test | Status |
|---|---|---|---|---|---|---|
| Onboarding (goal/stats/account) | WelcomeScreen, OnboardingScreen | Real (anonymous auth + profile upsert) | `profiles` | No network; duplicate CalFit ID | Fresh install → complete 4 steps | Verified by code read, device test pending |
| Auth (anon + email/pass) | authStore, Welcome/Onboarding | Real; no OAuth/MFA/password-reset | Supabase Auth + SecureStore | `usesAppleSignIn` flag dead; deep-link session unhandled | Sign up/in/out, restart persistence | Code-verified; needs device test |
| Profile + goals | EditProfile, GoalsScreen, EquipmentPreference | Real | `profiles` | Unit conversion; range 1000–5000 kcal | Edit + reload | Code-verified |
| Calorie + food log | CalorieScreen, FoodScannerScreen | Real; vision via NVIDIA proxy | `food_logs` | OFF offline; portion NaN; camera perm | Log manual + search + scan | Code-verified |
| Water | CalorieScreen, Home | Real | `water_logs` | — | +250ml buttons, goal pct | Code-verified |
| Workouts + PRs | Activity, QuickStart, Analysis | Real; volume = duration/kcal only | `workout_sessions`, `personal_records` | Timer leak on rapid nav; AI default 0s | Start/complete/AI workout | Code-verified |
| Steps | useSteps, stepService, TabNavigator | Real (pedometer) | `step_logs`, Zustand liveSteps | Perm denied; emulator no sensor | Walk / mock | Needs device |
| Sleep | SleepScreen, Meals sleep section | Real manual entry | `sleep_logs(hours)` | Midnight span N/A (manual hrs) | Log 7.5h, avg check | Code-verified |
| Fasting | IntermittentFastingScreen | Real timer | `fasting_logs` | Kill app mid-fast; TZ | Start 16:8, end early/complete | Needs device |
| Streaks + milestones | StreaksScreen, MilestoneCelebration | Real check-in | `profiles.streak_count` | Freeze week/month copy mismatch | Check-in 2 days | Code-verified |
| Progress/Recap + charts | Progress, Recap, TrendCharts | Real; 14-day cap; bars unreadable at 30/90d | computed | Empty state; color-only | View with 0/30d data | Code-verified |
| AI Coach chat | AICoachScreen, nvidia-client | Real via ai-proxy | `chat_messages`, `ai_api_usage` | Proxy unauth/quota; offline | Ask + meal plan prompt | Needs backend live |
| Meal plans | MealPlanScreen, mealPlanStore | Real generation; hardcoded kcal fallback | `ai_generated_meal_plans` | — | Generate plan | Needs backend live |
| Accountability + chat | Accountability, PartnerChat | Real + Realtime | `partners`, `partner_messages` | Reverse-row func lacks auth check | Add partner, chat | Needs 2 accounts |
| Notes journal | NotesScreen | Real CRUD | `notes` | — | Create/edit/delete | Code-verified |
| Notifications inbox | NotificationsScreen, reminderService | Real local + inbox | `notifications` | Perm denied | Schedule + receive | Needs device |
| Subscription tiers | SubscriptionScreen | Placeholder (IAP stubbed) | `userTier` free default | — | Open screen only | Placeholder — do not demo as working |
| Data export | DownloadDataScreen, pdf-export | Real (CSV truncated to preview; TXT full; PDF share) | Share sheet | No file for CSV; cache PDFs linger | Export each format | Partially verified |
| Theme light/dark | themeStore, Settings | Real | SecureStore prefs | StatusBar fixed light-content (fixed for insets; barStyle still static) | Toggle | Code-verified |

Not implemented: BMR/TDEE auto-targets, workout tonnage, HealthKit/Google Fit sync, password reset, real delete-account, file-based CSV.
