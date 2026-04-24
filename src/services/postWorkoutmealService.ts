// Post-workout meal suggestion service
// Uses Claude API when key is configured, falls back to static suggestions

export interface MealSuggestion {
  name: string;
  description: string;
  protein: number;
  carbs: number;
  calories: number;
  timing: string;
}

// ── STATIC FALLBACKS BY WORKOUT TYPE ─────────────────────────
const STATIC_SUGGESTIONS: Record<string, MealSuggestion> = {
  Cardio: {
    name: 'Rice & Grilled Chicken',
    description: 'White rice with grilled chicken breast and steamed vegetables. Fast-absorbing carbs to replenish glycogen after cardio.',
    protein: 42, carbs: 58, calories: 520,
    timing: 'Within 30–45 minutes of your workout',
  },
  Chest: {
    name: 'Egg & Oat Protein Bowl',
    description: 'Scrambled eggs with oats, banana, and a drizzle of honey. High protein to repair chest muscles.',
    protein: 38, carbs: 45, calories: 480,
    timing: 'Within 30 minutes for best muscle recovery',
  },
  Back: {
    name: 'Tuna & Sweet Potato',
    description: 'Canned tuna with baked sweet potato and avocado. Lean protein and complex carbs for back muscle repair.',
    protein: 40, carbs: 50, calories: 490,
    timing: 'Within 45 minutes after your session',
  },
  Core: {
    name: 'Greek Yogurt & Fruit',
    description: 'Greek yogurt with mixed berries, granola and a drizzle of honey. Light but protein-rich for core recovery.',
    protein: 25, carbs: 40, calories: 360,
    timing: 'Within 30 minutes after your session',
  },
  Legs: {
    name: 'Jollof Rice & Beans',
    description: 'Jollof rice with beans and grilled fish. High carbs and protein to refuel after intense leg training.',
    protein: 45, carbs: 70, calories: 580,
    timing: 'Within 30 minutes — legs need maximum fuel',
  },
  Shoulders: {
    name: 'Protein Smoothie',
    description: 'Banana, oats, peanut butter, milk and protein powder blended. Fast recovery drink for shoulder muscles.',
    protein: 35, carbs: 48, calories: 450,
    timing: 'Immediately after your workout',
  },
  Arms: {
    name: 'Boiled Eggs & Bread',
    description: 'Three boiled eggs with whole grain bread and avocado. Simple, effective protein and carb combo for arm recovery.',
    protein: 28, carbs: 38, calories: 400,
    timing: 'Within 30–45 minutes after training',
  },
  Flexibility: {
    name: 'Fruit & Nut Mix',
    description: 'Mixed fruits with almonds and cashews. Anti-inflammatory snack perfect after yoga or stretching sessions.',
    protein: 12, carbs: 35, calories: 280,
    timing: 'Any time within an hour after your session',
  },
  default: {
    name: 'Grilled Chicken & Rice',
    description: 'The classic recovery meal — grilled chicken breast with white rice and a side of vegetables. Works for any workout type.',
    protein: 42, carbs: 55, calories: 510,
    timing: 'Within 30–45 minutes after your workout',
  },
};

// ── GET SUGGESTION FROM CLAUDE API ────────────────────────────
const getClaudeSuggestion = async (
  workoutCategory: string,
  caloriesBurned: number,
  durationMinutes: number
): Promise<MealSuggestion | null> => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: `You are a sports nutritionist. Respond ONLY with a valid JSON object, no markdown, no explanation.
The JSON must have exactly these fields:
{
  "name": "meal name",
  "description": "2 sentence description including Nigerian food options where relevant",
  "protein": number (grams),
  "carbs": number (grams),
  "calories": number,
  "timing": "when to eat this"
}`,
        messages: [{
          role: 'user',
          content: `Suggest a post-workout recovery meal for someone who just completed a ${workoutCategory} workout, burned ${caloriesBurned} calories in ${durationMinutes} minutes. Keep it practical and accessible in Nigeria.`,
        }],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.content?.[0]?.text ?? '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Validate required fields
    if (!parsed.name || !parsed.description || !parsed.calories) return null;
    return parsed as MealSuggestion;
  } catch (_) {
    return null;
  }
};

// ── MAIN EXPORT ───────────────────────────────────────────────
// Returns a Claude suggestion if API is available, else static fallback
export const getPostWorkoutMealSuggestion = async (
  workoutCategory: string,
  caloriesBurned: number,
  durationSeconds: number
): Promise<MealSuggestion> => {
  const durationMinutes = Math.round(durationSeconds / 60);

  // Try Claude first
  const claudeSuggestion = await getClaudeSuggestion(
    workoutCategory,
    caloriesBurned,
    durationMinutes
  );
  if (claudeSuggestion) return claudeSuggestion;

  // Fall back to static suggestion based on workout category
  return (
    STATIC_SUGGESTIONS[workoutCategory] ??
    STATIC_SUGGESTIONS.default
  );
};