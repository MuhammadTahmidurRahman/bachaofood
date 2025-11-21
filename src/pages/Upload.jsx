import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, Image, FileText, Calendar, Trash2, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { extractText } from "../utils/ocr";


const Upload = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [association, setAssociation] = useState("receipt");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [foodLogs, setFoodLogs] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      loadUploads();
      loadInventoryAndLogs();
    }
  }, [user]);

  const loadUploads = async () => {
    try {
      const { data, error } = await dbHelpers.getUploads(user.id);
      if (error) {
        console.error('Error loading uploads:', error);
        return;
      }
      console.log('Uploads loaded:', data);
      setUploads(data || []);
    } catch (err) {
      console.error('Exception loading uploads:', err);
    }
    setLoading(false);
  };

  const loadInventoryAndLogs = async () => {
    try {
      const { data: inventory } = await dbHelpers.getInventory(user.id);
      const { data: logs } = await dbHelpers.getFoodLogs(user.id, 20);
      setInventoryItems(inventory || []);
      setFoodLogs(logs || []);
    } catch (err) {
      console.error('Error loading items:', err);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only JPG/PNG images allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    try {
      console.log('Starting upload for:', file.name);
      
      // Upload image to storage
      const { data: fileUrl, error: uploadError } = await dbHelpers.uploadImage(file);
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded to storage, URL:', fileUrl);
// ----- OCR extract text -----
let ocrText = "";
try {
  ocrText = await extractText(file);
  console.log("OCR RESULT:", ocrText);
} catch (err) {
  console.error("OCR failed:", err);
}

      // Save record to database
      const uploadData = {
        user_id: user.id,
        file_url: fileUrl,
        file_type: file.type,
        associated_with: association,
        notes: selectedItem 
          ? `Associated with: ${selectedItem}` 
          : `Uploaded ${file.name}`
      };

      console.log('Saving upload record:', uploadData);

      // Try to save the record
      const { data: savedRecord, error: saveError } = await dbHelpers.saveUploadRecord(uploadData);
      
      if (saveError) {
        console.error('Database save error:', saveError);
        
        // If RLS policy error, show specific message
        if (saveError.message?.includes('row-level security') || saveError.code === '42501') {
          throw new Error('Database permission error. Please run this SQL in Supabase:\n\nCREATE POLICY "Users can insert own uploads" ON uploads FOR INSERT WITH CHECK (auth.uid() = user_id);');
        }
        
        throw saveError;
      }

      console.log('Upload record saved:', savedRecord);

      // Show success and reload
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      await loadUploads();
      
      // Reset selection
      setSelectedItem("");
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Failed to upload: ${err.message || 'Unknown error'}`);
    }
// Auto-generate inventory from receipt
if (association === "receipt") {
  try {
    const { processReceipt } = await import("../lib/receiptParser");
    await processReceipt(file, user.id);
    
    await loadInventoryAndLogs();

  } catch (err) {
    console.error("Receipt auto-inventory failed:", err);
  }
}

    setUploading(false);
  };

  const handleDelete = async (uploadId) => {
    if (!confirm('Delete this upload?')) return;
    
    try {
      const { error } = await dbHelpers.deleteUpload(uploadId);
      if (error) throw error;
      await loadUploads();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete upload');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Upload Images
        </h1>
        <p className="text-gray-600">Upload receipts, food labels, or associate with inventory/logs</p>
      </motion.div>

      {/* Success Message */}
      <AnimatePresence>
        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-50 border-2 border-green-200 text-green-700 p-4 rounded-xl flex items-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Image uploaded successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Association Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-effect rounded-2xl p-6 border-2 border-white/50"
      >
        <div className="flex items-center space-x-2 mb-4">
          <LinkIcon className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-lg text-gray-800">Associate Upload With:</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              value={association}
              onChange={(e) => {
                setAssociation(e.target.value);
                setSelectedItem("");
              }}
              className="input-field"
            >
              <option value="receipt">Receipt</option>
              <option value="label">Food Label</option>
              <option value="inventory">Inventory Item</option>
              <option value="food_log">Food Log</option>
              <option value="other">Other</option>
            </select>
          </div>

          {(association === 'inventory' || association === 'food_log') && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select {association === 'inventory' ? 'Inventory Item' : 'Food Log'}
              </label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="input-field"
              >
                <option value="">-- Optional --</option>
                {association === 'inventory' 
                  ? inventoryItems.map(item => (
                      <option key={item.id} value={item.item_name}>
                        {item.item_name} (Qty: {item.quantity})
                      </option>
                    ))
                  : foodLogs.map(log => (
                      <option key={log.id} value={log.item_name}>
                        {log.item_name} - {new Date(log.created_at).toLocaleDateString()}
                      </option>
                    ))
                }
              </select>
            </div>
          )}
        </div>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-effect rounded-3xl p-8 border-2 border-white/50"
      >
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-4 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-300 hover:border-emerald-400"
          }`}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-500 mx-auto"></div>
              <p className="text-gray-600 font-medium">Uploading to database...</p>
            </div>
          ) : (
            <>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <UploadIcon className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Drop your images here
              </h3>
              <p className="text-gray-600 mb-6">
                or click to browse (JPG, PNG • Max 5MB)
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Uploads ({uploads.length})</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500"></div>
          </div>
        ) : uploads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-effect rounded-3xl p-12 text-center border-2 border-white/50"
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
                whileHover={{ scale: 1.02 }}
                className="glass-effect rounded-2xl overflow-hidden card-hover border-2 border-white/50"
              >
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative group">
                  <img
                    src={upload.file_url}
                    alt="Upload"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <a
                      href={upload.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100"
                    >
                      View Full
                    </a>
                    <button
                      onClick={() => handleDelete(upload.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(upload.created_at).toLocaleDateString()}
                    </span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      {upload.associated_with}
                    </span>
                  </div>
                  {upload.notes && (
                    <p className="text-sm text-gray-600 line-clamp-2">{upload.notes}</p>
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