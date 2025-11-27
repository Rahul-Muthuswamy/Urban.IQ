import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";

export default function EditSubthreadModal({ community, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: community.name?.replace("t/", "") || "",
    title: community.title || "",
    description: community.description || "",
    rules: community.rules || "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(community.logo || null);
  const [bannerPreview, setBannerPreview] = useState(community.banner || null);
  const [errors, setErrors] = useState({});

  const { mutate: updateCommunity, isPending } = useMutation({
    mutationFn: async (data) => {
      const formDataToSend = new FormData();
      // Ensure name has "t/" prefix if not already present
      let communityName = data.name.trim();
      if (!communityName.startsWith("t/")) {
        communityName = `t/${communityName.toLowerCase()}`;
      } else {
        communityName = communityName.toLowerCase();
      }
      formDataToSend.append("name", communityName);
      formDataToSend.append("title", data.title.trim());
      formDataToSend.append("description", data.description.trim() || "");
      formDataToSend.append("rules", data.rules.trim() || "");
      
      // Handle logo upload
      if (logoFile) {
        formDataToSend.append("logo", logoFile);
        formDataToSend.append("logo_content_type", "image");
      }
      
      // Handle banner upload
      if (bannerFile) {
        formDataToSend.append("banner", bannerFile);
        formDataToSend.append("banner_content_type", "image");
      }

      const response = await api.patch(`/api/thread/${community.id}`, formDataToSend);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all community-related queries
      queryClient.invalidateQueries({ queryKey: ["community"] });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Error updating community:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to update community. Please try again.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }
    if (!formData.title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    updateCommunity(formData);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-glass-xl border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Subthread</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-2.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800"
                placeholder="Community name (without t/)"
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-2.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800"
                placeholder="Community title"
                required
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-2.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 min-h-[100px]"
                placeholder="Community description"
                rows={4}
              />
            </div>

            {/* Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rules
              </label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-2.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 min-h-[120px]"
                placeholder="Community rules (one per line)"
                rows={5}
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                )}
                <label className="glass rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white/40 transition-colors text-sm font-medium text-gray-700">
                  {logoFile ? "Change Logo" : "Upload Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Banner Upload */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner
              </label>
              <div className="space-y-2">
                {bannerPreview && (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                  />
                )}
                <label className="glass rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white/40 transition-colors text-sm font-medium text-gray-700 inline-block">
                  {bannerFile ? "Change Banner" : "Upload Banner"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div> */}

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/20">
              <motion.button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-gradient-primary text-white font-semibold shadow-lg hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isPending ? 1 : 1.05 }}
                whileTap={{ scale: isPending ? 1 : 0.95 }}
              >
                {isPending ? (
                  <span className="flex items-center space-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.div>
                    <span>Saving...</span>
                  </span>
                ) : (
                  "Save Changes"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

