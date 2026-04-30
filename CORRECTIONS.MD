# CalFit — Build To-Do List
### BigCut Store / Fabs Development (fabsdevelopment.com) · Updated April 2026
### Stack: React Native · Expo · TypeScript · Supabase · Claude API + DEEPGRAM API

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

## REMAINING FEATURES AND THINGS TO BUILD

- [x] **Sleep tracker screen** — manual sleep logging, daily goal, sleep history, sleep consistency score. Feeds into dashboard sleep card, readiness score, and progress screen (all currently show 0)
- [x] **Notification reminder scheduling** — wire the toggle buttons in Settings to actually schedule local Expo Notifications for meal, water, workout, and sleep reminders at set times
- [x] **Save favourite meals** in calorie tracker — save a logged meal combination and re-add it in one tap
- [x] **Post like notification** — add to `postService.toggleLike` (when liking, not unliking, notify post owner)
- [Not functional yet but implemented] **Stories manual upload** — users tap their story bubble to upload their own story (currently only auto-generated from workouts and streaks)
- [] **Group real-time chat** — groups have feed and workouts but no live group chat inside each group
- [x] **Post-workout meal suggestions** — after workout completes, suggest a recovery meal via Claude fallback
- [x] **Personal records tracking** — detect and display PRs (new max weight, longest duration etc) in workout history
- [ ] **Micronutrient tracking** — toggle in Settings to show/hide micronutrients in food log. UI placeholder exists but not wired
- [ ] **Equipment preferences** — save preferred equipment in Settings, used to filter workout library
- [x] **Calorie trend charts** — view by day/week/month with actual chart rendering (currently flat list)
- [x] **Comeback Mode Banner** — show warm return message on Home if user inactive for 2+ days
- [x] **Weekly summary widget** — sleep average currently always shows 0 (needs sleep logs)
- [x] **Accountability partner streak shared goals** — partners can set a shared goal beyond just streaks
- [ ] **Linked Instagram on profile** — field exists in onboarding and profile but doesn't actually link/open
- [x] **PR showcase on profile** — show personal records section on public profile page
- [ ] **Manual meal planning** — drag and drop meal slots, save templates, auto grocery list
- [ ] **Recipes library** — organised recipe library with ratings, save/submit, step-by-step instructions, import via URL
- [ ] **Meal plan history** — planned vs actual adherence score
- [ ] **Workout scheduling** — schedule workouts, set rest days, recurring schedules
- [ ] **Group/Community streak threshold logic** — admin sets completion threshold (e.g. 4 of 5 members must log)
- [x] **Streak Keeper badge** — badge for most consistent group streak member
- [x] **Challenge leaderboards** — leaderboard scoped to active challenges
- [x] **Milestone celebrations** — in-app celebration animation + shareable milestone card when hitting streak milestones
- [x] **Mood trends** — track mood over time from daily check-ins, show trend chart
- [x] **Leaderboard rank-up notification** — notify user when their rank improves
- [x] **Withdrawal history in Credits screen** — show past withdrawal records (date, amount, method, status)
- [ ] **App Store listing copy** — description, keywords, subtitle, age rating answers
- [ ] **Privacy policy page** — required by Apple and Google before app approval. Publish at `calfit.tech/privacy`
- [ ] **App icon and splash screen** — blocking store submission on both platforms
- [ ] **EAS build configuration** — `eas.json` not yet set up. Needed to generate APK and IPA

---

### Requires Anthropic API Key
- [x] AI Coach real responses (currently falls back to static message)
- [x] AI Meal Planner generation
- [x] Food photo/AI logging (Google cloud vision/fallback - Claude Vision)
- [x] Food barcode scanner
- [x] Social image moderation (Claude Vision — flags inappropriate uploads)
- [x] Voice food logging (speak what you ate)
- [x] AI Form Check in workout screen

### Requires Apple Developer Account ($99/year)
- [ ] App Store submission
- [ ] TestFlight beta testing
- [ ] Apple Sign In
- [ ] Apple In-App Purchase products (`store.bigcut.calfit.pro.monthly`, `store.bigcut.calfit.premium.monthly`)

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

## 💰 FUNDS NEEDED FROM BIGCUT

| Item | Cost | Type | Unblocks |
|------|------|------|---------|
| Apple Developer Program | $99/year | One-time (annual) | App Store, TestFlight, Apple Sign In, Apple IAP |
| Google Play Console | $25 | One-time | Play Store, Google Sign In, Google Play Billing |
| Google Workspace | ~$6/month | Monthly | All platform registrations |
| Anthropic API credits | ~$10/month | Monthly | AI Coach, Meal Planner, Vision, Food Scanner |
| Exercise DB or Lottie Illustrations for workout video - $24 one time fee
| Google cloud vision API - $10 pre payment a month
| **Total first month** | **** | | |

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



#WHAT TO DO WHEN CLIENT PAYS THE $24.99 FOR THE WORKOUTS VIDEO 

**What's done right now (no money needed):**

**The `gif_url` column** is already added to your `exercises` table in Supabase — I applied that migration.

**When client pays the $24:**

