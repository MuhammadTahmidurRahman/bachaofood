// src/pages/MealOptimizer.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Utensils, ShoppingCart, DollarSign, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { aiService } from '../lib/aiService';

const MealOptimizer = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [budget, setBudget] = useState(1000);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    if (user) loadInventory();
  }, [user]);

  const loadInventory = async () => {
    const { data } = await dbHelpers.getInventory(user.id);
    setInventory(data || []);
  };

  const generateMealPlan = async () => {
    setLoading(true);
    try {
      const nutritionReq = {
        protein: '60g',
        vegetables: '5 servings',
        fruits: '3 servings',
        grains: '6 servings'
      };

      const plan = await aiService.optimizeMealPlan(inventory, budget, nutritionReq);
      setMealPlan(plan);
    } catch (error) {
      console.error('Meal optimization error:', error);
      alert('Failed to generate meal plan. Please try again.');
    }
    setLoading(false);
  };

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
            <p className="text-lg font-semibold text-gray-600">Optimize meals for budget & waste reduction</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Weekly Budget (BDT)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="input-field"
              placeholder="1000"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generateMealPlan}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin inline" />
                  Generating...
                </>
              ) : (
                'Generate Meal Plan'
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Meal Plan */}
      {mealPlan && (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-800">৳{mealPlan.totalCost}</div>
                  <div className="text-sm text-gray-600 font-semibold">Total Cost</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-800">{mealPlan.wasteReduction}%</div>
                  <div className="text-sm text-gray-600 font-semibold">Waste Reduction</div>
                </div>
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
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-800">{mealPlan.nutritionScore}</div>
                  <div className="text-sm text-gray-600 font-semibold">Nutrition Score</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 7-Day Meal Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-3xl p-8"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-6">7-Day Meal Plan</h2>
            <div className="space-y-4">
              {mealPlan.mealPlan.map((day, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/50 rounded-2xl p-6"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{day.day}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-bold text-gray-600 mb-2">Breakfast</div>
                      <div className="font-semibold text-gray-800">{day.breakfast}</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-600 mb-2">Lunch</div>
                      <div className="font-semibold text-gray-800">{day.lunch}</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-600 mb-2">Dinner</div>
                      <div className="font-semibold text-gray-800">{day.dinner}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <strong>Using:</strong> {day.usedItems.join(', ')}
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
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart className="w-8 h-8 text-primary-600" />
              <h2 className="text-3xl font-bold text-gray-800">Shopping List</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {mealPlan.shoppingList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl">
                  <div>
                    <div className="font-bold text-gray-800">{item.item}</div>
                    <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-xl font-black text-primary-600">৳{item.estimatedCost}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default MealOptimizer;