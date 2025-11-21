// src/pages/AIDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, TrendingUp, Target, Sparkles, AlertTriangle,
  Lightbulb, ChevronDown, ChevronUp, Database, Info, Calendar,
  Activity, PieChart, BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { aiService } from '../lib/aiService';

const ReasoningCard = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 mt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-blue-900">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 text-sm text-blue-800 space-y-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InsightCard = ({ insight }) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <Lightbulb className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 text-lg mb-2">{insight.finding}</h4>
          <p className="text-gray-700 leading-relaxed">{insight.explanation}</p>
        </div>
      </div>
      
      {insight.reasoning && (
        <ReasoningCard title="Why this insight?" icon={Database}>
          <div className="space-y-2">
            {insight.reasoning.dataSource && (
              <div>
                <span className="font-semibold">Data Source: </span>
                <span>{insight.reasoning.dataSource}</span>
              </div>
            )}
            {insight.reasoning.calculation && (
              <div>
                <span className="font-semibold">Calculation: </span>
                <span>{insight.reasoning.calculation}</span>
              </div>
            )}
            {insight.reasoning.benchmark && (
              <div>
                <span className="font-semibold">Benchmark: </span>
                <span>{insight.reasoning.benchmark}</span>
              </div>
            )}
            {insight.reasoning.impact && (
              <div className="mt-2 p-2 bg-yellow-100 rounded">
                <span className="font-semibold text-yellow-900">Impact: </span>
                <span className="text-yellow-800">{insight.reasoning.impact}</span>
              </div>
            )}
          </div>
        </ReasoningCard>
      )}
      
      {insight.action && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="font-semibold text-green-900 mb-1 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Recommended Action:
          </div>
          <div className="text-green-800">{insight.action}</div>
        </div>
      )}
    </div>
  );
};

