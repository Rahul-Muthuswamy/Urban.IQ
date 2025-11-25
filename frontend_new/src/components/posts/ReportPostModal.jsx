import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";

const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Misinformation",
  "Inappropriate Content",
  "Copyright Violation",
  "Other",
];

export default function ReportPostModal({ postId, onClose, onSuccess }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { mutate: submitReport, isPending } = useMutation({
    mutationFn: async (reason) => {
      const response = await api.post("/api/reports", {
        post_id: postId,
        reason: reason,
      });
      return response.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
      }, 2000);
    },
    onError: (error) => {
      setError(error.response?.data?.message || "Failed to submit report. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }

    const reason = selectedReason === "Other" ? customReason.trim() : selectedReason;

    if (!reason || reason.length < 10) {
      setError("Please provide a reason (at least 10 characters)");
      return;
    }

    submitReport(reason);
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
            <h2 className="text-2xl font-bold text-gray-800">Report Post</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              disabled={isPending || success}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Report Submitted</h3>
              <p className="text-gray-600">Thank you for your report. We'll review it shortly.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Why are you reporting this post? *
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-4 h-4 text-primary focus:ring-primary"
                        disabled={isPending}
                      />
                      <span className="text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedReason === "Other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Please provide details *
                  </label>
                  <textarea
                    id="customReason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Describe the issue (at least 10 characters)"
                    disabled={isPending}
                    required={selectedReason === "Other"}
                  />
                </motion.div>
              )}

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
                  {isPending ? "Submitting..." : "Submit Report"}
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}




