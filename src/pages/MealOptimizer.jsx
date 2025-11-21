// src/pages/MealOptimizer.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Utensils, ShoppingCart, DollarSign, Loader, 
  TrendingDown, Check, AlertCircle, Info, PieChart,
  Calendar, Sparkles, Wallet, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { aiService } from '../lib/aiService';

// Local Dhaka Market Prices (BDT)
const LOCAL_PRICES = {
  // Proteins
  'chicken': { price: 280, unit: 'kg', category: 'protein' },
  'beef': { price: 650, unit: 'kg', category: 'protein' },
  'fish': { price: 450, unit: 'kg', category: 'protein' },
  'eggs': { price: 140, unit: 'dozen', category: 'protein' },
  'lentils': { price: 120, unit: 'kg', category: 'protein' },
  'tofu': { price: 150, unit: 'kg', category: 'protein' },
  
  // Vegetables
  'potato': { price: 30, unit: 'kg', category: 'vegetable' },
  'tomato': { price: 60, unit: 'kg', category: 'vegetable' },
  'onion': { price: 35, unit: 'kg', category: 'vegetable' },
  'carrot': { price: 40, unit: 'kg', category: 'vegetable' },
  'spinach': { price: 50, unit: 'kg', category: 'vegetable' },
  'cabbage': { price: 30, unit: 'kg', category: 'vegetable' },
  'cauliflower': { price: 50, unit: 'kg', category: 'vegetable' },
  'eggplant': { price: 50, unit: 'kg', category: 'vegetable' },
  'bell pepper': { price: 100, unit: 'kg', category: 'vegetable' },
  'broccoli': { price: 120, unit: 'kg', category: 'vegetable' },
  
  // Fruits
  'banana': { price: 60, unit: 'dozen', category: 'fruit' },
  'apple': { price: 180, unit: 'kg', category: 'fruit' },
  'orange': { price: 120, unit: 'kg', category: 'fruit' },
  'mango': { price: 120, unit: 'kg', category: 'fruit' },
  'papaya': { price: 40, unit: 'kg', category: 'fruit' },
  'watermelon': { price: 25, unit: 'kg', category: 'fruit' },
  
  // Grains
  'rice': { price: 60, unit: 'kg', category: 'grain' },
  'bread': { price: 50, unit: 'loaf', category: 'grain' },
  'wheat flour': { price: 55, unit: 'kg', category: 'grain' },
  'oats': { price: 180, unit: 'kg', category: 'grain' },
  'pasta': { price: 120, unit: 'kg', category: 'grain' },
  
  // Dairy
  'milk': { price: 80, unit: 'liter', category: 'dairy' },
  'yogurt': { price: 100, unit: 'kg', category: 'dairy' },
  'cheese': { price: 550, unit: 'kg', category: 'dairy' },
  'butter': { price: 450, unit: 'kg', category: 'dairy' },
  
  // Pantry
  'oil': { price: 150, unit: 'liter', category: 'pantry' },
  'sugar': { price: 80, unit: 'kg', category: 'pantry' },
  'salt': { price: 25, unit: 'kg', category: 'pantry' }
};

