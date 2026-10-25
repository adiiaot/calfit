/**
 * Builds the CalFit IT Defence deck — 6 slides, 5-minute slot.
 *
 *   node scripts/build-defense-deck.js
 *
 * Output:
 *   docs/it-defense/CALFIT_IT_DEFENCE_DECK.pptx     (6 slides, present this)
 *   docs/it-defense/CALFIT_IT_DEFENCE_APPENDIX.pptx (previous 14-slide version, for Q&A)
 *
 * Design: 16:9, light slides for projection, dark title/close.
 * Screenshots: ../CalFit App Screens/CalFit App Screens/
 */

const path = require('path');
const fs = require('fs');
const PptxGenJS = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.resolve(ROOT, '..', 'CalFit App Screens', 'CalFit App Screens');
const OUT = process.env.DECK_OUT
  ? path.resolve(process.env.DECK_OUT)
  : path.join(ROOT, 'docs', 'it-defense', 'CALFIT_IT_DEFENCE_DECK.pptx');

const W = 13.333;
const H = 7.5;

const C = {
  bg: 'F7F8FC',
  navy: '0B1026',
  ink: '11162E',
  muted: '5B6382',
  faint: '98A0BC',
  green: '10B981',
  greenDark: '0B8F65',
  purple: '7C5CFF',
  orange: 'F97316',
  blue: '2F80ED',
  border: 'E2E5F0',
  white: 'FFFFFF',
  softGreen: 'E8F8F2',
  softPurple: 'EFEBFF',
  softOrange: 'FFF1E6',
};

const FONT = 'Segoe UI';
const TOTAL = 6;

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'CALFIT_16X9', width: W, height: H });
pptx.layout = 'CALFIT_16X9';
pptx.author = 'Oluwadare Taye Ayo, Okechukwu David Chukwuebuka';
pptx.company = 'AI HIVE / University of Port Harcourt';
pptx.title = 'CalFit — Industrial Training Project Defence';
pptx.subject = 'AI-powered fitness and nutrition coach';

// ── helpers ────────────────────────────────────────────────────────────────

function slide(dark) {
  const s = pptx.addSlide();
  s.background = { color: dark ? C.navy : C.bg };
  return s;
}

function text(s, str, o = {}) {
  s.addText(str, {
    x: o.x, y: o.y, w: o.w, h: o.h,
    fontFace: FONT,
    fontSize: o.size ?? 12,
    bold: !!o.bold,
    color: o.color ?? C.ink,
    align: o.align ?? 'left',
    valign: o.valign ?? 'top',
    italic: !!o.italic,
    charSpacing: o.spacing,
    margin: 0,
    lineSpacingMultiple: o.line ?? 1.1,
  });
}

function header(s, eyebrow, title, sub) {
  text(s, eyebrow.toUpperCase(), { x: 0.62, y: 0.4, w: 11.8, h: 0.26, size: 10, bold: true, color: C.greenDark, spacing: 2.4 });
  text(s, title, { x: 0.6, y: 0.7, w: 12.1, h: 0.6, size: 30, bold: true, color: C.ink });
  if (sub) text(s, sub, { x: 0.62, y: 1.34, w: 11.9, h: 0.32, size: 13, color: C.muted });
}

function footer(s, n, dark) {
  s.addShape(pptx.ShapeType.line, {
    x: 0.6, y: 6.98, w: 12.13, h: 0,
    line: { color: dark ? '2B3459' : C.border, width: 1 },
  });
  text(s, 'CalFit  ·  Industrial Training Project Defence', { x: 0.62, y: 7.07, w: 8, h: 0.24, size: 8.5, color: dark ? '8A93B4' : C.faint });
  text(s, String(n).padStart(2, '0') + ' / ' + TOTAL, { x: 11.3, y: 7.07, w: 1.43, h: 0.24, size: 8.5, color: dark ? '8A93B4' : C.faint, align: 'right' });
}

function card(s, x, y, w, h, o = {}) {
  // Flat cards on purpose: no shadow effects. Some viewers render imported
  // shadows as stray light rectangles, which is exactly what we do not want
  // over screenshots or text.
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: o.radius ?? 0.1,
    fill: { color: o.fill ?? C.white, transparency: o.transparency ?? 0 },
    line: { color: o.line ?? C.border, width: o.lineWidth ?? 1 },
  });
}

