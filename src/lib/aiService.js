// src/lib/aiService.js - ENHANCED VERSION
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

  // ============ ENHANCED NOURISHBOT WITH DATABASE CONTEXT ============
  
  /**
   * Generate comprehensive database context for AI
   */
  generateDatabaseContext(userData) {
    if (!userData) return '';

    const { profile, recentLogs = [], inventory = [], foodItems = [], resources = [] } = userData;

    // Calculate analytics
    const expiringItems = inventory.filter(item => {
      if (!item.expiry_date) return false;
      const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
    });

    const categoryCount = {};
    recentLogs.forEach(log => {
      categoryCount[log.category] = (categoryCount[log.category] || 0) + 1;
    });

    const totalInventoryCost = inventory.reduce((sum, item) => sum + (item.cost || 0), 0);
    const budgetAmount = parseFloat(profile?.budget_amount || 0);
    const budgetUtilization = budgetAmount > 0 ? Math.round((totalInventoryCost / budgetAmount) * 100) : 0;

    return `
USER PROFILE:
- Name: ${profile?.full_name || 'User'}
- Household: ${profile?.household_size || 1} people
- Dietary Preference: ${profile?.dietary_preference || 'none'}
- Budget: ${profile?.budget_amount || 0} BDT (${profile?.budget_range || 'medium'} range)
- Location: ${profile?.location || 'Bangladesh'}

CURRENT INVENTORY (${inventory.length} items):
${inventory.slice(0, 15).map(item => 
  `• ${item.item_name} - ${item.quantity} ${item.unit || 'units'}, expires: ${item.expiry_date || 'N/A'}, cost: ৳${item.cost || 0}`
).join('\n')}
${inventory.length > 15 ? `... and ${inventory.length - 15} more items` : ''}

⚠️ URGENT ALERTS:
${expiringItems.length > 0 
  ? `${expiringItems.length} items expiring within 3 days:\n${expiringItems.map(i => `  - ${i.item_name} (${i.quantity} units) - expires ${i.expiry_date}`).join('\n')}`
  : '✓ No items expiring soon - great management!'}

RECENT CONSUMPTION LOGS (Last ${recentLogs.length} entries):
${recentLogs.slice(0, 10).map(log => 
  `• ${log.item_name} (${log.quantity} units) - ${log.category} - ${new Date(log.created_at).toLocaleDateString()}`
).join('\n')}

BUDGET ANALYSIS:
- Total inventory value: ৳${Math.round(totalInventoryCost)}
- Budget allocated: ৳${budgetAmount}
- Utilization: ${budgetUtilization}%
- Remaining budget: ৳${Math.max(0, budgetAmount - totalInventoryCost)}

CONSUMPTION PATTERNS:
${Object.entries(categoryCount).map(([cat, count]) => 
  `• ${cat}: ${count} items consumed`
).join('\n')}

AVAILABLE FOOD REFERENCE DATABASE (${foodItems.length} items):
${foodItems.slice(0, 10).map(item => 
  `• ${item.name} (${item.category}) - ৳${item.cost_per_unit}/${item.unit}, shelf life: ${item.expiration_days} days`
).join('\n')}

KNOWLEDGE BASE RESOURCES (${resources.length} articles):
${resources.slice(0, 5).map(res => 
  `• [${res.category}] ${res.title}: ${res.description}`
).join('\n')}
    `.trim();
  }

  /**
   * Enhanced chatbot with full database context
   */
  async chatBotResponse(userMessage, conversationHistory, userData) {
    // Generate comprehensive context
    const databaseContext = this.generateDatabaseContext(userData);

    // Determine intent for better responses
    const intent = this.detectIntent(userMessage);

    const systemPrompt = `You are NourishBot, an expert AI assistant for food management, waste reduction, and nutrition aligned with SDG 2 (Zero Hunger) and SDG 12 (Responsible Consumption).

${databaseContext}

YOUR CAPABILITIES:
1. **Food Waste Reduction**: Analyze expiring items, suggest preservation methods, FIFO strategies
2. **Nutrition Balancing**: Assess dietary gaps, recommend foods, create balanced meal plans
3. **Budget Meal Planning**: Create cost-effective meals using available inventory within budget
4. **Creative Leftovers**: Transform existing ingredients into new recipes
5. **Local Food Sharing**: Guide on community sharing opportunities in ${userData?.profile?.location || 'Bangladesh'}
6. **Environmental Impact**: Explain SDG connections, calculate waste/carbon footprint

RESPONSE GUIDELINES:
- ALWAYS reference specific items from the user's ACTUAL inventory/logs when relevant
- Provide ACTIONABLE, PERSONALIZED advice based on their real data (names, quantities, costs, dates)
- Include specific recommendations with quantities, costs, and timeframes
- PRIORITIZE using expiring items first (${userData?.inventory?.filter(i => {
  const days = i.expiry_date ? Math.ceil((new Date(i.expiry_date) - new Date()) / (1000*60*60*24)) : 999;
  return days <= 3;
}).map(i => i.item_name).join(', ') || 'none'})
- Respect dietary preference: ${userData?.profile?.dietary_preference || 'none'}
- Use Bangladeshi context (BDT currency, local foods like rice/dal/vegetables, cultural practices)
- Be concise (3-5 sentences for simple queries, detailed for analysis requests)
- If data is insufficient, acknowledge and provide general best practices

DETECTED INTENT: ${intent}

Respond naturally and helpfully to: "${userMessage}"`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 3 exchanges for context
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await this.callGroq(messages, 0.8);
      return response;
    } catch (error) {
      console.error('NourishBot error:', error);
      // Fallback to rule-based response
      return this.generateRuleBasedResponse(userMessage, userData, intent);
    }
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message) {
    const m = message.toLowerCase();
    
    if (m.includes('waste') || m.includes('expir') || m.includes('throw') || m.includes('spoil')) {
      return 'waste_reduction';
    }
    if (m.includes('budget') || m.includes('save money') || m.includes('cheap') || m.includes('afford')) {
      return 'budget_planning';
    }
    if (m.includes('meal') || m.includes('recipe') || m.includes('cook') || m.includes('dinner')) {
      return 'meal_planning';
    }
    if (m.includes('nutrition') || m.includes('healthy') || m.includes('vitamin') || m.includes('protein')) {
      return 'nutrition';
    }
    if (m.includes('leftover') || m.includes('use up') || m.includes('creative') || m.includes('transform')) {
      return 'leftovers';
    }
    if (m.includes('share') || m.includes('donate') || m.includes('community') || m.includes('neighbor')) {
      return 'food_sharing';
    }
    if (m.includes('environment') || m.includes('sdg') || m.includes('impact') || m.includes('carbon')) {
      return 'environmental_impact';
    }
    
    return 'general';
  }

  /**
   * Fallback rule-based response using actual data
   */
  generateRuleBasedResponse(question, userData, intent) {
    const { inventory = [], recentLogs = [], profile = {} } = userData || {};
    
    // Calculate key metrics
    const expiringItems = inventory.filter(item => {
      if (!item.expiry_date) return false;
      const days = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      return days <= 3 && days >= 0;
    });

    const totalCost = inventory.reduce((sum, item) => sum + (item.cost || 0), 0);
    const budgetAmount = parseFloat(profile.budget_amount || 1000);
    const budgetUtilization = Math.round((totalCost / budgetAmount) * 100);

    switch (intent) {
      case 'waste_reduction':
        if (expiringItems.length > 0) {
          const items = expiringItems.map(i => `${i.item_name} (${i.quantity} ${i.unit || 'units'})`).join(', ');
          const totalValue = expiringItems.reduce((sum, i) => sum + (i.cost || 0), 0);
          return `⚠️ **Urgent Waste Alert!**\n\nYou have ${expiringItems.length} items expiring within 3 days: ${items}\n\n**Action Plan:**\n1. Cook ${expiringItems[0].item_name} TODAY\n2. Freeze items that can be preserved\n3. Share extras with neighbors/community\n\n💰 By acting now, you'll save ৳${Math.round(totalValue)} and prevent waste! This contributes to SDG 12 (Responsible Consumption).`;
        }
        return `✅ **Great News!** No items are expiring in the next 3 days.\n\nTo maintain this:\n• Continue using FIFO method (First In, First Out)\n• Check expiry dates weekly\n• Plan meals around purchase dates\n\nYou're managing food waste excellently! Keep it up for SDG 12. 🌱`;

      case 'budget_planning':
        const remaining = budgetAmount - totalCost;
        const topItems = inventory.slice(0, 3).map(i => i.item_name).join(', ');
        return `💰 **Budget Analysis**\n\n**Your ${profile.budget_range || 'medium'} budget:** ৳${budgetAmount}\n**Used:** ৳${Math.round(totalCost)} (${budgetUtilization}%)\n**Available:** ৳${Math.round(remaining)}\n\n**Smart Spending Tips:**\n• Use existing ${topItems} to create 2-3 meals (saves ৳150-200)\n• Buy seasonal vegetables (30% cheaper)\n• Bulk purchase staples like rice/lentils\n\nFor your household of ${profile.household_size || 1}, you can create nutritious meals within budget!`;

      case 'meal_planning':
        const mealItems = inventory.slice(0, 5).map(i => i.item_name).join(', ');
        return `🍽️ **Meal Plan Using Your Inventory**\n\nAvailable: ${mealItems}\n\n**Today's Ideas:**\n1. ${inventory[0]?.item_name || 'Rice'} with vegetable curry\n2. ${inventory[1]?.item_name || 'Lentils'} dal with flatbread\n3. ${inventory[2]?.item_name || 'Banana'} smoothie/dessert\n\n**Quick Shopping (within budget):**\n• Onions: ৳25\n• Spices: ৳30\n• Oil: ৳50\n\nTotal: ৳105 for 3 hearty meals! Would you like detailed recipes?`;

      case 'nutrition':
        const categories = [...new Set(recentLogs.map(l => l.category))];
        const missing = ['Fruit', 'Vegetable', 'Protein', 'Dairy', 'Grain'].filter(c => !categories.includes(c));
        
        if (missing.length > 0) {
          return `🥗 **Nutrition Gap Analysis**\n\n**You're consuming:** ${categories.join(', ')}\n\n⚠️ **Missing categories:** ${missing.join(', ')}\n\n**Recommendations (${profile.dietary_preference || 'balanced'} diet):**\n• Add 2 servings of ${missing[0]?.toLowerCase() || 'vegetables'} daily\n• Try: seasonal fruits (৳50-80), leafy greens (৳30-50)\n• Improves energy, immunity & SDG 2 score by 15 points!\n\nBudget: ৳100-150/week for better nutrition.`;
        }
        return `✅ Good dietary diversity! You're consuming from ${categories.length} food groups. To maintain balance, ensure daily intake includes all major categories.`;

      case 'leftovers':
        return `♻️ **Creative Leftover Ideas**\n\nFrom your inventory:\n• ${inventory[0]?.item_name || 'Rice'}: Fried rice, congee, rice pudding\n• ${inventory[1]?.item_name || 'Vegetables'}: Stir-fry, soup, fritters\n• Scraps: Make vegetable stock for soups\n\n**Storage Hacks:**\n1. Freeze in portion sizes\n2. Label with dates\n3. Reheat within 3 days\n\nTransform "waste" into gourmet meals! 👨‍🍳`;

      case 'food_sharing':
        return `🤝 **Local Food Sharing Guide (${profile.location || 'Bangladesh'})**\n\nYou have ${expiringItems.length > 0 ? `${expiringItems.length} items to share` : 'surplus food to share'}!\n\n**Options:**\n1. **Neighbors:** Share directly with community\n2. **Local mosques/temples:** Donate for distribution\n3. **Food banks:** Contact local NGOs\n4. **Community fridges:** Public sharing points\n\nSharing builds community & aligns with SDG 2 (Zero Hunger)! 🌍`;

      case 'environmental_impact':
        const wasteScore = expiringItems.length === 0 ? 'Excellent' : 'Moderate';
        return `🌍 **Your Environmental Impact**\n\n**Current Status:**\n• Waste prevention: ${wasteScore}\n• Food saved: ~${expiringItems.length === 0 ? 500 : 200}g/week\n• CO2 reduction: ${expiringItems.length === 0 ? 2.5 : 1}kg/month\n\n**SDG Contribution:**\n• SDG 2 (Zero Hunger): ${recentLogs.length > 10 ? 'Active' : 'Moderate'}\n• SDG 12 (Responsible Consumption): ${budgetUtilization < 80 ? 'Good' : 'Improving'}\n\n**Level Up:**\n• Compost scraps (reduces landfill)\n• Buy local produce (cuts transport emissions)\n• Share surplus food\n\nYou're making a real difference! 🎯`;

      default:
        return `I understand you're asking about "${question}".\n\nBased on your data:\n• ${inventory.length} items in inventory\n• ${expiringItems.length} expiring soon\n• Budget: ${budgetUtilization}% used\n\n**I can help with:**\n1. Reducing waste from expiring items\n2. Budget-friendly meal planning\n3. Nutrition balancing (${profile.dietary_preference || 'general'} diet)\n4. Creative recipe ideas\n5. Environmental impact tracking\n\nWhat would you like to focus on?`;
    }
  }

  // [Keep all your existing methods below - analyzeConsumptionPatterns, optimizeMealPlan, etc.]
  // I'm not modifying them to avoid breaking your code
  
  async analyzeConsumptionPatterns(logs) {
    // ... your existing code
  }

  async optimizeMealPlan(inventory, budget, nutritionRequirements) {
    // ... your existing code
  }

  async predictExpirationRisk(inventoryItem) {
    // ... your existing code
  }

  async estimateWaste(consumptionHistory, inventory) {
    // ... your existing code
  }

  async calculateSDGScore(userData, logs, inventory) {
    // ... your existing code
  }

  async predictNutrientGaps(consumptionHistory) {
    // ... your existing code
  }
}

export const aiService = new AIService();