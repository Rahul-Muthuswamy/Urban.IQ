import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";

export default function EditPostModal({ post, onClose, onSuccess }) {
  const [title, setTitle] = useState(post.post_info?.title || "");
  const [content, setContent] = useState(post.post_info?.content || "");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const postInfo = post.post_info || {};

  const { mutate: updatePost, isPending } = useMutation({
    mutationFn: async (formData) => {
      const response = await api.patch(`/api/post/${postInfo.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postInfo.id] });
      onSuccess();
    },
    onError: (error) => {
      setError(error.response?.data?.message || "Failed to update post. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content.trim() || "");
    formData.append("subthread_id", postInfo.thread_id || "");

    updatePost(formData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass rounded-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-glass-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Post</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              disabled={isPending}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Enter post title"
                disabled={isPending}
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                placeholder="Enter post content (optional)"
                disabled={isPending}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={isPending}
                className="px-6 py-2 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow transition-all disabled:opacity-50"
                whileHover={{ scale: isPending ? 1 : 1.05 }}
                whileTap={{ scale: isPending ? 1 : 0.95 }}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}