function phone(s, file, x, y, h) {
  const w = h * (1170 / 2532);
  // No frame shape and no shadow: the screenshot is the only object in this box,
  // so nothing can render over it in any viewer.
  s.addImage({ path: path.join(SHOTS, file), x, y, w, h });
  return { x, y, w, h };
}

function caption(s, cx, y, title, body) {
  text(s, title, { x: cx - 1.2, y, w: 2.4, h: 0.28, size: 12, bold: true, color: C.ink, align: 'center' });
  text(s, body, { x: cx - 1.2, y: y + 0.3, w: 2.4, h: 0.6, size: 9.5, color: C.muted, align: 'center', line: 1.15 });
}

function chip(s, label, x, y, w) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.34, rectRadius: 0.17,
    fill: { color: C.white }, line: { color: C.border, width: 1 },
  });
  text(s, label, { x, y: y + 0.01, w, h: 0.32, size: 9.5, color: C.muted, align: 'center', valign: 'middle', bold: true });
}

function notes(s, str) {
  s.addNotes(str);
}

// ── 01 · Title ─────────────────────────────────────────────────────────────

{
  const s = slide(true);

  s.addShape(pptx.ShapeType.ellipse, {
    x: 10.4, y: -1.9, w: 4.6, h: 4.6,
    fill: { color: C.green, transparency: 92 },
    line: { color: C.green, transparency: 100 },
  });
  s.addShape(pptx.ShapeType.ellipse, {
    x: -1.6, y: 5.1, w: 3.8, h: 3.8,
    fill: { color: C.purple, transparency: 92 },
    line: { color: C.purple, transparency: 100 },
  });

  text(s, 'INDUSTRIAL TRAINING PROJECT DEFENCE  ·  2026', { x: 0.9, y: 1.16, w: 6.2, h: 0.28, size: 10, bold: true, color: C.green, spacing: 2.2 });
  text(s, 'CalFit', { x: 0.84, y: 1.44, w: 6.2, h: 1.15, size: 66, bold: true, color: C.white });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.92, y: 2.76, w: 1.1, h: 0.06, rectRadius: 0.03, fill: { color: C.green }, line: { color: C.green, width: 0 } });
  text(s, 'One app for food, workouts, sleep and fasting —\nwith an AI coach that knows your history.', {
    x: 0.9, y: 2.96, w: 5.35, h: 0.95, size: 17, color: 'C6CDE4', line: 1.3,
  });

  text(s, 'PRESENTED BY', { x: 0.9, y: 4.28, w: 5, h: 0.24, size: 8.5, bold: true, color: '7F88AA', spacing: 2 });
  text(s, 'Oluwadare Taye Ayo', { x: 0.9, y: 4.52, w: 5.4, h: 0.3, size: 15, bold: true, color: C.white });
  text(s, 'Okechukwu David Chukwuebuka', { x: 0.9, y: 4.85, w: 5.7, h: 0.3, size: 15, bold: true, color: C.white });

  text(s, 'Computer Science  ·  University of Port Harcourt', { x: 0.9, y: 5.36, w: 5.7, h: 0.26, size: 10.5, color: 'A9B1CC' });
  text(s, 'Industrial Training at AI HIVE  ·  October 2026', { x: 0.9, y: 5.62, w: 5.7, h: 0.26, size: 10.5, color: 'A9B1CC' });
  text(s, '“You can’t stay motivated by progress you can’t see.”', {
    x: 0.9, y: 6.14, w: 5.7, h: 0.3, size: 11, italic: true, color: C.green,
  });

  const bx = 6.75, by = 1.02, bw = 5.98, bh = 3.987;
  s.addShape(pptx.ShapeType.roundRect, {
    x: bx - 0.08, y: by - 0.08, w: bw + 0.16, h: bh + 0.16,
    rectRadius: 0.18,
    fill: { color: '1A2142' },
    line: { color: '39406B', width: 1 },
  });
  s.addImage({ path: path.join(SHOTS, 'calfit thumbnail.png'), x: bx, y: by, w: bw, h: bh, sizing: { type: 'cover', w: bw, h: bh } });

  text(s, 'Android APK  ·  iOS via Expo Go  ·  Web build', { x: 6.75, y: 5.2, w: 6, h: 0.26, size: 9.5, color: '8A93B4', align: 'center' });

  s.addShape(pptx.ShapeType.line, { x: 0.9, y: 6.56, w: 11.55, h: 0, line: { color: '2B3459', width: 1 } });
  text(s, 'dist-seven-woad-33.vercel.app', { x: 0.9, y: 6.7, w: 4.5, h: 0.24, size: 9, color: '8A93B4' });
  text(s, '5-minute defence  ·  demo follows', { x: 7.3, y: 6.7, w: 5.15, h: 0.24, size: 9, color: '8A93B4', align: 'right' });

  notes(s, `TIMING: 0:00–0:15  ·  AYO

"Good morning. We are Oluwadare Taye Ayo and Okechukwu David Chukwuebuka. This is CalFit — one app for food, workouts, sleep and fasting, with an AI coach that knows your history. Three slides on the problem and what we built, then David takes the engineering and the proof, then we open the app."

Do not read the slide. Names, project, roadmap of the five minutes — then move.

If you are nervous: slow down for these first two sentences. Everything else follows from them.`);
}

