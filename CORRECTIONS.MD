## 📋 Full Corrections List (from client doc)

**Navigation / Layout**
- Remove Credits as a main tab → move to Profile page
- Remove Coach as a main tab → embed on Home page (tap to open full screen)
- Social Feed tabs: rename "Following" → "Feed", add "Communities" as 3rd tab, remove separate Community icon from tab bar
- Replace community tab icon with a message/chat icon

**Home Screen**
- Remove Daily Readiness bar
- Move Streaks to very top (no box, styled like the circular day dots shown)
- Add food scanner shortcut on Home page (not just Calorie screen)
- Remove "9-day streak" text, put fire emoji before Monday marker
- Make elements bigger/bolder (reference: Cal AI interface style)
- Embed Coach access on Home (not a separate tab)

**Onboarding**
- Complete overhaul — Cal AI style deep onboarding with personalized plan creation feel
- "We're building your plan as you answer" progress message shown throughout
- Add Intermittent Fasting questions (Yes/guide me / Already do it / No → pick style 16:8, 18:6, 20:4, Custom)
- After onboarding: show free trial paywall screen (card required before app access — same psychology as Cal AI but different wording)
- Add Google Sign-In and Apple Sign-In buttons on auth screen
- Remove a circled text element from one screen (needs screenshot to identify exactly which)

**Calorie / Food**
- When "Add Food" is tapped → show options: Type manually OR Scan
- Scanner result shows: Edit Result / Perfect buttons
- Save favourite meals feature

**Activity Screen — Major Overhaul**
- Rename "Today" tab → "My Routines"
- My Routines = user's saved workout sets (not today's log)
- Add two creation options: "Build from Catalogue" and "Let CalFit Coach Create It"
- Coach creation: asks 8 questions → generates routine → shows Edit / Perfect buttons
- Manual creation: can add exercises from catalogue + type custom exercises manually
- Saved routines show as cards (name, exercises preview, duration, calories)
- Tap routine → start immediately
- Multiple routines supported (Leg Day, Cardio Day, etc.)
- Always show "Create New Routine" button in My Routines tab
- Catalogue tab remains the exercise library source

**Leaderboard**
- Overall leaderboard formula: replace Workout×5 with app activity score (tracks meal logging, scanning, steps, fasting — fair for non-gym users)
- Add Steps leaderboard and Calorie Consistency leaderboard (top 10 most consistent, no numbers shown)
- Put leaderboard categories in a dropdown to save space
- Make tabs scrollable (currently just 4 — needs 6)

**Community / Social**
- Free users: no access to ANY premium communities (owned by CalFit or users) — remove that access completely
- Challenges: replace points reward with recognition badges (badges need to be defined)
- Badges show on public profiles
- Community streaks UI shown at top of communities (reference image provided)
- Free users: see ads at start of livestreams and every 5 minutes — remove credits page ad item that references this

**Chat / Messages**
- Add audio recording option in chat
- Add image sending in chat
- Add audio call and video call features

**Coach Screen**
- Users can send images to Coach (Claude Vision)
- Voice note input → transcribed to text → sent to AI
- Replace "AI Coach powered by Claude API" text with "CalFit Coach"
- Redesign the screen (reference image provided)

**Meal Planner**
- During AI question flow: users can answer by typing OR voice note (transcribed to text)
- After meal plan generated: show Edit Result / Perfect buttons

**Profile**
- Follower/post count: singular when 1, plural when 2+
- PR badges show on public profile

**Referrals / Earnings**
- Income earned shows FIRST on referrals page (30-day and lifetime)
- Points earned shows below income
- Withdrawal balance stays below (separate)
- Every user gets an invite code (in addition to referral link)
- Users earn 5 points per referral

**Recap Cards**
- Bold and Gradient designs need to look better — use more distinct/beautiful templates (Canva-style photo backgrounds suggested)


## OTHER FEATURES
# CalFit — Build To-Do List
### BigCut Store / Fabs Development (fabsdevelopment.com) · Updated April 2026
### Stack: React Native · Expo · TypeScript · Supabase · Claude API

---

## ✅ COMPLETED

### Auth & Onboarding
- [x] Email/password login and signup
- [x] Forgot password / reset link
- [x] Session management via Supabase Auth

