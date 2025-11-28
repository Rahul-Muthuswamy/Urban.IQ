import { motion } from "framer-motion";
import { useEffect } from "react";

export default function SuccessModal({ community, onClose }) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
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
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full shadow-glass-xl backdrop-blur-xl"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center"
        >
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        {/* Success Message */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl font-bold text-gradient text-center mb-4"
        >
          Community Created!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-200 text-center mb-6"
        >
          Your community "{community?.subthread?.title || "Community"}" has been created successfully.
        </motion.p>

        {/* Community Info */}
        {community?.subthread && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-4 mb-6"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-900">Name:</span>
                <span className="font-semibold text-gray-800">{community.subthread.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">Title:</span>
                <span className="font-semibold text-gray-800">{community.subthread.title}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Close Button */}
        <motion.button
          onClick={onClose}
          className="w-full py-4 rounded-xl bg-gradient-primary text-white font-semibold shadow-lg hover:shadow-glow-lg transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
}


