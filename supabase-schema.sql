-- SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  household_size INTEGER DEFAULT 1,
  dietary_preference TEXT,
  budget_amount TEXT,
  budget_type TEXT DEFAULT 'monthly',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food logs table
CREATE TABLE food_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  category TEXT NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food items (reference/seeded data)
CREATE TABLE food_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  expiration_days INTEGER,
  cost_per_unit NUMERIC,
  unit TEXT DEFAULT 'piece',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table
CREATE TABLE resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uploads table
CREATE TABLE uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  associated_with TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON food_items FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON resources FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated users" ON profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Enable all for own data" ON food_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Enable all for own data" ON inventory
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Enable all for own data" ON uploads
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Seed food_items with more data
INSERT INTO food_items (name, category, expiration_days, cost_per_unit, unit) VALUES
('Apple', 'Fruit', 7, 20, 'piece'),
('Banana', 'Fruit', 5, 10, 'piece'),
('Orange', 'Fruit', 7, 15, 'piece'),
('Mango', 'Fruit', 4, 30, 'piece'),
('Pineapple', 'Fruit', 5, 50, 'piece'),
('Strawberry', 'Fruit', 3, 100, 'kg'),
('Grapes', 'Fruit', 5, 150, 'kg'),
('Watermelon', 'Fruit', 7, 20, 'kg'),
('Papaya', 'Fruit', 4, 40, 'kg'),
('Kiwi', 'Fruit', 7, 50, 'piece'),
('Carrot', 'Vegetable', 14, 30, 'kg'),
('Potato', 'Vegetable', 30, 20, 'kg'),
('Tomato', 'Vegetable', 7, 40, 'kg'),
('Onion', 'Vegetable', 30, 25, 'kg'),
('Broccoli', 'Vegetable', 5, 100, 'kg'),
('Spinach', 'Vegetable', 4, 50, 'kg'),
('Cabbage', 'Vegetable', 10, 30, 'kg'),
('Cauliflower', 'Vegetable', 7, 40, 'kg'),
('Eggplant', 'Vegetable', 5, 50, 'kg'),
('Bell Pepper', 'Vegetable', 7, 80, 'kg'),
('Milk', 'Dairy', 7, 80, 'liter'),
('Cheese', 'Dairy', 30, 500, 'kg'),
('Yogurt', 'Dairy', 14, 100, 'kg'),
('Butter', 'Dairy', 60, 400, 'kg'),
('Chicken', 'Protein', 2, 250, 'kg'),
('Beef', 'Protein', 3, 600, 'kg'),
('Fish', 'Protein', 2, 300, 'kg'),
('Eggs', 'Protein', 30, 10, 'piece'),
('Tofu', 'Protein', 7, 150, 'kg'),
('Lentils', 'Protein', 365, 100, 'kg'),
('Rice', 'Grain', 365, 60, 'kg'),
('Wheat Flour', 'Grain', 180, 50, 'kg'),
('Bread', 'Grain', 5, 40, 'piece'),
('Pasta', 'Grain', 365, 100, 'kg'),
('Oats', 'Grain', 365, 150, 'kg'),
('Sugar', 'Pantry', 730, 80, 'kg'),
('Salt', 'Pantry', 730, 20, 'kg'),
('Oil', 'Pantry', 365, 150, 'liter'),
('Tea', 'Beverages', 365, 300, 'kg'),
('Coffee', 'Beverages', 365, 500, 'kg'),
('Soda', 'Beverages', 180, 50, 'liter'),
('Juice', 'Beverages', 7, 100, 'liter'),
('Water Bottle', 'Beverages', 365, 20, 'liter'),
('Chips', 'Snacks', 90, 50, 'packet'),
('Biscuits', 'Snacks', 180, 30, 'packet'),
('Nuts', 'Snacks', 180, 400, 'kg'),
('Chocolate', 'Snacks', 365, 200, 'kg'),
('Ice Cream', 'Frozen', 180, 150, 'liter'),
('Frozen Vegetables', 'Frozen', 365, 100, 'kg'),
('Ketchup', 'Condiments', 365, 100, 'bottle'),
('Mustard', 'Condiments', 365, 80, 'bottle'),
('Soy Sauce', 'Condiments', 365, 120, 'bottle');

