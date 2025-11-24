import { motion } from "framer-motion";
import { useState } from "react";

export default function MessageBubble({ message, index }) {
  const [showSources, setShowSources] = useState(false);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (message.type === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{
          duration: 0.4,
          delay: index * 0.05,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] md:max-w-[70%]">
          <motion.div
            className="glass rounded-2xl rounded-tr-sm px-4 py-3 bg-gradient-to-br from-primary/20 to-accent/20 shadow-glass-lg"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-gray-800 text-sm md:text-base whitespace-pre-wrap break-words">
              {message.text}
            </p>
            {message.timestamp && (
              <p className="text-xs text-gray-500 mt-2 text-right">
                {formatTime(message.timestamp)}
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // AI Message
  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="flex justify-start items-start space-x-3"
    >
      {/* AI Avatar */}
      <motion.div
        className="flex-shrink-0"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full glass flex items-center justify-center shadow-glass">
          <img
            src="/assets/4_remove_bg.png"
            alt="AI Assistant"
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          />
        </div>
      </motion.div>

      {/* Message Content */}
      <div className="flex-1 max-w-[80%] md:max-w-[70%]">
        <motion.div
          className="glass rounded-2xl rounded-tl-sm px-4 py-3 shadow-glass-lg"
          whileHover={{ scale: 1.01 }}
        >
          {message.isError ? (
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 text-sm md:text-base">{message.text}</p>
            </div>
          ) : (
            <>
              <p className="text-gray-800 text-sm md:text-base whitespace-pre-wrap break-words">
                {message.text}
              </p>
              {message.isPolitical && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <p className="text-xs text-yellow-800">
                    ⚠️ This response may contain political content. Please verify information independently.
                  </p>
                </motion.div>
              )}
            </>
          )}

          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3">
              <motion.button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center space-x-2 text-xs text-primary hover:text-accent transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>{showSources ? "Hide" : "Show"} Sources ({message.sources.length})</span>
              </motion.button>

              <motion.div
                initial={false}
                animate={{
                  height: showSources ? "auto" : 0,
                  opacity: showSources ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2">
                  {message.sources.map((source, idx) => (
                    <motion.a
                      key={idx}
                      href={source.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start space-x-2 p-2 glass rounded-lg hover:bg-white/40 transition-colors text-xs"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-gray-700 line-clamp-2">{source.title || source.url || `Source ${idx + 1}`}</span>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Timestamp */}
          {message.timestamp && (
            <p className="text-xs text-gray-500 mt-2">
              {formatTime(message.timestamp)}
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}