// ── 02 · Problem ───────────────────────────────────────────────────────────

{
  const s = slide();
  header(s, 'The problem', 'Why people quit — four reasons, one outcome', 'Not laziness. These four, from watching how people around us actually track.');

  const items = [
    ['01', 'Records live everywhere', 'Workouts in a notebook, meals in memory, sleep recorded nowhere. No full picture, so no proof of progress.', C.softGreen, C.greenDark],
    ['02', 'Apps don’t know our food', 'Try logging eba, ofada rice or moi moi. It becomes guesswork — so people stop logging.', C.softPurple, C.purple],
    ['03', 'Every plan is the same plan', 'The beginner and the gym regular get identical advice, so it fits neither of them.', C.softOrange, C.orange],
    ['04', 'Nobody checks in', 'No partner, no reminder, no streak. One missed week quietly becomes a missed month, then it is deleted.', 'E9F1FE', C.blue],
  ];

  items.forEach((it, i) => {
    const x = 0.6 + i * 3.12;
    card(s, x, 1.86, 2.86, 3.18);
    s.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.28, y: 2.06, w: 0.56, h: 0.44, rectRadius: 0.1,
      fill: { color: it[3] }, line: { color: it[3], width: 0 },
    });
    text(s, it[0], { x: x + 0.28, y: 2.06, w: 0.56, h: 0.44, size: 11, bold: true, color: it[4], align: 'center', valign: 'middle' });
    text(s, it[1], { x: x + 0.28, y: 2.66, w: 2.35, h: 0.72, size: 14.5, bold: true, color: C.ink, line: 1.08 });
    text(s, it[2], { x: x + 0.28, y: 3.46, w: 2.35, h: 1.4, size: 10.8, color: C.muted, line: 1.32 });
  });

  text(s, '“You can’t stay motivated by progress you can’t see.”', {
    x: 0.6, y: 5.42, w: 12.13, h: 0.5, size: 19, italic: true, bold: true, color: C.greenDark, align: 'center',
  });
  text(s, 'The observation that started CalFit.', { x: 0.6, y: 5.94, w: 12.13, h: 0.28, size: 10.5, color: C.faint, align: 'center' });

  notes(s, `TIMING: 0:15–0:55  ·  AYO

"Look at how people around us actually track. Workouts are in a notebook, meals are remembered, sleep is not recorded at all — so there is no full picture and no proof of progress. Then the apps themselves: the popular ones are built for foreign users, so logging eba or ofada rice is guesswork. Everyone gets the same generic plan. And nobody checks in. Put those together and you get one sentence: you cannot stay motivated by progress you cannot see."

If asked for evidence, be honest: "Observation and informal conversations, not a formal survey." Do not invent sample sizes.`);
}

// ── 03 · Solution ──────────────────────────────────────────────────────────