-- Seed resources with more data
INSERT INTO resources (title, description, url, category, type) VALUES
('Budget Meal Planning', 'Plan nutritious meals on a tight budget', 'https://www.eatright.org/food/planning/budget-shopping', 'Budget Tips', 'Article'),
('Food Storage Guide', 'Best practices for storing different foods', 'https://www.fda.gov/food/buy-store-serve-safe-food/food-storage-chart', 'Storage Tips', 'Article'),
('Reduce Food Waste', 'Tips to minimize household food waste', 'https://www.epa.gov/recycle/reducing-wasted-food-home', 'Waste Reduction', 'Article'),
('Healthy Meal Prep', 'Prepare healthy meals in advance', 'https://www.nutrition.gov/topics/healthy-living-and-weight/strategies-success', 'Meal Planning', 'Article'),
('Balanced Nutrition Basics', 'Understanding essential nutrients', 'https://www.who.int/health-topics/nutrition', 'Nutrition', 'Article'),
('Home Composting', 'Turn food scraps into rich soil', 'https://www.epa.gov/recycle/composting-home', 'Waste Reduction', 'Article'),
('Seasonal Eating Guide', 'Benefits of eating seasonal produce', 'https://www.nutrition.gov/topics/diet-and-health-conditions/seasonal-produce-guide', 'Nutrition', 'Article'),
('Food Safety Fundamentals', 'Essential food safety practices for home cooking', 'https://www.fda.gov/food/buy-store-serve-safe-food/safe-food-handling', 'Food Safety', 'Article'),
('Smart Grocery Shopping Tips', 'Make the most of your grocery budget', 'https://www.myplate.gov/eat-healthy/healthy-eating-budget/tips-shopping', 'Budget Tips', 'Article'),
('Protein on a Budget', 'Affordable protein sources for every diet', 'https://www.nutrition.gov/topics/basic-nutrition/protein', 'Budget Tips', 'Article'),
('Zero Waste Kitchen', 'Steps to create a waste-free kitchen', 'https://www.epa.gov/recycle/preventing-wasted-food-home', 'Waste Reduction', 'Article'),
('Portion Control Guide', 'Understanding proper serving sizes', 'https://www.myplate.gov/eat-healthy/what-is-myplate', 'Nutrition', 'Article'),
('Leftover Transformation Recipes', 'Creative ways to use leftovers', 'https://www.nutrition.gov/topics/shopping-cooking-and-meal-planning', 'Meal Planning', 'Article'),
('Pantry Organization Tips', 'Organize your pantry for efficiency', 'https://www.fda.gov/food/buy-store-serve-safe-food/are-you-storing-food-safely', 'Storage Tips', 'Article'),
('Nutrition Label Reading', 'Decode nutrition facts and make informed choices', 'https://www.fda.gov/food/new-nutrition-facts-label/how-understand-and-use-nutrition-facts-label', 'Nutrition', 'Article'),
('Sustainable Shopping Habits', 'Choose eco-friendly food options', 'https://www.epa.gov/sustainable-management-food', 'Sustainability', 'Article'),
('Food Preservation Methods', 'Traditional and modern food preservation techniques', 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/canning-and-food-preservation', 'Storage Tips', 'Article'),
('Vegan Meal Ideas', 'Delicious plant-based recipes on a budget', 'https://www.pcrm.org/good-nutrition/plant-based-diets/recipes', 'Meal Planning', 'Article'),
('Quick Healthy Snacks', 'Nutritious snacks for busy days', 'https://www.heart.org/en/healthy-living/healthy-eating/add-color/healthy-snacking', 'Nutrition', 'Article'),
('Water Conservation in Kitchen', 'Save water while cooking and cleaning', 'https://www.epa.gov/watersense/kitchen', 'Sustainability', 'Article'),
('Allergen-Free Cooking', 'Tips for cooking without common allergens', 'https://www.foodallergy.org/living-food-allergies/food-allergy-essentials/managing-food-allergies', 'Food Safety', 'Article'),
('Batch Cooking Guide', 'Efficient cooking for the week', 'https://www.bbcgoodfood.com/howto/guide/batch-cooking', 'Meal Planning', 'Article'),
('Herb Gardening at Home', 'Grow your own herbs to reduce waste', 'https://www.gardeners.com/how-to/herb-garden/5068.html', 'Sustainability', 'Article'),
('Fermentation Basics', 'Preserve foods through fermentation', 'https://www.culturesforhealth.com/learn/category/fermentation-basics/', 'Storage Tips', 'Article'),
('Mindful Eating Practices', 'Develop better eating habits', 'https://www.health.harvard.edu/staying-healthy/8-steps-to-mindful-eating', 'Nutrition', 'Article'),
('Grocery List Templates', 'Organized shopping lists to avoid waste', 'https://www.realsimple.com/food-recipes/shopping-storing/grocery-list-template', 'Budget Tips', 'Article');

-- Create storage bucket (run this in Supabase dashboard or via API)
-- Storage bucket for food images will be created through Supabase dashboard
-- Bucket name: food-images
-- Public: true