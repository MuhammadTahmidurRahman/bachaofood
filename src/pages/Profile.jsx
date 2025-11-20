import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, DollarSign, Save, Edit2 } from "lucide-react";
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
      budget_amount: String(formData.budget_amount || ""), // ensure TEXT type
      updated_at: new Date(),
    },
    { onConflict: "user_id" } // 🔥 FIX: tells Supabase to update the existing row
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


  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <motion.div className="glass-effect p-6 rounded-3xl shadow-xl">
        <div className="flex justify-between mb-6 items-center">
          <div>
            <h2 className="text-3xl font-bold">Your Profile</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-primary flex items-center gap-2"
          >
            <Edit2 size={16} />
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        <Field
          label="Full Name"
          value={formData.full_name}
          edit={isEditing}
          onChange={(e) =>
            setFormData({ ...formData, full_name: e.target.value })
          }
        />

        <Field
          icon={<MapPin size={16} />}
          label="Location"
          value={formData.location}
          edit={isEditing}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
        />

        <Field
          icon={<Users size={16} />}
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
              formData.household_size + " people"
            )
          }
        />

        <Field
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
              formData.dietary_preference
            )
          }
        />

        <Field
          icon={<DollarSign size={16} />}
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
                <option value="low">Low ($)</option>
                <option value="medium">Medium ($$)</option>
                <option value="high">High ($$$)</option>
              </select>
            ) : (
              formData.budget_range
            )
          }
        />

        <Field
          label="Budget Amount (Taka)"
          raw
          value={
            isEditing ? (
              <input
                type="number"
                className="input-field"
                value={formData.budget_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget_amount: e.target.value,
                  })
                }
              />
            ) : (
              formData.budget_amount || "Not set"
            )
          }
        />

        <Field
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
              formData.budget_type
            )
          }
        />

        {isEditing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full mt-4"
          >
            {saving ? "Saving..." : <><Save size={16} /> Save Changes</>}
          </button>
        )}
      </motion.div>
    </div>
  );
};

const Field = ({ label, value, icon, edit, onChange, raw }) => (
  <div className="mb-5">
    <label className="block text-gray-700 font-semibold mb-1 flex gap-2 items-center">
      {icon} {label}
    </label>

    {raw ? (
      value
    ) : edit ? (
      <input type="text" className="input-field" value={value} onChange={onChange} />
    ) : (
      <p className="text-gray-900 text-lg">{value || "Not set"}</p>
    )}
  </div>
);

export default Profile;
