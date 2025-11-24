import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "../api.js";
import FormField from "./FormField.jsx";
import FileUploader from "./FileUploader.jsx";

export default function CommunityForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    rules: "",
  });
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const { mutate: createCommunity, isPending } = useMutation({
    mutationFn: async (data) => {
      const formDataToSend = new FormData();
      formDataToSend.append("name", data.name);
      formDataToSend.append("title", data.title);
      formDataToSend.append("description", data.description);
      if (data.rules) {
        formDataToSend.append("rules", data.rules);
      }
      if (logoFile) {
        formDataToSend.append("logo", logoFile);
      }
      if (bannerFile) {
        formDataToSend.append("banner", bannerFile);
      }

      const response = await api.post("/api/subthread/create", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      onSuccess(data);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Failed to create community. Please try again.";
      setErrors({ general: errorMessage });
    },
  });

  const validateForm = () => {
    const newErrors = {};

    // Name validation: 3-21 chars, lowercase, alphanumeric + hyphens
    const cleanName = formData.name.replace("t/", "").toLowerCase();
    if (!formData.name.trim()) {
      newErrors.name = "Community name is required";
    } else if (cleanName.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    } else if (cleanName.length > 21) {
      newErrors.name = "Name must be at most 21 characters";
    } else if (!/^[a-z0-9-]+$/.test(cleanName)) {
      newErrors.name = "Name can only contain lowercase letters, numbers, and hyphens";
    }

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Display title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be at most 200 characters";
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.length > 5000) {
      newErrors.description = "Description must be at most 5000 characters";
    }

    // Rules validation (optional)
    if (formData.rules && formData.rules.length > 10000) {
      newErrors.rules = "Rules must be at most 10000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      createCommunity(formData);
    }
  };

  const handleLogoChange = (file) => {
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleBannerChange = (file) => {
    setBannerFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setBannerPreview(null);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="glass rounded-3xl p-6 md:p-10 shadow-glass-lg backdrop-blur-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-6">
        {/* Community Name */}
        <FormField
          label="Community Name"
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="e.g., city-news"
          helperText="3-21 characters, lowercase letters, numbers, and hyphens only"
          required
        />

        {/* Display Title */}
        <FormField
          label="Display Title"
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          placeholder="e.g., City News & Updates"
          required
        />

        {/* Description */}
        <FormField
          label="Description"
          id="description"
          type="textarea"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          error={errors.description}
          placeholder="Describe what your community is about..."
          helperText="Minimum 10 characters"
          rows={5}
          required
        />

        {/* Rules */}
        <FormField
          label="Community Rules (Optional)"
          id="rules"
          type="textarea"
          value={formData.rules}
          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
          error={errors.rules}
          placeholder="Set rules for your community..."
          rows={4}
        />

        {/* Logo Upload */}
        <div>
          <label className="block mb-3 text-sm md:text-base font-medium text-gray-700">
            Community Logo (Optional)
          </label>
          <FileUploader
            onFileChange={handleLogoChange}
            preview={logoPreview}
            accept="image/*"
            label="Upload Logo"
          />
        </div>

        {/* Banner Upload */}
        <div>
          <label className="block mb-3 text-sm md:text-base font-medium text-gray-700">
            Community Banner (Optional)
          </label>
          <FileUploader
            onFileChange={handleBannerChange}
            preview={bannerPreview}
            accept="image/*"
            label="Upload Banner"
            isBanner
          />
        </div>

        {/* General Error */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 glass rounded-xl border-2 border-red-200 bg-red-50/50"
          >
            <p className="text-sm text-red-600">{errors.general}</p>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isPending}
          className="w-full py-4 md:py-5 rounded-xl bg-gradient-primary text-white font-semibold text-base md:text-lg shadow-lg hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          whileHover={{ scale: isPending ? 1 : 1.02, y: -2 }}
          whileTap={{ scale: isPending ? 1 : 0.98 }}
        >
          <span className="relative z-10 flex items-center justify-center space-x-2">
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
                <span>Creating Community...</span>
              </>
            ) : (
              <span>Create Community</span>
            )}
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
          />
        </motion.button>
      </div>
    </motion.form>
  );
}