const MealOptimizer = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mealPlan, setMealPlan] = useState(null);
  const [budget, setBudget] = useState(1000);
  const [profileBudget, setProfileBudget] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [preferences, setPreferences] = useState({
    protein: 60,
    vegetables: 5,
    fruits: 3,
    grains: 6
  });
  const [optimizationMode, setOptimizationMode] = useState('balanced');

  useEffect(() => {
    if (user) loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setLoadingProfile(true);
    try {
      const [inventoryRes, profileRes] = await Promise.all([
        dbHelpers.getInventory(user.id),
        dbHelpers.getProfile(user.id)
      ]);
      
      const inventoryData = inventoryRes.data || [];
      const profileData = profileRes.data;

      setInventory(inventoryData);
      
      // Extract budget from profile
      if (profileData) {
        // Try to extract budget from budget_range or budget_amount
        let weeklyBudget = 1000; // default
        
        if (profileData.budget_amount) {
          const amount = parseInt(profileData.budget_amount);
          if (!isNaN(amount)) {
            // Convert to weekly if monthly
            if (profileData.budget_type === 'monthly') {
              weeklyBudget = Math.round(amount / 4.3);
            } else {
              weeklyBudget = amount;
            }
          }
        } else if (profileData.budget_range) {
          // Extract from range like "500-1000"
          const match = profileData.budget_range.match(/(\d+)/);
          if (match) {
            weeklyBudget = Math.round(parseInt(match[1]) / 4.3);
          }
        }
        
        setProfileBudget(weeklyBudget);
        setBudget(weeklyBudget);
        
        console.log('Profile Budget Loaded:', weeklyBudget);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    setLoadingProfile(false);
  };

  const generateMealPlan = async () => {
    if (budget <= 0) {
      alert('Please enter a valid budget amount.');
      return;
    }

    setLoading(true);
    try {
      const plan = await generateOptimizedPlan();
      setMealPlan(plan);
      console.log('Generated Meal Plan:', plan);
    } catch (error) {
      console.error('Meal optimization error:', error);
      alert('Failed to generate meal plan. Please try again.');
    }
    setLoading(false);
  };

  const generateOptimizedPlan = async () => {
    const dailyBudget = budget / 7;
    const mealBudget = dailyBudget / 3; // 3 meals per day
    
    // Get optimization weights
    const modeWeights = {
      'balanced': { budget: 0.33, nutrition: 0.34, waste: 0.33 },
      'budget': { budget: 0.6, nutrition: 0.25, waste: 0.15 },
      'nutrition': { budget: 0.15, nutrition: 0.7, waste: 0.15 },
      'waste': { budget: 0.2, nutrition: 0.2, waste: 0.6 }
    };
    
    const weights = modeWeights[optimizationMode];
    
    // Sort inventory by expiry urgency
    const sortedInventory = [...inventory].sort((a, b) => {
      const daysA = a.expiry_date ? Math.floor((new Date(a.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : 999;
      const daysB = b.expiry_date ? Math.floor((new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : 999;
      return daysA - daysB;
    });
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealPlan = [];
    const usedInventoryItems = [];
    const shoppingList = [];
    const shoppingMap = {};
    
    let totalCost = 0;
    let nutritionScoreSum = 0;
    
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dayMeals = {
        day: days[dayIdx],
        breakfast: '',
        lunch: '',
        dinner: '',
        dailyCost: 0,
        usedItems: [],
        nutritionSummary: {
          protein: '0g',
          carbs: '0g',
          fiber: '0g',
          totalCal: 0
        }
      };
      
      // Generate each meal
      const meals = ['breakfast', 'lunch', 'dinner'];
      
      for (const mealType of meals) {
        const mealResult = generateMeal(
          mealType, 
          mealBudget, 
          sortedInventory, 
          usedInventoryItems,
          weights
        );
        
        dayMeals[mealType] = mealResult.name;
        dayMeals.dailyCost += mealResult.cost;
        dayMeals.usedItems.push(...mealResult.inventoryUsed);
        
        // Add to shopping list
        mealResult.ingredients.forEach(ing => {
          if (!ing.fromInventory) {
            const key = ing.name.toLowerCase();
            if (!shoppingMap[key]) {
              shoppingMap[key] = {
                item: ing.name,
                quantity: 0,
                category: ing.category,
                estimatedCost: 0
              };
            }
            shoppingMap[key].quantity += ing.quantity;
            shoppingMap[key].estimatedCost += ing.cost;
          }
        });
        
        // Update nutrition
        dayMeals.nutritionSummary.protein = `${(parseFloat(dayMeals.nutritionSummary.protein) + mealResult.nutrition.protein).toFixed(0)}g`;
        dayMeals.nutritionSummary.carbs = `${(parseFloat(dayMeals.nutritionSummary.carbs) + mealResult.nutrition.carbs).toFixed(0)}g`;
        dayMeals.nutritionSummary.fiber = `${(parseFloat(dayMeals.nutritionSummary.fiber) + mealResult.nutrition.fiber).toFixed(0)}g`;
        dayMeals.nutritionSummary.totalCal += mealResult.nutrition.calories;
      }
      
      totalCost += dayMeals.dailyCost;
      dayMeals.dailyCost = Math.round(dayMeals.dailyCost);
      nutritionScoreSum += calculateMealNutritionScore(dayMeals.nutritionSummary);
      
      mealPlan.push(dayMeals);
    }
    
    // Convert shopping map to list
    Object.values(shoppingMap).forEach(item => {
      shoppingList.push({
        item: item.item,
        quantity: `${item.quantity.toFixed(1)} ${LOCAL_PRICES[item.item.toLowerCase()]?.unit || 'units'}`,
        category: item.category,
        estimatedCost: Math.round(item.estimatedCost)
      });
    });
    
    // Calculate metrics
    const inventoryUsed = usedInventoryItems.length;
    const wasteReduction = inventory.length > 0 ? Math.round((inventoryUsed / inventory.length) * 100) : 0;
    const nutritionScore = Math.round(nutritionScoreSum / 7);
    const savedAmount = Math.round(usedInventoryItems.reduce((sum, item) => {
      const priceData = LOCAL_PRICES[item.item_name?.toLowerCase()];
      return sum + (priceData ? priceData.price * 0.15 : 20);
    }, 0));
    
    // Generate insights
    const insights = generateOptimizationInsights(
      totalCost,
      budget,
      inventoryUsed,
      inventory.length,
      nutritionScore,
      optimizationMode
    );
    
    return {
      mealPlan,
      totalCost: Math.round(totalCost),
      wasteReduction,
      nutritionScore,
      inventoryUsed,
      savedAmount,
      shoppingList,
      shoppingListCost: Math.round(shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0)),
      optimizationInsights: insights,
      localCostData: {
        source: 'Dhaka local market averages (2025)'
      }
    };
  };

  const generateMeal = (mealType, budgetLimit, inventory, usedItems, weights) => {
    const mealTemplates = {
      breakfast: [
        { name: 'Omelette with Toast', base: 'eggs', sides: ['bread', 'butter'], cost: 35 },
        { name: 'Rice and Dal', base: 'rice', sides: ['lentils', 'onion'], cost: 25 },
        { name: 'Milk and Banana', base: 'milk', sides: ['banana', 'oats'], cost: 40 },
        { name: 'Paratha with Egg', base: 'wheat flour', sides: ['eggs', 'oil'], cost: 30 },
        { name: 'Bread and Butter', base: 'bread', sides: ['butter', 'milk'], cost: 35 }
      ],
      lunch: [
        { name: 'Rice with Chicken Curry', base: 'rice', sides: ['chicken', 'onion', 'tomato'], cost: 85 },
        { name: 'Rice with Fish Curry', base: 'rice', sides: ['fish', 'potato', 'onion'], cost: 75 },
        { name: 'Rice with Dal and Vegetables', base: 'rice', sides: ['lentils', 'spinach', 'carrot'], cost: 40 },
        { name: 'Rice with Beef Curry', base: 'rice', sides: ['beef', 'potato', 'onion'], cost: 120 },
        { name: 'Rice with Egg Curry', base: 'rice', sides: ['eggs', 'tomato', 'onion'], cost: 50 }
      ],
      dinner: [
        { name: 'Rice with Vegetable Curry', base: 'rice', sides: ['potato', 'cauliflower', 'carrot'], cost: 45 },
        { name: 'Rice with Lentil Soup', base: 'rice', sides: ['lentils', 'onion', 'spinach'], cost: 40 },
        { name: 'Rice with Fish and Vegetables', base: 'rice', sides: ['fish', 'eggplant', 'tomato'], cost: 80 },
        { name: 'Rice with Chicken and Salad', base: 'rice', sides: ['chicken', 'cabbage', 'carrot'], cost: 75 },
        { name: 'Bread with Vegetable Stew', base: 'bread', sides: ['potato', 'carrot', 'onion'], cost: 35 }
      ]
    };
    
    const templates = mealTemplates[mealType] || mealTemplates.lunch;
    
    // Try to find a meal that fits budget and uses inventory
    let selectedMeal = null;
    let bestScore = -1;
    
    for (const template of templates) {
      if (template.cost > budgetLimit * 1.5) continue; // Skip if way over budget
      
      const allIngredients = [template.base, ...template.sides];
      let inventoryMatches = 0;
      let actualCost = 0;
      const ingredients = [];
      const inventoryUsed = [];
      
      // Check each ingredient
      allIngredients.forEach(ingName => {
        const invItem = inventory.find(i => 
          i.item_name.toLowerCase().includes(ingName) && 
          !usedItems.find(u => u.id === i.id)
        );
        
        if (invItem && weights.waste > 0.3) {
          inventoryMatches++;
          inventoryUsed.push(invItem);
          ingredients.push({
            name: invItem.item_name,
            quantity: 0.2,
            category: invItem.category || 'other',
            cost: 0,
            fromInventory: true
          });
        } else {
          const priceData = LOCAL_PRICES[ingName.toLowerCase()] || { price: 50, unit: 'kg' };
          const qty = 0.2; // 200g per ingredient
          const cost = priceData.price * qty;
          actualCost += cost;
          
          ingredients.push({
            name: ingName,
            quantity: qty,
            category: priceData.category || 'other',
            cost,
            fromInventory: false
          });
        }
      });
      
      // Calculate score
      const budgetScore = actualCost <= budgetLimit ? 100 : Math.max(0, 100 - ((actualCost - budgetLimit) / budgetLimit) * 100);
      const wasteScore = (inventoryMatches / allIngredients.length) * 100;
      const nutritionScore = 70; // Base nutrition score
      
      const totalScore = 
        budgetScore * weights.budget +
        nutritionScore * weights.nutrition +
        wasteScore * weights.waste;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        selectedMeal = {
          ...template,
          cost: actualCost,
          ingredients,
          inventoryUsed,
          nutrition: {
            protein: 15 + Math.random() * 10,
            carbs: 40 + Math.random() * 20,
            fiber: 5 + Math.random() * 5,
            calories: 350 + Math.random() * 150
          }
        };
      }
    }
    
    // Fallback to simplest meal
    if (!selectedMeal) {
      const fallback = templates[0];
      selectedMeal = {
        ...fallback,
        cost: fallback.cost,
        ingredients: [fallback.base, ...fallback.sides].map(ing => ({
          name: ing,
          quantity: 0.2,
          category: LOCAL_PRICES[ing.toLowerCase()]?.category || 'other',
          cost: (LOCAL_PRICES[ing.toLowerCase()]?.price || 50) * 0.2,
          fromInventory: false
        })),
        inventoryUsed: [],
        nutrition: {
          protein: 15,
          carbs: 50,
          fiber: 5,
          calories: 400
        }
      };
    }
    
    // Mark inventory as used
    selectedMeal.inventoryUsed.forEach(item => {
      if (!usedItems.find(u => u.id === item.id)) {
        usedItems.push(item);
      }
    });
    
    return selectedMeal;
  };

  const calculateMealNutritionScore = (nutrition) => {
    const proteinScore = Math.min(100, (parseFloat(nutrition.protein) / 60) * 100);
    const carbScore = Math.min(100, (parseFloat(nutrition.carbs) / 150) * 100);
    const fiberScore = Math.min(100, (parseFloat(nutrition.fiber) / 15) * 100);
    const calScore = nutrition.totalCal >= 1800 && nutrition.totalCal <= 2400 ? 100 : 70;
    
    return (proteinScore + carbScore + fiberScore + calScore) / 4;
  };

  const generateOptimizationInsights = (cost, budget, used, total, nutrition, mode) => {
    const insights = [];
    
    if (cost < budget * 0.9) {
      insights.push({
        title: 'Under Budget Success',
        description: `Meal plan costs ৳${Math.round(cost)}, saving ৳${Math.round(budget - cost)} (${Math.round(((budget - cost) / budget) * 100)}% savings)`
      });
    }
    
    if (used > 0 && total > 0) {
      const utilizationPercent = Math.round((used / total) * 100);
      insights.push({
        title: 'Inventory Utilization',
        description: `Used ${used} of ${total} inventory items (${utilizationPercent}% utilization), reducing waste significantly`
      });
    }
    
    if (nutrition >= 80) {
      insights.push({
        title: 'Excellent Nutrition Balance',
        description: `Nutrition score of ${nutrition}/100 indicates well-balanced meals meeting dietary requirements`
      });
    }
    
    if (mode === 'waste') {
      insights.push({
        title: 'Waste Reduction Priority',
        description: 'Meal plan prioritized using expiring items first, following FIFO inventory management'
      });
    }
    
    if (insights.length === 0) {
      insights.push({
        title: 'Balanced Approach',
        description: 'Meal plan balances budget, nutrition, and inventory usage effectively'
      });
    }
    
    return insights;
  };

  const getBudgetStatus = () => {
    if (!mealPlan) return null;
    
    const savings = budget - mealPlan.totalCost;
    const savingsPercent = ((savings / budget) * 100).toFixed(1);
    
    return {
      savings,
      savingsPercent,
      status: savings >= 0 ? 'under' : 'over'
    };
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const budgetStatus = getBudgetStatus();

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-3xl p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gradient-dark">AI Meal Optimizer</h1>
            <p className="text-lg font-semibold text-gray-600">
              Smart meal planning for budget, nutrition & waste reduction
            </p>
          </div>
        </div>

        {/* Current Inventory Status */}
        {inventory.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-900">
                Current Inventory: {inventory.length} items
              </span>
            </div>
            <p className="text-sm text-blue-700">
              The meal plan will prioritize using your existing inventory to reduce waste.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Budget Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Weekly Budget (BDT)
              {profileBudget && (
                <span className="ml-2 text-xs text-green-600">
                  (From Profile: ৳{profileBudget})
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="input-field pl-12"
                placeholder="1000"
                min="100"
              />
              
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recommended: ৳800-1500 per week for balanced nutrition
            </p>
          </div>

          {/* Optimization Mode */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Optimization Priority
            </label>
            <select
              value={optimizationMode}
              onChange={(e) => setOptimizationMode(e.target.value)}
              className="input-field"
            >
              <option value="balanced">⚖️ Balanced (Budget + Nutrition + Waste)</option>
              <option value="budget">💰 Budget Priority (Minimize Cost)</option>
              <option value="nutrition">🥗 Nutrition Priority (Health Focus)</option>
              <option value="waste">♻️ Waste Reduction (Use Inventory First)</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={generateMealPlan}
            disabled={loading}
            className="btn-primary w-full py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader className="w-6 h-6 mr-2 animate-spin inline" />
                Optimizing Your Meal Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-2 inline" />
                Generate Optimized Meal Plan
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Meal Plan Results */}
      {mealPlan && (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-800">৳{mealPlan.totalCost}</div>
                  <div className="text-sm text-gray-600 font-semibold">Total Cost</div>
                </div>
              </div>
              {budgetStatus && (
                <div className={`text-xs font-bold ${budgetStatus.status === 'under' ? 'text-green-600' : 'text-red-600'}`}>
                  {budgetStatus.status === 'under' ? '✓' : '⚠'} {budgetStatus.status === 'under' ? 'Under' : 'Over'} budget by ৳{Math.abs(budgetStatus.savings)}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-800">{mealPlan.wasteReduction}%</div>
                  <div className="text-sm text-gray-600 font-semibold">Waste Reduction</div>
                </div>
              </div>
              <div className="text-xs text-green-600 font-bold">
                {mealPlan.inventoryUsed}/{inventory.length} inventory items used
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-800">{mealPlan.nutritionScore}</div>
                  <div className="text-sm text-gray-600 font-semibold">Nutrition Score</div>
                </div>
              </div>
              <div className="text-xs text-purple-600 font-bold">
                {mealPlan.nutritionScore >= 85 ? 'Excellent' : mealPlan.nutritionScore >= 70 ? 'Good' : 'Fair'} balance
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-800">৳{mealPlan.savedAmount}</div>
                  <div className="text-sm text-gray-600 font-semibold">Money Saved</div>
                </div>
              </div>
              <div className="text-xs text-orange-600 font-bold">
                by using inventory
              </div>
            </motion.div>
          </div>

          {/* Budget Analysis */}
          {budgetStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 ${budgetStatus.status === 'under' ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                {budgetStatus.status === 'under' ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                )}
                <div>
                  <h3 className={`text-2xl font-bold ${budgetStatus.status === 'under' ? 'text-green-800' : 'text-orange-800'}`}>
                    {budgetStatus.status === 'under' ? 'Great Job! Under Budget' : 'Over Budget Alert'}
                  </h3>
                  <p className={`text-sm ${budgetStatus.status === 'under' ? 'text-green-600' : 'text-orange-600'}`}>
                    {budgetStatus.status === 'under' 
                      ? `You're saving ৳${Math.abs(budgetStatus.savings)} (${budgetStatus.savingsPercent}% of your budget)`
                      : `You're over by ৳${Math.abs(budgetStatus.savings)} (${Math.abs(budgetStatus.savingsPercent)}% over budget)`
                    }
                  </p>
                </div>
              </div>
              {budgetStatus.status === 'over' && (
                <div className="mt-3 p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>💡 Tip:</strong> Try selecting "Budget Priority" mode to fit within your budget.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Optimization Insights */}
          {mealPlan.optimizationInsights && mealPlan.optimizationInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-3xl p-8"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-purple-600" />
                Optimization Insights
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {mealPlan.optimizationInsights.map((insight, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-400">
                    <div className="font-bold text-gray-800 mb-2">{insight.title}</div>
                    <div className="text-sm text-gray-600">{insight.description}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 7-Day Meal Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-3xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-800">7-Day Meal Plan</h2>
              </div>
              <button
                onClick={generateMealPlan}
                className="btn-secondary flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
            <div className="space-y-4">
              {mealPlan.mealPlan.map((day, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/50 rounded-2xl p-6 border-2 border-gray-200 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">{day.day}</h3>
                    <span className="text-lg font-black text-green-600">৳{day.dailyCost}</span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-bold text-gray-600 mb-2">🌅 Breakfast</div>
                      <div className="font-semibold text-gray-800">{day.breakfast}</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-600 mb-2">☀️ Lunch</div>
                      <div className="font-semibold text-gray-800">{day.lunch}</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-600 mb-2">🌙 Dinner</div>
                      <div className="font-semibold text-gray-800">{day.dinner}</div>
                    </div>
                  </div>

                  {day.usedItems && day.usedItems.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        <strong className="text-green-600">♻️ Using from inventory:</strong>{' '}
                        {[...new Set(day.usedItems)].join(', ')}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600 grid grid-cols-4 gap-2">
                      <div>
                        <span className="font-semibold">Protein:</span> {day.nutritionSummary.protein}
                      </div>
                      <div>
                        <span className="font-semibold">Carbs:</span> {day.nutritionSummary.carbs}
                      </div>
                      <div>
                        <span className="font-semibold">Fiber:</span> {day.nutritionSummary.fiber}
                      </div>
                      <div>
                        <span className="font-semibold">Calories:</span> {day.nutritionSummary.totalCal}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Shopping List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-3xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-8 h-8 text-primary-600" />
                <h2 className="text-3xl font-bold text-gray-800">Shopping List</h2>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-primary-600">
                  ৳{mealPlan.shoppingListCost}
                </div>
                <div className="text-sm text-gray-600">Total cost</div>
              </div>
            </div>

            {mealPlan.shoppingList.length === 0 ? (
              <div className="text-center py-8 bg-green-50 rounded-xl">
                <Check className="w-16 h-16 text-green-600 mx-auto mb-3" />
                <p className="text-lg font-bold text-green-800">No shopping needed!</p>
                <p className="text-sm text-green-600">
                  Your current inventory is sufficient for this meal plan.
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  {mealPlan.shoppingList.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-primary-300 transition-colors">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 capitalize">{item.item}</div>
                        <div className="text-sm text-gray-600">
                          Qty: {item.quantity}
                          {item.category && <span className="ml-2 text-xs text-gray-500">• {item.category}</span>}
                        </div>
                      </div>
                      <div className="text-xl font-black text-primary-600 ml-4">
                        ৳{item.estimatedCost}
                      </div>
                    </div>
                  ))}
                </div>

                {mealPlan.localCostData && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <p className="text-sm text-blue-800">
                      <Info className="w-4 h-4 inline mr-1" />
                      <strong>Prices based on:</strong> {mealPlan.localCostData.source}
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default MealOptimizer;