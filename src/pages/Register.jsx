import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, MapPin, Users, DollarSign, Leaf, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';

// FREE Location Autocomplete + Current Location (LocationIQ)
const FreeLocationInput = React.forwardRef(({ value, onChange, error }, ref) => {
  const inputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);

  const searchCity = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.locationiq.com/v1/autocomplete.php?key=${import.meta.env.VITE_LOCATIONIQ_TOKEN}&q=${encodeURIComponent(query)}&limit=5&tag=city,town`
      );
      const data = await res.json();
      setSuggestions(data || []);
    } catch (err) {
      setSuggestions([]);
    }
  };

  React.useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus()
  }));

  return (
    <div className="relative">
      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e);
          searchCity(e.target.value);
        }}
        className={`input-field pl-12 ${error ? 'border-red-400' : ''}`}
        placeholder="Search your city..."
      />

      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((item) => (
            <div
              key={item.place_id}
              onClick={() => {
                onChange({ target: { name: 'location', value: item.display_name } });
                setSuggestions([]);
              }}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm"
            >
              {item.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const locationInputRef = useRef();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    householdSize: '1',
    dietaryPreference: 'none',
    budgetRange: 'medium',
    location: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // VALIDATION (unchanged)
  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim())
      newErrors.fullName = 'Full name is required';
    else if (formData.fullName.trim().length < 2)
      newErrors.fullName = 'Name must be at least 2 characters';

    if (!formData.email)
      newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Email is invalid';

    if (!formData.password)
      newErrors.password = 'Password is required';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (!formData.location.trim())
      newErrors.location = 'Location is required';

    return newErrors;
  };

  // SUBMIT (unchanged except merged)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    const userData = {
      full_name: formData.fullName,
      household_size: parseInt(formData.householdSize),
      dietary_preference: formData.dietaryPreference,
      budget_range: formData.budgetRange,
      location: formData.location
    };

    const { data, error } = await signUp(
      formData.email,
      formData.password,
      userData
    );

    if (error) {
      setApiError(error.message || 'Failed to create account. Please try again.');
      setLoading(false);
    } else if (data.user) {
      await dbHelpers.createProfile(data.user.id, userData);
      navigate('/dashboard');
    }
  };

  // HANDLE CHANGE (unchanged)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  // CURRENT LOCATION (unchanged)
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >

        {/* Logo */}
        <Link to="/" className="flex justify-center mb-8">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl"
          >
            <Leaf className="w-8 h-8 text-white" />
          </motion.div>
        </Link>

        {/* CARD */}
        <div className="glass-effect rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-2 gradient-text">
            Create Account
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Join BachaoFood and start your sustainable journey
          </p>

          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
            >
              {apiError}
            </motion.div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`input-field pl-12 ${errors.fullName ? 'border-red-400' : ''}`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field pl-12 ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Password *
  </label>

  <div className="relative">
    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

    <input
      type={showPassword ? "text" : "password"}
      name="password"
      value={formData.password}
      onChange={handleChange}
      className={`input-field pl-12 pr-12 ${errors.password ? 'border-red-400' : ''}`}
      placeholder="••••••••"
    />

    {/* Eye Button */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>

  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
</div>


              {/* Confirm Password */}
              <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Confirm Password *
  </label>

  <div className="relative">
    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

    <input
      type={showConfirmPassword ? "text" : "password"}
      name="confirmPassword"
      value={formData.confirmPassword}
      onChange={handleChange}
      className={`input-field pl-12 pr-12 ${errors.confirmPassword ? 'border-red-400' : ''}`}
      placeholder="••••••••"
    />

    {/* Eye Button */}
    <button
      type="button"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
    >
      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>

  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
</div>


              {/* LOCATION (merged with autocomplete + current location + type) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>

                {/* Autocomplete input */}
                <FreeLocationInput
                  ref={locationInputRef}
                  value={formData.location}
                  onChange={handleChange}
                  error={errors.location}
                />

                {/* Buttons */}
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

                {errors.location && <p className="mt-2 text-sm text-red-600">{errors.location}</p>}
              </div>

              {/* Household Size */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Household Size
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="householdSize"
                    value={formData.householdSize}
                    onChange={handleChange}
                    className="input-field pl-12"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'person' : 'people'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dietary Preference */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dietary Preference
                </label>
                <select
                  name="dietaryPreference"
                  value={formData.dietaryPreference}
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
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Budget Range
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleChange}
                    className="input-field pl-12"
                  >
                    <option value="low">Low (300–500 taka)</option>
                    <option value="medium">Medium (600–1200 taka)</option>
                    <option value="high">High (1200+ taka)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* SUBMIT BUTTON */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* LOGIN LINK */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;