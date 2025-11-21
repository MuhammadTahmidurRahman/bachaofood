import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Users, 
  DollarSign, 
  Leaf,
  UtensilsCrossed,
  Apple,
  Pizza,
  Soup,
  ArrowRight   // ✅ FIXED — THIS WAS MISSING AND CAUSED WHITE SCREEN
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import FreeLocationInput from './FreeLocationInput';

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >

        {/* ⭐⭐⭐ REPLACED LOGO WITH 3D ROTATING PURPLE GLOW VERSION ⭐⭐⭐ */}
        <Link to="/" className="flex justify-center mb-8">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
          >
            <motion.div
              animate={{ rotateY: 360, rotateX: [0, 10, 0] }}
              transition={{
                rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
                rotateX: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-20 h-20 rounded-full relative"
              style={{
                background: 'linear-gradient(135deg, rgba(107,87,255,0.45), rgba(122,99,245,0.25))',
                boxShadow: `
                  0 12px 45px rgba(107,87,255,0.35),
                  0 0 30px rgba(122,99,245,0.55),
                  inset 0 0 25px rgba(255,255,255,0.25)
                `,
                border: '2px solid rgba(255,255,255,0.35)',
                transformStyle: "preserve-3d"
              }}
            >

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <UtensilsCrossed
                  className="w-8 h-8"
                  style={{
                    color: "white",
                    filter: `
                      drop-shadow(0 0 12px rgba(122,99,245,0.85))
                      drop-shadow(0 0 18px rgba(107,87,255,0.75))
                    `
                  }}
                />
              </motion.div>

              <motion.div animate={{ rotate: -360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="absolute inset-0">
                <Apple
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-4"
                  style={{ color: "#7A63F5", filter: "drop-shadow(0 0 10px rgba(107,87,255,0.9))" }}
                />
              </motion.div>

              <motion.div animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2 }} className="absolute inset-0">
                <Pizza
                  className="absolute bottom-0 right-0 w-4 h-4"
                  style={{ color: "#8A6FF0", filter: "drop-shadow(0 0 10px rgba(122,99,245,0.9))" }}
                />
              </motion.div>

              <motion.div animate={{ rotate: -360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 4 }} className="absolute inset-0">
                <Soup
                  className="absolute bottom-0 left-0 w-4 h-4"
                  style={{ color: "#6B57FF", filter: "drop-shadow(0 0 10px rgba(107,87,255,0.9))" }}
                />
              </motion.div>

            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.75, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(122,99,245,0.6), transparent 70%)",
                filter: "blur(28px)"
              }}
            />
          </motion.div>
        </Link>
        {/* END OF REPLACED LOGO */}

        {/* REST OF YOUR CODE — UNCHANGED */}
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

              {/* LOCATION */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>

                <FreeLocationInput
                  ref={locationInputRef}
                  value={formData.location}
                  onChange={handleChange}
                  error={errors.location}
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
