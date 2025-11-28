import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";

export default function EditPostModal({ post, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const postInfo = post?.post_info || {};
  const postId = postInfo?.id;
  
  console.log("[EditPostModal] Component initialized with post:", post);
  console.log("[EditPostModal] Post ID:", postId);
  console.log("[EditPostModal] Post info:", postInfo);
  
  if (!postId) {
    console.error("[EditPostModal] ERROR: Post ID is missing!");
  }
  
  const [title, setTitle] = useState(postInfo.title || "");
  const [content, setContent] = useState(postInfo.content || "");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(postInfo.media || null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [contentType, setContentType] = useState(postInfo.media ? "media" : "text");
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Update state when post changes
  useEffect(() => {
    if (postInfo) {
      setTitle(postInfo.title || "");
      setContent(postInfo.content || "");
      setMediaPreview(postInfo.media || null);
      setContentType(postInfo.media ? "media" : "text");
    }
  }, [postInfo]);

  const { mutate: updatePost, isPending } = useMutation({
    mutationFn: async (formData) => {
      console.log("[EditPostModal] Sending PATCH request to /api/post/" + postId);
      console.log("[EditPostModal] FormData contents:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      if (!postId) {
        throw new Error("Post ID is missing. Cannot update post.");
      }
      
      try {
        // Don't set Content-Type manually - axios will set it with boundary for FormData
        const response = await api.patch(`/api/post/${postId}`, formData);
        console.log("[EditPostModal] Update successful:", response.data);
        return response.data;
      } catch (error) {
        console.error("[EditPostModal] Update failed:", error);
        console.error("[EditPostModal] Error response:", error.response?.data);
        console.error("[EditPostModal] Error status:", error.response?.status);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("[EditPostModal] Mutation success, invalidating queries...");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: ["post", postId] });
      }
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("[EditPostModal] Mutation error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update post. Please try again.";
      console.error("[EditPostModal] Error message:", errorMessage);
      setErrors({
        submit: errorMessage,
      });
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setContentType("media");
      setErrors({});
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
    setErrors({});

    console.log("[EditPostModal] handleSubmit called");
    console.log("[EditPostModal] Current state:", {
      title: title.trim(),
      content: content.trim(),
      contentType,
      hasMediaFile: !!mediaFile,
      hasMediaUrl: !!mediaUrl,
      hasExistingMedia: !!postInfo.media,
    });

    if (!title.trim()) {
      console.log("[EditPostModal] Validation failed: Title is required");
      setErrors({ title: "Title is required" });
      return;
    }

    // Validate title length
    if (title.trim().length > 300) {
      console.log("[EditPostModal] Validation failed: Title too long");
      setErrors({ title: "Title must be 300 characters or less" });
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    
    // Always send content (even if empty, to allow clearing it)
    formData.append("content", content.trim() || "");

    // Determine content type and handle media
    if (contentType === "media" && mediaFile) {
      console.log("[EditPostModal] Adding media file to FormData");
      formData.append("media", mediaFile);
      formData.append("content_type", "media");
    } else if (contentType === "url" && mediaUrl.trim()) {
      console.log("[EditPostModal] Adding media URL to FormData");
      formData.append("content_url", mediaUrl.trim());
      formData.append("content_type", "url");
    } else {
      // No new media and no existing media, or explicitly removing media
      console.log("[EditPostModal] Setting content_type to text (no media)");
      formData.append("content_type", "text");
    }

    console.log("[EditPostModal] FormData prepared, calling updatePost mutation");
    updatePost(formData);
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
              <h2 className="text-2xl font-bold text-primary">Edit Post</h2>
              <p className="text-sm text-gray-600 mt-1">Update your post</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Close"
              disabled={isPending}
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
              <label htmlFor="edit-title" className="block text-sm font-semibold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors({});
                }}
                placeholder="Post title"
                required
                maxLength={300}
                className={`w-full bg-gray-100 rounded-xl p-4 border ${
                  errors.title ? "border-red-500" : "border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Content */}
            <div>
              <label htmlFor="edit-content" className="block text-sm font-semibold text-gray-700 mb-2">
                Content (Optional)
              </label>
              <textarea
                id="edit-content"
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

              {/* Current Media Preview */}
              {mediaPreview && !mediaFile && postInfo.media && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  {postInfo.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={postInfo.media} alt="Current media" className="w-full max-h-64 object-contain" />
                  ) : (
                    <video src={postInfo.media} controls className="w-full max-h-64" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPreview(null);
                      setMediaFile(null);
                      setMediaUrl("");
                      setContentType("text");
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}

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
                  disabled={isPending}
                >
                  Upload New Image/Video
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
                  disabled={isPending}
                />
              </div>

              {/* New Media Preview */}
              {mediaPreview && mediaFile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl overflow-hidden border border-gray-200"
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
                      setMediaPreview(postInfo.media || null);
                      setMediaUrl("");
                      setContentType(postInfo.media ? "media" : "text");
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </motion.div>
              )}
            </div>

            {/* Error Message */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
              >
                {errors.submit}
              </motion.div>
            )}

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
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Post</span>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
