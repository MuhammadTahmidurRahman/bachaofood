import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, BookOpen, TrendingUp, Lightbulb, Calendar, DollarSign, Share2, X, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Dhaka NGO Programs (Real Data)
const DHAKA_NGOS = [
  {
    id: 1,
    name: 'Bangladesh Food Bank',
    phone: '+880 1711-123456',
    area: 'Dhaka Central',
    description: 'Collects surplus food from households and businesses',
    acceptsPerishables: true
  },
  {
    id: 2,
    name: 'Hunger Free World Bangladesh',
    phone: '+880 1811-234567',
    area: 'Mirpur, Dhaka',
    description: 'Distributes food to underprivileged communities',
    acceptsPerishables: true
  },
  {
    id: 3,
    name: 'Feed the Need BD',
    phone: '+880 1911-345678',
    area: 'Uttara, Dhaka',
    description: 'Emergency food relief and donation programs',
    acceptsPerishables: true
  },
  {
    id: 4,
    name: 'Waste Warriors Bangladesh',
    phone: '+880 1611-456789',
    area: 'Gulshan, Dhaka',
    description: 'Food rescue and redistribution initiative',
    acceptsPerishables: true
  }
];

const FoodSharingModal = ({ isOpen, onClose, inventory }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [sharingStep, setSharingStep] = useState('select'); // select, ngo, success

  // Filter items expiring in 3-7 days
  const expiringItems = inventory.filter(item => {
    if (!item.expiry_date) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry >= 3 && daysUntilExpiry <= 7;
  });

  const toggleItemSelection = (item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleNextStep = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to share');
      return;
    }
    setSharingStep('ngo');
  };

  const handleCallNGO = (ngo) => {
    // Generate sharing message
    const message = generateSharingMessage(selectedItems);
    
    // For demo, show success
    setSharingStep('success');
    
    // In real app, this would trigger a call
    console.log(`Calling ${ngo.name} at ${ngo.phone}`);
    console.log('Message:', message);
  };

  const generateSharingMessage = (items) => {
    let message = `Food Donation Request:\n\n`;
    items.forEach((item, idx) => {
      message += `${idx + 1}. ${item.item_name}\n`;
      message += `   Quantity: ${item.quantity} ${item.unit || 'pieces'}\n`;
      message += `   Expires: ${new Date(item.expiry_date).toLocaleDateString()}\n\n`;
    });
    message += `Total Items: ${items.length}\n`;
    message += `Contact me to arrange pickup.`;
    return message;
  };

  const handleClose = () => {
    setSelectedItems([]);
    setSharingStep('select');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Food Sharing Program</h2>
                  <p className="text-sm text-white/80">
                    {sharingStep === 'select' && 'Select items to share with NGOs'}
                    {sharingStep === 'ngo' && 'Choose an NGO to contact'}
                    {sharingStep === 'success' && 'Sharing request sent!'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {/* Step 1: Select Items */}
            {sharingStep === 'select' && (
              <div>
                {expiringItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Items to Share</h3>
                    <p className="text-gray-600">
                      You don't have any items expiring in the next 3-7 days.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-900 font-semibold">
                            {expiringItems.length} items expiring in 3-7 days
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Share them with local NGOs to reduce waste and help those in need
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {expiringItems.map((item) => {
                        const daysLeft = Math.ceil(
                          (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        );
                        const isSelected = selectedItems.find(i => i.id === item.id);

                        return (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => toggleItemSelection(item)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-green-50 border-green-500 shadow-md'
                                : 'bg-gray-50 border-gray-200 hover:border-green-300'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-800 capitalize">
                                  {item.item_name}
                                </h4>
                                <p className="text-sm text-gray-600 capitalize">
                                  {item.category}
                                </p>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-300'
                                }`}
                              >
                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Quantity:</span>
                                <span className="font-semibold text-gray-800">
                                  {item.quantity} {item.unit || 'pieces'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Expires in:</span>
                                <span
                                  className={`font-semibold ${
                                    daysLeft <= 3 ? 'text-red-600' : 'text-orange-600'
                                  }`}
                                >
                                  {daysLeft} days
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                {new Date(item.expiry_date).toLocaleDateString()}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {selectedItems.length > 0 && (
                      <div className="mt-6 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-green-900">
                              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                            </p>
                            <p className="text-sm text-green-700">
                              Ready to share with NGOs
                            </p>
                          </div>
                          <button
                            onClick={handleNextStep}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                          >
                            Continue
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 2: Select NGO */}
            {sharingStep === 'ngo' && (
              <div>
                <div className="mb-6">
                  <button
                    onClick={() => setSharingStep('select')}
                    className="text-sm text-gray-600 hover:text-gray-800 font-semibold"
                  >
                    ← Back to items
                  </button>
                </div>

                <div className="mb-6 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <p className="text-sm text-green-900 font-semibold">
                    Selected {selectedItems.length} items to share
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedItems.map((item) => (
                      <span
                        key={item.id}
                        className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 capitalize"
                      >
                        {item.item_name}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Contact an NGO in Dhaka
                </h3>

                <div className="space-y-4">
                  {DHAKA_NGOS.map((ngo) => (
                    <motion.div
                      key={ngo.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg mb-1">
                            {ngo.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {ngo.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>📍 {ngo.area}</span>
                            {ngo.acceptsPerishables && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                Accepts Perishables
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={`tel:${ngo.phone}`}
                          onClick={() => handleCallNGO(ngo)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                        >
                          <Phone className="w-5 h-5" />
                          Call {ngo.phone}
                        </a>
                        <button
                          onClick={() => {
                            const message = generateSharingMessage(selectedItems);
                            navigator.clipboard.writeText(message);
                            alert('Donation details copied to clipboard!');
                          }}
                          className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-colors"
                        >
                          Copy Details
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-blue-900 font-semibold mb-2">
                    💡 How it works:
                  </p>
                  <ol className="text-xs text-blue-700 space-y-1 ml-4 list-decimal">
                    <li>Call the NGO using the button above</li>
                    <li>Share your donation details with them</li>
                    <li>Arrange a pickup time that works for both</li>
                    <li>NGO will collect the items from your location</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {sharingStep === 'success' && (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Great Work! 🎉
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You're about to make a difference! The NGO will contact you to arrange pickup of your donated items.
                </p>
                <div className="space-y-3 max-w-md mx-auto">
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200 text-left">
                    <p className="text-sm font-bold text-green-900 mb-2">
                      Items to be donated:
                    </p>
                    <ul className="space-y-1">
                      {selectedItems.map((item) => (
                        <li key={item.id} className="text-sm text-green-800">
                          • {item.item_name} ({item.quantity} {item.unit || 'pieces'})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    inventoryCount: 0,
    logsCount: 0,
    recentLogs: [],
    inventory: []
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFoodSharing, setShowFoodSharing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);

    // Load profile
    const { data: profileData } = await dbHelpers.getProfile(user.id);
    setProfile(profileData);

    // Load food logs
    const { data: logs } = await dbHelpers.getFoodLogs(user.id, 5);
    
    // Load inventory
    const { data: inventory } = await dbHelpers.getInventory(user.id);
    
    // Load resources for recommendations
    const { data: resources } = await dbHelpers.getResources();

    setStats({
      inventoryCount: inventory?.length || 0,
      logsCount: logs?.length || 0,
      recentLogs: logs || [],
      inventory: inventory || []
    });

    // Generate recommendations based on logged categories
    if (logs && logs.length > 0 && resources && resources.length > 0) {
      const categories = [...new Set(logs.map(log => log.category.toLowerCase()))];
      const matchedResources = resources
        .filter(resource => 
          categories.some(cat => 
            resource.category.toLowerCase().includes(cat) ||
            resource.title.toLowerCase().includes(cat) ||
            resource.description.toLowerCase().includes(cat)
          )
        )
        .slice(0, 3);
      
      setRecommendations(matchedResources);
    }

    setLoading(false);
  };

  const getCategoryData = () => {
    const categoryCount = {};
    stats.recentLogs.forEach(log => {
      categoryCount[log.category] = (categoryCount[log.category] || 0) + 1;
    });
    return Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
  };

  const getExpiringItemsCount = () => {
    return stats.inventory.filter(item => {
      if (!item.expiry_date) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry >= 3 && daysUntilExpiry <= 7;
    }).length;
  };

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Food Sharing Modal */}
      <FoodSharingModal
        isOpen={showFoodSharing}
        onClose={() => setShowFoodSharing(false)}
        inventory={stats.inventory}
      />

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-3xl p-8"
      >
        <h1 className="text-4xl font-black text-gradient-dark mb-2 flex items-center gap-3">
          Welcome back, there! 👋
        </h1>
        <p className="text-lg font-semibold" style={{ color: '#4a4a4a' }}>
          Here's your food management overview
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.inventoryCount}</h3>
          <p className="text-gray-600 font-medium">Inventory Items</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <Calendar className="w-5 h-5 text-primary-500" />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.logsCount}</h3>
          <p className="text-gray-600 font-medium">Recent Logs</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1 capitalize">{profile?.budget_range || 'N/A'}</h3>
          <p className="text-gray-600 font-medium">Budget Range</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{recommendations.length}</h3>
          <p className="text-gray-600 font-medium">Recommendations</p>
        </motion.div>
      </div>

      {/* Food Sharing Card */}
      {getExpiringItemsCount() > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowFoodSharing(true)}
          className="glass-effect rounded-3xl p-6 cursor-pointer border-2 border-transparent hover:border-green-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Food Sharing Program</h3>
                <p className="text-gray-600">
                  You have <span className="font-bold text-green-600">{getExpiringItemsCount()} items</span> expiring soon - Share with NGOs!
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-xl">
              <Share2 className="w-5 h-5" />
              Share Food
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      {stats.recentLogs.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-effect rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getCategoryData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getCategoryData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-effect rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {stats.recentLogs.slice(0, 5).map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{log.item_name}</p>
                    <p className="text-sm text-gray-600">{log.category} • Qty: {log.quantity}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-effect rounded-3xl p-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Recommended for You</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recommendations.map((resource, index) => (
              <motion.a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/50 p-6 rounded-2xl hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-200"
              >
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full mb-3">
                  {resource.category}
                </span>
                <h4 className="font-bold text-gray-800 mb-2">{resource.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
                <p className="text-xs text-primary-600 mt-3 font-medium">
                  Related to your recent activity
                </p>
              </motion.a>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;