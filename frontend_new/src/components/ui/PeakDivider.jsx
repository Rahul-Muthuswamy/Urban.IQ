import { motion } from "framer-motion";

/**
 * PeakDivider - Animated glowing divider with shimmer
 * Features:
 * - Glowing shimmer animation
 * - Smooth transitions
 */
export default function PeakDivider({ text = "Or continue with" }) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1, duration: 0.6 }}
      className="relative my-8"
    >
      {/* Animated shimmer line */}
      <div className="absolute inset-0 flex items-center">
        <motion.div
          className="h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
          animate={
            prefersReducedMotion
              ? {}
              : {
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }
          }
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>

      {/* Center content */}
      <div className="relative flex justify-center items-center">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/20 mr-4" />
        <span className="px-4 bg-transparent text-sm text-white/80 font-medium">{text}</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20 ml-4" />
      </div>
    </motion.div>
  );
}

