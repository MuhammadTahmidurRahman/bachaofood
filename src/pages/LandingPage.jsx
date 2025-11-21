import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Target, Recycle, TrendingDown, ArrowRight, Sparkles, UtensilsCrossed, Apple, Pizza, Soup } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Target,
      title: 'Zero Hunger',
      description: 'Support SDG 2 by improving food security and nutrition',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Recycle,
      title: 'Responsible Consumption',
      description: 'Align with SDG 12 through sustainable food practices',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingDown,
      title: 'Reduce Waste',
      description: 'Cut food waste with smart tracking and planning',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Sparkles,
      title: 'Smart Insights',
      description: 'Get personalized recommendations for better food management',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary-200/30 to-emerald-200/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">

          {/* ------------------------------------------------ */}
          {/* 🌟 UPDATED: 3D Rotating Logo with NEW PURPLE Glow */}
          {/* ------------------------------------------------ */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mb-10 flex justify-center"
          >
            <div
              className="relative"
              style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
            >

              {/* Rotating Plate */}
              <motion.div
                animate={{
                  rotateY: 360,
                  rotateX: [0, 10, 0]
                }}
                transition={{
                  rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
                  rotateX: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-24 h-24 rounded-full relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(107, 87, 255, 0.4), rgba(122, 99, 245, 0.25))',
                  boxShadow: `
                    0 12px 45px rgba(107, 87, 255, 0.35),
                    0 0 30px rgba(122, 99, 245, 0.55),
                    inset 0 0 25px rgba(255, 255, 255, 0.25)
                  `,
                  border: '2px solid rgba(255, 255, 255, 0.35)',
                  transformStyle: 'preserve-3d',
                }}
              >

                {/* Center Icon */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <UtensilsCrossed
                    className="w-10 h-10"
                    style={{
                      color: "white",
                      filter: `
                        drop-shadow(0 0 12px rgba(122, 99, 245, 0.85))
                        drop-shadow(0 0 18px rgba(107, 87, 255, 0.75))
                      `
                    }}
                  />
                </motion.div>

                {/* Orbiting Icons */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Apple
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-5 h-5"
                    style={{
                      color: "#7A63F5",
                      filter: "drop-shadow(0 0 10px rgba(107, 87, 255, 0.9))"
                    }}
                  />
                </motion.div>

                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2 }}
                  className="absolute inset-0"
                >
                  <Pizza
                    className="absolute bottom-0 right-0 w-5 h-5"
                    style={{
                      color: "#8A6FF0",
                      filter: "drop-shadow(0 0 10px rgba(122, 99, 245, 0.9))"
                    }}
                  />
                </motion.div>

                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 4 }}
                  className="absolute inset-0"
                >
                  <Soup
                    className="absolute bottom-0 left-0 w-5 h-5"
                    style={{
                      color: "#6B57FF",
                      filter: "drop-shadow(0 0 10px rgba(107, 87, 255, 0.9))"
                    }}
                  />
                </motion.div>

              </motion.div>

              {/* Glow Layer */}
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 0.75, 0.4]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(122, 99, 245, 0.6), transparent 70%)',
                  filter: 'blur(28px)'
                }}
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="gradient-text">BachaoFood</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto"
          >
            Smart Food Management for a Sustainable Future
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto"
          >
            Track your food, reduce waste, and contribute to Zero Hunger and Responsible Consumption
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex items-center space-x-2 text-lg"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary text-lg"
              >
                Sign In
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              Why FoodWise?
            </h2>
            <p className="text-xl text-gray-600">
              Empowering sustainable food practices for everyone
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="glass-effect rounded-3xl p-8 card-hover"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-lg">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SDG Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-effect rounded-3xl p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">
              Supporting UN Sustainable Development Goals
            </h2>
            <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-8">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary-600 mb-2">SDG 2</div>
                <p className="text-xl font-semibold text-gray-700">Zero Hunger</p>
              </div>
              <div className="text-4xl text-gray-400">+</div>
              <div className="text-center">
                <div className="text-6xl font-bold text-emerald-600 mb-2">SDG 12</div>
                <p className="text-xl font-semibold text-gray-700">Responsible Consumption</p>
              </div>
            </div>
            <p className="text-lg text-gray-600">
              Join us in creating a more sustainable and food-secure future for all
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-gray-600">
        <p>© 2024 BachaoFood. Building a sustainable future together.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