### Home Dashboard
- [x] Personalized greeting (Good morning / afternoon / evening)
- [x] Daily Readiness Score (live from steps, water, sleep)
- [x] Calorie card (goal, consumed, burned, remaining)
- [x] Water, Steps, Sleep stat cards with progress bars
- [x] Personal streak card with day dots
- [x] Quick log buttons (Food, Water, Sleep, Workout)
- [x] Quick nav row (Leaderboard, Partners, Community)
- [x] Mood check-in card → navigates to Coach
- [x] Friends Activity Ticker
- [x] Invite Link button
- [x] Pull to refresh

### Calorie Tracker
- [x] Food log split into Breakfast, Lunch, Dinner, Snacks
- [x] Open Food Facts search with 400ms debounce
- [x] Nigerian food database fallback (25 foods)
- [x] Portion size adjustment with nutrition preview
- [x] Water intake card with +250ml, +500ml, +1L buttons
- [x] Calorie history loads from Supabase
- [x] Notifications when calorie and water goals are hit

### Activity Screen
- [x] 40-exercise catalogue with categories and filters
- [x] Live workout timer
- [x] Per-exercise timer and calorie tracking
- [x] Complete workout saves to Supabase
- [x] Workout history tab
- [x] Calories tab with weekly bar chart
- [x] Steps tab with live Expo Pedometer data
- [x] Voice coach using expo-speech (free, no API key)
- [x] Quick Start screen with voice coach and workout complete notification

### Coach Screen
- [x] Chat interface with message bubbles
- [x] 5 personality selector with modal
- [x] System prompt changes per personality
- [x] Claude API call wired (awaiting Anthropic API key)
- [x] Quick chips for common questions
- [x] Fallback response when API not connected
- [x] Input bar gap fixed

### Meal Planner
- [x] AI meal plan generation with 5-question flow
- [x] Duration selector (1, 3, 7, 14, 30 days)
- [x] Day-by-day plan viewer with macro breakdown
- [x] Saved plans stored in Supabase
- [x] Delete plan
- [x] Intermittent Fasting screen (16:8, 18:6, 20:4, 24hr, 5:2)
- [x] Fasting live timer with progress ring
- [x] Fasting history saved to Supabase
- [x] Fasting started/completed notifications → navigate correctly

### Social Feed
- [x] Following feed and Discover tab
- [x] Post types: workout, meal, milestone, text (constraint fixed)
- [x] Likes, comments, kudos reactions
- [x] Kudos notification → post owner notified
- [x] Comment notification → post owner notified
- [x] Follow notification → person notified when followed
- [x] Share post to external apps (WhatsApp, Instagram, TikTok etc)
- [x] Follow/unfollow users
- [x] Profile screen fixed (name/avatar from Zustand for own profile)
- [x] Profiles RLS fixed (all authenticated users can read profiles)
- [x] Post grid on profile

### Community
- [x] Create/join/leave/delete groups
- [x] Tier limits (Free: 1, Pro: 5, Premium: unlimited)
- [x] Group created notification
- [x] Group joined notification
- [x] Auto-generated challenges with real participant counts
- [x] Challenge join/leave with points reward

### Chat / Messages
- [x] Real-time 1-1 messaging via Supabase Realtime
- [x] Conversation list with unread badges
- [x] Privacy-first design (CalFit ID only)

### Leaderboard
- [x] Global and Friends tabs
- [x] 4 categories (Overall, Streaks, Workouts, Referrals)
- [x] My rank card
- [x] Weekly reset scoring formula

### Accountability
- [x] Add up to 3 partners by CalFit ID
- [x] Shared dashboard (side by side streaks)
- [x] Message partner directly

### Streaks
- [x] Personal streak auto-tracking
- [x] Weekly streak freeze
- [x] Milestone badges
- [x] Streak check-in notification

### Recap Cards
- [x] Daily, Weekly, Monthly recap
- [x] 4 design styles (Minimal, Bold, Gradient, Dark)
- [x] Real Supabase data wired
- [x] Share via native iOS/Android share sheet
- [x] Recap button added to Progress screen

### Progress Screen
- [x] Weight card with progress bar toward goal
- [x] Stats grid wired to real Supabase data
- [x] Streak progress card
- [x] Recent workouts list
- [x] Period selector (Week, Month, 3 Months, Year)

### Notifications Screen
- [x] Notification screen with unread count
- [x] Filter tabs (All, Unread, Activity, Achievements, System)
- [x] Mark all read
- [x] Delete notification (long press)
- [x] Navigation fixed — all tap actions go to correct screens
- [x] Fasting notifications navigate to IntermittentFasting screen

### Settings
- [x] Light/dark mode toggle
- [x] Units selection (metric/imperial)
- [x] Notification controls UI
- [x] Account settings
- [x] Privacy controls
- [x] Delete account (Supabase Edge Function)

### Payments & Subscriptions
- [x] IAP service stub (react-native-iap) — awaiting store accounts
- [x] Subscription screen UI (Pro $9.99, Premium $19.99)
- [x] Stripe removed — using Apple IAP + Google Play Billing only
- [x] Payment README documented

### Live Screen
- [x] UI complete, Go Live button present

---

## ❌ PENDING — CAN BUILD NOW (no external accounts needed)

### High Priority

- [DONE] **Sleep tracker screen** — manual sleep logging, daily goal, sleep history, sleep consistency score. Feeds into dashboard sleep card, readiness score, and progress screen (all currently show 0)
- [ ] **Notification reminder scheduling** — wire the toggle buttons in Settings to actually schedule local Expo Notifications for meal, water, workout, and sleep reminders at set times
- [ ] **Save favourite meals** in calorie tracker — save a logged meal combination and re-add it in one tap
- [ ] **Post like notification** — add to `postService.toggleLike` (when liking, not unliking, notify post owner)
- [ ] **Stories manual upload** — users tap their story bubble to upload their own story (currently only auto-generated from workouts and streaks)
- [ ] **Group real-time chat** — groups have feed and workouts but no live group chat inside each group
- [ ] **Post-workout meal suggestions** — after workout completes, suggest a recovery meal via Claude fallback
- [ ] **Personal records tracking** — detect and display PRs (new max weight, longest duration etc) in workout history
- [ ] **Leaderboard rank-up notification** — notify user when their rank improves
- [ ] **Privacy policy page** — required by Apple and Google before app approval. Publish at `calfit.tech/privacy`
- [ ] **App icon and splash screen** — blocking store submission on both platforms
- [ ] **EAS build configuration** — `eas.json` not yet set up. Needed to generate APK and IPA

- [ ] **Micronutrient tracking** — toggle in Settings to show/hide micronutrients in food log. UI placeholder exists but not wired
- [ ] **Equipment preferences** — save preferred equipment in Settings, used to filter workout library
- [ ] **Calorie trend charts** — view by day/week/month with actual chart rendering (currently flat list)
- [ ] **Sleep-to-performance connection** — show how sleep quality affects readiness score with explanation card
- [ ] **Comeback Mode Banner** — show warm return message on Home if user inactive for 2+ days
- [ ] **Weekly summary widget** — sleep average currently always shows 0 (needs sleep logs)
- [ ] **Accountability partner streak shared goals** — partners can set a shared goal beyond just streaks
- [ ] **Linked Instagram on profile** — field exists in onboarding and profile but doesn't actually link/open
- [ ] **PR showcase on profile** — show personal records section on public profile page
- [ ] **Withdrawal history in Credits screen** — show past withdrawal records (date, amount, method, status)
- [ ] **App Store listing copy** — description, keywords, subtitle, age rating answers

- [ ] **Manual meal planning** — drag and drop meal slots, save templates, auto grocery list
- [ ] **Recipes library** — organised recipe library with ratings, save/submit, step-by-step instructions, import via URL
- [ ] **Meal plan history** — planned vs actual adherence score
- [ ] **Workout scheduling** — schedule workouts, set rest days, recurring schedules
- [ ] **Adaptive recovery system** — auto-adjust workout intensity based on readiness score
- [ ] **Group/Community streak threshold logic** — admin sets completion threshold (e.g. 4 of 5 members must log)
- [ ] **Streak Keeper badge** — badge for most consistent group streak member
- [ ] **Challenge leaderboards** — leaderboard scoped to active challenges
- [ ] **Milestone celebrations** — in-app celebration animation + shareable milestone card when hitting streak milestones
- [ ] **Mood trends** — track mood over time from daily check-ins, show trend chart

---

## ⏳ PENDING — WAITING ON BIGCUT LLC

