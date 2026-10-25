# CalFit — Speaker Notes (3:50 of slides + demo)

The same script is inside the `.pptx` as speaker notes. This file is the printable copy.
Bold names mark who speaks. **Do not read the slides** — these are prompts, not a script to recite.

---

## Slide 1 · 0:00–0:15 · **Ayo**
“Good morning. We are Oluwadare Taye Ayo and Okechukwu David Chukwuebuka. This is CalFit — one app for food, workouts, sleep and fasting, with an AI coach that knows your history. Three slides on the problem and what we built, then David takes the engineering and the proof, then we open the app.”

## Slide 2 · 0:15–0:55 · **Ayo**
“Look at how people around us actually track. Workouts are in a notebook, meals are remembered, sleep is not recorded at all — so there is no full picture and no proof of progress. Then the apps themselves: the popular ones are built for foreign users, so logging eba or ofada rice is guesswork. Everyone gets the same generic plan. And nobody checks in. Put those together and you get one sentence: you cannot stay motivated by progress you cannot see.”

*If asked for evidence: observation and informal conversations, not a formal survey. Never invent a sample size.*

## Slide 3 · 0:55–1:45 · **Ayo**
“Each row is cause and answer. Scattered records become one dashboard. Foreign food data becomes a local database, Open Food Facts and a scanner. Generic plans become plans generated from your own profile. And no accountability becomes partners, streaks, shared goals and reminders.”

Say slowly: “If a feature did not remove one of those four causes, we did not build it.”

## Slide 4 · 1:45–2:30 · **Ayo**
“Four screens, and this is the loop a user repeats every day. Home tells you what is left today. Calorie is where you log it — twenty-five Nigerian dishes, Open Food Facts, or a photo. The AI Coach turns your profile into a session with sets, reps, rest and form tips. Activity is where you train: eight categories, forty-eight bodyweight exercises, and a timer that talks you through it.”

Point, don’t read. “You will see each of these in the demo. David will show how it is put together.”

## Slide 5 · 2:30–3:10 · **David**
“One codebase: React Native and Expo, so the same code runs on Android, iPhone and the web. Data and login live in Supabase — PostgreSQL with Row-Level Security, and realtime for partner chat. The AI is never called from the phone: the phone calls an Edge Function, and the function holds the key.”

“Every table has a policy that ties the row to the signed-in user. That check happens in the database, not on the screen.”

Then: “Two jobs remain — the AI proxy should reject calls that are not from a signed-in session, and account deletion is not finished on the server. Both are in our known-issues file.”

*If behind schedule, compress to: “One codebase for both phones, private rows enforced in the database, and the AI key lives on the server, not in the app.”*

## Slide 6 · 3:10–3:50 · **David, then Ayo**
David: “Three layers of testing. We read the code looking for weak spots. We wrote a check script and ran it after every fix — thirty-two checks, all passing. Expo Doctor passes twenty-one of twenty-one, and TypeScript reports zero errors. These are real failures, not hypotheticals: the app crashed on launch in front of an assessor because setup values were missing — it now shows a setup screen; the AI model was retired overnight — the name now lives in config.”

Ayo: “Working today: the whole loop, the coach, the scanner, partners, streaks, export. Next thirty days: lock the AI proxy, finish account deletion, finish device testing. Not yet: store release and real payments. It runs today — so let’s open it.”

---

## Demo · after 3:50 · **both**

Five clicks, two minutes: Home → Calorie (search `eba`, log it) → AI Coach (generate a workout) → Activity (start it, let the voice cue talk) → Progress (week view, export).

Rules:
- Log **one** item. Generate **one** workout. Do not wait in silence — narrate what should happen.
- If the network dies, switch to the deployed web build, then the recording. Never debug on stage.
- If only a minute is left: Home → Calorie → AI Coach, then “the rest is in the deck.”
- Close with: “Thank you — we are happy to take questions.”
