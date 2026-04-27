// src/services/claudeService.ts
// ─────────────────────────────────────────────────────────────
// CalFit Claude API Service — Cost-optimised production build
//
// MODELS:
//   Haiku  — all chat (20x cheaper than Sonnet, fast)
//   Sonnet — vision only (food scanner, image analysis)
//
// COST TARGET: < $20/month for early users
// ─────────────────────────────────────────────────────────────

const HAIKU_MODEL  = 'claude-haiku-4-5-20251001';  // chat, Q&A — fastest & cheapest
const SONNET_MODEL = 'claude-sonnet-4-5-20250929';  // vision only
const API_URL      = 'https://api.anthropic.com/v1/messages';

// ── DAILY LIMITS PER PLAN ─────────────────────────────────────
export const PLAN_LIMITS = {
  free:    0,   // no access — show paywall
  pro:     15,  // hard cap
  premium: 50,  // soft limit then shorter responses
} as const;

// ── COOLDOWN ──────────────────────────────────────────────────
// 10 seconds between requests to prevent spam
const COOLDOWN_MS = 10_000;
let lastRequestTime = 0;

export const isOnCooldown = (): boolean =>
  Date.now() - lastRequestTime < COOLDOWN_MS;

export const getCooldownRemaining = (): number =>
  Math.ceil((COOLDOWN_MS - (Date.now() - lastRequestTime)) / 1000);

// ── KEY CHECK ─────────────────────────────────────────────────
export const hasClaudeKey = (): boolean =>
  !!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

// ── HEADERS ───────────────────────────────────────────────────
const headers = () => ({
  'Content-Type': 'application/json',
  'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
});

// ── USAGE TRACKING ────────────────────────────────────────────
// Stored in Supabase: ai_usage table
// user_id | messages_today | last_reset_at

import { supabase } from './supabase';

export interface UsageStatus {
  allowed: boolean;
  reason: 'ok' | 'free_plan' | 'limit_reached' | 'cooldown';
  messagesUsed: number;
  messagesLimit: number;
  isSoftLimit: boolean;  // premium over 50 — still works but shorter responses
}

export const checkUsage = async (
  userId: string,
  userTier: string
): Promise<UsageStatus> => {
  // Free users — block immediately, no DB check needed
  if (userTier === 'free') {
    return { allowed: false, reason: 'free_plan', messagesUsed: 0, messagesLimit: 0, isSoftLimit: false };
  }

  // Cooldown check
  if (isOnCooldown()) {
    return { allowed: false, reason: 'cooldown', messagesUsed: 0, messagesLimit: PLAN_LIMITS[userTier as keyof typeof PLAN_LIMITS] ?? 15, isSoftLimit: false };
  }

  const limit = PLAN_LIMITS[userTier as keyof typeof PLAN_LIMITS] ?? 15;
  const today = new Date().toISOString().split('T')[0];

  // Get or create usage row
  const { data: existing } = await supabase
    .from('ai_usage')
    .select('messages_today, last_reset_at')
    .eq('user_id', userId)
    .maybeSingle();

  let used = 0;

  if (existing) {
    const lastReset = existing.last_reset_at?.split('T')[0];
    // Reset if last reset was before today
    used = lastReset === today ? (existing.messages_today ?? 0) : 0;
  }

  // Premium soft limit — still allowed but flag for shorter responses
  if (userTier === 'premium' && used >= limit) {
    return { allowed: true, reason: 'ok', messagesUsed: used, messagesLimit: limit, isSoftLimit: true };
  }

  // Pro hard limit
  if (userTier === 'pro' && used >= limit) {
    return { allowed: false, reason: 'limit_reached', messagesUsed: used, messagesLimit: limit, isSoftLimit: false };
  }

  return { allowed: true, reason: 'ok', messagesUsed: used, messagesLimit: limit, isSoftLimit: false };
};

