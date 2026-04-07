export interface FoodResult {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  serving_size: string;
  image_url?: string;
}

// Search Open Food Facts — free, no API key needed
export const searchFood = async (query: string): Promise<FoodResult[]> => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,brands,nutriments,serving_size,image_small_url`
    );
    const data = await response.json();

    if (!data.products) return [];

    return data.products
      .filter((p: any) =>
        p.product_name &&
        p.nutriments?.['energy-kcal_100g']
      )
      .map((p: any) => ({
        id: p.id || Math.random().toString(),
        name: p.product_name || 'Unknown food',
        brand: p.brands || '',
        calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
        protein_g: Math.round(p.nutriments['proteins_100g'] || 0),
        carbs_g: Math.round(p.nutriments['carbohydrates_100g'] || 0),
        fats_g: Math.round(p.nutriments['fat_100g'] || 0),
        serving_size: p.serving_size || '100g',
        image_url: p.image_small_url || '',
      }));
  } catch (error) {
    console.error('Food search error:', error);
    return [];
  }
};

// Common Nigerian/African foods with hardcoded nutrition data
// since Open Food Facts may not have all local dishes
export const commonFoods: FoodResult[] = [
  { id: 'ng1', name: 'Jollof Rice', brand: '', calories: 180, protein_g: 4, carbs_g: 36, fats_g: 3, serving_size: '1 cup (200g)' },
  { id: 'ng2', name: 'Fried Rice', brand: '', calories: 220, protein_g: 5, carbs_g: 38, fats_g: 7, serving_size: '1 cup (200g)' },
  { id: 'ng3', name: 'Egusi Soup', brand: '', calories: 310, protein_g: 12, carbs_g: 8, fats_g: 26, serving_size: '1 bowl (250g)' },
  { id: 'ng4', name: 'Pounded Yam', brand: '', calories: 290, protein_g: 3, carbs_g: 68, fats_g: 1, serving_size: '1 wrap (250g)' },
  { id: 'ng5', name: 'Suya', brand: '', calories: 210, protein_g: 28, carbs_g: 4, fats_g: 10, serving_size: '100g' },
  { id: 'ng6', name: 'Moi Moi', brand: '', calories: 150, protein_g: 10, carbs_g: 16, fats_g: 6, serving_size: '1 piece (150g)' },
  { id: 'ng7', name: 'Akara', brand: '', calories: 190, protein_g: 8, carbs_g: 22, fats_g: 8, serving_size: '3 pieces (100g)' },
  { id: 'ng8', name: 'Ofada Rice', brand: '', calories: 170, protein_g: 3, carbs_g: 35, fats_g: 2, serving_size: '1 cup (200g)' },
  { id: 'ng9', name: 'Plantain (Fried)', brand: '', calories: 220, protein_g: 2, carbs_g: 40, fats_g: 8, serving_size: '100g' },
  { id: 'ng10', name: 'Ofe Onugbu (Bitter Leaf Soup)', brand: '', calories: 280, protein_g: 14, carbs_g: 6, fats_g: 22, serving_size: '1 bowl (250g)' },
  { id: 'ng11', name: 'Eba / Garri', brand: '', calories: 330, protein_g: 2, carbs_g: 80, fats_g: 1, serving_size: '1 wrap (250g)' },
  { id: 'ng12', name: 'Pepper Soup', brand: '', calories: 140, protein_g: 18, carbs_g: 4, fats_g: 6, serving_size: '1 bowl (300g)' },
  { id: 'ng13', name: 'Beans (Cooked)', brand: '', calories: 130, protein_g: 8, carbs_g: 22, fats_g: 1, serving_size: '1 cup (180g)' },
  { id: 'ng14', name: 'Bread (Agege)', brand: '', calories: 260, protein_g: 8, carbs_g: 50, fats_g: 4, serving_size: '2 slices (80g)' },
  { id: 'ng15', name: 'Indomie Noodles', brand: '', calories: 370, protein_g: 8, carbs_g: 52, fats_g: 14, serving_size: '1 pack (70g)' },
  { id: 'ng16', name: 'Chicken (Grilled)', brand: '', calories: 165, protein_g: 31, carbs_g: 0, fats_g: 4, serving_size: '100g' },
  { id: 'ng17', name: 'Boiled Egg', brand: '', calories: 77, protein_g: 6, carbs_g: 1, fats_g: 5, serving_size: '1 large egg' },
  { id: 'ng18', name: 'Oatmeal', brand: '', calories: 150, protein_g: 5, carbs_g: 27, fats_g: 3, serving_size: '1 cup cooked' },
  { id: 'ng19', name: 'Banana', brand: '', calories: 89, protein_g: 1, carbs_g: 23, fats_g: 0, serving_size: '1 medium' },
  { id: 'ng20', name: 'Rice and Stew', brand: '', calories: 400, protein_g: 12, carbs_g: 60, fats_g: 12, serving_size: '1 plate' },
];