1. Sign up at `exercisedb.io` → one-time $24 → get API key
2. Run: `SUPABASE_SERVICE_KEY=your_key node seed_exercise_gifs.js YOUR_EXERCISEDB_KEY`
3. The script fetches GIF URLs for all 42 exercises and writes them to Supabase
4. The modal already reads `gif_url` from the exercise object — it just switches from placeholder to animated GIF automatically, zero code changes needed


// ─────────────────────────────────────────────────────────────────────────────
// EXERCISEDB GIF SEEDING GUIDE + READY-TO-RUN SCRIPT
//
// STEP 1: Client pays $24 one-time at https://exercisedb.io
// STEP 2: You get an API key
// STEP 3: Run this script once from your terminal:
//         node seed_exercise_gifs.js YOUR_API_KEY
// STEP 4: All 42 exercises get gif_url populated in Supabase
// STEP 5: The ExerciseDemoModal already reads gif_url — it just works
// ─────────────────────────────────────────────────────────────────────────────

// seed_exercise_gifs.js
// Run with: node seed_exercise_gifs.js <YOUR_EXERCISEDB_API_KEY>

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tmddrjplvafqbqlaxhrn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // set this env var
const EXERCISEDB_KEY = process.argv[2];

if (!EXERCISEDB_KEY) {
  console.error('Usage: node seed_exercise_gifs.js <EXERCISEDB_API_KEY>');
  process.exit(1);
}

// These are our 42 exercise names mapped to ExerciseDB search terms
// ExerciseDB uses lowercase names — we search and take the best match
const EXERCISE_SEARCH_MAP = {
  // Arms
  'Bicep Curls':       'bicep curl',
  'Tricep Dips':       'triceps dip',
  'Tricep Push Ups':   'triceps push up',

  // Back
  'Chin Ups':          'chin up',
  'Inverted Rows':     'inverted row',
  'Pull Ups':          'pull up',
  'Superman Hold':     'superman',

  // Cardio
  'Box Jumps':         'box jump',
  'Burpees':           'burpee',
  'High Knees':        'high knees',
  'Jump Rope':         'jump rope',
  'Jumping Jacks':     'jumping jacks',
  'Mountain Climbers': 'mountain climber',
  'Running in Place':  'run in place',
  'Star Jumps':        'squat jump', // closest match in ExerciseDB

  // Chest
  'Chest Dips':        'chest dip',
  'Decline Push Ups':  'decline push up',
  'Diamond Push Ups':  'diamond push up',
  'Push Ups':          'push up',
  'Wide Push Ups':     'wide push up',

  // Core
  'Bicycle Crunches':  'bicycle crunch',
  'Crunches':          'crunch',
  'Dead Bug':          'dead bug',
  'Leg Raises':        'leg raise',
  'Plank':             'plank',
  'Russian Twists':    'russian twist',
  'V-Ups':             'v up',

  // Flexibility
  'Cat Cow Stretch':   'cat cow',
  "Child's Pose":      "child's pose",
  'Hamstring Stretch': 'hamstring stretch',
  'Hip Flexor Stretch':'hip flexor stretch',

  // Legs
  'Calf Raises':       'calf raise',
  'Donkey Kicks':      'donkey kick',
  'Glute Bridges':     'glute bridge',
  'Jump Squats':       'jump squat',
  'Lunges':            'lunge',
  'Squats':            'squat',
  'Step Ups':          'step up',
  'Wall Sit':          'wall sit',

  // Shoulders
  'Lateral Raises':    'lateral raise',
  'Pike Push Ups':     'pike push up',
};

async function fetchGifUrl(searchTerm, apiKey) {
  const encoded = encodeURIComponent(searchTerm);
  const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encoded}?limit=1&offset=0`;
  
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
    },
  });

  if (!res.ok) {
    console.warn(`  ⚠️  Failed to fetch "${searchTerm}": ${res.status}`);
    return null;
  }

  const data = await res.json();
  if (!data || data.length === 0) {
    console.warn(`  ⚠️  No results for "${searchTerm}"`);
    return null;
  }

  return data[0].gifUrl ?? null;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get all exercises from DB
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name');

  if (error) {
    console.error('Failed to fetch exercises:', error);
    process.exit(1);
  }

  console.log(`\n🏋️  Seeding GIF URLs for ${exercises.length} exercises...\n`);

  let success = 0;
  let failed = 0;

  for (const exercise of exercises) {
    const searchTerm = EXERCISE_SEARCH_MAP[exercise.name];
    
    if (!searchTerm) {
      console.warn(`  ⚠️  No search term mapped for "${exercise.name}" — skipping`);
      failed++;
      continue;
    }

    process.stdout.write(`  Fetching "${exercise.name}"...`);
    
    const gifUrl = await fetchGifUrl(searchTerm, EXERCISEDB_KEY);

    if (gifUrl) {
      const { error: updateError } = await supabase
        .from('exercises')
        .update({ gif_url: gifUrl })
        .eq('id', exercise.id);

      if (updateError) {
        console.log(` ❌ DB update failed`);
        failed++;
      } else {
        console.log(` ✅ ${gifUrl.split('/').pop()}`);
        success++;
      }
    } else {
      console.log(` ❌ No GIF found`);
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n✅ Done! ${success} succeeded, ${failed} failed.\n`);
}

main().catch(console.error);