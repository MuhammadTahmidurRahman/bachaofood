// src/components/Layout.jsx - UPDATED with AI Navigation
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, BookOpen, Package, Leaf, Upload, User, LogOut, Menu, X,
  UtensilsCrossed, Apple, Pizza, Soup, Brain, Bot, Sparkles 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FloatingOrbs = () => (
  <div className="floating-orbs">
    <div className="orb orb-1"></div>
    <div className="orb orb-2"></div>
    <div className="orb orb-3"></div>
  </div>
);

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/logs', label: 'Food Logs', icon: BookOpen },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/ai-insights', label: 'AI Insights', icon: Brain },
    { path: '/meal-optimizer', label: 'Meal Optimizer', icon: Sparkles },
    { path: '/nourish-bot', label: 'NourishBot', icon: Bot },
    { path: '/resources', label: 'Resources', icon: Leaf },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <FloatingOrbs />
      <div className="min-h-screen relative">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="sticky top-0 z-50"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(25px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(74, 122, 109, 0.15)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo */}
              <Link to="/dashboard" className="flex items-center space-x-3">
                <motion.div
                  className="relative"
                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                >
                  <motion.div
                    animate={{ rotateY: 360, rotateX: [0, 10, 0] }}
                    transition={{
                      rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
                      rotateX: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="w-16 h-16 rounded-full relative"
                    style={{
                      background: 'linear-gradient(135deg, rgba(107, 150, 136, 0.4) 0%, rgba(90, 134, 121, 0.3) 100%)',
                      boxShadow: '0 12px 45px rgba(74, 122, 109, 0.35), inset 0 0 25px rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <UtensilsCrossed className="w-7 h-7 text-white" style={{ filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.7))' }} />
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.span className="text-2xl font-black gradient-text hidden sm:block">
                  BachaoFood
                </motion.span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2 overflow-x-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}>
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all relative ${
                          isActive ? 'text-white' : 'text-white/75 hover:text-white'
                        }`}
                        style={{
                          background: isActive ? 'rgba(107, 150, 136, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                          backdropFilter: 'blur(10px)',
                          border: isActive ? '1px solid rgba(107, 150, 136, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: isActive ? '0 0 25px rgba(107, 150, 136, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.08)' : 'none',
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-semibold text-xs">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-3 rounded-xl text-white font-semibold text-xs"
                  style={{
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </motion.button>
              </div>

              {/* Mobile menu button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-3 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
              style={{
                background: 'rgba(107, 150, 136, 0.2)',
                backdropFilter: 'blur(25px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div className="px-4 py-4 space-y-2 max-h-96 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center space-x-3 px-5 py-4 rounded-xl transition-all ${
                          isActive ? 'text-white' : 'text-white/75'
                        }`}
                        style={{
                          background: isActive ? 'rgba(107, 150, 136, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                          border: `1px solid rgba(255, 255, 255, ${isActive ? '0.25' : '0.15'})`,
                        }}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-semibold">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-5 py-4 rounded-xl text-white font-semibold"
                  style={{
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </motion.nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout;