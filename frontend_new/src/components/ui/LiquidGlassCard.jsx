import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * LiquidGlassCard - Premium glassmorphism card with sheen animation
 * Features:
 * - bg-white/10
 * - backdrop-blur-2xl
 * - border border-white/15
 * - Soft glowing edges
 * - Floating sheen animation on hover
 * - Fits 100% height of right side section
 */
export default function LiquidGlassCard({ children, className = "", delay = 0 }) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    // Subtle idle sheen animation every 8 seconds
    const interval = setInterval(() => {
      setMousePosition({
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: delay,
        duration: prefersReducedMotion ? 0.3 : 0.7,
        ease: [0.2, 0.9, 0.2, 1],
      }}
      onMouseMove={handleMouseMove}
      className={`relative rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 md:p-10 lg:p-12 flex flex-col ${className}`}
      style={{
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
      }}
    >
      {/* Soft Glowing Edges */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(255, 255, 255, 0.1)",
        }}
      />

      {/* Floating Sheen Animation */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)`,
            transform: `translate(${mousePosition.x - 50}%, ${mousePosition.y - 50}%) rotate(45deg)`,
            width: "200%",
            height: "200%",
          }}
          animate={{
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </motion.div>
  );
}

