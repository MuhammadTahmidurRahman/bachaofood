import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Users, DollarSign, Save, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await dbHelpers.getProfile(user.id);
    setProfile(data);
    setFormData(data || {});
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    const { error } = await dbHelpers.updateProfile(user.id, formData);
    
    if (error) {
      setMessage('Error updating profile');
    } else {
      setMessage('Profile updated successfully!');
      setProfile(formData);
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    }
    
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-3xl p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Your Profile</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? 'btn-secondary' : 'btn-primary'}
          >
            <Edit2 className="w-4 h-4 inline mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </motion.button>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
          >
            {message}
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input-field"
              />
            ) : (
              <p className="text-lg text-gray-800 font-medium">{profile?.full_name || 'Not set'}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input-field"
                placeholder="City, Country"
              />
            ) : (
              <p className="text-lg text-gray-800 font-medium">{profile?.location || 'Not set'}</p>
            )}
          </div>

          {/* Household Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Household Size
            </label>
            {isEditing ? (
              <select
                value={formData.household_size || 1}
                onChange={(e) => setFormData({ ...formData, household_size: parseInt(e.target.value) })}
                className="input-field"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                ))}
              </select>
            ) : (
              <p className="text-lg text-gray-800 font-medium">{profile?.household_size || 1} {profile?.household_size === 1 ? 'person' : 'people'}</p>
            )}
          </div>

          {/* Dietary Preference */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dietary Preference</label>
            {isEditing ? (
              <select
                value={formData.dietary_preference || 'none'}
                onChange={(e) => setFormData({ ...formData, dietary_preference: e.target.value })}
                className="input-field"
              >
                <option value="none">No Restrictions</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="halal">Halal</option>
                <option value="kosher">Kosher</option>
              </select>
            ) : (
              <p className="text-lg text-gray-800 font-medium capitalize">{profile?.dietary_preference || 'None'}</p>
            )}
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Budget Range
            </label>
            {isEditing ? (
              <select
                value={formData.budget_range || 'medium'}
                onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                className="input-field"
              >
                <option value="low">Low ($)</option>
                <option value="medium">Medium ($$)</option>
                <option value="high">High ($$$)</option>
              </select>
            ) : (
              <p className="text-lg text-gray-800 font-medium capitalize">{profile?.budget_range || 'Medium'}</p>
            )}
          </div>

          {isEditing && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full disabled:opacity-50"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 inline mr-2" />
                  Save Changes
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