{
  const s = slide();
  header(s, 'The solution', 'One app that removes all four reasons', 'Each feature answers one specific cause — not a list we liked the look of.');

  text(s, 'WHAT WAS BREAKING', { x: 0.62, y: 1.78, w: 5, h: 0.24, size: 9, bold: true, color: C.faint, spacing: 1.8 });
  text(s, 'WHAT CALFIT DOES INSTEAD', { x: 6.6, y: 1.78, w: 6, h: 0.24, size: 9, bold: true, color: C.greenDark, spacing: 1.8 });

  const rows = [
    ['Scattered records', 'One dashboard for calories, macros, water, steps, sleep and workouts — plus week, month and year progress views with PDF export.'],
    ['Food data that ignores our dishes', '25 Nigerian dishes built in, Open Food Facts for packaged food, and a camera scanner for when typing is too much.'],
    ['One-size-fits-all plans', 'The AI coach generates workouts and meal plans from your goal, body stats, equipment and history — and answers questions with that context.'],
    ['No accountability', 'Up to 3 partners with shared goals and live chat, daily streaks with milestones, local reminders, and a fasting timer that survives a restart.'],
  ];

  rows.forEach((r, i) => {
    const y = 2.08 + i * 1.12;
    card(s, 0.6, y, 5.42, 0.96, { fill: 'FFFFFF' });
    text(s, r[0], { x: 0.9, y: y + 0.29, w: 4.85, h: 0.42, size: 13, color: C.ink, bold: true });

    s.addShape(pptx.ShapeType.chevron, {
      x: 6.14, y: y + 0.27, w: 0.3, h: 0.42,
      fill: { color: C.softGreen }, line: { color: C.softGreen, width: 0 },
    });

    card(s, 6.54, y, 6.19, 0.96, { fill: 'FFFFFF' });
    s.addShape(pptx.ShapeType.roundRect, {
      x: 6.54, y: y + 0.1, w: 0.06, h: 0.76, rectRadius: 0.03,
      fill: { color: C.green }, line: { color: C.green, width: 0 },
    });
    text(s, r[1], { x: 6.82, y: y + 0.17, w: 5.72, h: 0.64, size: 10.8, color: C.muted, line: 1.2 });
  });

  text(s, 'Every screen on the next slide exists to remove one of these four causes.', {
    x: 0.62, y: 6.56, w: 12.1, h: 0.28, size: 10.5, italic: true, color: C.faint,
  });

  notes(s, `TIMING: 0:55–1:45  ·  AYO

"Each row is cause and answer. Scattered records become one dashboard. Foreign food data becomes a local database, Open Food Facts and a scanner. Generic plans become plans generated from your own profile. And no accountability becomes partners, streaks, shared goals and reminders."

The line that earns marks — say it slowly: "If a feature did not remove one of those four causes, we did not build it."

Do not name every screen. The next slide does that.`);
}

// ── 04 · Screens ───────────────────────────────────────────────────────────

{
  const s = slide();
  header(s, 'The product', 'The daily loop, in four screens', 'Home → log food → get the plan → train. This is what a user repeats every day.');

  const shots = [
    ['home screen.PNG', 'Home', 'Calories left, macros, water, steps, sleep and the streak — one screen'],
    ['calorie screen.PNG', 'Calorie', 'Log meals and macros, add water, or scan the plate with the camera'],
    ['workout generation screen.PNG', 'AI Coach', 'A real session back: sets, reps, rest, form tips, progression'],
    ['activity screen.PNG', 'Activity', '8 categories, 48 exercises, guided timer with voice cues'],
  ];

  const h = 4.42;
  const w = h * (1170 / 2532);
  const gap = (12.13 - 4 * w) / 3;

  // captions first, screenshots last — nothing is drawn after the images
  shots.forEach((sh, i) => {
    const x = 0.6 + i * (w + gap);
    caption(s, x + w / 2, 6.04, sh[1], sh[2]);
  });
  shots.forEach((sh, i) => {
    phone(s, sh[0], 0.6 + i * (w + gap), 1.56, h);
  });

  notes(s, `TIMING: 1:45–2:30  ·  AYO

"Four screens, and this is the loop a user repeats every day. Home tells you what is left today. Calorie is where you log it — twenty-five Nigerian dishes, Open Food Facts, or a photo. The AI Coach turns your profile into a session with sets, reps, rest and form tips. Activity is where you train: eight categories, forty-eight bodyweight exercises, and a timer that talks you through it."

Point, do not read. "You will see each of these in the demo." Then hand to David: "David will show how it is put together."`);
}

// ── 05 · Architecture + security ───────────────────────────────────────────

