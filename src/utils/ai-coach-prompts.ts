import type { WorkoutParams, MealPlanParams } from '../types/ai-coach.types';

export const buildSystemPrompt = (): string =>
  `You are a certified fitness coach with 15 years of experience. ` +
  `You design safe, effective workouts that respect the client's level and goals. ` +
  `Every exercise must include form tips to prevent injury.`;

export function buildCoachChatSystemPrompt(userProfile?: {
  name?: string; goal?: string; fitnessLevel?: string;
}): string {
  const profile = userProfile
    ? `\nUser profile:\n- Name: ${userProfile.name ?? 'Unknown'}\n- Goal: ${userProfile.goal ?? 'Not set'}\n- Fitness level: ${userProfile.fitnessLevel ?? 'Not set'}`
    : '';

  return `You are CalFit Coach — a supportive, knowledgeable fitness and nutrition coach. Your tone is encouraging but honest.

You help users with:
- Workout recommendations and exercise form guidance
- Nutrition advice and meal planning
- Progress tracking motivation
- Answering health and fitness questions
- Generating structured workout plans (use <action:generate_workout>JSON</action> to trigger workout generation)
- Creating meal plans (use <action:generate_meal_plan>JSON</action> when the user asks for meal plans)

Rules:
- Keep responses concise (2-4 sentences unless asked for detail)
- Never give medical advice — recommend consulting a doctor for injuries/conditions
- Encourage consistency over perfection
- Reference the user's profile when relevant
- If the user asks for a workout, include <action:generate_workout>{"goals":["strength"],"duration":30,"level":"beginner"}</action> in your response with appropriate params
- If the user asks for a meal plan, include <action:generate_meal_plan>{"goal":"weight_loss","calories":2000}</action>
- If the user wants to track progress, suggest using the app's tracking features
${profile}`;
}

export const generateWorkoutPrompt = (
  params: WorkoutParams & { previousWorkouts?: string[] }
): string => {
  const prevSummary =
    params.previousWorkouts?.length
      ? params.previousWorkouts.join(', ')
      : 'None';

  return `
Generate a detailed workout for a ${params.fitnessLevel} client.

**Client Profile:**
- Fitness Level: ${params.fitnessLevel}
- Goals: ${params.goals.join(', ')}
- Duration: ${params.duration} minutes
- Available Equipment: ${params.equipment.join(', ')}
- Previous workouts this week: ${prevSummary}

**Requirements:**
1. Duration: ${params.duration} ± 5 minutes
2. No exercise should repeat within their last 5 workouts
3. Every exercise must have form tips to prevent injury
4. Include progression advice so they can advance next time
5. Structure: Warmup → Exercises → Cooldown

**Output Rules:**
- Respond ONLY with valid JSON (no markdown, no preamble, no backticks)
- No extra text before or after JSON
- All strings must be properly escaped

**JSON Structure (EXACT):**
{
  "title": "Workout name (e.g. 'Upper Body Strength Focus')",
  "description": "1-2 sentence description of what this workout targets",
  "duration": ${params.duration},
  "difficulty": <number 1-10>,
  "warmup": ["5 min light cardio", "Arm circles 10 reps", "Cat-cow stretches 10 reps"],
  "exercises": [
    {
      "name": "Exercise name",
      "sets": <number>,
      "reps": "8-12 or 20 (whatever is appropriate)",
      "rest": <seconds>,
      "form_tips": "Specific coaching point to prevent injury",
      "progression": "How to make it harder next time"
    }
  ],
  "cooldown": ["5 min walking", "Quad stretch 30 sec each leg", "Child's pose 30 sec"],
  "ai_notes": "Why this workout is perfect for their goals. Mention periodization strategy."
}

Remember: ONLY output the JSON. Nothing else.`;
};

export const generateMealPlanPrompt = (params: MealPlanParams): string => {
  return `
Generate a detailed daily meal plan with the following preferences:

**Client Preferences:**
- Dietary Preferences: ${params.dietary_preferences.join(', ') || 'None specified'}
- Budget Level: ${params.budget_level}
- Daily Calorie Target: ${params.calories_target} kcal
- Meals per Day: ${params.meals_per_day}
- Excluded Foods: ${params.excluded_foods.join(', ') || 'None'}
- Cuisine Style: ${params.cuisine_style || 'Any'}
- Health Goal: ${params.health_goal || 'General health'}

**Requirements:**
1. Create ${params.meals_per_day} meals covering the full day
2. Total calories should be close to ${params.calories_target} kcal
3. Consider the budget level — suggest affordable ingredients for 'low', mid-range for 'moderate', premium for 'high'
4. Avoid any excluded foods
5. Include estimated protein, carbs, fats for each meal
6. Suggest realistic, easy-to-prepare meals

**Output Rules:**
- Respond ONLY with valid JSON (no markdown, no preamble, no backticks)
- No extra text before or after JSON

**JSON Structure (EXACT):**
{
  "title": "Meal plan title (e.g. 'Balanced Budget Meal Plan')",
  "description": "1-2 sentence description",
  "daily_calories": ${params.calories_target},
  "meals": [
    {
      "name": "Breakfast",
      "foods": ["Food 1", "Food 2", "Food 3"],
      "calories": 450,
      "protein_g": 25,
      "carbs_g": 45,
      "fats_g": 15
    }
  ],
  "nutrition_goals": {
    "protein_g": 120,
    "carbs_g": 200,
    "fats_g": 60
  },
  "ai_notes": "Why this meal plan suits their preferences and goals"
}

Remember: ONLY output the JSON. Nothing else.`;
};
