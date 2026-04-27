// src/services/favouriteMealsService.ts
// Save and re-add favourite meal combinations from the calorie tracker

import { supabase } from './supabase';

export interface FavouriteMeal {
  id: string;
  user_id: string;
  name: string;          // user-given name e.g. "My Usual Breakfast"
  meal_type: string;     // breakfast | lunch | dinner | snack
  food_name: string;     // the food item
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  created_at: string;
}

// ── SAVE A MEAL AS FAVOURITE ──────────────────────────────────
export const saveFavouriteMeal = async (
  userId: string,
  payload: Omit<FavouriteMeal, 'id' | 'user_id' | 'created_at'>
): Promise<boolean> => {
  const { error } = await supabase.from('favourite_meals').insert({
    user_id: userId,
    ...payload,
  });
  return !error;
};

// ── LOAD FAVOURITES ───────────────────────────────────────────
export const loadFavouriteMeals = async (
  userId: string
): Promise<FavouriteMeal[]> => {
  const { data, error } = await supabase
    .from('favourite_meals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (error ? [] : data ?? []) as FavouriteMeal[];
};

// ── DELETE A FAVOURITE ────────────────────────────────────────
export const deleteFavouriteMeal = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('favourite_meals').delete().eq('id', id);
  return !error;
};

// ── LOG A FAVOURITE MEAL (re-add it to today's food log) ──────
export const logFavouriteMeal = async (
  userId: string,
  meal: FavouriteMeal
): Promise<boolean> => {
  const { error } = await supabase.from('food_logs').insert({
    user_id: userId,
    date: new Date().toISOString().split('T')[0],
    meal_type: meal.meal_type,
    food_name: meal.food_name,
    calories: meal.calories,
    protein_g: meal.protein_g,
    carbs_g: meal.carbs_g,
    fats_g: meal.fats_g,
    logged_at: new Date().toISOString(),
  });
  return !error;
};