const TrendHeatmap = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          Weekly Consumption Heatmap
        </h3>
        <p className="text-gray-500 text-center py-4">
          Add more food logs to see weekly consumption patterns
        </p>
      </div>
    );
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Generate weekly trends directly from logs
  const trends = {};
  
  // Initialize structure for each category
  logs.forEach(log => {
    const category = (log.category || 'other').toLowerCase();
    if (!trends[category]) {
      trends[category] = {
        dailyPattern: [0, 0, 0, 0, 0, 0, 0], // Mon-Sun
        totalWeekly: 0
      };
    }
  });

  // Populate daily patterns
  logs.forEach(log => {
    const category = (log.category || 'other').toLowerCase();
    const logDate = new Date(log.created_at || log.date);
    const dayOfWeek = logDate.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Convert to Monday=0 format
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    if (trends[category]) {
      trends[category].dailyPattern[dayIndex]++;
      trends[category].totalWeekly++;
    }
  });
  
  // Get top 6 categories by total consumption
  const categories = Object.entries(trends)
    .sort((a, b) => b[1].totalWeekly - a[1].totalWeekly)
    .slice(0, 6)
    .map(([name, data]) => ({ name, data }));
  
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          Weekly Consumption Heatmap
        </h3>
        <p className="text-gray-500 text-center py-4">
          No consumption patterns detected yet
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-indigo-600" />
        Weekly Consumption Heatmap
      </h3>
      
      <div className="space-y-3">
        {categories.map((category, idx) => {
          const { name, data } = category;
          const dailyPattern = data.dailyPattern || [0, 0, 0, 0, 0, 0, 0];
          const maxValue = Math.max(...dailyPattern, 1);
          
          return (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-28 font-semibold text-gray-700 text-sm capitalize truncate" title={name}>
                {name}
              </div>
              <div className="flex-1 flex gap-1">
                {dailyPattern.map((value, dayIdx) => {
                  const intensity = value / maxValue;
                  
                  // Color based on intensity
                  let bgColor = 'bg-gray-100';
                  let textColor = 'text-gray-400';
                  
                  if (value > 0) {
                    if (intensity >= 0.75) {
                      bgColor = 'bg-red-500';
                      textColor = 'text-white';
                    } else if (intensity >= 0.5) {
                      bgColor = 'bg-orange-400';
                      textColor = 'text-white';
                    } else if (intensity >= 0.25) {
                      bgColor = 'bg-yellow-400';
                      textColor = 'text-gray-800';
                    } else {
                      bgColor = 'bg-green-400';
                      textColor = 'text-white';
                    }
                  }
                  
                  return (
                    <div
                      key={dayIdx}
                      className={`flex-1 h-12 rounded ${bgColor} flex items-center justify-center text-xs font-bold ${textColor} transition-all hover:scale-105 hover:shadow-md cursor-pointer`}
                      title={`${days[dayIdx]}: ${value} ${name} items logged`}
                    >
                      {value > 0 ? value : ''}
                    </div>
                  );
                })}
              </div>
              <div className="w-16 text-right text-sm text-gray-600">
                <span className="font-bold">{data.totalWeekly}</span>
                <span className="text-xs ml-1">total</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="font-semibold">Intensity:</span>
          <div className="flex items-center gap-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-6 h-6 bg-green-400 rounded"></div>
              <div className="w-6 h-6 bg-yellow-400 rounded"></div>
              <div className="w-6 h-6 bg-orange-400 rounded"></div>
              <div className="w-6 h-6 bg-red-500 rounded"></div>
            </div>
            <span>More</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          Showing top {categories.length} categories
        </div>
      </div>
    </div>
  );
};

const ConsumptionDetailCard = ({ title, items, icon: Icon, bgColor, borderColor, textColor }) => {
  if (!items || items.length === 0) {
    return (
      <div className={`${bgColor} rounded-2xl p-6 border-2 ${borderColor}`}>
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`w-6 h-6 ${textColor}`} />
          <h3 className={`text-xl font-bold ${textColor}`}>{title}</h3>
        </div>
        <p className="text-gray-600">✓ No issues detected. Great balance!</p>
      </div>
    );
  }

  return (
    <div className={`${bgColor} rounded-2xl p-6 border-2 ${borderColor}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-6 h-6 ${textColor}`} />
        <h3 className={`text-xl font-bold ${textColor}`}>{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white/70 rounded-xl p-4 border border-gray-200">
            <div className="font-bold text-gray-800 text-base capitalize">{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AIDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [sdgScore, setSdgScore] = useState(null);
  const [wasteEstimate, setWasteEstimate] = useState(null);
  const [insights, setInsights] = useState([]);
  const [dataStats, setDataStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) loadAIAnalysis();
  }, [user]);

  const loadAIAnalysis = async () => {
    setLoading(true);
    setAnalyzing(true);
    setError(null);
    
    try {
      // Fetch data in parallel
      const [logsRes, inventoryRes, profileRes] = await Promise.all([
        dbHelpers.getFoodLogs(user.id, 100),
        dbHelpers.getInventory(user.id),
        dbHelpers.getProfile(user.id)
      ]);

      const fetchedLogs = logsRes.data || [];
      const inventory = inventoryRes.data || [];
      const profile = profileRes.data;

      setLogs(fetchedLogs); // Store logs for heatmap

      console.log('Dashboard Data:', { 
        logsCount: fetchedLogs.length, 
        inventoryCount: inventory.length,
        profileExists: !!profile 
      });

      // Calculate data statistics
      const stats = {
        totalLogs: fetchedLogs.length,
        inventoryItems: inventory.length,
        dateRange: fetchedLogs.length > 0 ? {
          oldest: new Date(fetchedLogs[fetchedLogs.length - 1].created_at).toLocaleDateString(),
          newest: new Date(fetchedLogs[0].created_at).toLocaleDateString()
        } : null,
        categories: [...new Set(fetchedLogs.map(l => l.category))].length,
        avgDailyLogs: fetchedLogs.length > 0 ? (fetchedLogs.length / Math.max(aiService.calculateDaysCovered(fetchedLogs), 1)).toFixed(1) : 0
      };
      setDataStats(stats);

      if (fetchedLogs.length > 0) {
        // Run AI analyses in parallel
        const [patterns, waste, score] = await Promise.all([
          aiService.analyzeConsumptionPatterns(fetchedLogs),
          aiService.estimateWaste(fetchedLogs, inventory),
          aiService.calculateSDGScore(profile, fetchedLogs, inventory)
        ]);

        console.log('AI Analysis Results:', {
          patterns,
          waste,
          score
        });

        setAnalysis(patterns);
        setWasteEstimate(waste);
        setSdgScore(score);

        // Generate insights with better error handling
        try {
          const generatedInsights = await aiService.generateAdvancedInsights(
            fetchedLogs,
            inventory,
            patterns,
            waste,
            score
          );
          
          console.log('Generated Insights:', generatedInsights);
          setInsights(generatedInsights || []);
        } catch (insightError) {
          console.error('Insight Generation Error:', insightError);
          // Use fallback insights
          setInsights(aiService.generateFallbackInsights({
            totalLogs: fetchedLogs.length,
            categories: [...new Set(fetchedLogs.map(l => l.category))],
            inventorySize: inventory.length,
            wasteGrams: waste.weeklyWasteGrams,
            wasteMoney: waste.weeklyWasteMoney,
            sdgTotal: score.totalScore,
            sdg2: score.sdg2Progress,
            sdg12: score.sdg12Progress,
            overConsumption: patterns.overConsumption,
            underConsumption: patterns.underConsumption,
            wasteRisks: patterns.wasteRiskItems,
            topWasted: waste.topWastedItems
          }));
        }
      } else {
        setError('Not enough data yet. Add at least 5 food logs to see insights.');
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setError('Failed to load AI analysis. Please try again.');
    }
    
    setAnalyzing(false);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Analyzing your consumption patterns...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Enough Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
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
            <h1 className="text-4xl font-black text-gradient-dark">AI Consumption Analyzer</h1>
            <p className="text-lg font-semibold text-gray-600">Advanced pattern recognition & waste prediction</p>
          </div>
        </div>

        {dataStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/50 rounded-xl p-4">
              <div className="text-3xl font-black text-purple-600">{dataStats.totalLogs}</div>
              <div className="text-sm text-gray-600 font-semibold">Food Logs Analyzed</div>
            </div>
            <div className="bg-white/50 rounded-xl p-4">
              <div className="text-3xl font-black text-blue-600">{dataStats.inventoryItems}</div>
              <div className="text-sm text-gray-600 font-semibold">Current Inventory</div>
            </div>
            <div className="bg-white/50 rounded-xl p-4">
              <div className="text-3xl font-black text-green-600">{dataStats.categories}</div>
              <div className="text-sm text-gray-600 font-semibold">Food Categories</div>
            </div>
            <div className="bg-white/50 rounded-xl p-4">
              <div className="text-3xl font-black text-orange-600">{dataStats.avgDailyLogs}</div>
              <div className="text-sm text-gray-600 font-semibold">Avg Daily Logs</div>
            </div>
          </div>
        )}

        {analyzing && (
          <div className="mt-4 flex items-center gap-2 text-purple-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="font-semibold">AI is analyzing your patterns...</span>
          </div>
        )}
      </motion.div>

      {/* Key Insights */}
      {insights && insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-800">AI-Powered Insights</h2>
          </div>
          
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
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
              <div className="text-sm opacity-90 mt-2">
                {sdgScore.totalScore >= 80 ? '🌟 Excellent!' : sdgScore.totalScore >= 60 ? '👍 Good' : '📈 Keep improving'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
              <div className="text-5xl font-black mb-2">{sdgScore.sdg2Progress}%</div>
              <div className="text-lg font-semibold">SDG 2: Zero Hunger</div>
              <div className="text-sm opacity-90 mt-2">Nutritional adequacy & food security</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
              <div className="text-5xl font-black mb-2">{sdgScore.sdg12Progress}%</div>
              <div className="text-lg font-semibold">SDG 12: Responsible Consumption</div>
              <div className="text-sm opacity-90 mt-2">Waste reduction & efficiency</div>
            </div>
          </div>

          {sdgScore.improvements && sdgScore.improvements.length > 0 && (
            <div className="bg-white/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Priority Improvement Areas</h3>
              <div className="space-y-3">
                {sdgScore.improvements.map((imp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 capitalize text-lg">{imp.area}</div>
                      <div className="text-sm text-gray-600 mt-1">{imp.action}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-black text-green-600">+{imp.potential}</div>
                      <div className="text-xs text-gray-500">potential points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Consumption Patterns */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-8 h-8 text-indigo-600" />
            <h2 className="text-3xl font-bold text-gray-800">Consumption Pattern Analysis</h2>
          </div>
          
          {/* Weekly Trends Heatmap - Now using logs directly */}
          <div className="mb-6">
            <TrendHeatmap logs={logs} />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Over-Consumption */}
            <ConsumptionDetailCard
              title="Over-Consumption Alert"
              items={analysis.overConsumption}
              icon={AlertTriangle}
              bgColor="bg-gradient-to-br from-orange-50 to-red-50"
              borderColor="border-orange-200"
              textColor="text-orange-800"
            />

            {/* Under-Consumption */}
            <ConsumptionDetailCard
              title="Under-Consumption Alert"
              items={analysis.underConsumption}
              icon={TrendingUp}
              bgColor="bg-gradient-to-br from-yellow-50 to-amber-50"
              borderColor="border-yellow-200"
              textColor="text-yellow-800"
            />
          </div>

          {/* Waste Risk Items */}
          {analysis.wasteRiskItems && analysis.wasteRiskItems.length > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200">
              <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                ⚠️ High Waste Risk Items - Consume Soon!
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {analysis.wasteRiskItems.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
                    <div className="font-bold text-gray-800 text-lg capitalize">{item.item}</div>
                    <div className="text-sm text-red-600 font-semibold mt-2">
                      🚨 {item.risk.toUpperCase()} RISK
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {item.days} days remaining
                    </div>
                    {item.category && (
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        Category: {item.category}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Waste Estimate */}
      {wasteEstimate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-8 h-8 text-red-600" />
            <h2 className="text-3xl font-bold text-gray-800">Waste Impact Analysis</h2>
          </div>
          
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

          {wasteEstimate.topWastedItems && wasteEstimate.topWastedItems.length > 0 && (
            <div className="bg-white/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Top Wasted Items</h3>
              <div className="space-y-3">
                {wasteEstimate.topWastedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center font-bold text-red-600">
                        {idx + 1}
                      </div>
                      <span className="font-bold text-gray-800 capitalize">{item.item}</span>
                    </div>
                    <span className="text-red-600 font-black text-2xl">{item.wastePercent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AIDashboard;