### Requires Anthropic API Key (GOTTEN FROM BIGCUT)
- [ ] AI Coach real responses (currently falls back to static message)
- [ ] AI Meal Planner generation
- [ ] Food photo/AI logging (Claude Vision)
- [ ] Food barcode scanner
- [ ] Social image moderation (Claude Vision — flags inappropriate uploads)
- [ ] Voice food logging (speak what you ate)
- [ ] AI Form Check in workout screen

### Requires Apple Developer Account ($99/year)
- [ ] App Store submission
- [ ] TestFlight beta testing
- [ ] Apple Sign In (onboarding Step 7)
- [ ] Apple In-App Purchase products (`com.fabsdevelopment.calfit.pro.monthly`, `com.fabsdevelopment.calfit.premium.monthly`)

### Requires Google Play Console ($25 one-time)
- [ ] Play Store submission
- [ ] Google Sign In
- [ ] Google Play Billing products (same product IDs as App Store)

### Requires Firebase Setup
- [ ] Push notifications to device (FCM)
- [ ] Notification delivered to device even when app is closed
- [ ] `google-services.json` and `GoogleService-Info.plist` added to project

### Requires Agora Account
- [ ] Live streaming (Go Live screen — UI complete, Agora SDK not configured)
- [ ] Accountability partner audio/video calls (spec requirement)

### Requires Paystack Account
- [ ] Referral payout processing (Bank Transfer)
- [ ] Note: Paystack is NOT used for user subscriptions — that goes through Apple/Google IAP only

### Requires Hostinger Email Setup
- [DONE] `dev@bigcut.store` — register Apple Developer, Google Play, Firebase, Supabase, GitHub, Expo, Anthropic
- [ ] `support@calfit.tech` — shown in App Store and Play Store as user support contact

### Requires Apple Health / Google Fit Entitlements
- [ ] Smartwatch integration (sleep, steps, heart rate)
- [ ] Apple Health read/write permissions
- [ ] Google Fit API

---

## 💰 FUNDS NEEDED FROM FABS DEVELOPMENT

| Item | Cost | Type | Unblocks |
|------|------|------|---------|
| Apple Developer Program | $99/year | One-time (annual) | App Store, TestFlight, Apple Sign In, Apple IAP |
| Google Play Console | $25 | One-time | Play Store, Google Sign In, Google Play Billing |
| Hostinger Premium Email ×2 | ~$4/month | Monthly | All platform registrations |
| Anthropic API credits | ~$50/month | Monthly | AI Coach, Meal Planner, Vision, Food Scanner |
| **Total first month** | **~$178** | | |

---

## 🏗️ INFRASTRUCTURE REFERENCE

### App Bundle IDs
```
iOS:     com.bigcutstore.calfit
Android: com.bigcutstore.calfit
```

### IAP Product IDs (must match exactly in App Store Connect + Google Play Console)
```
com.bigcutstore.calfit.pro.monthly      — $9.99/month
com.bigcutstore.calfit.premium.monthly  — $19.99/month
```

### Subscription Tiers
| Tier | Price | Key Features |
|------|-------|-------------|
| Free | $0 | 5 Coach prompts/day, ads, 1 group |
| Pro | $9.99/mo | 20 prompts, food scanner, no ads, 5 groups, accountability |
| Premium | $19.99/mo | Unlimited Coach, AI Meal Planner, live streaming, earnings wallet |

### Key Domains
- App: `calfit.tech`
- Company: `bigcut.store`
- Privacy Policy (required): `calfit.tech/privacy`

### Key Files
```
src/services/iapService.ts              — IAP stub (activate when store accounts ready)
src/services/notificationService.ts    — All in-app notification triggers
src/services/iapService.ts             — Subscription purchase flow
CalFit_Payment_Setup_README.md         — Full store setup guide
```

### Revenue Split
- Apple App Store: 85% to BigCut (15% small business rate if <$1M/year)
- Google Play: 85% to BigCut (15% small business rate for first $1M/year)
- Referral commission: 15% of referred user's subscription for 5 years

---

## 📋 SUGGESTED BUILD ORDER (next sessions)

1. Sleep tracker screen
2. Notification reminder scheduling (local Expo Notifications)
3. Post like notification in postService
4. Stories manual upload
5. Privacy policy at calfit.tech/privacy
6. App icon and splash screen
7. EAS build configuration (eas.json)
8. Personal records tracking
9. Post-workout meal suggestions
10. Leaderboard rank-up notification