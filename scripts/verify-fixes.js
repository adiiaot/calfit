// CalFit regression verification — runs with plain `node scripts/verify-fixes.js`.
// Checks source patterns for fixed defects + asserts pure calculation formulas.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`PASS: ${name}`); }
  else { fail++; console.log(`FAIL: ${name}`); }
}

// 1. Sleep export uses `hours` (with legacy fallback), not duration_hours alone
const dl = read('src/screens/settings/DownloadDataScreen.tsx');
check('DownloadData CSV uses r.hours', dl.includes('r.hours ?? r.duration_hours'));
check('DownloadData avg uses r.hours', dl.includes('(r.hours ?? r.duration_hours ?? 0)'));
check('DownloadData no bare duration_hours sum', !dl.includes('s + (r.duration_hours ?? 0)'));

// 2. BMI reads current_weight_kg first
const meals = read('src/screens/meals/MealsScreen.tsx');
check('Meals BMI prefers current_weight_kg', meals.includes('current_weight_kg ?? profile?.weight_kg'));
const prog = read('src/screens/progress/ProgressScreen.tsx');
check('Progress query selects current_weight_kg', prog.includes('current_weight_kg'));
check('Progress weight prefers current_weight_kg', prog.includes('p?.current_weight_kg ?? p?.weight_kg'));

// 3. No false "stays on this device" claims in auth flow
const welcome = read('src/screens/onboarding/WelcomeScreen.tsx');
const onboard = read('src/screens/onboarding/OnboardingScreen.tsx');
const settings = read('src/screens/settings/SettingsScreen.tsx');
check('Welcome copy fixed', !welcome.includes('stays on this device'));
check('Onboarding copy fixed', !onboard.includes('stays on this device'));
check('SignOut copy fixed', !settings.includes('stays on this device'));

// 4. Privacy lists all processors + honest delete
const privacy = read('src/screens/settings/PrivacyScreen.tsx');
check('Privacy lists Open Food Facts', privacy.includes('Open Food Facts'));
check('Privacy lists Deepgram', privacy.includes('Deepgram'));
check('Privacy honest about delete', privacy.includes('not yet available'));

// 5. PDF export escapes HTML
const pdf = read('src/utils/pdf-export.ts');
check('pdf-export has escapeHtml', pdf.includes('function escapeHtml'));
check('pdf-export escapes userName', pdf.includes('escapeHtml(userName)'));
check('pdf-export escapes suggestions', pdf.includes('escapeHtml(s)'));

// 6. AndroidSafeView handles all insets
const safe = read('src/modules/shared/AndroidSafeView.tsx');
check('AndroidSafeView bottom inset', safe.includes('paddingBottom: insets.bottom'));
check('AndroidSafeView side insets', safe.includes('paddingLeft: insets.left'));

// 7. Tab bar: correct focus + a11y + bottom inset
const nav = read('src/navigation/AppNavigator.tsx');
check('TabBar correct focus compare', nav.includes('state.routes.findIndex') && nav.includes('state.index === routeIndex'));
check('TabBar a11y tab role', nav.includes('accessibilityRole="tab"'));
check('TabBar bottom inset', nav.includes('Math.max(insets.bottom, 8)'));

// 8. Web viewport allows zoom
const appJson = read('app.json');
check('Web viewport allows scaling', !appJson.includes('user-scalable=no'));

// 8b. Supabase must not throw at import (launch crash); App shows config screen
const svc = read('src/services/supabase.ts');
const app = read('App.tsx');
check('No module-scope throw in supabase client', !svc.includes("throw new Error('Missing EXPO_PUBLIC"));
check('supabaseConfigError exported', svc.includes('export const supabaseConfigError'));
check('App renders config error screen', app.includes('supabaseConfigError') && app.includes('Configuration error'));

// 9. Pure formula spot-checks (mirror of app logic)
const remaining = (goal, consumed) => Math.max(goal - consumed, 0);
check('remaining=goal-consumed', remaining(2000, 1500) === 500);
check('remaining floors at 0', remaining(2000, 2500) === 0);
const stepsToCal = (s) => Math.round(s * 0.04);
check('steps->kcal 10000=400', stepsToCal(10000) === 400);
const bmi = (kg, cm) => kg && cm ? (kg / ((cm / 100) ** 2)).toFixed(1) : null;
check('BMI 70kg/175cm=22.9', bmi(70, 175) === '22.9');
check('BMI null on missing', bmi(null, 175) === null);
const avgSleep = (logs) => logs.length ? logs.reduce((s, r) => s + (r.hours ?? 0), 0) / logs.length : 0;
check('avgSleep uses hours', avgSleep([{ hours: 7 }, { hours: 8 }]) === 7.5);
check('avgSleep empty=0', avgSleep([]) === 0);
const fastProgress = (elapsed, h) => Math.min(elapsed / (h * 3600000), 1);
check('fast progress half', fastProgress(8 * 3600000, 16) === 0.5);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
