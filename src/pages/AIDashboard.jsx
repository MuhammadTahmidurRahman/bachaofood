// src/pages/AIDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Target, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { aiService } from '../lib/aiService';

const AIDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [sdgScore, setSdgScore] = useState(null);
  const [wasteEstimate, setWasteEstimate] = useState(null);

  useEffect(() => {
    if (user) loadAIAnalysis();
  }, [user]);

  const loadAIAnalysis = async () => {
    setLoading(true);
    try {
      const [logsRes, inventoryRes, profileRes] = await Promise.all([
        dbHelpers.getFoodLogs(user.id, 100),
        dbHelpers.getInventory(user.id),
        dbHelpers.getProfile(user.id)
      ]);

      const logs = logsRes.data || [];
      const inventory = inventoryRes.data || [];
      const profile = profileRes.data;

      if (logs.length > 0) {
        setAnalyzing(true);
        
        // Run AI analyses in parallel
        const [patterns, waste, score] = await Promise.all([
          aiService.analyzeConsumptionPatterns(logs),
          aiService.estimateWaste(logs, inventory),
          aiService.calculateSDGScore(profile, logs, inventory)
        ]);

        setAnalysis(patterns);
        setWasteEstimate(waste);
        setSdgScore(score);
        setAnalyzing(false);
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setAnalyzing(false);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-3xl p-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gradient-dark">AI Insights</h1>
            <p className="text-lg font-semibold text-gray-600">Powered by Advanced Analytics</p>
          </div>
        </div>
        
        <button
          onClick={loadAIAnalysis}
          disabled={analyzing}
          className="btn-primary mt-4"
        >
          {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </motion.div>

      {analyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-effect rounded-3xl p-8 text-center"
        >
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary-500 animate-pulse" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">AI Analysis in Progress</h3>
          <p className="text-gray-600">Our AI is analyzing your food patterns...</p>
        </motion.div>
      )}

      {/* SDG Score Card */}
      {sdgScore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-800">Your SDG Impact Score</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="text-6xl font-black mb-2">{sdgScore.totalScore}</div>
              <div className="text-xl font-semibold">Total Score</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
              <div className="text-5xl font-black mb-2">{sdgScore.sdg2Progress}%</div>
              <div className="text-lg font-semibold">SDG 2: Zero Hunger</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
              <div className="text-5xl font-black mb-2">{sdgScore.sdg12Progress}%</div>
              <div className="text-lg font-semibold">SDG 12: Responsible Consumption</div>
            </div>
          </div>

          {/* Improvements */}
          <div className="bg-white/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Areas for Improvement</h3>
            <div className="space-y-3">
              {sdgScore.improvements.map((imp, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl">
                  <div>
                    <div className="font-bold text-gray-800 capitalize">{imp.area}</div>
                    <div className="text-sm text-gray-600">{imp.action}</div>
                  </div>
                  <div className="text-2xl font-black text-green-600">+{imp.potential}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Consumption Patterns */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-3xl p-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Consumption Patterns</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-orange-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-bold text-orange-800">Over-Consumption</h3>
              </div>
              <ul className="space-y-2">
                {analysis.overConsumption.map((item, idx) => (
                  <li key={idx} className="text-orange-700 font-semibold">• {item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-bold text-yellow-800">Under-Consumption</h3>
              </div>
              <ul className="space-y-2">
                {analysis.underConsumption.map((item, idx) => (
                  <li key={idx} className="text-yellow-700 font-semibold">• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Waste Risk Items */}
          <div className="mt-6 bg-red-50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-red-800 mb-4">High Waste Risk Items</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {analysis.wasteRiskItems.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4">
                  <div className="font-bold text-gray-800">{item.item}</div>
                  <div className="text-sm text-red-600 font-semibold mt-1">
                    Risk: {item.risk.toUpperCase()} • {item.days} days
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Waste Estimate */}
      {wasteEstimate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-3xl p-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Waste Estimation</h2>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="text-4xl font-black mb-2">{wasteEstimate.weeklyWasteGrams}g</div>
              <div className="text-sm font-semibold">Weekly Waste</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl p-6 text-white">
              <div className="text-4xl font-black mb-2">৳{wasteEstimate.weeklyWasteMoney}</div>
              <div className="text-sm font-semibold">Money Lost</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 text-white">
              <div className="text-4xl font-black mb-2">{wasteEstimate.monthlyProjection}g</div>
              <div className="text-sm font-semibold">Monthly Projection</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="text-4xl font-black mb-2">{wasteEstimate.communityAverage}g</div>
              <div className="text-sm font-semibold">Community Avg</div>
            </div>
          </div>

          {/* Top Wasted Items */}
          <div className="bg-white/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Top Wasted Items</h3>
            <div className="space-y-3">
              {wasteEstimate.topWastedItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl">
                  <span className="font-bold text-gray-800">{item.item}</span>
                  <span className="text-red-600 font-black text-xl">{item.wastePercent}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIDashboard;