import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Calendar, DollarSign, Trash2, Edit, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { differenceInDays } from 'date-fns';

const Inventory = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    category: 'Vegetable',
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    cost: ''
  });

  const categories = ['All', 'Fruit', 'Vegetable', 'Dairy', 'Protein', 'Grain', 'Pantry', 'Other'];

  useEffect(() => {
    loadInventory();
  }, [user]);

  useEffect(() => {
    if (filterCategory === 'All') {
      setFilteredInventory(inventory);
    } else {
      setFilteredInventory(inventory.filter(item => item.category === filterCategory));
    }
  }, [filterCategory, inventory]);

  const loadInventory = async () => {
    const { data } = await dbHelpers.getInventory(user.id);
    setInventory(data || []);
    setFilteredInventory(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const itemData = {
      user_id: user.id,
      ...formData,
      quantity: parseFloat(formData.quantity),
      cost: formData.cost ? parseFloat(formData.cost) : null
    };
    
    if (editingItem) {
      await dbHelpers.updateInventoryItem(editingItem.id, formData);
    } else {
      await dbHelpers.addInventoryItem(itemData);
    }
    
    loadInventory();
    resetForm();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      quantity: item.quantity,
      category: item.category,
      purchase_date: item.purchase_date,
      expiry_date: item.expiry_date || '',
      cost: item.cost || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await dbHelpers.deleteInventoryItem(id);
      loadInventory();
    }
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      quantity: '',
      category: 'Vegetable',
      purchase_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      cost: ''
    });
    setShowForm(false);
    setEditingItem(null);
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'No expiry', color: 'bg-gray-100 text-gray-700' };
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
    if (days <= 3) return { label: `${days}d left`, color: 'bg-orange-100 text-orange-700' };
    if (days <= 7) return { label: `${days}d left`, color: 'bg-yellow-100 text-yellow-700' };
    return { label: `${days}d left`, color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Inventory</h1>
          <p className="text-gray-600">Manage your food items</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field pl-10 pr-4"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowForm(!showForm); setEditingItem(null); }}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add Item
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-effect rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6">{editingItem ? 'Edit' : 'Add'} Inventory Item</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="input-field"
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary">
                  {editingItem ? 'Update' : 'Add'} Item
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={resetForm} className="btn-secondary">
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
      ) : filteredInventory.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-effect rounded-3xl p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
          <p className="text-gray-600">Add items to your inventory</p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item, index) => {
            const expiryStatus = getExpiryStatus(item.expiry_date);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="glass-effect rounded-2xl p-6 card-hover"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{item.item_name}</h3>
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEdit(item)} className="p-2 hover:bg-blue-50 rounded-lg">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </motion.button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-primary-600">Qty: {item.quantity}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${expiryStatus.color}`}>
                    {expiryStatus.label}
                  </span>
                  {item.cost && (
                    <p className="flex items-center text-gray-600 text-sm">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ${item.cost}
                    </p>
                  )}
                  <p className="flex items-center text-gray-600 text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(item.purchase_date).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inventory;
