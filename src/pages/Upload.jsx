import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, Image, FileText, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';

const Upload = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadUploads();
  }, [user]);

  const loadUploads = async () => {
    const { data } = await dbHelpers.getUploads(user.id);
    setUploads(data || []);
    setLoading(false);
  };

  const handleFile = async (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload only image files (JPG, PNG)');
      return;
    }

    setUploading(true);

    try {
      const { data: fileUrl, error: uploadError } = await dbHelpers.uploadImage(file);
      
      if (uploadError) throw uploadError;

      const uploadData = {
        user_id: user.id,
        file_url: fileUrl,
        file_type: file.type,
        associated_with: 'receipt',
        notes: `Uploaded ${file.name}`
      };

      await dbHelpers.saveUploadRecord(uploadData);
      loadUploads();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    }

    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Upload Images</h1>
        <p className="text-gray-600">Upload receipts or food labels for future scanning</p>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-effect rounded-3xl p-8"
      >
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-4 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500 mx-auto"></div>
              <p className="text-gray-600 font-medium">Uploading...</p>
            </div>
          ) : (
            <>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <UploadIcon className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Drop your images here
              </h3>
              <p className="text-gray-600 mb-6">
                or click to browse (JPG, PNG only)
              </p>
              <label className="btn-primary inline-flex items-center cursor-pointer">
                <Image className="w-5 h-5 mr-2" />
                Choose File
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </label>
            </>
          )}
        </div>
      </motion.div>

      {/* Uploads Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Uploads</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div>
          </div>
        ) : uploads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-effect rounded-3xl p-12 text-center"
          >
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No uploads yet</h3>
            <p className="text-gray-600">Start by uploading your first image</p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploads.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="glass-effect rounded-2xl overflow-hidden card-hover"
              >
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative group">
                  <img
                    src={upload.file_url}
                    alt="Upload"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={upload.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      View Full
                    </a>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(upload.created_at).toLocaleDateString()}
                    </span>
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                      {upload.associated_with}
                    </span>
                  </div>
                  {upload.notes && (
                    <p className="text-sm text-gray-600 mt-2">{upload.notes}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
