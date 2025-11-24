import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";

export default function CreatePostModal({ communityId, communityName, onClose, onPostCreated }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [contentType, setContentType] = useState("text");
  const fileInputRef = useRef(null);

  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post("/api/post", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts", communityId] });
      queryClient.invalidateQueries({ queryKey: ["community", communityName] });
      if (onPostCreated) onPostCreated();
    },
    onError: (error) => {
      console.error("Error creating post:", error);
      alert(error.response?.data?.message || "Failed to create post. Please try again.");
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setContentType("media");
      // Create preview
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setMediaPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleUrlChange = () => {
    if (mediaUrl) {
      setContentType("url");
      setMediaFile(null);
      setMediaPreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    const formData = new FormData();
    formData.append("subthread_id", communityId);
    formData.append("title", title.trim());
    if (content.trim()) {
      formData.append("content", content.trim());
    }

    if (contentType === "media" && mediaFile) {
      formData.append("media", mediaFile);
      formData.append("content_type", "media");
    } else if (contentType === "url" && mediaUrl) {
      formData.append("content_url", mediaUrl);
      formData.append("content_type", "url");
    }

    createPost(formData);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white/95 backdrop-blur-md rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary">Create Post</h2>
              <p className="text-sm text-gray-600 mt-1">Posting to r/{communityName?.replace("t/", "")}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                required
                maxLength={300}
                className="w-full bg-gray-100 rounded-xl p-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                Content (Optional)
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Post content"
                rows={6}
                className="w-full bg-gray-100 rounded-xl p-4 resize-none border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              />
            </div>

            {/* Media Options */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">Media (Optional)</label>

              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all text-sm font-medium"
                >
                  Upload Image/Video
                </button>
              </div>

              {/* URL Input */}
              <div>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    handleUrlChange();
                  }}
                  placeholder="Or paste image/video URL"
                  className="w-full bg-gray-100 rounded-xl p-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
              </div>

              {/* Preview */}
              {mediaPreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl overflow-hidden"
                >
                  {mediaFile?.type.startsWith("image/") ? (
                    <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-contain" />
                  ) : (
                    <video src={mediaPreview} controls className="w-full max-h-64" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                      setMediaUrl("");
                      setContentType("text");
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={isPending || !title.trim()}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                whileHover={{ scale: isPending || !title.trim() ? 1 : 1.05 }}
                whileTap={{ scale: isPending || !title.trim() ? 1 : 0.95 }}
              >
                {isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </motion.div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <span>Post</span>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

