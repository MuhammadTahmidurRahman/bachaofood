import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, ExternalLink, Filter, Search } from 'lucide-react';
import { dbHelpers } from '../lib/supabase';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['All', 'Budget Tips', 'Storage Tips', 'Waste Reduction', 'Meal Planning', 'Nutrition', 'Food Safety', 'Sustainability'];

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    let filtered = resources;
    
    if (filterCategory !== 'All') {
      filtered = filtered.filter(r => r.category === filterCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredResources(filtered);
  }, [filterCategory, searchTerm, resources]);

  const loadResources = async () => {
    const { data } = await dbHelpers.getResources();
    setResources(data || []);
    setFilteredResources(data || []);
    setLoading(false);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Budget Tips': 'from-green-500 to-emerald-500',
      'Storage Tips': 'from-blue-500 to-cyan-500',
      'Waste Reduction': 'from-orange-500 to-red-500',
      'Meal Planning': 'from-purple-500 to-pink-500',
      'Nutrition': 'from-yellow-500 to-orange-500',
      'Food Safety': 'from-red-500 to-pink-500',
      'Sustainability': 'from-green-500 to-teal-500'
    };
    return colors[category] || 'from-gray-500 to-slate-500';
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Resources</h1>
        <p className="text-gray-600">Expert tips for sustainable food management</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-effect rounded-2xl p-6"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field pl-12"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div>
        </div>
      ) : filteredResources.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-effect rounded-3xl p-12 text-center"
        >
          <Leaf className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No resources found</h3>
          <p className="text-gray-600">Try adjusting your filters</p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource, index) => (
            <motion.a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-effect rounded-2xl p-6 card-hover group"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${getCategoryColor(resource.category)} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Leaf className="w-6 h-6 text-white" />
              </div>
              
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full mb-3">
                {resource.category}
              </span>
              
              <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-primary-600 transition-colors">
                {resource.title}
              </h3>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {resource.description}
              </p>
              
              <div className="flex items-center text-primary-600 font-medium group-hover:translate-x-2 transition-transform">
                <span>Learn more</span>
                <ExternalLink className="w-4 h-4 ml-2" />
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
};

export default Resources;
