// src/lib/aiService.js
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

  // AI Consumption Pattern Analyzer
  async analyzeConsumptionPatterns(logs) {
    const prompt = `Analyze these food consumption logs and provide insights in JSON format:

${JSON.stringify(logs.slice(0, 50), null, 2)}

Return ONLY valid JSON with this structure:
{
  "weeklyTrends": ["trend1", "trend2"],
  "overConsumption": ["item1", "item2"],
  "underConsumption": ["item1", "item2"],
  "wasteRiskItems": [{"item": "name", "risk": "high/medium/low", "days": 3}],
  "imbalances": ["imbalance1", "imbalance2"],
  "heatmapData": [{"category": "Fruit", "count": 10}, {"category": "Vegetable", "count": 5}]
}`;

    const response = await this.callGroq([
      { role: 'system', content: 'You are a food consumption analyst. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
  }

  // AI Meal Optimization Engine
  async optimizeMealPlan(inventory, budget, nutritionRequirements) {
    const prompt = `Create a 7-day meal plan optimizing for:
- Budget: ${budget} BDT
- Available inventory: ${JSON.stringify(inventory.slice(0, 20))}
- Nutrition: ${JSON.stringify(nutritionRequirements)}

Return ONLY valid JSON:
{
  "mealPlan": [
    {
      "day": "Monday",
      "breakfast": "meal name",
      "lunch": "meal name",
      "dinner": "meal name",
      "usedItems": ["item1", "item2"]
    }
  ],
  "shoppingList": [{"item": "name", "quantity": 1, "estimatedCost": 50}],
  "totalCost": 500,
  "wasteReduction": 30,
  "nutritionScore": 85
}`;

    const response = await this.callGroq([
      { role: 'system', content: 'You are a meal planning expert. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ], 0.5);

    return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
  }

  // Expiration Risk Prediction
  async predictExpirationRisk(inventoryItem) {
    const prompt = `Predict expiration risk for:
Item: ${inventoryItem.item_name}
Category: ${inventoryItem.category}
Purchase Date: ${inventoryItem.purchase_date}
Expiry Date: ${inventoryItem.expiry_date || 'unknown'}
Quantity: ${inventoryItem.quantity}

Return ONLY valid JSON:
{
  "riskLevel": "high/medium/low",
  "daysUntilExpiry": 3,
  "consumptionPriority": 1-10,
  "recommendations": ["action1", "action2"]
}`;

    const response = await this.callGroq([
      { role: 'system', content: 'You are a food safety expert. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ], 0.3);

    return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
  }

  // Waste Estimation Model
  async estimateWaste(consumptionHistory, inventory) {
    const prompt = `Estimate food waste based on:
Consumption History: ${JSON.stringify(consumptionHistory.slice(0, 30))}
Current Inventory: ${JSON.stringify(inventory.slice(0, 20))}

Return ONLY valid JSON:
{
  "weeklyWasteGrams": 500,
  "weeklyWasteMoney": 150,
  "monthlyProjection": 600,
  "communityAverage": 800,
  "topWastedItems": [{"item": "name", "wastePercent": 30}],
  "recommendations": ["tip1", "tip2"]
}`;

    const response = await this.callGroq([
      { role: 'system', content: 'You are a waste reduction analyst. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
  }

  // NourishBot Chatbot
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

  // SDG Impact Scoring
  async calculateSDGScore(userData, logs, inventory) {
    const prompt = `Calculate SDG Impact Score (0-100) for:
User: ${JSON.stringify(userData)}
Recent Logs: ${JSON.stringify(logs.slice(0, 30))}
Inventory: ${JSON.stringify(inventory.slice(0, 20))}

Return ONLY valid JSON:
{
  "totalScore": 75,
  "wasteReductionScore": 80,
  "nutritionScore": 70,
  "weeklyInsights": ["insight1", "insight2"],
  "improvements": [
    {"area": "vegetables", "potential": 10, "action": "Increase veggie intake"}
  ],
  "sdg2Progress": 75,
  "sdg12Progress": 80
}`;

    const response = await this.callGroq([
      { role: 'system', content: 'You are an SDG impact analyst. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
  }

  // Nutrient Gap Prediction
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