import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, BookOpen, TrendingUp, Lightbulb, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-3xl p-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
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

      {/* Charts Section */}
      {stats.recentLogs.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
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
            transition={{ delay: 0.6 }}
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
          transition={{ delay: 0.7 }}
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
