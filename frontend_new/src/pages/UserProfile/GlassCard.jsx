import { motion } from "framer-motion";

export default function GlassCard({ children, className = "", title, subtitle, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass rounded-2xl p-6 md:p-8 shadow-glass-lg ${className}`}
      {...props}
    >
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gradient">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}


