import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import InputField from "./InputField.jsx";

export default function UpdateProfileModal({ user, onClose, profileUsername }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    first_name: "",
    last_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone_number || "",
        address_line1: user.address_line1 || "",
        address_line2: user.address_line2 || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data) => {
      const formDataToSend = new FormData();

      // Always append bio (even if empty)
      formDataToSend.append("bio", data.bio || "");

      // Append all profile fields
      formDataToSend.append("first_name", data.first_name || "");
      formDataToSend.append("last_name", data.last_name || "");
      formDataToSend.append("phone_number", data.phone || "");
      formDataToSend.append("address_line1", data.address_line1 || "");
      formDataToSend.append("address_line2", data.address_line2 || "");
      formDataToSend.append("city", data.city || "");
      formDataToSend.append("state", data.state || "");
      formDataToSend.append("pincode", data.pincode || "");

      // Handle avatar upload with Cloudinary
      if (avatarFile) {
        // Validate file type
        if (!avatarFile.type.startsWith("image/")) {
          throw new Error("Please select a valid image file");
        }
        // Validate file size (max 5MB)
        if (avatarFile.size > 5 * 1024 * 1024) {
          throw new Error("Image size must be less than 5MB");
        }
        formDataToSend.append("avatar", avatarFile);
        formDataToSend.append("content_type", "image");
      } else {
        formDataToSend.append("content_type", "text");
      }

      console.log("[UpdateProfile] Sending FormData with fields:", {
        hasAvatar: !!avatarFile,
        content_type: avatarFile ? "image" : "text",
        bio: data.bio,
        first_name: data.first_name,
        last_name: data.last_name,
      });

      const response = await api.patch("/api/user", formDataToSend);
      return response.data;
    },
    onSuccess: async (data) => {
      setSuccessMessage("Profile updated successfully!");
      setErrors({});
      
      // Invalidate and refetch queries with exact keys
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
        queryClient.invalidateQueries({ queryKey: ["userProfile", profileUsername || user?.username] }),
        queryClient.invalidateQueries({ queryKey: ["userProfile"] }), // Also invalidate all userProfile queries
      ]);
      
      // Refetch immediately to ensure UI updates
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["currentUser"] }),
        queryClient.refetchQueries({ queryKey: ["userProfile", profileUsername || user?.username] }),
      ]);
      
      console.log("[UpdateProfile] Profile updated successfully, cache invalidated");
      
      setTimeout(() => {
        setSuccessMessage("");
        onClose();
      }, 1500);
    },
    onError: (error) => {
      console.error("[UpdateProfile] Error:", error);
      const errorMessage = error.message || error.response?.data?.message || "Failed to update profile";
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: errorMessage });
      }
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors({ avatar: "Please select a valid image file (JPG, PNG, etc.)" });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ avatar: "Image size must be less than 5MB" });
        return;
      }

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.avatar;
        return newErrors;
      });

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    updateProfile(formData);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-glass-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gradient">Update Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

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

            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <img
                  src={avatarPreview || user?.avatar || "/default-avatar.png"}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                  title="Change profile photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={isPending}
                />
              </div>
              {errors.avatar && (
                <p className="mt-2 text-sm text-red-600">{errors.avatar}</p>
              )}
              <p className="mt-2 text-xs text-gray-500 text-center">
                JPG, PNG, GIF or WebP. Max 5MB
              </p>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="First Name"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
                placeholder="Enter your first name"
              />
              <InputField
                label="Last Name"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
                placeholder="Enter your last name"
              />
              <InputField
                label="Phone Number"
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="Enter your phone number"
              />
              {/* <InputField
                label="Email"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                readOnly
                placeholder="Your email address"
              /> */}
              <InputField
                label="Address Line 1"
                id="address_line1"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleChange}
                error={errors.address_line1}
                placeholder="Enter your address"
              />
              <InputField
                label="Address Line 2"
                id="address_line2"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleChange}
                error={errors.address_line2}
                placeholder="Apartment, suite, etc. (optional)"
              />
              <InputField
                label="City"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                error={errors.city}
                placeholder="Enter your city"
              />
              <InputField
                label="State"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                error={errors.state}
                placeholder="Enter your state"
              />
              <InputField
                label="Pincode"
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                error={errors.pincode}
                placeholder="Enter your pincode"
              />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#00000022] focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white/80 text-gray-800"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
                whileHover={{ scale: isPending ? 1 : 1.05 }}
                whileTap={{ scale: isPending ? 1 : 0.95 }}
              >
                {isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

