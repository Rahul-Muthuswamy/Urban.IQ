import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
// Toast notifications handled via inline messages

export default function DeletePostModal({ report, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { mutate: deletePost, isPending } = useMutation({
    mutationFn: async (deleteReason) => {
      // Axios DELETE with body requires data in the config object
      const response = await api.delete(`/api/mod/posts/${report.post_id}`, {
        params: {
          report_id: report.id,
        },
        data: deleteReason ? { reason: deleteReason } : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      // Also resolve the report
      api.put(`/api/reports/${report.id}/resolve`, {
        keep_post: false,
      }).catch((err) => {
        console.error("Error resolving report:", err);
      });

      onSuccess();
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || "Failed to delete post");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (confirmText !== "DELETE") {
      setErrorMessage("Please type 'DELETE' to confirm");
      return;
    }

    deletePost(reason.trim() || undefined);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass rounded-2xl p-6 md:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-glass-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Delete Post</h2>
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

          <div className="mb-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
              <h3 className="font-semibold text-red-800 mb-2">Post to be deleted:</h3>
              <p className="text-sm text-red-700">{report.post?.title || "Loading..."}</p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Report Reason:</h4>
              <p className="text-sm text-yellow-700">{report.reason}</p>
            </div>
          </div>

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
            >
              {errorMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Deletion Reason (Optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Provide a reason for deletion (optional)"
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </label>
              <input
                id="confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                placeholder="DELETE"
                disabled={isPending}
                required
              />
            </div>

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
                disabled={isPending || confirmText !== "DELETE"}
                className="px-6 py-2 bg-red-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isPending || confirmText !== "DELETE" ? 1 : 1.05 }}
                whileTap={{ scale: isPending || confirmText !== "DELETE" ? 1 : 0.95 }}
              >
                {isPending ? "Deleting..." : "Delete Post"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

