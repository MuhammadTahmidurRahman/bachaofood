import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Calendar, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';

const FoodLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    category: 'Vegetable',
    notes: ''
  });

  const categories = ['Fruit', 'Vegetable', 'Dairy', 'Protein', 'Grain', 'Pantry', 'Other'];

  useEffect(() => {
    loadLogs();
  }, [user]);

  const loadLogs = async () => {
    const { data } = await dbHelpers.getFoodLogs(user.id);
    setLogs(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const logData = {
      user_id: user.id,
      ...formData,
      quantity: parseFloat(formData.quantity)
    };
    
    const { error } = await dbHelpers.createFoodLog(logData);
    
    if (!error) {
      loadLogs();
      setFormData({ item_name: '', quantity: '', category: 'Vegetable', notes: '' });
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Food Logs</h1>
          <p className="text-gray-600">Track your daily food consumption</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Add Log
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-effect rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6">Add New Log</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Apple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn-primary"
                >
                  Add Log
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div>
        </div>
      ) : logs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-effect rounded-3xl p-12 text-center"
        >
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No logs yet</h3>
          <p className="text-gray-600">Start tracking your food consumption</p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="glass-effect rounded-2xl p-6 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{log.item_name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center text-gray-600">
                      <Tag className="w-4 h-4 mr-1" />
                      {log.category}
                    </span>
                    <span className="text-gray-600">
                      Qty: <span className="font-semibold">{log.quantity}</span>
                    </span>
                    <span className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {log.notes && (
                    <p className="mt-2 text-gray-600 text-sm">{log.notes}</p>
                  )}
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  log.category === 'Fruit' ? 'bg-red-100 text-red-700' :
                  log.category === 'Vegetable' ? 'bg-green-100 text-green-700' :
                  log.category === 'Dairy' ? 'bg-blue-100 text-blue-700' :
                  log.category === 'Protein' ? 'bg-purple-100 text-purple-700' :
                  log.category === 'Grain' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {log.category}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodLogs;
