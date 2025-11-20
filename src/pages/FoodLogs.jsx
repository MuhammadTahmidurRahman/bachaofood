import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Calendar, Tag, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';

/**
 * FoodLogs.jsx
 *
 * Features added:
 * - When creating a log, deduct the logged quantity from inventory (FIFO by expiry_date).
 * - When deleting a log, add the logged quantity back to inventory (best-effort).
 * - Inventory dropdown to pick an existing inventory item (prefills name & category).
 *
 * Notes / Caveats:
 * - If multiple inventory rows exist for the same item_name, the code subtracts from the earliest-expiring rows.
 * - If there's not enough inventory to cover the logged quantity, it will still create the log and deduct what's available,
 *   and will alert the user about the shortfall.
 * - Reverting a deleted log tries to put the quantity back into existing rows; if none exist, it creates a new inventory row.
 * - For stronger ACID guarantees (atomic multi-row updates + log creation) we can add a Postgres RPC to handle it server-side.
 */

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

  const [inventoryList, setInventoryList] = useState([]);
  const [invLoading, setInvLoading] = useState(true);

  const categories = ['Fruit', 'Vegetable', 'Dairy', 'Protein', 'Grain', 'Pantry', 'Other'];

  useEffect(() => {
    if (!user) return;
    loadLogs();
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // reload inventory and logs (use after changes)
  const reloadAll = async () => {
    await Promise.all([loadLogs(), loadInventory()]);
  };

  const loadLogs = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await dbHelpers.getFoodLogs(user.id);
    setLogs(data || []);
    setLoading(false);
  };

  const loadInventory = async () => {
    if (!user) return;
    setInvLoading(true);
    const { data } = await dbHelpers.getInventory(user.id);
    // sort client-side by expiry (earliest first, null/undefined expiry last)
    const sorted = (data || []).sort((a, b) => {
      if (!a.expiry_date && !b.expiry_date) return 0;
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date) - new Date(b.expiry_date);
    });
    setInventoryList(sorted);
    setInvLoading(false);
  };

  // Utility: adjust inventory by item_name across multiple rows (FIFO)
  // operation: 'subtract' or 'add'
  const adjustInventory = async (userId, itemName, qty, operation = 'subtract') => {
    if (!itemName || !qty || qty <= 0) return { success: true, message: 'No adjustment needed' };

    // fetch latest inventory for user
    const { data: invData } = await dbHelpers.getInventory(userId);
    const matching = (invData || [])
      .filter(i => i.item_name?.toLowerCase() === itemName.toLowerCase())
      // sort earliest expiry first (for subtract), for add we can prefer latest expiry or first
      .sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      });

    let remaining = qty;

    if (operation === 'subtract') {
      for (const row of matching) {
        if (remaining <= 0) break;
        const available = Number(row.quantity || 0);
        if (available <= 0) continue;
        const take = Math.min(available, remaining);
        const newQty = Number((available - take).toFixed(6)); // preserve decimals
        await dbHelpers.updateInventoryItem(row.id, { quantity: newQty });
        remaining = Number((remaining - take).toFixed(6));
      }

      // If remaining > 0 then inventory insufficient
      if (remaining > 0) {
        // remaining couldn't be covered: let the caller know (we already deducted what's available)
        return { success: false, message: `Inventory short by ${remaining} (logged anyway).` };
      }

      return { success: true };
    } else if (operation === 'add') {
      // Try to add back into earliest-expiry matching row (or just first matching). If none exist, create a new inventory item.
      if (matching.length === 0) {
        // create a new inventory row to reflect returned quantity
        // minimal fields: user_id, item_name, quantity, category (use formData.category as fallback)
        await dbHelpers.addInventoryItem({
          user_id: userId,
          item_name: itemName,
          quantity: Number(qty),
          category: formData.category || 'Other',
          purchase_date: new Date().toISOString().split('T')[0],
          expiry_date: null,
          cost: null
        });
        return { success: true };
      } else {
        // Add back to the first matching row
        const row = matching[0];
        const newQty = Number((Number(row.quantity || 0) + Number(qty)).toFixed(6));
        await dbHelpers.updateInventoryItem(row.id, { quantity: newQty });
        return { success: true };
      }
    }

    return { success: false, message: 'Unknown operation' };
  };

  // Create a log and adjust inventory (deduct)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const quantityNum = Number(formData.quantity);
    if (!formData.item_name || !quantityNum || quantityNum <= 0) {
      alert('Provide a valid item name and quantity.');
      return;
    }

    const logData = {
      user_id: user.id,
      item_name: formData.item_name,
      quantity: quantityNum,
      category: formData.category,
      notes: formData.notes || ''
    };

    // create log first (so we have a record even if inventory insufficient)
    const { data, error } = await dbHelpers.createFoodLog(logData);
    if (error) {
      console.error('Failed to create log', error);
      alert('Failed to create log. See console.');
      return;
    }

    // attempt to deduct from inventory (best-effort)
    const adjustResult = await adjustInventory(user.id, formData.item_name, quantityNum, 'subtract');
    if (!adjustResult.success) {
      // warn user but still keep the log
      console.warn(adjustResult.message);
      alert(adjustResult.message);
    }

    // reload data
    await reloadAll();

    // reset form
    setFormData({ item_name: '', quantity: '', category: 'Vegetable', notes: '' });
    setShowForm(false);
  };

  // Delete a log and revert inventory (add back)
  const handleDeleteLog = async (log) => {
    if (!log || !user) return;
    if (!confirm(`Delete log for "${log.item_name}" (${log.quantity})? This will return the quantity to inventory.`)) {
      return;
    }

    // Remove the log record
    const { error } = await dbHelpers.deleteFoodLog(log.id);
    if (error) {
      console.error('Failed to delete log', error);
      alert('Failed to delete log. See console.');
      return;
    }

    // Add back the quantity to inventory (best-effort)
    await adjustInventory(user.id, log.item_name, Number(log.quantity), 'add');

    // reload
    await reloadAll();
  };

  // When user selects an inventory item from the dropdown
  const handleSelectInventory = (invId) => {
    const inv = inventoryList.find(i => i.id === invId);
    if (!inv) return;
    setFormData({
      ...formData,
      item_name: inv.item_name,
      category: inv.category || formData.category,
      quantity: 1, // default to 1, user can change
      notes: ''
    });
    // show form if hidden
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Food Logs</h1>
          <p className="text-gray-600">Track your daily food consumption</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-5 h-5 inline mr-2" />
          Add Log
        </motion.button>
      </motion.div>

      {/* Inventory dropdown to quickly pick an item */}
      <div className="mb-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Quick pick from Inventory</label>
        <div className="flex gap-3 items-center">
          <select
            onChange={(e) => handleSelectInventory(e.target.value)}
            className="input-field"
            value=""
          >
            <option value="">Select inventory item...</option>
            {invLoading ? <option>Loading...</option> :
              inventoryList.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.item_name} — Qty: {Number(inv.quantity).toFixed(2)}
                </option>
              ))
            }
          </select>

          <button onClick={() => { setFormData({ item_name: '', quantity: '', category: 'Vegetable', notes: '' }); setShowForm(true); }} className="btn-outline">
            Manual Log
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-effect rounded-3xl p-8">
            <h3 className="text-2xl font-bold mb-6">Add New Log</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                  <input type="text" required value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="input-field" placeholder="e.g., Apple" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                  <input type="number" required step="0.01" value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="input-field" placeholder="e.g., 2" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <input type="text" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field" placeholder="Optional notes" />
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary">Add Log</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div></div>
      ) : logs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-effect rounded-3xl p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No logs yet</h3>
          <p className="text-gray-600">Start tracking your food consumption</p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {logs.map((log, index) => (
            <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.02 }} className="glass-effect rounded-2xl p-6 card-hover">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{log.item_name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center text-gray-600"><Tag className="w-4 h-4 mr-1" />{log.category}</span>
                    <span className="text-gray-600">Qty: <span className="font-semibold">{log.quantity}</span></span>
                    <span className="flex items-center text-gray-600"><Calendar className="w-4 h-4 mr-1" />{new Date(log.created_at).toLocaleDateString()}</span>
                  </div>
                  {log.notes && <p className="mt-2 text-gray-600 text-sm">{log.notes}</p>}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => handleDeleteLog(log)} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>

                  {/* display a small badge showing whether there's matching inventory */}
                  <div className="text-xs text-gray-500">
                    {inventoryList.some(i => i.item_name?.toLowerCase() === log.item_name.toLowerCase()) ? 'Matched in Inventory' : 'Not in Inventory'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodLogs;
