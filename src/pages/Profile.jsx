import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, DollarSign, Save, Edit2, User, Utensils, Calendar, Wallet } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const Profile = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    location: "",
    household_size: 1,
    dietary_preference: "none",
    budget_range: "medium",
    budget_amount: "",
    budget_type: "monthly",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  // Load profile + metadata
  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data: db, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const meta = user.user_metadata || {};

    const merged = {
      full_name: db?.full_name || meta.full_name || "",
      location: db?.location || meta.location || "",
      household_size: db?.household_size || meta.household_size || 1,
      dietary_preference:
        db?.dietary_preference || meta.dietary_preference || "none",
      budget_range: db?.budget_range || meta.budget_range || "medium",
      budget_amount: db?.budget_amount || meta.budget_amount || "",
      budget_type: db?.budget_type || meta.budget_type || "monthly",
    };

    setFormData(merged);
    setLoading(false);
  };

  // Save (UPSERT)
  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    if (!formData.full_name.trim()) {
      setMessage("Full name is required.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        ...formData,
        budget_amount: String(formData.budget_amount || ""),
        updated_at: new Date(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error(error);
      setMessage("Error saving profile.");
    } else {
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Your Profile</h1>
        <p className="text-gray-600">{user.email}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-effect rounded-2xl p-6"
      >
        <div className="flex justify-between mb-6 items-center">
          <h2 className="text-2xl font-bold text-gray-800">Account Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-primary flex items-center gap-2"
          >
            <Edit2 size={16} />
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${
              message.includes("Error")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Field
            icon={<User size={18} />}
            label="Full Name"
            value={formData.full_name}
            edit={isEditing}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
          />

          <Field
            icon={<MapPin size={18} />}
            label="Location"
            value={formData.location}
            edit={isEditing}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          />

          <Field
            icon={<Users size={18} />}
            label="Household Size"
            raw
            value={
              isEditing ? (
                <select
                  value={formData.household_size}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      household_size: parseInt(e.target.value),
                    })
                  }
                  className="input-field"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="glass-effect rounded-xl p-4">
                  <p className="text-gray-900 text-lg font-medium">{formData.household_size} people</p>
                </div>
              )
            }
          />

          <Field
            icon={<Utensils size={18} />}
            label="Dietary Preference"
            raw
            value={
              isEditing ? (
                <select
                  value={formData.dietary_preference}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dietary_preference: e.target.value,
                    })
                  }
                  className="input-field"
                >
                  <option value="none">None</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="halal">Halal</option>
                  <option value="kosher">Kosher</option>
                </select>
              ) : (
                <div className="glass-effect rounded-xl p-4">
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full capitalize">
                    {formData.dietary_preference}
                  </span>
                </div>
              )
            }
          />

          <Field
            icon={<div className="text-xl font-bold">৳</div>}
            label="Budget Range"
            raw
            value={
              isEditing ? (
                <select
                  value={formData.budget_range}
                  onChange={(e) =>
                    setFormData({ ...formData, budget_range: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="low">Low (300–500 taka)</option>
                  <option value="medium">Medium (600–1200 taka)</option>
                  <option value="high">High (1200+ taka)</option>
                </select>
              ) : (
                <div className="glass-effect rounded-xl p-4">
                  <p className="text-gray-900 text-lg font-medium capitalize">{formData.budget_range}</p>
                </div>
              )
            }
          />

          <Field
            icon={<Calendar size={18} />}
            label="Budget Type"
            raw
            value={
              isEditing ? (
                <select
                  value={formData.budget_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget_type: e.target.value,
                    })
                  }
                  className="input-field"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              ) : (
                <div className="glass-effect rounded-xl p-4">
                  <p className="text-gray-900 text-lg font-medium capitalize">{formData.budget_type}</p>
                </div>
              )
            }
          />
        </div>

        {isEditing && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

const Field = ({ label, value, icon, edit, onChange, raw }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
        <div className="text-white">{icon}</div>
      </div>
      {label}
    </label>

    {raw ? (
      value
    ) : edit ? (
      <input type="text" className="input-field" value={value} onChange={onChange} />
    ) : (
      <div className="glass-effect rounded-xl p-4">
        <p className="text-gray-900 text-lg font-medium">{value || "Not set"}</p>
      </div>
    )}
  </div>
);

export default Profile;