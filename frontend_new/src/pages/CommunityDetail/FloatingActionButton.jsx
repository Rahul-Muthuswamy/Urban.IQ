import { motion } from "framer-motion";

export default function FloatingActionButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-40 w-14 h-14 md:w-16 md:h-16 bg-gradient-primary text-white rounded-full shadow-lg hover:shadow-glow-lg flex items-center justify-center transition-all"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      aria-label="Create Post"
    >
      <motion.svg
        className="w-6 h-6 md:w-8 md:h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        animate={{ rotate: [0, 90, 0] }}
        transition={{ duration: 0.3 }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </motion.svg>
    </motion.button>
  );
}


