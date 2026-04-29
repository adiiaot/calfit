// src/services/FoodVisionService.ts
// ─────────────────────────────────────────────────────────────
// CalFit Food Scanner — Three-Layer Pipeline
//
// LAYER 1: Google Cloud Vision API
//   → Identifies food labels from the photo
//   → Purpose-built image model — far more accurate than a general LLM
//
// LAYER 2: Nigerian Food DB (priority match)
//   → If Google Vision label matches a local food, use verified DB data
//   → Free, instant, no extra API call
//
// LAYER 3: FatSecret API
//   → If no local DB match, search FatSecret with the Vision label
//   → Returns verified nutrition data from 58-country dataset
//
// LAYER 4: Claude Vision (last resort only)
//   → Only fires if Google Vision AND FatSecret both fail
//   → Logs a warning so you can monitor how often this happens
//
// ENV VARS REQUIRED (never in codebase):
//   EXPO_PUBLIC_GOOGLE_VISION_API_KEY
//   EXPO_PUBLIC_FATSECRET_CLIENT_ID
//   EXPO_PUBLIC_FATSECRET_CLIENT_SECRET
//   EXPO_PUBLIC_ANTHROPIC_API_KEY  (existing — fallback only)
// ─────────────────────────────────────────────────────────────

import { NIGERIAN_FOODS, FoodResult } from './foodSearchService';
import { claudeVision } from './ClaudeService';

// ── TYPES ─────────────────────────────────────────────────────

export type DataSource = 'nigerian_db' | 'fatsecret' | 'claude_estimate';

export interface FoodScanResult {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fibre: number;
  portion: string;
  confidence: number;        // 0–100
  source: DataSource;        // where the nutrition data came from
  withinGoal: boolean;
  caloriesRemaining: number;
}

// ── LAYER 1: GOOGLE CLOUD VISION ──────────────────────────────
// Sends the base64 image to Google Vision's label detection.
// Returns an array of food-related labels sorted by confidence score.
// We filter to labels that are likely food items (score > 0.7).
//
// WHY label detection and not object localisation?
// Label detection returns descriptive names like "Jollof rice" or
// "Fried plantain" which map better to food DB search terms.

interface VisionLabel {
  description: string;
  score: number;  // 0.0 – 1.0
}

const GOOGLE_VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

