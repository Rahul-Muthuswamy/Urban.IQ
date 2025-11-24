import { motion } from "framer-motion";

/**
 * CleanDivider - Simple divider with text (not glowing)
 * Features:
 * - Clean grey lines
 * - Centered text
 */
export default function CleanDivider({ text = "Or continue with" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1, duration: 0.6 }}
      className="relative my-8"
    >
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center items-center">
        <div className="flex-1 border-t border-gray-300 mr-4" />
        <span className="px-4 bg-white text-sm text-gray-500 font-medium">{text}</span>
        <div className="flex-1 border-t border-gray-300 ml-4" />
      </div>
    </motion.div>
  );
}

