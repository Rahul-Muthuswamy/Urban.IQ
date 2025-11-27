import { motion } from "framer-motion";

/**
 * CleanAuthCard - Clean white card for auth forms (not glassmorphism)
 * Features:
 * - Clean white background
 * - Soft rounded corners
 * - Subtle shadow
 * - Fits content naturally
 */
export default function CleanAuthCard({ children, className = "", delay = 0 }) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: delay,
        duration: prefersReducedMotion ? 0.3 : 0.7,
        ease: [0.2, 0.9, 0.2, 1],
      }}
      className={`relative rounded-xl md:rounded-2xl bg-white shadow-lg border-2 px-6 sm:px-8 md:px-10 lg:px-12 py-1 sm:py-2 md:py-4 lg:py-6 flex flex-col w-full max-w-full ${className}`}
      style={{
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      {children}
    </motion.div>
  );
}

