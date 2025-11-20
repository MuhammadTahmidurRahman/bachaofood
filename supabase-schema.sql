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
  budget_range TEXT,
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
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for food_logs
CREATE POLICY "Users can view own logs" ON food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON food_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for inventory
CREATE POLICY "Users can view own inventory" ON inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON inventory FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for uploads
CREATE POLICY "Users can view own uploads" ON uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own uploads" ON uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read for food_items and resources
CREATE POLICY "Anyone can read food items" ON food_items FOR SELECT USING (true);
CREATE POLICY "Anyone can read resources" ON resources FOR SELECT USING (true);

-- Seed Food Items
INSERT INTO food_items (name, category, expiration_days, cost_per_unit, unit) VALUES
('Banana', 'Fruit', 5, 0.50, 'piece'),
('Apple', 'Fruit', 14, 0.75, 'piece'),
('Orange', 'Fruit', 10, 0.60, 'piece'),
('Milk', 'Dairy', 7, 3.50, 'liter'),
('Cheese', 'Dairy', 30, 5.00, 'block'),
('Yogurt', 'Dairy', 14, 2.50, 'container'),
('Chicken Breast', 'Protein', 2, 8.00, 'kg'),
('Ground Beef', 'Protein', 2, 10.00, 'kg'),
('Eggs', 'Protein', 21, 4.00, 'dozen'),
('Rice', 'Grain', 365, 2.00, 'kg'),
('Bread', 'Grain', 5, 2.50, 'loaf'),
('Pasta', 'Grain', 730, 1.50, 'pack'),
('Tomato', 'Vegetable', 7, 0.40, 'piece'),
('Potato', 'Vegetable', 30, 0.30, 'piece'),
('Carrot', 'Vegetable', 14, 0.35, 'piece'),
('Lettuce', 'Vegetable', 7, 1.50, 'head'),
('Onion', 'Vegetable', 30, 0.25, 'piece'),
('Spinach', 'Vegetable', 5, 2.00, 'bunch'),
('Olive Oil', 'Pantry', 365, 8.00, 'bottle'),
('Butter', 'Dairy', 60, 4.00, 'block');

-- Seed Resources
INSERT INTO resources (title, description, url, category, type) VALUES
('Meal Planning on a Budget', 'Complete guide to planning nutritious meals while saving money', 'https://www.nutrition.gov/topics/nutrition-age/children/meal-planning', 'Budget Tips', 'Article'),
('How to Store Fresh Produce', 'Best practices for extending the life of fruits and vegetables', 'https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-produce-safely', 'Storage Tips', 'Article'),
('Reducing Food Waste at Home', 'Practical strategies to minimize household food waste', 'https://www.epa.gov/recycle/reducing-wasted-food-home', 'Waste Reduction', 'Article'),
('Understanding Expiration Dates', 'Learn what food date labels really mean', 'https://www.fda.gov/consumers/consumer-updates/confused-date-labels-packaged-foods', 'Storage Tips', 'Article'),
('Freezing Food Guide', 'Comprehensive guide to freezing different types of food', 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety', 'Storage Tips', 'Article'),
('Budget-Friendly Vegetarian Meals', 'Delicious and affordable plant-based recipes', 'https://www.nutrition.gov/topics/whats-food/vegetarian-diet', 'Budget Tips', 'Article'),
('Dairy Storage Best Practices', 'Keep dairy products fresh longer', 'https://www.fda.gov/food/buy-store-serve-safe-food/refrigerator-thermometers', 'Storage Tips', 'Article'),
('Batch Cooking for Busy Families', 'Save time and money with meal prep strategies', 'https://www.myplate.gov/eat-healthy/healthy-eating-budget', 'Meal Planning', 'Article'),
('Composting Basics', 'Turn food scraps into nutrient-rich soil', 'https://www.epa.gov/recycle/composting-home', 'Waste Reduction', 'Article'),
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
('Food Preservation Methods', 'Traditional and modern food preservation techniques', 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/canning-and-food-preservation', 'Storage Tips', 'Article');

-- Create storage bucket (run this in Supabase dashboard or via API)
-- Storage bucket for food images will be created through Supabase dashboard
-- Bucket name: food-images
-- Public: true