export const detectFoodLabels = async (
  imageBase64: string
): Promise<VisionLabel[]> => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    console.warn('[FoodVisionService] Google Vision API key not set');
    return [];
  }

  try {
    const response = await fetch(`${GOOGLE_VISION_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 10 },
            // WEB_DETECTION gives "best guess" labels — very useful for food
            { type: 'WEB_DETECTION', maxResults: 5 },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[FoodVisionService] Google Vision error:', err?.error?.message);
      return [];
    }

    const data = await response.json();
    const result = data?.responses?.[0];

    // Combine label detection + web detection best guess labels
    const labelAnnotations: VisionLabel[] = (result?.labelAnnotations ?? [])
      .map((l: any) => ({ description: l.description, score: l.score }));

    const webLabels: VisionLabel[] = (result?.webDetection?.bestGuessLabels ?? [])
      .map((l: any) => ({ description: l.label, score: 0.95 })); // web guess is usually high quality

    // Merge, deduplicate, filter to score > 0.6, sort by score descending
    const all = [...webLabels, ...labelAnnotations];
    const seen = new Set<string>();
    const filtered = all
      .filter(l => {
        const key = l.description.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return l.score >= 0.6;
      })
      .sort((a, b) => b.score - a.score);

    return filtered;
  } catch (e) {
    console.error('[FoodVisionService] detectFoodLabels error:', e);
    return [];
  }
};

// ── LAYER 2: NIGERIAN DB MATCH ────────────────────────────────
// Try to match Google Vision labels against the local Nigerian food DB.
// This is free and instant — always checked before making a FatSecret call.
//
// Matching strategy:
//   1. Direct substring match (label contains food name or vice versa)
//   2. Keyword alias map for common Nigerian foods that Google may
//      describe in English (e.g. "bean cake" → Akara)

const NIGERIAN_ALIASES: Record<string, string[]> = {
  'jollof rice':      ['jollof', 'jollof rice', 'party rice', 'tomato rice'],
  'egusi soup':       ['egusi', 'melon seed soup', 'egusi'],
  'pounded yam':      ['pounded yam', 'fufu yam', 'pounded'],
  'eba (garri)':      ['eba', 'garri', 'cassava fufu', 'gari'],
  'okra soup':        ['okra', 'okra soup', 'okro'],
  'suya':             ['suya', 'spiced beef', 'nigerian kebab', 'grilled beef skewer'],
  'moi moi':          ['moi moi', 'moin moin', 'steamed bean pudding', 'bean pudding'],
  'akara':            ['akara', 'bean cake', 'bean fritter', 'fried bean cake'],
  'ofada rice':       ['ofada', 'ofada rice', 'local rice'],
  'banga soup':       ['banga', 'palm nut soup', 'ofe akwu'],
  'oha soup':         ['oha', 'ora soup'],
  'ogbono soup':      ['ogbono', 'draw soup', 'wild mango seed soup'],
  'nkwobi':           ['nkwobi', 'spiced cow foot', 'ugba nkwobi'],
  'plantain (fried)': ['fried plantain', 'dodo', 'ripe plantain fried'],
  'plantain (boiled)':['boiled plantain', 'boiled unripe plantain'],
  'chin chin':        ['chin chin', 'chin-chin', 'nigerian snack'],
  'puff puff':        ['puff puff', 'puff-puff', 'nigerian doughnut', 'fried dough ball'],
  'groundnut soup':   ['groundnut soup', 'peanut soup', 'ofe ose oji'],
  'efo riro':         ['efo riro', 'efo', 'yoruba vegetable soup', 'spinach stew'],
  'tuwo shinkafa':    ['tuwo', 'tuwo shinkafa', 'rice fufu', 'hausa rice ball'],
  'kilishi':          ['kilishi', 'dried meat', 'nigerian beef jerky', 'spiced dried beef'],
  'zobo drink':       ['zobo', 'hibiscus drink', 'sorrel drink'],
  'kunu drink':       ['kunu', 'millet drink', 'grain drink'],
  'pepper soup':      ['pepper soup', 'spicy broth', 'nigerian pepper soup'],
  'bole and fish':    ['bole', 'roasted plantain', 'boli'],
};

export const matchNigerianDB = (
  labels: VisionLabel[]
): { food: FoodResult; confidence: number } | null => {
  for (const label of labels) {
    const labelLower = label.description.toLowerCase();

    // Check alias map first
    for (const [foodName, aliases] of Object.entries(NIGERIAN_ALIASES)) {
      if (aliases.some(alias => labelLower.includes(alias) || alias.includes(labelLower))) {
        const dbEntry = NIGERIAN_FOODS.find(
          f => f.name.toLowerCase() === foodName.toLowerCase()
        );
        if (dbEntry) {
          return {
            food: dbEntry,
            confidence: Math.round(label.score * 100),
          };
        }
      }
    }

    // Direct name match fallback
    const directMatch = NIGERIAN_FOODS.find(f =>
      labelLower.includes(f.name.toLowerCase()) ||
      f.name.toLowerCase().includes(labelLower)
    );
    if (directMatch) {
      return {
        food: directMatch,
        confidence: Math.round(label.score * 100),
      };
    }
  }

  return null;
};

// ── LAYER 3: FATSECRET API ────────────────────────────────────
// FatSecret uses OAuth 2.0 client credentials flow.
// We get an access token first, then search for the food.
//
// FatSecret food.search returns a list of matching foods.
// We take the top result and extract its nutrition data.
//
// Note: FatSecret returns nutrition per serving — we use that directly.

const FATSECRET_TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const FATSECRET_API_URL   = 'https://platform.fatsecret.com/rest/server.api';

// Token is cached in memory per session — avoids requesting a new one
// on every scan. Token expires in 86400s (24h) so this is safe.
let fatSecretToken: string | null = null;
let tokenExpiry: number = 0;

const getFatSecretToken = async (): Promise<string | null> => {
  const clientId     = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('[FoodVisionService] FatSecret credentials not set');
    return null;
  }

  // Return cached token if still valid (with 60s buffer)
  if (fatSecretToken && Date.now() < tokenExpiry - 60_000) {
    return fatSecretToken;
  }

  try {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const response = await fetch(FATSECRET_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=basic',
    });

    if (!response.ok) {
      console.error('[FoodVisionService] FatSecret token error:', response.status);
      return null;
    }

    const data = await response.json();
    fatSecretToken = data.access_token;
    tokenExpiry    = Date.now() + (data.expires_in * 1000);
    return fatSecretToken;
  } catch (e) {
    console.error('[FoodVisionService] getFatSecretToken error:', e);
    return null;
  }
};

export interface FatSecretFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fibre: number;
  serving: string;
}

export const searchFatSecret = async (
  query: string
): Promise<FatSecretFood | null> => {
  const token = await getFatSecretToken();
  if (!token) return null;

  try {
    // FatSecret REST API — foods.search method
    const params = new URLSearchParams({
      method:         'foods.search',
      search_expression: query,
      format:         'json',
      max_results:    '5',
      page_number:    '0',
    });

    const response = await fetch(`${FATSECRET_API_URL}?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      console.error('[FoodVisionService] FatSecret search error:', response.status);
      return null;
    }

    const data = await response.json();
    const foods = data?.foods?.food;
    if (!foods || foods.length === 0) return null;

    // Take first result — it's the closest match
    const top = Array.isArray(foods) ? foods[0] : foods;

    // food_description format: "Per 100g - Calories: 180kcal | Fat: 4g | Carbs: 35g | Protein: 4g"
    const desc: string = top.food_description ?? '';

    const extract = (key: string): number => {
      const match = desc.match(new RegExp(`${key}:\\s*([\\d.]+)`));
      return match ? parseFloat(match[1]) : 0;
    };

    return {
      name:     top.food_name ?? query,
      calories: extract('Calories'),
      protein:  extract('Protein'),
      carbs:    extract('Carbs'),
      fats:     extract('Fat'),
      fibre:    extract('Fiber') || extract('Fibre'),
      serving:  '100g',
    };
  } catch (e) {
    console.error('[FoodVisionService] searchFatSecret error:', e);
    return null;
  }
};

