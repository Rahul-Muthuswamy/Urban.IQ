import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-12 py-6 text-center"
    >
      <p className="text-sm text-gray-500">
        © 2025 Urban.IQ. Licensed under the MIT License.
      </p>
    </motion.footer>
  );
}


