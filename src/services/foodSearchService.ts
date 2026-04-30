// src/services/foodSearchService.ts
//
// UPDATED: FoodResult now includes micronutrient fields.
// Open Food Facts returns these when available — we extract them
// and pass them through so CalorieScreen can store and display them.
// Nigerian local DB doesn't have micronutrients — those fields stay undefined.

export interface FoodResult {
  id:          string;
  name:        string;
  brand:       string;
  calories:    number;
  protein:     number;
  carbs:       number;
  fat:         number;
  servingSize: string;
  image?:      string;
  // ── MICRONUTRIENTS (optional — only from Open Food Facts) ──
  fiber_g?:      number;
  sugar_g?:      number;
  sodium_mg?:    number;
  vitamin_c_mg?: number;
  calcium_mg?:   number;
  iron_mg?:      number;
  potassium_mg?: number;
}

export const searchFoods = async (query: string): Promise<FoodResult[]> => {
  if (!query.trim() || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,serving_size,image_small_url`
    );

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    const products = data.products ?? [];

    const results: FoodResult[] = products
      .filter((p: any) => p.product_name && p.nutriments?.['energy-kcal_100g'])
      .map((p: any, i: number) => {
        const n = p.nutriments ?? {};
        return {
          id:          p.code ?? `off_${i}`,
          name:        p.product_name ?? 'Unknown',
          brand:       p.brands ?? '',
          calories:    Math.round(n['energy-kcal_100g'] ?? 0),
          protein:     Math.round((n.proteins_100g      ?? 0) * 10) / 10,
          carbs:       Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
          fat:         Math.round((n.fat_100g           ?? 0) * 10) / 10,
          servingSize: p.serving_size ?? '100g',
          image:       p.image_small_url,
          // ── Micronutrients — undefined if not in API response ──
          fiber_g:      n.fiber_100g      != null ? Math.round(n.fiber_100g      * 10) / 10 : undefined,
          sugar_g:      n.sugars_100g     != null ? Math.round(n.sugars_100g     * 10) / 10 : undefined,
          sodium_mg:    n.sodium_100g     != null ? Math.round(n.sodium_100g     * 1000 * 10) / 10 : undefined, // g→mg
          vitamin_c_mg: n['vitamin-c_100g'] != null ? Math.round(n['vitamin-c_100g'] * 1000 * 10) / 10 : undefined,
          calcium_mg:   n.calcium_100g    != null ? Math.round(n.calcium_100g    * 1000 * 10) / 10 : undefined,
          iron_mg:      n.iron_100g       != null ? Math.round(n.iron_100g       * 1000 * 10) / 10 : undefined,
          potassium_mg: n.potassium_100g  != null ? Math.round(n.potassium_100g  * 1000 * 10) / 10 : undefined,
        };
      });

    if (results.length === 0) return searchLocalFoods(query);
    return results;
  } catch {
    return searchLocalFoods(query);
  }
};

// ── LOCAL NIGERIAN FOOD DATABASE ──────────────────────────────
// No micronutrient data — fields are simply absent (undefined)
export const NIGERIAN_FOODS: FoodResult[] = [
  { id: 'ng_1',  name: 'Jollof Rice',       brand: 'Nigerian', calories: 180, protein: 4,  carbs: 35, fat: 4,  servingSize: '1 cup (200g)' },
  { id: 'ng_2',  name: 'Egusi Soup',         brand: 'Nigerian', calories: 320, protein: 14, carbs: 8,  fat: 26, servingSize: '1 bowl (250g)' },
  { id: 'ng_3',  name: 'Pounded Yam',        brand: 'Nigerian', calories: 200, protein: 2,  carbs: 47, fat: 0,  servingSize: '1 wrap (200g)' },
  { id: 'ng_4',  name: 'Eba (Garri)',         brand: 'Nigerian', calories: 170, protein: 1,  carbs: 40, fat: 0,  servingSize: '1 wrap (180g)' },
  { id: 'ng_5',  name: 'Okra Soup',           brand: 'Nigerian', calories: 150, protein: 8,  carbs: 12, fat: 9,  servingSize: '1 bowl (250g)' },
  { id: 'ng_6',  name: 'Suya',               brand: 'Nigerian', calories: 280, protein: 28, carbs: 4,  fat: 16, servingSize: '1 skewer (100g)' },
  { id: 'ng_7',  name: 'Moi Moi',            brand: 'Nigerian', calories: 140, protein: 9,  carbs: 16, fat: 5,  servingSize: '1 piece (150g)' },
  { id: 'ng_8',  name: 'Akara',              brand: 'Nigerian', calories: 120, protein: 6,  carbs: 14, fat: 5,  servingSize: '3 pieces (100g)' },
  { id: 'ng_9',  name: 'Ofada Rice',         brand: 'Nigerian', calories: 165, protein: 3,  carbs: 35, fat: 1,  servingSize: '1 cup (200g)' },
  { id: 'ng_10', name: 'Banga Soup',          brand: 'Nigerian', calories: 280, protein: 10, carbs: 8,  fat: 24, servingSize: '1 bowl (250g)' },
  { id: 'ng_11', name: 'Oha Soup',            brand: 'Nigerian', calories: 200, protein: 12, carbs: 6,  fat: 15, servingSize: '1 bowl (250g)' },
  { id: 'ng_12', name: 'Ogbono Soup',         brand: 'Nigerian', calories: 290, protein: 11, carbs: 7,  fat: 25, servingSize: '1 bowl (250g)' },
  { id: 'ng_13', name: 'Nkwobi',             brand: 'Nigerian', calories: 380, protein: 22, carbs: 5,  fat: 30, servingSize: '1 plate (200g)' },
  { id: 'ng_14', name: 'Plantain (fried)',    brand: 'Nigerian', calories: 220, protein: 1,  carbs: 38, fat: 8,  servingSize: '1 medium (100g)' },
  { id: 'ng_15', name: 'Plantain (boiled)',   brand: 'Nigerian', calories: 130, protein: 1,  carbs: 31, fat: 0,  servingSize: '1 medium (100g)' },
  { id: 'ng_16', name: 'Chin Chin',           brand: 'Nigerian', calories: 450, protein: 7,  carbs: 60, fat: 20, servingSize: '1 cup (80g)' },
  { id: 'ng_17', name: 'Puff Puff',           brand: 'Nigerian', calories: 280, protein: 4,  carbs: 38, fat: 12, servingSize: '3 pieces (100g)' },
  { id: 'ng_18', name: 'Groundnut Soup',      brand: 'Nigerian', calories: 350, protein: 16, carbs: 10, fat: 28, servingSize: '1 bowl (250g)' },
  { id: 'ng_19', name: 'Efo Riro',            brand: 'Nigerian', calories: 180, protein: 12, carbs: 8,  fat: 12, servingSize: '1 bowl (250g)' },
  { id: 'ng_20', name: 'Tuwo Shinkafa',       brand: 'Nigerian', calories: 190, protein: 3,  carbs: 42, fat: 1,  servingSize: '1 wrap (200g)' },
  { id: 'ng_21', name: 'Kilishi',             brand: 'Nigerian', calories: 300, protein: 35, carbs: 8,  fat: 14, servingSize: '100g' },
  { id: 'ng_22', name: 'Zobo Drink',          brand: 'Nigerian', calories: 50,  protein: 0,  carbs: 12, fat: 0,  servingSize: '1 glass (250ml)' },
  { id: 'ng_23', name: 'Kunu Drink',          brand: 'Nigerian', calories: 80,  protein: 1,  carbs: 18, fat: 1,  servingSize: '1 glass (250ml)' },
  { id: 'ng_24', name: 'Pepper Soup',         brand: 'Nigerian', calories: 160, protein: 18, carbs: 4,  fat: 8,  servingSize: '1 bowl (300g)' },
  { id: 'ng_25', name: 'Bole and Fish',       brand: 'Nigerian', calories: 420, protein: 28, carbs: 45, fat: 14, servingSize: '1 plate (300g)' },
];

export const searchLocalFoods = (query: string): FoodResult[] => {
  const q = query.toLowerCase();
  return NIGERIAN_FOODS.filter(
    f => f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q)
  );
};