{
  const s = slide();
  header(s, 'Under the hood', 'One codebase, private data, no keys in the app', 'The engineering decisions a panel usually asks about, in one picture.');

  const boxes = [
    {
      x: 0.6, tag: 'CLIENT', title: 'React Native + Expo',
      lines: ['One codebase → Android, iOS, web', 'React Navigation · Zustand state', 'Session in the phone’s secure store'],
    },
    {
      x: 4.86, tag: 'DATA & AUTH', title: 'Supabase',
      lines: ['PostgreSQL + Row-Level Security', 'Auth, Realtime chat, Storage', 'Every row tied to one user'],
    },
    {
      x: 9.12, tag: 'SERVER-SIDE AI', title: 'Edge Functions',
      lines: ['ai-proxy · deepgram-proxy', 'Keys live in Supabase secrets', 'The app never calls the provider'],
    },
  ];

  boxes.forEach((b) => {
    card(s, b.x, 1.74, 3.6, 2.34);
    text(s, b.tag, { x: b.x + 0.26, y: 1.92, w: 3.1, h: 0.24, size: 8.5, bold: true, color: C.greenDark, spacing: 1.8 });
    text(s, b.title, { x: b.x + 0.26, y: 2.18, w: 3.1, h: 0.34, size: 14.5, bold: true, color: C.ink });
    text(s, b.lines.map((l) => '·  ' + l).join('\n'), {
      x: b.x + 0.26, y: 2.64, w: 3.1, h: 1.2, size: 10.2, color: C.muted, line: 1.42,
    });
  });

  [4.36, 8.62].forEach((x) => {
    s.addShape(pptx.ShapeType.chevron, {
      x, y: 2.64, w: 0.34, h: 0.48,
      fill: { color: C.softGreen }, line: { color: C.softGreen, width: 0 },
    });
  });

  const chips = ['TypeScript', 'React Native 0.86', 'Expo 57', 'Supabase', 'Zustand', 'NVIDIA · Nemotron 3.5', 'Deepgram'];
  let cx = 0.6;
  chips.forEach((c) => {
    const w = 0.082 * c.length + 0.36;
    chip(s, c, cx, 4.3, w);
    cx += w + 0.14;
  });

  const sec = [
    ['RLS', 'PostgreSQL policies: user_id = auth.uid()', C.softPurple, C.purple],
    ['KEY', 'API keys only in server secrets', C.softOrange, C.orange],
    ['AUTH', 'Anonymous login, token in secure storage', C.softGreen, C.greenDark],
  ];
  sec.forEach((it, i) => {
    const x = 0.6 + i * 4.12;
    card(s, x, 4.92, 3.9, 1.28);
    s.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.26, y: 5.1, w: 0.66, h: 0.4, rectRadius: 0.09,
      fill: { color: it[2] }, line: { color: it[2], width: 0 },
    });
    text(s, it[0], { x: x + 0.26, y: 5.1, w: 0.66, h: 0.4, size: 9, bold: true, color: it[3], align: 'center', valign: 'middle' });
    text(s, it[1], { x: x + 1.06, y: 5.06, w: 2.6, h: 0.9, size: 10.5, color: C.muted, line: 1.25, valign: 'middle' });
  });

  text(s, 'Next: lock the AI proxy to signed-in users  ·  complete server-side account deletion — both written down, not hidden.', {
    x: 0.62, y: 6.44, w: 12.1, h: 0.3, size: 10, italic: true, color: C.orange,
  });

  notes(s, `TIMING: 2:30–3:10  ·  DAVID

"One codebase: React Native and Expo, so the same code runs on Android, iPhone and the web. Data and login live in Supabase — PostgreSQL with Row-Level Security, realtime for partner chat. And the AI is never called from the phone. The phone calls an Edge Function, and the function holds the key."

Privacy line: "Every table has a policy that ties the row to the signed-in user. That check happens in the database, not on the screen."

Then the honest line: "Two jobs remain — the AI proxy should reject calls that are not from a signed-in session, and account deletion is not finished on the server. Both are in our known-issues file."

IF YOU ARE BEHIND: compress this whole slide into: "One codebase for both phones, private rows enforced in the database, and the AI key lives on the server, not in the app." Then move on.`);
}

// ── 06 · Proof + status + close ────────────────────────────────────────────

