import { motion } from "framer-motion";

export default function RouteResults({ distance, duration }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Route Information</span>
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-2xl font-bold text-primary mb-1">{distance}</div>
          <div className="text-sm text-gray-600">Distance</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-2xl font-bold text-primary mb-1">{duration}</div>
          <div className="text-sm text-gray-600">Duration</div>
        </div>
      </div>
    </motion.div>
  );
}


