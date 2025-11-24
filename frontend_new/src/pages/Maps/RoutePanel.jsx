import { motion } from "framer-motion";

export default function RoutePanel({
  startLocation,
  endLocation,
  onStartChange,
  onEndChange,
  onCalculate,
  isCalculating,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary mb-1">Route Planning</h2>
        <p className="text-sm text-gray-600">Plan your journey with smart routing</p>
      </div>

      <div className="space-y-4">
        {/* Start Location */}
        <div>
          <label htmlFor="startInput" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Start Location</span>
          </label>
          <input
            id="startInput"
            type="text"
            value={startLocation}
            onChange={(e) => onStartChange(e.target.value)}
            placeholder="e.g. Chennai Central Station or 13.0827,80.2707"
            className="w-full bg-gray-100 rounded-xl p-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        {/* End Location */}
        <div>
          <label htmlFor="endInput" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Destination</span>
          </label>
          <input
            id="endInput"
            type="text"
            value={endLocation}
            onChange={(e) => onEndChange(e.target.value)}
            placeholder="e.g. Marina Beach or 13.0475,80.2827"
            className="w-full bg-gray-100 rounded-xl p-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Calculate Button */}
        <motion.button
          onClick={onCalculate}
          disabled={isCalculating || !startLocation.trim() || !endLocation.trim()}
          className="w-full px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          whileHover={{ scale: isCalculating ? 1 : 1.02 }}
          whileTap={{ scale: isCalculating ? 1 : 0.98 }}
        >
          {isCalculating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </motion.div>
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Calculate Route</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}


