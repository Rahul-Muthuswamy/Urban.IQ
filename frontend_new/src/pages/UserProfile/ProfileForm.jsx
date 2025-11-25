import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import GlassCard from "./GlassCard.jsx";
import InputField from "./InputField.jsx";
import AnimatedButton from "./AnimatedButton.jsx";

export default function ProfileForm({ user }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    // Note: These fields don't exist in backend but we'll show them for UI consistency
    // They can be stored in bio as JSON or added to backend later
    first_name: "",
    last_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      // Parse username to extract first/last name if possible
      const nameParts = user.username?.split(/[\s_]/) || [];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Use direct fields from backend (no longer stored in bio as JSON)
      setFormData({
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        first_name: user.first_name || firstName || "",
        last_name: user.last_name || lastName || "",
        phone: user.phone_number || "",
        address_line1: user.address_line1 || "",
        address_line2: user.address_line2 || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
      });
    }
  }, [user]);

  // Update profile mutation
  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data) => {
      // Prepare form data for backend
      const formDataToSend = new FormData();
      
      // Add all profile fields directly (backend now supports them)
      if (data.bio !== undefined) {
        formDataToSend.append("bio", data.bio || "");
      }
      if (data.first_name !== undefined) {
        formDataToSend.append("first_name", data.first_name || "");
      }
      if (data.last_name !== undefined) {
        formDataToSend.append("last_name", data.last_name || "");
      }
      if (data.phone !== undefined) {
        formDataToSend.append("phone_number", data.phone || "");
      }
      if (data.address_line1 !== undefined) {
        formDataToSend.append("address_line1", data.address_line1 || "");
      }
      if (data.address_line2 !== undefined) {
        formDataToSend.append("address_line2", data.address_line2 || "");
      }
      if (data.city !== undefined) {
        formDataToSend.append("city", data.city || "");
      }
      if (data.state !== undefined) {
        formDataToSend.append("state", data.state || "");
      }
      if (data.pincode !== undefined) {
        formDataToSend.append("pincode", data.pincode || "");
      }
      
      formDataToSend.append("content_type", "text");

      const response = await api.patch("/api/user", formDataToSend);
      return response.data;
    },
    onSuccess: () => {
      setSuccessMessage("Profile updated successfully!");
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.response?.data?.message || "Failed to update profile" });
      }
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    updateProfile(formData);
  };

  return (
    <GlassCard title="Personal Information">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700"
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* General Error */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
          >
            {errors.general}
          </motion.div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <InputField
            label="First Name"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            error={errors.first_name}
            placeholder="Enter your first name"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          {/* Last Name */}
          <InputField
            label="Last Name"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            error={errors.last_name}
            placeholder="Enter your last name"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          {/* Phone Number */}
          <InputField
            label="Phone Number"
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            placeholder="Enter your phone number"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
          />

          {/* Email (Read-only) */}
          <InputField
            label="Email"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            readOnly
            placeholder="Your email address"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          {/* Address Line 1 */}
          <InputField
            label="Address Line 1"
            id="address_line1"
            name="address_line1"
            value={formData.address_line1}
            onChange={handleChange}
            error={errors.address_line1}
            placeholder="Enter your address"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          {/* Address Line 2 */}
          <InputField
            label="Address Line 2"
            id="address_line2"
            name="address_line2"
            value={formData.address_line2}
            onChange={handleChange}
            error={errors.address_line2}
            placeholder="Apartment, suite, etc. (optional)"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          {/* City */}
          <InputField
            label="City"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            error={errors.city}
            placeholder="Enter your city"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          {/* State */}
          <InputField
            label="State"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            error={errors.state}
            placeholder="Enter your state"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          {/* Pincode */}
          <InputField
            label="Pincode"
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            error={errors.pincode}
            placeholder="Enter your pincode"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <AnimatedButton
            type="submit"
            disabled={isPending}
            isLoading={isPending}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          >
            Save Changes
          </AnimatedButton>
        </div>
      </form>
    </GlassCard>
  );
}

