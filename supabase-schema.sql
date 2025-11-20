-- ============================================================
-- SUPABASE DATABASE FULL CLEAN REBUILD
-- ============================================================

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

---------------------------------------------------------------
-- DROP ALL TABLES (SAFE CLEAN RESET)
---------------------------------------------------------------
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS food_items CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS food_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

---------------------------------------------------------------
-- PROFILES TABLE
---------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  household_size INTEGER DEFAULT 1,
  dietary_preference TEXT,
  budget_amount TEXT,
  budget_type TEXT DEFAULT 'monthly',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---------------------------------------------------------------
-- FOOD LOGS
---------------------------------------------------------------
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---------------------------------------------------------------
-- INVENTORY TABLE
-- Improved for deduction + restore logic
---------------------------------------------------------------
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  original_quantity NUMERIC,  -- useful for logging history
  category TEXT NOT NULL,
  unit TEXT DEFAULT 'piece',
  source TEXT DEFAULT 'manual',
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---------------------------------------------------------------
-- FOOD ITEMS TABLE (REFERENCE ONLY)
---------------------------------------------------------------
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  expiration_days INTEGER,
  cost_per_unit NUMERIC,       -- stored directly in BDT
  unit TEXT DEFAULT 'piece',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---------------------------------------------------------------
-- RESOURCES TABLE
---------------------------------------------------------------
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---------------------------------------------------------------
-- UPLOADS TABLE
---------------------------------------------------------------
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  associated_with TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---------------------------------------------------------------
-- ENABLE RLS
---------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

---------------------------------------------------------------
-- RLS POLICIES
---------------------------------------------------------------

-- Public read tables
CREATE POLICY "Public Read Food Items"
ON food_items
FOR SELECT
USING (true);

CREATE POLICY "Public Read Resources"
ON resources
FOR SELECT
USING (true);

-- Private user tables
CREATE POLICY "User Own Profile"
ON profiles
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "User Own Logs"
ON food_logs
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "User Own Inventory"
ON inventory
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "User Own Uploads"
ON uploads
FOR ALL
USING (auth.uid() = user_id);

---------------------------------------------------------------
-- TRIGGER: update updated_at timestamp
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
CREATE TRIGGER trg_profiles_update
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER trg_inventory_update
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER trg_food_logs_update
BEFORE UPDATE ON food_logs
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

---------------------------------------------------------------
-- SEED DATA: FOOD ITEMS (BDT VERSION)
---------------------------------------------------------------
INSERT INTO food_items (name, category, expiration_days, cost_per_unit, unit) VALUES
-- Fruit
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

-- Vegetables
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

-- Dairy
('Milk', 'Dairy', 7, 80, 'liter'),
('Cheese', 'Dairy', 30, 500, 'kg'),
('Yogurt', 'Dairy', 14, 100, 'kg'),
('Butter', 'Dairy', 60, 400, 'kg'),

-- Protein
('Chicken', 'Protein', 2, 250, 'kg'),
('Beef', 'Protein', 3, 600, 'kg'),
('Fish', 'Protein', 2, 300, 'kg'),
('Eggs', 'Protein', 30, 10, 'piece'),
('Tofu', 'Protein', 7, 150, 'kg'),
('Lentils', 'Protein', 365, 100, 'kg'),

-- Grain
('Rice', 'Grain', 365, 60, 'kg'),
('Wheat Flour', 'Grain', 180, 50, 'kg'),
('Bread', 'Grain', 5, 40, 'piece'),
('Pasta', 'Grain', 365, 100, 'kg'),
('Oats', 'Grain', 365, 150, 'kg'),

-- Pantry
('Sugar', 'Pantry', 730, 80, 'kg'),
('Salt', 'Pantry', 730, 20, 'kg'),
('Oil', 'Pantry', 365, 150, 'liter'),

-- Beverages
('Tea', 'Beverages', 365, 300, 'kg'),
('Coffee', 'Beverages', 365, 500, 'kg'),
('Soda', 'Beverages', 180, 50, 'liter'),
('Juice', 'Beverages', 7, 100, 'liter'),
('Water Bottle', 'Beverages', 365, 20, 'liter'),

-- Snacks
('Chips', 'Snacks', 90, 50, 'packet'),
('Biscuits', 'Snacks', 180, 30, 'packet'),
('Nuts', 'Snacks', 180, 400, 'kg'),
('Chocolate', 'Snacks', 365, 200, 'kg'),

-- Frozen
('Ice Cream', 'Frozen', 180, 150, 'liter'),
('Frozen Vegetables', 'Frozen', 365, 100, 'kg'),

-- Condiments
('Ketchup', 'Condiments', 365, 100, 'bottle'),
('Mustard', 'Condiments', 365, 80, 'bottle'),
('Soy Sauce', 'Condiments', 365, 120, 'bottle');

INSERT INTO resources (title, description, url, category, type) VALUES
('Quick Breakfast Ideas', 'Fast and healthy breakfast options for busy mornings', 'https://www.nutrition.gov/topics/nutrition-age/children/breakfast', 'Meal Planning', 'Article'),
('Vegetable Prep Guide', 'How to wash, cut and store vegetables properly', 'https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-fresh-and-frozen-seafood-safely', 'Storage Tips', 'Article'),
('Budget Meal Prep Sunday', 'Complete guide to meal prep for the week', 'https://www.myplate.gov/eat-healthy/healthy-eating-budget/meal-planning', 'Budget Tips', 'Article'),
('Food Safety Temperature Guide', 'Safe cooking temperatures for different foods', 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart', 'Food Safety', 'Article'),
('Spice Storage Best Practices', 'Keep spices fresh and flavorful longer', 'https://www.fda.gov/food/buy-store-serve-safe-food/are-you-storing-food-safely', 'Storage Tips', 'Article'),
('Plant-Based Protein Sources', 'Complete guide to vegetarian protein options', 'https://www.nutrition.gov/topics/basic-nutrition/protein', 'Nutrition', 'Article'),
('Reducing Plastic in Kitchen', 'Eco-friendly alternatives for food storage', 'https://www.epa.gov/recycle/reducing-waste-what-you-can-do', 'Sustainability', 'Article'),
('Fermented Foods Guide', 'Health benefits and how to make them', 'https://www.nutrition.gov/topics/basic-nutrition/food-groups', 'Nutrition', 'Article'),
('Kids Lunch Box Ideas', 'Healthy and appealing lunches for children', 'https://www.nutrition.gov/topics/nutrition-age/children', 'Meal Planning', 'Article'),
('Herb Garden Basics', 'Growing fresh herbs at home', 'https://www.nutrition.gov/topics/shopping-cooking-and-meal-planning', 'Sustainability', 'Article'),
('Microwave Safety Tips', 'Proper use of microwave for reheating food', 'https://www.fda.gov/radiation-emitting-products/home-business-and-entertainment-products/microwave-oven-radiation', 'Food Safety', 'Article'),
('Seasonal Recipe Collection', 'Make the most of seasonal produce', 'https://www.nutrition.gov/topics/diet-and-health-conditions/seasonal-produce-guide', 'Meal Planning', 'Article'),
('Food Allergy Management', 'Safe practices for households with allergies', 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies', 'Food Safety', 'Article'),
('Bulk Buying Guide', 'Save money by buying in bulk smartly', 'https://www.myplate.gov/eat-healthy/healthy-eating-budget/tips-shopping', 'Budget Tips', 'Article'),
('DIY Food Preservation', 'Canning, pickling and preserving at home', 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/canning-and-food-preservation', 'Storage Tips', 'Article');
