import { motion, AnimatePresence } from "framer-motion";

export default function DeleteConfirmModal({ postTitle, onConfirm, onCancel, isDeleting }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass rounded-2xl p-6 md:p-8 w-full max-w-md shadow-glass-xl"
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Post?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">"{postTitle}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                onClick={onConfirm}
                disabled={isDeleting}
                className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                whileHover={{ scale: isDeleting ? 1 : 1.05 }}
                whileTap={{ scale: isDeleting ? 1 : 0.95 }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}








