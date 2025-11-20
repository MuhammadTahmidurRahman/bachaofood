import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const authHelpers = {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async signUp(email, password, userData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.full_name
      }
    }
  });
  
  if (data.user && !error) {
    await supabase.from('profiles').insert([{
      user_id: data.user.id,
      full_name: userData.full_name,
      household_size: userData.household_size,
      dietary_preference: userData.dietary_preference,
      budget_range: userData.budget_range,
      budget_type: userData.budget_type,
      budget_amount: userData.budget_amount,
      location: userData.location
    }]);
  }
  
  return { data, error };
},
    

  async signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Combined database helpers
export const dbHelpers = {
  // Profile
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  },

  async createProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ user_id: userId, ...profileData }])
      .select()
      .single();
    return { data, error };
  },

  // Food Logs
  async getFoodLogs(userId, limit = 100) {
    let query = supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    return { data, error };
  },

  async createFoodLog(logData) {
    const { data, error } = await supabase
      .from('food_logs')
      .insert([logData])
      .select()
      .single();
    return { data, error };
  },

  async deleteFoodLog(logId) {
    const { error } = await supabase
      .from('food_logs')
      .delete()
      .eq('id', logId);
    return { error };
  },

  // Inventory
  async getInventory(userId) {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)
      .order('expiry_date', { ascending: true });
    return { data, error };
  },

  async addInventoryItem(itemData) {
    const { data, error } = await supabase
      .from('inventory')
      .insert([itemData])
      .select()
      .single();
    return { data, error };
  },

  async updateInventoryItem(itemId, updates) {
    const { data, error } = await supabase
      .from('inventory')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();
    return { data, error };
  },

  async deleteInventoryItem(itemId) {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', itemId);
    return { error };
  },

  // Food Items (reference data)
  async getFoodItems() {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .order('category', { ascending: true });
    return { data, error };
  },

  // Resources
  async getResources() {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('category', { ascending: true });
    return { data, error };
  },

  // Uploads
  async getUploads(userId) {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(filePath, file);

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    const { data } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath);

    return { data: data.publicUrl, error: null };
  },

  async saveUploadRecord(uploadData) {
    const { data, error } = await supabase
      .from('uploads')
      .insert([{
        ...uploadData,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    return { data, error };
  },

  async deleteUpload(uploadId) {
    const { error } = await supabase
      .from('uploads')
      .delete()
      .eq('id', uploadId);
    return { error };
  }
};