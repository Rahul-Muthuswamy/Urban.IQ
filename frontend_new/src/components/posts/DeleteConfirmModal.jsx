import { motion, AnimatePresence } from "framer-motion";

export default function DeleteConfirmModal({ postTitle, onConfirm, onCancel, isDeleting }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-glass-xl border border-red-200"
        >
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">Delete Post</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>"{postTitle}"</strong>? This action cannot be undone.
            </p>
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This post and all its comments will be permanently deleted.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <motion.button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              whileHover={{ scale: isDeleting ? 1 : 1.05 }}
              whileTap={{ scale: isDeleting ? 1 : 0.95 }}
            >
              {isDeleting ? (
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
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Post</span>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