// ── LAYER 4: CLAUDE VISION FALLBACK ───────────────────────────
// Only called when both Google Vision and FatSecret fail.
// Uses the same approach as before but logs a warning so you can
// monitor how often this path is hit (should be rare).

const claudeFallback = async (
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  calorieGoal: number,
  consumed: number,
): Promise<FoodScanResult | null> => {
  console.warn('[FoodVisionService] Using Claude Vision fallback — monitor frequency');

  try {
    const text = await claudeVision(
      'You are a nutrition expert specialising in Nigerian and West African cuisine. Respond with valid JSON only. No markdown.',
      imageBase64,
      `Identify the food in this image — it is likely Nigerian or West African.
Estimate the nutrition for a typical serving.
Respond ONLY with:
{"food":"name","calories":number,"protein":number,"carbs":number,"fats":number,"fibre":number,"portion":"e.g. 1 plate ~400g","confidence":0-100}
If no food is visible: {"error":"No food detected"}`,
      mediaType
    );

    if (!text) return null;

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    if (parsed.error) return null;

    const remaining = calorieGoal - consumed;

    return {
      food: parsed.food,
      calories: parsed.calories,
      protein: parsed.protein,
      carbs: parsed.carbs,
      fats: parsed.fats,
      fibre: parsed.fibre ?? 0,
      portion: parsed.portion,
      confidence: parsed.confidence,
      source: 'claude_estimate',
      withinGoal: parsed.calories <= remaining,
      caloriesRemaining: remaining,
    };
  } catch (e) {
    console.error('[FoodVisionService] claudeFallback error:', e);
    return null;
  }
};

// ── MAIN EXPORT: analyseFood ───────────────────────────────────
// This is the single function FoodScannerScreen calls.
// Runs through all four layers in order.

export const analyseFood = async (
  imageBase64: string,
  calorieGoal: number,
  consumed: number,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
): Promise<FoodScanResult | null> => {
  const remaining = calorieGoal - consumed;

  // ── LAYER 1: Google Vision labels ──
  console.log('[FoodVisionService] Running Google Vision detection...');
  const labels = await detectFoodLabels(imageBase64);

  if (labels.length > 0) {
    console.log('[FoodVisionService] Labels detected:', labels.map(l => `${l.description} (${Math.round(l.score * 100)}%)`));

    // ── LAYER 2: Nigerian DB match ──
    const nigerianMatch = matchNigerianDB(labels);

    if (nigerianMatch) {
      console.log('[FoodVisionService] Nigerian DB match:', nigerianMatch.food.name);
      const f = nigerianMatch.food;
      const portionGrams = parseInt(f.servingSize.match(/(\d+)g/)?.[1] ?? '100');
      const scale = portionGrams / 100;

      return {
        food:             f.name,
        calories:         Math.round(f.calories * scale),
        protein:          Math.round(f.protein  * scale * 10) / 10,
        carbs:            Math.round(f.carbs    * scale * 10) / 10,
        fats:             Math.round(f.fat      * scale * 10) / 10,
        fibre:            0,
        portion:          f.servingSize,
        confidence:       nigerianMatch.confidence,
        source:           'nigerian_db',
        withinGoal:       f.calories <= remaining,
        caloriesRemaining: remaining,
      };
    }

    // ── LAYER 3: FatSecret search using top Vision label ──
    const topLabel = labels[0].description;
    console.log('[FoodVisionService] No Nigerian DB match. Searching FatSecret for:', topLabel);
    const fatSecretResult = await searchFatSecret(topLabel);

    if (fatSecretResult) {
      console.log('[FoodVisionService] FatSecret match:', fatSecretResult.name);
      return {
        food:             fatSecretResult.name,
        calories:         fatSecretResult.calories,
        protein:          fatSecretResult.protein,
        carbs:            fatSecretResult.carbs,
        fats:             fatSecretResult.fats,
        fibre:            fatSecretResult.fibre,
        portion:          fatSecretResult.serving,
        confidence:       Math.round(labels[0].score * 100),
        source:           'fatsecret',
        withinGoal:       fatSecretResult.calories <= remaining,
        caloriesRemaining: remaining,
      };
    }
  } else {
    console.warn('[FoodVisionService] Google Vision returned no labels');
  }

  // ── LAYER 4: Claude Vision fallback ──
  console.warn('[FoodVisionService] All primary layers failed — using Claude fallback');
  return claudeFallback(imageBase64, mediaType, calorieGoal, consumed);
};