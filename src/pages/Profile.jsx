import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Users, DollarSign, Save, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import FreeLocationInput from './FreeLocationInput';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    location: '',
    household_size: 1,
    dietary_preference: 'none',
    budget_range: 'medium'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const locationInputRef = useRef();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    console.log('Loading profile for user:', user.id);
    
    try {
      const { data, error } = await dbHelpers.getProfile(user.id);

      console.log('Profile data:', data);
      console.log('Profile error:', error);

      if (error) {
        console.error('Error loading profile:', error);
        setMessage('Error loading profile');
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          location: data.location || '',
          household_size: data.household_size || 1,
          dietary_preference: data.dietary_preference || 'none',
          budget_range: data.budget_range || 'medium'
        });
      } else {
        // Profile doesn't exist, initialize with empty data
        console.log('No profile found');
        setProfile(null);
        setFormData({
          full_name: '',
          location: '',
          household_size: 1,
          dietary_preference: 'none',
          budget_range: 'medium'
        });
      }
    } catch (err) {
      console.error('Exception loading profile:', err);
      setMessage('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const updatedData = {
        full_name: formData.full_name,
        location: formData.location,
        household_size: parseInt(formData.household_size),
        dietary_preference: formData.dietary_preference,
        budget_range: formData.budget_range
      };

      console.log('Saving profile data:', updatedData);

      const { data, error } = await dbHelpers.updateProfile(user.id, updatedData);

      console.log('Update response:', data, error);

      if (error) {
        setMessage('Error updating profile');
        console.error('Update error:', error);
      } else {
        setMessage('Profile updated successfully!');
        setProfile(data);
        setIsEditing(false);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Exception updating profile:', err);
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Location not supported in your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const res = await fetch(
          `https://us1.locationiq.com/v1/reverse.php?key=${import.meta.env.VITE_LOCATIONIQ_TOKEN}&lat=${latitude}&lon=${longitude}&format=json`
        );

        const data = await res.json();
        setFormData({ ...formData, location: data.display_name || 'Unknown location' });

      } catch (err) {
        alert('Could not get city name');
      }
    }, () => {
      alert('Please allow location access');
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div>
      </div>
    );
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
              <p className="text-gray-600">{user?.email}</p>
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
            className={`mb-6 p-4 rounded-xl ${
              message.includes('Error')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {message}
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="input-field"
              />
            ) : (
              <p className="text-lg text-gray-800 font-medium">
                {formData.full_name || 'Not set'}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </label>
            {isEditing ? (
              <>
                <FreeLocationInput
                  ref={locationInputRef}
                  value={formData.location}
                  onChange={handleChange}
                  error={false}
                />

                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={getMyLocation}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm py-2.5 rounded-xl transition"
                  >
                    Use My Current Location
                  </button>

                  <button
                    type="button"
                    onClick={() => locationInputRef.current?.focus()}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-sm py-2.5 rounded-xl transition"
                  >
                    Type Location
                  </button>
                </div>
              </>
            ) : (
              <p className="text-lg text-gray-800 font-medium">
                {formData.location || 'Not set'}
              </p>
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
                name="household_size"
                value={formData.household_size}
                onChange={handleChange}
                className="input-field"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'person' : 'people'}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-lg text-gray-800 font-medium">
                {formData.household_size || 1}{' '}
                {formData.household_size === 1 ? 'person' : 'people'}
              </p>
            )}
          </div>

          {/* Dietary Preference */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dietary Preference
            </label>
            {isEditing ? (
              <select
                name="dietary_preference"
                value={formData.dietary_preference}
                onChange={handleChange}
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
              <p className="text-lg text-gray-800 font-medium capitalize">
                {formData.dietary_preference === 'none' ? 'No Restrictions' : formData.dietary_preference}
              </p>
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
                name="budget_range"
                value={formData.budget_range}
                onChange={handleChange}
                className="input-field"
              >
                <option value="low">Low (300–500 taka)</option>
                <option value="medium">Medium (600–1200 taka)</option>
                <option value="high">High (1200+ taka)</option>
              </select>
            ) : (
              <p className="text-lg text-gray-800 font-medium capitalize">
                {formData.budget_range === 'low' && 'Low (300–500 taka)'}
                {formData.budget_range === 'medium' && 'Medium (600–1200 taka)'}
                {formData.budget_range === 'high' && 'High (1200+ taka)'}
              </p>
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