export const incrementUsage = async (userId: string): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  lastRequestTime = Date.now();

  // Upsert usage row — increment today's count
  const { data: existing } = await supabase
    .from('ai_usage')
    .select('messages_today, last_reset_at')
    .eq('user_id', userId)
    .maybeSingle();

  const lastReset = existing?.last_reset_at?.split('T')[0];
  const currentCount = lastReset === today ? (existing?.messages_today ?? 0) : 0;

  await supabase.from('ai_usage').upsert({
    user_id: userId,
    messages_today: currentCount + 1,
    last_reset_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
};

// ── SYSTEM PROMPT ─────────────────────────────────────────────
// Kept minimal — shorter prompt = lower cost per request
const BASE_SYSTEM = 'You are a fitness AI coach for CalFit. Give concise, actionable fitness and nutrition advice. Keep responses under 120 words. Use bullet points when possible. Avoid long explanations.';

export const buildCoachPrompt = (
  goal: string,
  streak: number,
  calorieGoal: number,
  personalityTone: string,
  isSoftLimit: boolean
): string => {
  const base = `${personalityTone}\n${BASE_SYSTEM}\nUser goal: ${goal}. Streak: ${streak} days. Calorie goal: ${calorieGoal} kcal.`;
  // Soft limit — cut response length further
  return isSoftLimit
    ? base + ' Keep response under 60 words.'
    : base;
};

// ── CORE CALL ─────────────────────────────────────────────────
const callClaude = async ({
  model,
  systemPrompt,
  messages,
  maxTokens,
}: {
  model: string;
  systemPrompt?: string;
  messages: { role: 'user' | 'assistant'; content: any }[];
  maxTokens: number;
}): Promise<string | null> => {
  if (!hasClaudeKey()) return null;

  try {
    const body: any = { model, max_tokens: maxTokens, messages };
    if (systemPrompt) body.system = systemPrompt;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Claude API error:', res.status, err?.error?.message ?? '');
      return null;
    }

    const data = await res.json();
    return data?.content?.[0]?.text?.trim() ?? null;
  } catch (e) {
    console.error('callClaude error:', e);
    return null;
  }
};

// ── COACH CHAT (Haiku) ────────────────────────────────────────
// Only sends last 2 exchanges to minimise token cost
// Full history stays in React state for display only
export const claudeChat = async (
  systemPrompt: string,
  fullHistory: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
  isSoftLimit = false
): Promise<string | null> => {
  // Take only last 2 exchanges (4 messages) — cost control
  const recentHistory = fullHistory.slice(-4);

  return callClaude({
    model: HAIKU_MODEL,
    systemPrompt,
    messages: [
      ...recentHistory,
      { role: 'user', content: userMessage },
    ],
    // Soft limit users get shorter responses
    maxTokens: isSoftLimit ? 100 : 200,
  });
};

// ── VISION — FOOD ANALYSIS (Sonnet) ───────────────────────────
// Uses Sonnet because Haiku has weaker vision accuracy
// Only used for food scanning — keep calls minimal
export const claudeVision = async (
  systemPrompt: string,
  imageBase64: string,
  prompt: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<string | null> => {
  return callClaude({
    model: SONNET_MODEL,
    systemPrompt,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
        { type: 'text', text: prompt },
      ],
    }],
    maxTokens: 400,
  });
};

// ── STRUCTURED JSON (Haiku) ───────────────────────────────────
// For meal plan generation — returns parsed object
export const claudeJSON = async <T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 600
): Promise<T | null> => {
  const text = await callClaude({
    model: HAIKU_MODEL,
    systemPrompt: systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no explanation.',
    messages: [{ role: 'user', content: userPrompt }],
    maxTokens,
  });
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) as T : null;
  } catch { return null; }
};

// ── CONTENT MODERATION (Haiku) ────────────────────────────────
// Returns true = safe to post, false = block
// Uses Haiku for cost — moderation doesn't need Sonnet's accuracy
export const moderateImage = async (imageBase64: string): Promise<boolean> => {
  const result = await callClaude({
    model: HAIKU_MODEL,
    systemPrompt: 'You are a content moderation system for a fitness app. Reply only with SAFE or UNSAFE.',
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: 'Is this image appropriate for a fitness health community? Reply: SAFE or UNSAFE' },
      ],
    }],
    maxTokens: 10,  // We only need one word back
  });
  return result?.trim().toUpperCase() !== 'UNSAFE';
};

// ── TYPES ─────────────────────────────────────────────────────
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}