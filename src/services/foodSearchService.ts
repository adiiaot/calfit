export interface FoodResult {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  serving_size: string;
}

// Nigerian and common foods database
export const commonFoods: FoodResult[] = [
  { id: 'ng1',  name: 'Jollof Rice',           calories: 180, protein_g: 4,  carbs_g: 36, fats_g: 3,  serving_size: '1 cup (200g)' },
  { id: 'ng2',  name: 'Fried Rice',             calories: 220, protein_g: 5,  carbs_g: 38, fats_g: 7,  serving_size: '1 cup (200g)' },
  { id: 'ng3',  name: 'Egusi Soup',             calories: 310, protein_g: 12, carbs_g: 8,  fats_g: 26, serving_size: '1 bowl (250g)' },
  { id: 'ng4',  name: 'Pounded Yam',            calories: 290, protein_g: 3,  carbs_g: 68, fats_g: 1,  serving_size: '1 wrap (250g)' },
  { id: 'ng5',  name: 'Suya',                   calories: 210, protein_g: 28, carbs_g: 4,  fats_g: 10, serving_size: '100g' },
  { id: 'ng6',  name: 'Moi Moi',                calories: 150, protein_g: 10, carbs_g: 16, fats_g: 6,  serving_size: '1 piece (150g)' },
  { id: 'ng7',  name: 'Akara',                  calories: 190, protein_g: 8,  carbs_g: 22, fats_g: 8,  serving_size: '3 pieces (100g)' },
  { id: 'ng8',  name: 'Plantain Fried',         calories: 220, protein_g: 2,  carbs_g: 40, fats_g: 8,  serving_size: '100g' },
  { id: 'ng9',  name: 'Eba / Garri',            calories: 330, protein_g: 2,  carbs_g: 80, fats_g: 1,  serving_size: '1 wrap (250g)' },
  { id: 'ng10', name: 'Beans Cooked',           calories: 130, protein_g: 8,  carbs_g: 22, fats_g: 1,  serving_size: '1 cup (180g)' },
  { id: 'ng11', name: 'Pepper Soup',            calories: 140, protein_g: 18, carbs_g: 4,  fats_g: 6,  serving_size: '1 bowl (300g)' },
  { id: 'ng12', name: 'Indomie Noodles',        calories: 370, protein_g: 8,  carbs_g: 52, fats_g: 14, serving_size: '1 pack (70g)' },
  { id: 'ng13', name: 'Rice and Stew',          calories: 400, protein_g: 12, carbs_g: 60, fats_g: 12, serving_size: '1 plate' },
  { id: 'ng14', name: 'Bread Agege',            calories: 260, protein_g: 8,  carbs_g: 50, fats_g: 4,  serving_size: '2 slices (80g)' },
  { id: 'ng15', name: 'Chicken Grilled',        calories: 165, protein_g: 31, carbs_g: 0,  fats_g: 4,  serving_size: '100g' },
  { id: 'ng16', name: 'Boiled Egg',             calories: 77,  protein_g: 6,  carbs_g: 1,  fats_g: 5,  serving_size: '1 large egg' },
  { id: 'ng17', name: 'Oatmeal',                calories: 150, protein_g: 5,  carbs_g: 27, fats_g: 3,  serving_size: '1 cup cooked' },
  { id: 'ng18', name: 'Banana',                 calories: 89,  protein_g: 1,  carbs_g: 23, fats_g: 0,  serving_size: '1 medium' },
  { id: 'ng19', name: 'Ofada Rice',             calories: 170, protein_g: 3,  carbs_g: 35, fats_g: 2,  serving_size: '1 cup (200g)' },
  { id: 'ng20', name: 'Semovita',               calories: 350, protein_g: 3,  carbs_g: 80, fats_g: 1,  serving_size: '1 wrap (250g)' },
  { id: 'ng21', name: 'Amala',                  calories: 270, protein_g: 2,  carbs_g: 64, fats_g: 0,  serving_size: '1 wrap (250g)' },
  { id: 'ng22', name: 'Boli (Roasted Plantain)',calories: 120, protein_g: 1,  carbs_g: 30, fats_g: 0,  serving_size: '1 medium' },
  { id: 'ng23', name: 'Ogbono Soup',            calories: 290, protein_g: 10, carbs_g: 6,  fats_g: 24, serving_size: '1 bowl (250g)' },
  { id: 'ng24', name: 'Groundnut Soup',         calories: 350, protein_g: 14, carbs_g: 10, fats_g: 28, serving_size: '1 bowl (250g)' },
  { id: 'ng25', name: 'White Rice Plain',       calories: 200, protein_g: 4,  carbs_g: 44, fats_g: 0,  serving_size: '1 cup (200g)' },
  // International
  { id: 'int1', name: 'Grilled Salmon',         calories: 208, protein_g: 28, carbs_g: 0,  fats_g: 10, serving_size: '100g' },
  { id: 'int2', name: 'Caesar Salad',           calories: 380, protein_g: 18, carbs_g: 28, fats_g: 22, serving_size: '1 bowl' },
  { id: 'int3', name: 'Pasta Bolognese',        calories: 430, protein_g: 22, carbs_g: 58, fats_g: 12, serving_size: '1 plate' },
  { id: 'int4', name: 'Greek Yogurt',           calories: 100, protein_g: 17, carbs_g: 6,  fats_g: 0,  serving_size: '1 cup (200g)' },
  { id: 'int5', name: 'Protein Shake',          calories: 150, protein_g: 25, carbs_g: 8,  fats_g: 2,  serving_size: '1 scoop (300ml)' },
  { id: 'int6', name: 'Avocado Toast',          calories: 290, protein_g: 7,  carbs_g: 30, fats_g: 16, serving_size: '2 slices' },
  { id: 'int7', name: 'Scrambled Eggs',         calories: 200, protein_g: 14, carbs_g: 2,  fats_g: 15, serving_size: '2 eggs' },
];

// Search local food database
export const searchFood = (query: string): FoodResult[] => {
  if (!query || query.length < 1) return commonFoods.slice(0, 10);
  const q = query.toLowerCase().trim();
  return commonFoods.filter((f) =>
    f.name.toLowerCase().includes(q)
  );
};