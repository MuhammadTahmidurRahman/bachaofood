import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Calendar, Trash2, Edit, Filter, Search } from 'lucide-react';
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
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [foodItems, setFoodItems] = useState([]);

  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    category: 'Vegetable',
    unit: 'piece',
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    cost: ''
  });

  const categories = [
    'All',
    'Fruit',
    'Vegetable',
    'Dairy',
    'Protein',
    'Grain',
    'Pantry',
    'Beverages',
    'Snacks',
    'Frozen',
    'Condiments',
    'Other'
  ];

  useEffect(() => {
    if (user) {
      loadInventory();
      loadFoodItems();
    }
  }, [user]);

  useEffect(() => {
    setFilteredInventory(
      filterCategory === 'All'
        ? inventory
        : inventory.filter(item => item.category === filterCategory)
    );
  }, [filterCategory, inventory]);

  const loadInventory = async () => {
    setLoading(true);
    const { data } = await dbHelpers.getInventory(user.id);
    setInventory(data || []);
    setFilteredInventory(data || []);
    setLoading(false);
  };

  const loadFoodItems = async () => {
    const { data } = await dbHelpers.getFoodItems();
    setFoodItems(data || []);
  };

  const selectFoodItem = (foodItem) => {
    setFormData({
      item_name: foodItem.name,
      quantity: 1,
      category: foodItem.category || 'Other',
      unit: foodItem.unit || 'piece',
      purchase_date: new Date().toISOString().split('T')[0],
      expiry_date: foodItem.expiration_days
        ? new Date(Date.now() + foodItem.expiration_days * 86400000)
            .toISOString()
            .split('T')[0]
        : '',
      cost: Number(foodItem.cost_per_unit || 0)
    });

    setShowForm(true);
    setShowFoodPicker(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const itemData = {
      user_id: user.id,
      item_name: formData.item_name,
      quantity: parseFloat(formData.quantity),
      category: formData.category,
      purchase_date: formData.purchase_date,
      expiry_date: formData.expiry_date || null,
      cost: formData.cost ? parseFloat(formData.cost) : null
    };

    if (editingItem) {
      await dbHelpers.updateInventoryItem(editingItem.id, itemData);
    } else {
      await dbHelpers.addInventoryItem(itemData);
    }

    await loadInventory();
    resetForm();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      quantity: item.quantity,
      category: item.category,
      unit: item.unit || 'piece',
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
      unit: 'piece',
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
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-gradient-dark mb-2">Inventory</h1>
          <p className="text-lg font-semibold" style={{ color: '#4a4a4a' }}>
            Manage your food items
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field pl-10 pr-4"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowFoodPicker(true);
              setShowForm(false);
              setEditingItem(null);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Browse Food Items
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowForm(!showForm);
              setEditingItem(null);
              setShowFoodPicker(false);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </motion.button>
        </div>
      </motion.div>

      {/* Food Items Picker Modal */}
      <AnimatePresence>
        {showFoodPicker && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFoodPicker(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-3xl w-full max-w-3xl p-8 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gradient-dark">Select Food Item</h3>
                <button 
                  onClick={() => setShowFoodPicker(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {foodItems.length === 0 ? (
                  <div className="text-center p-12">
                    <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg">No food items available.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {foodItems.map(fi => (
                      <motion.div 
                        key={fi.id}
                        whileHover={{ scale: 1.02 }}
                        className="glass-effect rounded-2xl p-5 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-lg text-gray-800">
                            {fi.name}{" "}
                            <span className="text-sm text-gray-500 font-normal">({fi.unit})</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{fi.category}</div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-lg font-bold text-gray-800">
                            ৳{Number(fi.cost_per_unit).toFixed(2)}
                          </div>

                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => selectFoodItem(fi)} 
                            className="btn-primary"
                          >
                            Add
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} 
            className="glass-effect rounded-3xl p-8 floating-shadow"
          >
            <h3 className="text-2xl font-bold text-gradient-dark mb-6">
              {editingItem ? "Edit" : "Add"} Inventory Item
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#2d2d2d' }}>
                    Item Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="input-field" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#2d2d2d' }}>
                    Quantity *
                  </label>
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
                  <label className="block text-sm font-bold mb-2" style={{ color: '#2d2d2d' }}>
                    Category *
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    {categories.filter(c => c !== 'All')
                      .map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#2d2d2d' }}>
                    Purchase Date
                  </label>
                  <input 
                    type="date" 
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="input-field" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#2d2d2d' }}>
                    Expiry Date
                  </label>
                  <input 
                    type="date" 
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="input-field" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#2d2d2d' }}>
                    Cost (BDT)
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="input-field" 
                    placeholder="৳0.00" 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  className="btn-primary"
                >
                  {editingItem ? "Update" : "Add"} Item
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button" 
                  onClick={resetForm} 
                  className="btn-secondary"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-12 w-12 border-t-4 border-gray-800 rounded-full"></div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-effect rounded-3xl p-12 text-center floating-shadow"
        >
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No items found</h3>
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
                className="stat-card card-hover floating-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{item.item_name}</h3>

                  <div className="flex gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(item)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </motion.button>

                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </motion.button>
                  </div>
                </div>

                <p className="text-2xl font-bold text-gray-800 mb-3">Qty: {item.quantity}</p>
                
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${expiryStatus.color}`}>
                  {expiryStatus.label}
                </span>

                {item.cost && (
                  <p className="text-lg font-bold text-gray-700 mb-2">
                    ৳{Number(item.cost).toFixed(2)}
                  </p>
                )}

                <p className="text-gray-600 text-sm flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(item.purchase_date).toLocaleDateString()}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inventory;