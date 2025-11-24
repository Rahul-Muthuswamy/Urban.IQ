import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { web_search } from "../../utils/webSearch.js";

export default function LocationDetails({ location, details, onClose }) {
  const [isLoading, setIsLoading] = useState(!details);
  const [locationInfo, setLocationInfo] = useState(details);

  useEffect(() => {
    if (!details && location) {
      fetchLocationInfo();
    } else {
      setLocationInfo(details);
      setIsLoading(false);
    }
  }, [location, details]);

  const fetchLocationInfo = async () => {
    setIsLoading(true);
    try {
      const searchQuery = `${location.address || location.city} information facts history`;
      const results = await web_search(searchQuery);
      
      setLocationInfo({
        name: location.address || location.city,
        description: results.description || `Discover ${location.city || location.address} - a vibrant location with rich culture and history.`,
        facts: results.facts || [
          "Popular destination for tourists",
          "Well-connected transportation",
          "Rich cultural heritage",
        ],
        images: results.images || [],
      });
    } catch (error) {
      console.error("Error fetching location info:", error);
      setLocationInfo({
        name: location.address || location.city,
        description: "Location information not available.",
        facts: [],
        images: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20 max-h-[60vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Location Details</span>
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Address */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Address</p>
            <p className="text-gray-800 font-medium">{location.address || "Address not available"}</p>
            {location.city && (
              <p className="text-sm text-gray-500">{location.city}, {location.country}</p>
            )}
          </div>

          {/* Coordinates */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Coordinates</p>
            <p className="text-gray-800 font-mono text-sm">
              {location.coordinates[1].toFixed(6)}, {location.coordinates[0].toFixed(6)}
            </p>
          </div>

          {/* Description */}
          {locationInfo?.description && (
            <div>
              <p className="text-sm text-gray-600 mb-2">About</p>
              <p className="text-gray-700 text-sm leading-relaxed">{locationInfo.description}</p>
            </div>
          )}

          {/* Facts */}
          {locationInfo?.facts && locationInfo.facts.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Interesting Facts</p>
              <ul className="space-y-2">
                {locationInfo.facts.map((fact, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
            <motion.button
              onClick={() => {
                if (onSetStart) onSetStart(location.address);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Use as Start
            </motion.button>
            <motion.button
              onClick={() => {
                if (onSetEnd) onSetEnd(location.address);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Use as End
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