{
  const s = slide();
  header(s, 'Proof & status', 'What we tested, and where it stands', 'Three layers: read the code, automate what repeats, then test on a real phone.');

  const stats = [
    ['32 / 32', 'automated checks pass', 'verify-fixes.js, run after every fix'],
    ['21 / 21', 'Expo Doctor checks pass', 'SDK 57 dependency health'],
    ['0', 'TypeScript errors', 'tsc --noEmit, clean'],
  ];

  stats.forEach((st, i) => {
    const x = 0.6 + i * 4.12;
    card(s, x, 1.72, 3.9, 1.16);
    text(s, st[0], { x: x + 0.26, y: 1.84, w: 1.6, h: 0.42, size: 21, bold: true, color: C.greenDark });
    text(s, st[1], { x: x + 1.62, y: 1.9, w: 2.1, h: 0.44, size: 10, color: C.ink, line: 1.15 });
    text(s, st[2], { x: x + 0.26, y: 2.4, w: 3.4, h: 0.32, size: 8.3, color: C.faint });
  });

  text(s, 'THREE REAL FAILURES WE FIXED', { x: 0.65, y: 3.12, w: 6, h: 0.24, size: 8.5, bold: true, color: C.faint, spacing: 1.8 });

  const bugs = [
    ['App crashed on launch', 'Now shows a readable setup screen instead of dying'],
    ['AI model retired overnight', 'Model name moved into config + a working replacement'],
    ['Fasting timer reset on reopen', 'Now derived from the stored start time'],
  ];

  bugs.forEach((b, i) => {
    const y = 3.46 + i * 0.86;
    card(s, 0.6, y, 7.4, 0.72, { shadow: false, fill: 'FFFFFF' });
    text(s, b[0], { x: 0.86, y: y + 0.12, w: 2.9, h: 0.3, size: 11, bold: true, color: C.ink });
    text(s, b[1], { x: 3.82, y: y + 0.12, w: 3.95, h: 0.48, size: 9.8, color: C.muted, line: 1.18 });
  });

  // status card
  const sx = 8.3, sy = 3.02, sw = 4.43, sh = 3.12;
  card(s, sx, sy, sw, sh);
  text(s, 'Where it stands', { x: sx + 0.3, y: sy + 0.2, w: sw - 0.6, h: 0.3, size: 12.5, bold: true, color: C.ink });

  text(s, [
    { text: 'WORKING TODAY\n', options: { bold: true, color: C.greenDark, fontSize: 8.5, charSpacing: 1.4 } },
    { text: 'Tracking loop · AI coach · scanner · partners · streaks · export\n\n', options: { color: C.muted, fontSize: 9.8, breakLine: true } },
    { text: 'NEXT 30 DAYS\n', options: { bold: true, color: C.purple, fontSize: 8.5, charSpacing: 1.4 } },
    { text: 'Lock the AI proxy · finish account deletion · device test list · clean APK\n\n', options: { color: C.muted, fontSize: 9.8, breakLine: true } },
    { text: 'NOT YET — HONESTLY\n', options: { bold: true, color: C.orange, fontSize: 8.5, charSpacing: 1.4 } },
    { text: 'Store release (no developer accounts) · real payments (placeholder screen)', options: { color: C.muted, fontSize: 9.8, breakLine: true } },
  ], { x: sx + 0.3, y: sy + 0.58, w: sw - 0.6, h: 2.3, fontFace: FONT, margin: 0, lineSpacingMultiple: 1.25 });

  text(s, 'It runs today — so let’s open it.', { x: 0.6, y: 6.4, w: 12.13, h: 0.4, size: 16, bold: true, color: C.ink, align: 'center' });

  notes(s, `TIMING: 3:10–3:50  ·  DAVID, then AYO closes

David: "Three layers of testing. We read the code looking for weak spots. We wrote a check script and ran it after every fix — thirty-two checks, all passing. Expo Doctor passes twenty-one of twenty-one, and TypeScript reports zero errors."

"These are real failures, not hypotheticals." Pick one, do not read all three: "The app crashed on launch in front of an assessor because setup values were missing. It now shows a setup screen instead. The AI model was retired overnight and the coach went silent; the model name now lives in config with a replacement."

Ayo: "Working today: the whole loop, the coach, the scanner, partners, streaks, export. Next thirty days: lock the AI proxy, finish account deletion, finish device testing. Not yet: store release and real payments. It runs today — so let's open it."

If asked 'did you test on a phone?': "We ran it on a real iPhone through Expo Go and built the Android APK. The full test list is not finished and we are not claiming it is."

TOTAL TALK TIME: about 3 minutes 50 seconds. Demo after this gets the rest of the five minutes.`);
}

// ── write ──────────────────────────────────────────────────────────────────

pptx.writeFile({ fileName: OUT })
  .then(() => {
    console.log('Wrote ' + OUT);
    console.log('Slides: ' + TOTAL);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
