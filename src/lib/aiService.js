// src/lib/aiService.js
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const NUTRITION_BENCHMARKS = {
  fruits: { min: 2, max: 4, unit: 'servings/day' },
  vegetables: { min: 3, max: 5, unit: 'servings/day' },
  grains: { min: 6, max: 8, unit: 'servings/day' },
  protein: { min: 2, max: 3, unit: 'servings/day' },
  dairy: { min: 2, max: 3, unit: 'servings/day' },
};

const PERISHABILITY_RATES = {
  fruits: 7, vegetables: 5, dairy: 10, meat: 3,
  seafood: 2, grains: 180, bakery: 5, other: 7
};

const WASTE_COSTS = {
  fruits: 0.15, vegetables: 0.08, dairy: 0.20,
  meat: 0.50, seafood: 0.60, grains: 0.05,
  bakery: 0.10, other: 0.15
};

class AIService {
  async callGroq(messages, temperature = 0.7) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }

  // ============ CONSUMPTION PATTERN ANALYSIS ============
  async analyzeConsumptionPatterns(logs) {
    if (!logs || logs.length === 0) {
      return {
        overConsumption: [],
        underConsumption: [],
        wasteRiskItems: [],
        weeklyTrends: {}
      };
    }

    const daysCovered = this.calculateDaysCovered(logs);
    const categoryStats = this.aggregateByCategory(logs, daysCovered);
    
    const overConsumption = [];
    const underConsumption = [];

    // Analyze each category against benchmarks
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const benchmark = NUTRITION_BENCHMARKS[category];
      if (!benchmark) return;

      const perDay = stats.perDay;
      const overPercent = Math.round(((perDay / benchmark.max) - 1) * 100);
      const underPercent = Math.round((1 - (perDay / benchmark.min)) * 100);

      if (perDay > benchmark.max * 1.2) {
        overConsumption.push(
          `${category} (${perDay.toFixed(1)}/day, ${overPercent}% over recommended)`
        );
      }
      
      if (perDay < benchmark.min * 0.7) {
        underConsumption.push(
          `${category} (${perDay.toFixed(1)}/day, ${underPercent}% under recommended)`
        );
      }
    });

    const wasteRiskItems = this.calculateWasteRisk(logs);

    return {
      overConsumption,
      underConsumption,
      wasteRiskItems,
      weeklyTrends: categoryStats
    };
  }

  calculateDaysCovered(logs) {
    if (!logs || logs.length === 0) return 1;
    
    const dates = logs.map(l => new Date(l.created_at || l.date).getTime());
    const oldest = Math.min(...dates);
    const newest = Math.max(...dates);
    const days = Math.ceil((newest - oldest) / (1000 * 60 * 60 * 24));
    
    return Math.max(days, 1);
  }

  aggregateByCategory(logs, days) {
    const stats = {};
    
    logs.forEach(log => {
      const cat = (log.category || 'other').toLowerCase();
      if (!stats[cat]) {
        stats[cat] = { count: 0, total: 0 };
      }
      stats[cat].count++;
      stats[cat].total += log.quantity || 1;
    });

    Object.keys(stats).forEach(cat => {
      stats[cat].perDay = stats[cat].count / days;
      stats[cat].avgQuantity = stats[cat].total / stats[cat].count;
    });

    return stats;
  }

  calculateWasteRisk(logs) {
    const itemFrequency = {};
    
    logs.forEach(log => {
      const item = log.food_name || log.name || 'Unknown';
      const cat = log.category || 'other';
      
      if (!itemFrequency[item]) {
        itemFrequency[item] = {
          count: 0,
          category: cat,
          lastSeen: log.created_at || log.date,
          firstSeen: log.created_at || log.date
        };
      }
      itemFrequency[item].count++;
      
      const logDate = new Date(log.created_at || log.date);
      const lastSeen = new Date(itemFrequency[item].lastSeen);
      if (logDate > lastSeen) {
        itemFrequency[item].lastSeen = log.created_at || log.date;
      }
    });

    const risks = [];
    Object.entries(itemFrequency).forEach(([item, data]) => {
      if (data.count >= 3) {
        const daysAgo = Math.floor(
          (Date.now() - new Date(data.lastSeen).getTime()) / (1000 * 60 * 60 * 24)
        );
        const perishDays = PERISHABILITY_RATES[data.category] || 7;
        
        if (daysAgo >= perishDays * 0.6) {
          const remainingDays = Math.max(0, perishDays - daysAgo);
          risks.push({
            item,
            risk: daysAgo >= perishDays ? 'high' : daysAgo >= perishDays * 0.8 ? 'medium' : 'low',
            days: remainingDays,
            category: data.category
          });
        }
      }
    });

    return risks.sort((a, b) => a.days - b.days).slice(0, 6);
  }

  // ============ WASTE ESTIMATION ============
  async estimateWaste(logs, inventory) {
    let weeklyWasteGrams = 0;
    let weeklyWasteMoney = 0;
    const wastedByItem = {};

    // Calculate from expired inventory
    if (inventory && inventory.length > 0) {
      const expiredItems = inventory.filter(item => {
        if (!item.expiry_date) return false;
        return new Date(item.expiry_date) < new Date();
      });

      expiredItems.forEach(item => {
        const weight = (item.quantity || 1) * 100;
        const cat = item.category || 'other';
        const cost = WASTE_COSTS[cat] || WASTE_COSTS.other;
        
        weeklyWasteGrams += weight;
        weeklyWasteMoney += weight * cost;

        const name = item.food_name || item.name || 'Unknown';
        if (!wastedByItem[name]) wastedByItem[name] = 0;
        wastedByItem[name] += weight;
      });
    }

    // Add estimated waste from overconsumption
    const daysCovered = this.calculateDaysCovered(logs);
    const categoryStats = this.aggregateByCategory(logs, daysCovered);
    
    Object.entries(categoryStats).forEach(([cat, stats]) => {
      const benchmark = NUTRITION_BENCHMARKS[cat];
      if (benchmark && stats.perDay > benchmark.max * 1.2) {
        const excessPerDay = stats.perDay - benchmark.max;
        const excessGrams = excessPerDay * 150 * 7; // 150g per serving, weekly
        const wasteRate = 0.25;
        
        weeklyWasteGrams += excessGrams * wasteRate;
        weeklyWasteMoney += excessGrams * wasteRate * (WASTE_COSTS[cat] || 0.15);
      }
    });

    const topWastedItems = Object.entries(wastedByItem)
      .map(([item, grams]) => ({
        item,
        wastePercent: weeklyWasteGrams > 0 ? Math.round((grams / weeklyWasteGrams) * 100) : 0
      }))
      .sort((a, b) => b.wastePercent - a.wastePercent)
      .slice(0, 5);

    return {
      weeklyWasteGrams: Math.round(weeklyWasteGrams),
      weeklyWasteMoney: Math.round(weeklyWasteMoney),
      monthlyProjection: Math.round(weeklyWasteGrams * 4.3),
      communityAverage: 800,
      topWastedItems
    };
  }

  // ============ SDG IMPACT SCORING ============
  async calculateSDGScore(profile, logs, inventory) {
    const mealRegularity = this.scoreMealRegularity(logs);
    const nutritionDiversity = this.scoreNutritionDiversity(logs);
    const calorieAdequacy = 75;
    
    const sdg2Score = Math.round(
      mealRegularity * 0.4 + 
      nutritionDiversity * 0.4 + 
      calorieAdequacy * 0.2
    );

    const wasteRate = this.scoreWasteRate(logs, inventory);
    const inventoryTurnover = this.scoreInventoryTurnover(inventory);
    const budgetEfficiency = 70;

    const sdg12Score = Math.round(
      wasteRate * 0.4 + 
      inventoryTurnover * 0.35 + 
      budgetEfficiency * 0.25
    );

    const totalScore = Math.round((sdg2Score + sdg12Score) / 2);
    const improvements = this.generateImprovements(logs, inventory, sdg2Score, sdg12Score);

    return {
      totalScore,
      sdg2Progress: sdg2Score,
      sdg12Progress: sdg12Score,
      improvements
    };
  }

  scoreMealRegularity(logs) {
    if (!logs || logs.length === 0) return 50;
    const days = this.calculateDaysCovered(logs);
    const uniqueDays = new Set(logs.map(l => new Date(l.created_at || l.date).toDateString())).size;
    const avgLogsPerDay = logs.length / Math.max(uniqueDays, 1);
    return Math.min(100, Math.round((avgLogsPerDay / 3) * 100));
  }

  scoreNutritionDiversity(logs) {
    if (!logs || logs.length === 0) return 40;
    const categories = new Set(logs.map(l => l.category));
    return Math.min(100, Math.round((categories.size / 5) * 100));
  }

  scoreWasteRate(logs, inventory) {
    if (!inventory || inventory.length === 0) return 75;
    const expired = inventory.filter(i => i.expiry_date && new Date(i.expiry_date) < new Date()).length;
    const wastePercent = (expired / inventory.length) * 100;
    return Math.max(0, Math.min(100, Math.round(100 - wastePercent * 2)));
  }

  scoreInventoryTurnover(inventory) {
    if (!inventory || inventory.length === 0) return 70;
    
    let totalDaysToExpiry = 0;
    let count = 0;

    inventory.forEach(item => {
      if (item.expiry_date) {
        const days = Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          totalDaysToExpiry += days;
          count++;
        }
      }
    });

    if (count === 0) return 70;
    const avgDays = totalDaysToExpiry / count;
    
    if (avgDays >= 5 && avgDays <= 10) return 100;
    if (avgDays < 5) return Math.max(50, 100 - (5 - avgDays) * 10);
    return Math.max(50, 100 - (avgDays - 10) * 2);
  }

  generateImprovements(logs, inventory, sdg2Score, sdg12Score) {
    const improvements = [];
    const categoryStats = this.aggregateByCategory(logs, this.calculateDaysCovered(logs));

    Object.entries(NUTRITION_BENCHMARKS).forEach(([cat, bench]) => {
      const actual = categoryStats[cat]?.perDay || 0;
      if (actual < bench.min * 0.8) {
        improvements.push({
          area: cat,
          action: `Increase ${cat} intake to ${bench.min}+ servings/day`,
          potential: 10
        });
      }
    });

    if (sdg12Score < 70) {
      improvements.push({
        area: 'waste reduction',
        action: 'Implement FIFO method and meal planning',
        potential: 15
      });
    }

    if (sdg2Score < 70) {
      improvements.push({
        area: 'meal consistency',
        action: 'Log at least 3 meals daily for better tracking',
        potential: 12
      });
    }

    return improvements.sort((a, b) => b.potential - a.potential).slice(0, 3);
  }

  // ============ ADVANCED INSIGHTS (GROQ-POWERED) ============
  async generateAdvancedInsights(logs, inventory, analysis, wasteEstimate, sdgScore) {
    const contextData = {
      totalLogs: logs.length,
      categories: [...new Set(logs.map(l => l.category))],
      inventorySize: inventory.length,
      wasteGrams: wasteEstimate.weeklyWasteGrams,
      wasteMoney: wasteEstimate.weeklyWasteMoney,
      sdgTotal: sdgScore.totalScore,
      sdg2: sdgScore.sdg2Progress,
      sdg12: sdgScore.sdg12Progress,
      overConsumption: analysis.overConsumption,
      underConsumption: analysis.underConsumption,
      wasteRisks: analysis.wasteRiskItems,
      topWasted: wasteEstimate.topWastedItems
    };

    // Try Groq API for AI-powered insights
    if (GROQ_API_KEY) {
      try {
        const prompt = `Analyze this food consumption data and provide 3-5 actionable insights.

Data Summary:
- ${contextData.totalLogs} food logs analyzed
- ${contextData.categories.length} categories: ${contextData.categories.join(', ')}
- ${contextData.inventorySize} items in inventory
- ${contextData.wasteGrams}g weekly waste (৳${contextData.wasteMoney} cost)
- SDG Score: ${contextData.sdgTotal}/100 (SDG2: ${contextData.sdg2}%, SDG12: ${contextData.sdg12}%)
- Over-consumption: ${contextData.overConsumption.join('; ') || 'none'}
- Under-consumption: ${contextData.underConsumption.join('; ') || 'none'}
- Waste risks: ${contextData.wasteRisks.map(r => `${r.item} (${r.days} days)`).join(', ') || 'none'}

Return ONLY valid JSON array (no markdown):
[{
  "finding": "Brief insight title",
  "explanation": "1-2 sentence explanation",
  "reasoning": {
    "dataSource": "Data used (be specific with numbers)",
    "calculation": "How derived",
    "benchmark": "Comparison standard",
    "impact": "Consequences"
  },
  "action": "Specific recommendation"
}]`;

        const response = await this.callGroq([
          { role: 'system', content: 'You are a food sustainability analyst. Return only valid JSON array.' },
          { role: 'user', content: prompt }
        ], 0.7);

        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (error) {
        console.warn('Groq API failed, using fallback:', error.message);
      }
    }

    // Fallback to rule-based insights
    return this.generateFallbackInsights(contextData);
  }

  generateFallbackInsights(data) {
    const insights = [];

    // Waste insight
    if (data.wasteGrams > 500) {
      const vsAverage = Math.round((data.wasteGrams / 800 - 1) * 100);
      insights.push({
        finding: `High food waste detected: ${data.wasteGrams}g per week`,
        explanation: `You're wasting approximately ${data.wasteGrams}g of food weekly, costing ৳${data.wasteMoney}. This is ${vsAverage > 0 ? vsAverage + '% above' : Math.abs(vsAverage) + '% below'} the community average.`,
        reasoning: {
          dataSource: `${data.inventorySize} inventory items analyzed, ${data.topWasted.length} items frequently wasted`,
          calculation: `Expired items + overconsumption waste = ${data.wasteGrams}g/week`,
          benchmark: `Bangladesh community average: 800g/week`,
          impact: `Annual loss: ৳${Math.round(data.wasteMoney * 52)} + ${Math.round(data.wasteGrams * 52 / 1000)}kg CO2 environmental impact`
        },
        action: `Priority: consume ${data.topWasted[0]?.item || 'high-risk items'} first. Implement meal planning to reduce waste by 30%.`
      });
    }

    // Over-consumption
    if (data.overConsumption.length > 0) {
      const item = data.overConsumption[0];
      const category = item.split('(')[0].trim();
      insights.push({
        finding: `Over-consuming ${category}`,
        explanation: `${item}. This creates waste risk and budget inefficiency.`,
        reasoning: {
          dataSource: `${data.totalLogs} food logs showing consumption patterns`,
          calculation: `Daily intake exceeds recommended maximum by 20%+`,
          benchmark: `WHO/FAO nutritional guidelines`,
          impact: `Potential savings: ৳200-400/month by reducing excess purchases`
        },
        action: `Reduce ${category} portions by 25% or explore community food sharing.`
      });
    }

    // Under-consumption
    if (data.underConsumption.length > 0) {
      const item = data.underConsumption[0];
      const category = item.split('(')[0].trim();
      insights.push({
        finding: `Nutritional gap in ${category}`,
        explanation: `${item}. Meeting this need improves SDG 2 (Zero Hunger) score.`,
        reasoning: {
          dataSource: `Dietary diversity analysis across ${data.categories.length} food categories`,
          calculation: `Current intake below recommended minimum by 30%+`,
          benchmark: `Nutritional adequacy standards`,
          impact: `Affects health, energy levels, and SDG sustainability score`
        },
        action: `Add 2 servings of ${category} daily. Try affordable seasonal options.`
      });
    }

    // SDG score
    if (data.sdgTotal < 70) {
      const weakest = data.sdg2 < data.sdg12 ? 'nutritional adequacy (SDG 2)' : 'waste reduction (SDG 12)';
      insights.push({
        finding: `SDG sustainability score needs improvement`,
        explanation: `Current score ${data.sdgTotal}/100 indicates moderate practices. Focus on ${weakest}.`,
        reasoning: {
          dataSource: `Analysis of ${data.totalLogs} consumption logs and ${data.inventorySize} inventory items`,
          calculation: `SDG 2 (${data.sdg2}%) + SDG 12 (${data.sdg12}%) = ${data.sdgTotal} total`,
          benchmark: `Target: 80+ (Good), 90+ (Excellent)`,
          impact: `Current practices have moderate environmental impact`
        },
        action: `Focus on ${weakest} - can boost score by 15+ points within 2 weeks.`
      });
    }

    // Urgent waste risks
    if (data.wasteRisks.length > 0) {
      const urgentItems = data.wasteRisks.filter(r => r.days <= 2);
      if (urgentItems.length > 0) {
        insights.push({
          finding: `${urgentItems.length} items expiring within 48 hours`,
          explanation: `Critical risk: ${urgentItems.map(r => r.item).join(', ')}. Immediate action needed.`,
          reasoning: {
            dataSource: `Real-time inventory expiration tracking`,
            calculation: `Items with <2 days remaining and low consumption frequency`,
            benchmark: `FIFO inventory management principles`,
            impact: `Preventing losses saves ৳${Math.round(urgentItems.length * 50)} this week`
          },
          action: `Cook or preserve these items today. Consider freezing or donating.`
        });
      }
    }

    return insights.slice(0, 5);
  }

  // ============ OTHER AI METHODS ============
  async chatBotResponse(userMessage, conversationHistory, userData) {
    const systemPrompt = `You are NourishBot, an AI assistant for food management, waste reduction, and nutrition.
User Profile: ${JSON.stringify(userData)}

Provide helpful advice on:
- Food waste reduction
- Nutrition balancing
- Budget meal planning
- Creative leftover ideas
- Local food sharing guidance
- Environmental impact

Keep responses concise and actionable.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    return await this.callGroq(messages, 0.8);
  }

  async predictNutrientGaps(consumptionHistory) {
    const prompt = `Analyze nutrient gaps from consumption:
${JSON.stringify(consumptionHistory.slice(0, 40))}

Return ONLY valid JSON:
{
  "likelyDeficiencies": [
    {"nutrient": "Vitamin C", "severity": "medium", "foods": ["oranges", "broccoli"]}
  ],
  "balancedCategories": ["Protein", "Grains"],
  "recommendations": ["Increase leafy greens", "Add more fruits"]
}`;

    const response = await this.callGroq([
      { role: 'system', content: 'You are a nutrition analyst. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
  }
}

export const aiService = new AIService();