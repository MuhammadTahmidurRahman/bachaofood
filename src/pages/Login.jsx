import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, UtensilsCrossed, Apple, Pizza, Soup } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FoodLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    className="w-8 h-8 text-white"
    fill="currentColor"
  >
    {/* Soup Bowl */}
    <path d="M12 34c0 10 9 18 20 18s20-8 20-18H12z" />
    <path d="M10 30h44v4H10z" />

    {/* Spoon */}
    <path d="M50 12c-3 0-6 3-6 6s3 6 6 6 6-3 6-6-3-6-6-6zm0 10c-2 0-4-2-4-4s2-4 4-4 4 2 4 4-2 4-4 4z" />

    {/* Small tomato on bowl */}
    <circle cx="32" cy="26" r="4" />

    {/* Pizza Slice-like steam */}
    <path d="M28 14c0 4 4 6 4 10s-4 6-4 10" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
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
    
    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      setApiError(error.message || 'Failed to sign in. Please check your credentials.');
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
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
              {/* Center Icon */}
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

              {/* Orbiting Icons */}
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

            {/* Glow Layer */}
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

        {/* Card */}
        <div className="glass-effect rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-2 gradient-text">
            Welcome Back
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Sign in to your BachaoFood account
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field pl-12 ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field pl-12 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
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
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
