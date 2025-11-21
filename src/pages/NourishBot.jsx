// src/pages/NourishBot.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Bot, User, Sparkles, Brain, Leaf, DollarSign, Share2, Recycle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { aiService } from '../lib/aiService';

const NourishBot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m NourishBot, your AI food management assistant. I can help you with:\n\n• 🗑️ Food waste reduction tips\n• 🥗 Nutrition advice and meal balancing\n• 💰 Budget meal planning\n• 🍳 Creative leftover transformation ideas\n• 🤝 Local food sharing guidance\n• 🌍 Environmental impact insights\n\nHow can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [sessionContext, setSessionContext] = useState({
    topics: [],
    preferences: [],
    previousSuggestions: []
  });
  const [apiConfigured, setApiConfigured] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) loadUserData();
    checkApiConfiguration();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkApiConfiguration = () => {
    const hasGroqKey = import.meta.env.VITE_GROQ_API_KEY && 
                       import.meta.env.VITE_GROQ_API_KEY.trim() !== '';
    setApiConfigured(hasGroqKey);
    
    if (!hasGroqKey) {
      console.warn('Groq API not configured - using enhanced fallback responses');
    }
  };

  const loadUserData = async () => {
    try {
      const [profileRes, logsRes, inventoryRes] = await Promise.all([
        dbHelpers.getProfile(user.id),
        dbHelpers.getFoodLogs(user.id, 30),
        dbHelpers.getInventory(user.id)
      ]);

      const userDataObj = {
        profile: profileRes.data,
        recentLogs: logsRes.data || [],
        inventory: inventoryRes.data || [],
        preferences: {
          dietary: profileRes.data?.dietary_preference || 'none specified',
          budget: profileRes.data?.budget_range || 'not specified',
          household_size: profileRes.data?.household_size || 1,
          location: profileRes.data?.location || 'Bangladesh'
        }
      };

      setUserData(userDataObj);

      // Analyze inventory for expiring items
      if (inventoryRes.data?.length > 0) {
        const expiringItems = inventoryRes.data.filter(item => {
          if (!item.expiry_date) return false;
          const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
        });

        if (expiringItems.length > 0) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `⚠️ Quick reminder: You have ${expiringItems.length} item(s) expiring soon: ${expiringItems.map(i => i.item_name).join(', ')}. Would you like suggestions on how to use them?`
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const enrichMessageWithContext = (userMessage) => {
    let enrichedMessage = userMessage;
    
    // Add inventory context if relevant
    const inventoryKeywords = ['inventory', 'fridge', 'pantry', 'have', 'ingredients', 'what can i make', 'recipe'];
    if (inventoryKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)) && userData?.inventory?.length > 0) {
      const inventoryList = userData.inventory.map(item => 
        `${item.item_name} (${item.quantity} ${item.unit || ''})`
      ).join(', ');
      enrichedMessage += `\n[Context: Current inventory includes: ${inventoryList}]`;
    }

    // Add dietary preference context
    const dietKeywords = ['meal', 'recipe', 'cook', 'eat', 'diet', 'nutrition'];
    if (dietKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)) && userData?.preferences?.dietary) {
      enrichedMessage += `\n[Context: Dietary preference: ${userData.preferences.dietary}]`;
    }

    // Add budget context
    const budgetKeywords = ['budget', 'cheap', 'affordable', 'cost', 'price', 'save money'];
    if (budgetKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)) && userData?.preferences?.budget) {
      enrichedMessage += `\n[Context: Budget range: ${userData.preferences.budget} BDT]`;
    }

    return enrichedMessage;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const enrichedMessage = enrichMessageWithContext(userMessage);
      
      const conversationHistory = messages
        .slice(1)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }));

      const userContext = {
        inventory: userData?.inventory?.map(i => ({
          name: i.item_name,
          quantity: i.quantity,
          unit: i.unit,
          expiry: i.expiry_date,
          daysUntilExpiry: i.expiry_date ? 
            Math.ceil((new Date(i.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
        })) || [],
        recentActivity: userData?.recentLogs?.slice(0, 10).map(log => ({
          food: log.item_name,
          quantity: log.quantity,
          category: log.category,
          date: log.created_at
        })) || [],
        preferences: userData?.preferences || {},
        sessionContext: sessionContext
      };

      let response;
      
      // Try AI service first
      try {
        response = await aiService.chatBotResponse(
          enrichedMessage,
          conversationHistory,
          userContext
        );
      } catch (apiError) {
        console.warn('AI API failed, using enhanced fallback:', apiError.message);
        // Use ENHANCED fallback that uses user data
        response = getContextualFallbackResponse(userMessage, userContext);
      }

      updateSessionContext(userMessage, response);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response 
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      
      // Final fallback
      const fallbackResponse = getContextualFallbackResponse(userMessage, {
        inventory: userData?.inventory?.map(i => ({
          name: i.item_name,
          quantity: i.quantity,
          unit: i.unit,
          expiry: i.expiry_date,
          daysUntilExpiry: i.expiry_date ? 
            Math.ceil((new Date(i.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
        })) || [],
        preferences: userData?.preferences || {}
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallbackResponse
      }]);
    }

    setLoading(false);
  };

  const getContextualFallbackResponse = (userMessage, context) => {
    const message = userMessage.toLowerCase();
    const { inventory = [], preferences = {}, recentActivity = [] } = context;
    
    // Budget meal planning - CONTEXTUAL
    if (message.includes('budget') || message.includes('cheap') || message.includes('affordable') || message.includes('meal idea')) {
      let response = '💰 **Budget-Friendly Meal Ideas for You**\n\n';
      
      // Check budget preference
      const budgetRange = preferences.budget || 'moderate';
      response += `Based on your ${budgetRange} budget:\n\n`;
      
      // Suggest meals based on inventory
      if (inventory.length > 0) {
        const hasRice = inventory.some(i => i.name.toLowerCase().includes('rice'));
        const hasLentils = inventory.some(i => i.name.toLowerCase().includes('lentil') || i.name.toLowerCase().includes('dal'));
        const hasVegetables = inventory.filter(i => i.name.toLowerCase().includes('vegetable') || 
                                                     i.name.toLowerCase().includes('potato') ||
                                                     i.name.toLowerCase().includes('tomato') ||
                                                     i.name.toLowerCase().includes('onion')).length > 0;
        const hasEggs = inventory.some(i => i.name.toLowerCase().includes('egg'));
        
        response += '**Based on Your Current Inventory:**\n\n';
        
        if (hasRice && hasLentils) {
          response += '1. **Rice & Dal Combo** (৳30-40/person)\n';
          response += '   - You have rice and lentils! Perfect budget staple\n';
          response += '   - Add turmeric, garlic, cumin for flavor\n\n';
        }
        
        if (hasVegetables) {
          response += '2. **Mixed Vegetable Curry** (৳40-60/person)\n';
          response += `   - Use your vegetables: ${inventory.filter(i => i.name.toLowerCase().includes('vegetable') || i.name.toLowerCase().includes('potato')).map(i => i.name).slice(0, 3).join(', ')}\n`;
          response += '   - Add local spices and serve with rice\n\n';
        }
        
        if (hasEggs) {
          response += '3. **Egg Curry or Bhurji** (৳25-35/person)\n';
          response += '   - You have eggs in inventory!\n';
          response += '   - Quick, protein-rich, and budget-friendly\n\n';
        }
        
        // Add items expiring soon
        const expiringSoon = inventory.filter(i => i.daysUntilExpiry !== null && i.daysUntilExpiry <= 5);
        if (expiringSoon.length > 0) {
          response += `⚠️ **Priority: Use These Soon!**\n`;
          expiringSoon.forEach(item => {
            response += `- ${item.name} (expires in ${item.daysUntilExpiry} days)\n`;
          });
          response += '\n';
        }
      } else {
        response += '**Shopping List for Budget Meals:**\n\n';
        response += '1. **Rice** (৳50-60/kg) - 2-3 days supply\n';
        response += '2. **Dal/Lentils** (৳80-120/kg) - protein rich\n';
        response += '3. **Seasonal Vegetables** (৳30-50/kg)\n';
        response += '4. **Eggs** (৳10-12 each) - versatile protein\n';
        response += '5. **Potatoes** (৳30-40/kg) - filling & cheap\n\n';
      }
      
      response += '**💡 Budget Tips:**\n';
      response += '- Shop at local markets (20-30% cheaper)\n';
      response += '- Buy seasonal produce\n';
      response += `- Cook for ${preferences.household_size || 1} people - batch cooking saves money\n`;
      response += '- Use leftovers creatively next day\n\n';
      response += 'Want specific recipes for any of these items?';
      
      return response;
    }
    
    // Recipe suggestions - CONTEXTUAL
    if (message.includes('recipe') || message.includes('cook') || message.includes('what can i make')) {
      let response = '🍳 **Recipe Suggestions Based on Your Inventory**\n\n';
      
      if (inventory.length === 0) {
        return '🍳 I notice you haven\'t added any items to your inventory yet! Add items to get personalized recipe suggestions based on what you have.\n\nIn the meantime, what type of cuisine are you interested in? (Bengali, Indian, Chinese, Continental?)';
      }
      
      // Group inventory by category
      const proteins = inventory.filter(i => 
        i.name.toLowerCase().includes('chicken') || 
        i.name.toLowerCase().includes('fish') || 
        i.name.toLowerCase().includes('egg') ||
        i.name.toLowerCase().includes('meat')
      );
      
      const vegetables = inventory.filter(i => 
        i.name.toLowerCase().includes('vegetable') ||
        i.name.toLowerCase().includes('potato') ||
        i.name.toLowerCase().includes('tomato') ||
        i.name.toLowerCase().includes('onion') ||
        i.name.toLowerCase().includes('carrot')
      );
      
      const grains = inventory.filter(i => 
        i.name.toLowerCase().includes('rice') ||
        i.name.toLowerCase().includes('flour') ||
        i.name.toLowerCase().includes('bread')
      );
      
      response += `**Your Inventory (${inventory.length} items):**\n`;
      if (proteins.length > 0) response += `🥩 Proteins: ${proteins.map(i => i.name).join(', ')}\n`;
      if (vegetables.length > 0) response += `🥬 Vegetables: ${vegetables.map(i => i.name).join(', ')}\n`;
      if (grains.length > 0) response += `🌾 Grains: ${grains.map(i => i.name).join(', ')}\n`;
      response += '\n';
      
      // Suggest specific recipes
      response += '**Recommended Recipes:**\n\n';
      
      if (proteins.length > 0 && vegetables.length > 0) {
        const protein = proteins[0].name;
        const veg = vegetables[0].name;
        response += `1. **${protein} & ${veg} Curry**\n`;
        response += `   - Use: ${protein}, ${veg}, onions, spices\n`;
        response += `   - Time: 30-40 mins | Serves: ${preferences.household_size || 2}\n`;
        response += `   - Dietary: ${preferences.dietary !== 'none specified' ? '✓ Fits your ' + preferences.dietary + ' preference' : 'Regular'}\n\n`;
      }
      
      if (grains.length > 0 && vegetables.length > 1) {
        response += `2. **Vegetable Fried ${grains[0].name}**\n`;
        response += `   - Use: ${grains[0].name}, ${vegetables.slice(0, 3).map(v => v.name).join(', ')}\n`;
        response += `   - Time: 20 mins | Quick & Easy\n\n`;
      }
      
      // Items expiring soon - PRIORITY
      const urgentItems = inventory.filter(i => i.daysUntilExpiry !== null && i.daysUntilExpiry <= 2);
      if (urgentItems.length > 0) {
        response += `🚨 **URGENT - Use These First:**\n`;
        urgentItems.forEach(item => {
          response += `- **${item.name}** expires in ${item.daysUntilExpiry} day(s)!\n`;
        });
        response += '\nWould you like specific recipes to use these items?\n\n';
      }
      
      response += 'Need a specific recipe or have dietary restrictions?';
      return response;
    }
    
    // Waste reduction - CONTEXTUAL
    if (message.includes('waste') || message.includes('reduce') || message.includes('expiring')) {
      let response = '🗑️ **Personalized Food Waste Reduction Plan**\n\n';
      
      if (inventory.length > 0) {
        const expiring = inventory.filter(i => i.daysUntilExpiry !== null && i.daysUntilExpiry <= 7);
        const expired = inventory.filter(i => i.daysUntilExpiry !== null && i.daysUntilExpiry < 0);
        
        if (expired.length > 0) {
          response += `❌ **Already Expired (${expired.length}):**\n`;
          expired.forEach(item => {
            response += `- ${item.name} - dispose safely\n`;
          });
          response += '\n';
        }
        
        if (expiring.length > 0) {
          response += `⚠️ **Action Needed - Expiring Soon (${expiring.length}):**\n`;
          expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
          expiring.forEach(item => {
            response += `- **${item.name}** (${item.daysUntilExpiry} days) - ${item.quantity} ${item.unit}\n`;
          });
          response += '\n**Suggestions:**\n';
          response += `- Cook a meal using ${expiring[0].name} today\n`;
          response += '- Freeze items if possible\n';
          response += '- Share with neighbors/community\n\n';
        } else {
          response += '✅ Great news! No items expiring in the next 7 days.\n\n';
        }
        
        response += '**Waste Prevention Tips for You:**\n';
        response += `- Check your ${inventory.length} items regularly\n`;
        response += '- Use FIFO (First In, First Out) method\n';
        response += `- Plan meals for ${preferences.household_size || 1} people\n`;
        response += '- Store properly to extend freshness\n';
      } else {
        response += 'Start tracking your inventory to get personalized waste reduction tips!\n\n';
        response += '**General Tips:**\n';
        response += '1. Track expiry dates\n';
        response += '2. Use FIFO method\n';
        response += '3. Meal plan weekly\n';
        response += '4. Proper storage\n';
        response += '5. Creative leftover use\n';
      }
      
      return response;
    }
    
    // Nutrition - CONTEXTUAL
    if (message.includes('nutrition') || message.includes('healthy') || message.includes('diet')) {
      let response = '🥗 **Personalized Nutrition Guidance**\n\n';
      
      if (preferences.dietary && preferences.dietary !== 'none specified') {
        response += `**Your Dietary Preference:** ${preferences.dietary}\n\n`;
      }
      
      if (recentActivity && recentActivity.length > 0) {
        response += '**Recent Food Analysis:**\n';
        const categories = [...new Set(recentActivity.map(a => a.category))];
        response += `- Tracked ${recentActivity.length} items across ${categories.length} categories\n`;
        response += `- Categories: ${categories.join(', ')}\n\n`;
        
        const hasVegetables = recentActivity.some(a => a.category === 'Vegetable');
        const hasFruits = recentActivity.some(a => a.category === 'Fruit');
        const hasProtein = recentActivity.some(a => a.category === 'Protein' || a.category === 'Meat');
        
        response += '**Recommendations:**\n';
        if (!hasVegetables) response += '⚠️ Add more vegetables (3-5 servings/day)\n';
        if (!hasFruits) response += '⚠️ Include fruits (2-4 servings/day)\n';
        if (!hasProtein) response += '⚠️ Ensure protein intake (2-3 servings/day)\n';
      } else {
        response += '**Balanced Diet Guidelines:**\n';
        response += '• Fruits: 2-4 servings/day\n';
        response += '• Vegetables: 3-5 servings/day\n';
        response += '• Whole Grains: 6-8 servings/day\n';
        response += '• Protein: 2-3 servings/day\n';
        response += '• Dairy: 2-3 servings/day\n\n';
        
        response += 'Start logging your meals to get personalized nutrition insights!';
      }
      
      return response;
    }
    
    // Default contextual response
    let response = 'I\'m here to help with your food management! ';
    
    if (inventory.length > 0) {
      response += `I see you have ${inventory.length} items in your inventory. `;
      const expiring = inventory.filter(i => i.daysUntilExpiry !== null && i.daysUntilExpiry <= 3);
      if (expiring.length > 0) {
        response += `${expiring.length} items are expiring soon. `;
      }
    }
    
    response += '\n\nI can help you with:\n';
    response += '• Budget meal ideas based on your inventory\n';
    response += '• Recipes using items you have\n';
    response += '• Reducing food waste\n';
    response += '• Nutrition tracking\n';
    response += '• Food sharing options\n\n';
    response += 'What would you like to know more about?';
    
    return response;
  };

  const updateSessionContext = (userMessage, aiResponse) => {
    const topicKeywords = {
      waste: ['waste', 'expired', 'throw', 'spoil'],
      nutrition: ['nutrition', 'healthy', 'vitamin', 'protein', 'diet'],
      budget: ['budget', 'cheap', 'save', 'affordable', 'cost'],
      recipes: ['recipe', 'cook', 'make', 'prepare', 'meal'],
      sharing: ['share', 'donate', 'community', 'neighbor'],
      environment: ['environment', 'sustainable', 'eco', 'carbon', 'green']
    };

    const newTopics = [];
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(k => userMessage.toLowerCase().includes(k))) {
        newTopics.push(topic);
      }
    });

    setSessionContext(prev => ({
      ...prev,
      topics: [...new Set([...prev.topics, ...newTopics])],
      previousSuggestions: aiResponse.includes('recipe') || aiResponse.includes('cook') ? 
        [...prev.previousSuggestions, aiResponse.substring(0, 100)] : prev.previousSuggestions
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { icon: <Recycle className="w-4 h-4" />, text: 'How can I reduce food waste?', topic: 'waste' },
    { icon: <DollarSign className="w-4 h-4" />, text: 'Give me budget meal ideas', topic: 'budget' },
    { icon: <Sparkles className="w-4 h-4" />, text: 'What can I make with my inventory?', topic: 'creative' },
    { icon: <Brain className="w-4 h-4" />, text: 'Nutrition tips for my diet', topic: 'nutrition' },
    { icon: <Share2 className="w-4 h-4" />, text: 'Local food sharing options', topic: 'sharing' },
    { icon: <Leaf className="w-4 h-4" />, text: 'Environmental impact tips', topic: 'environment' }
  ];

  return (
    <div className="space-y-6">
      {/* API Status Warning */}
      {!apiConfigured && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Running in Enhanced Mode
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Using context-aware responses based on your inventory and preferences. For AI-powered insights, configure Groq API key.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-3xl p-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gradient-dark">NourishBot</h1>
            <p className="text-lg font-semibold text-gray-600">Your AI Food Management Assistant</p>
            {sessionContext.topics.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Topics discussed: {sessionContext.topics.join(', ')}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Chat Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-3xl p-6 h-[600px] flex flex-col"
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 px-2">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                      : 'bg-white/70 text-gray-800 shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-medium leading-relaxed">{msg.content}</p>
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/70 rounded-2xl p-4 shadow-sm">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about food management..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="btn-primary px-6"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-3xl p-6"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Questions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => setInput(action.text)}
              className="btn-secondary text-left flex items-center gap-2 hover:scale-105 transition-transform"
              disabled={loading}
            >
              <span className="text-primary-600">{action.icon}</span>
              <span className="flex-1">{action.text}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tips Section */}
      {userData?.inventory?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-3xl p-6 bg-gradient-to-br from-yellow-50 to-orange-50"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            Smart Tips Based on Your Inventory
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            {userData.inventory.filter(i => i.expiry_date).length > 0 && (
              <p>• You have {userData.inventory.filter(i => i.expiry_date).length} items with expiry dates tracked</p>
            )}
            {userData.inventory.length > 10 && (
              <p>• Well-stocked inventory! Consider meal planning to use everything efficiently</p>
            )}
            {userData.inventory.filter(i => i.category === 'Vegetable').length > 3 && (
              <p>• Great vegetable variety! Try making a stir-fry or vegetable soup</p>
            )}
            {userData.inventory.some(i => {
              if (!i.expiry_date) return false;
              const days = Math.ceil((new Date(i.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
              return days <= 3 && days >= 0;
            }) && (
              <p className="text-orange-700 font-semibold">⚠️ Some items are expiring soon - use them first!</p>
            )}
          </div>
        </motion.div>
      )}

      {/* User Context Summary */}
      {userData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-3xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-3">Your Profile</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Inventory Items</p>
              <p className="text-2xl font-bold text-primary-600">{userData.inventory?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Food Logs</p>
              <p className="text-2xl font-bold text-primary-600">{userData.recentLogs?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Dietary Preference</p>
              <p className="text-lg font-semibold text-gray-800 capitalize">
                {userData.preferences?.dietary || 'Not set'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NourishBot;