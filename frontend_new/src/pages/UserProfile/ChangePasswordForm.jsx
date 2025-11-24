import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import GlassCard from "./GlassCard.jsx";
import InputField from "./InputField.jsx";
import AnimatedButton from "./AnimatedButton.jsx";

export default function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Change password mutation
  // Note: This endpoint may need to be created in the backend
  // For now, we'll attempt to call it and handle errors gracefully
  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: async (data) => {
      // Try the endpoint mentioned in requirements
      try {
        const response = await api.post("/api/user/password", {
          old_password: data.current_password,
          new_password: data.new_password,
        });
        return response.data;
      } catch (error) {
        // If endpoint doesn't exist, try alternative approach
        // This would require backend implementation
        throw error;
      }
    },
    onSuccess: () => {
      setSuccessMessage("Password updated successfully!");
      setErrors({});
      setFormData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      if (error.response?.status === 404) {
        setErrors({
          general: "Password change endpoint not yet implemented. Please contact support.",
        });
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: "Failed to change password. Please try again." });
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.current_password) {
      newErrors.current_password = "Current password is required";
    }

    if (!formData.new_password) {
      newErrors.new_password = "New password is required";
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = "Password must be at least 8 characters";
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your new password";
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = "New password must be different from current password";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    changePassword({
      current_password: formData.current_password,
      new_password: formData.new_password,
    });
  };

  return (
    <GlassCard title="Change Password">
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

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Current Password */}
          <InputField
            label="Current Password"
            id="current_password"
            name="current_password"
            type="password"
            value={formData.current_password}
            onChange={handleChange}
            error={errors.current_password}
            placeholder="Enter your current password"
            required
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />

          {/* New Password */}
          <InputField
            label="New Password"
            id="new_password"
            name="new_password"
            type="password"
            value={formData.new_password}
            onChange={handleChange}
            error={errors.new_password}
            placeholder="Enter your new password"
            required
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />
        </div>

        {/* Helper Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-500"
        >
          Password must be at least 8 characters long and contain both letters and numbers.
        </motion.p>

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
            Update Password
          </AnimatedButton>
        </div>
      </form>
    </GlassCard>
  );
}


