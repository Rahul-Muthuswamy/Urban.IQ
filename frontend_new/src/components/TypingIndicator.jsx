import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start items-start space-x-3"
    >
      {/* Animated AI Avatar */}
      <motion.div
        className="flex-shrink-0"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
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

      {/* Typing Dots */}
      <motion.div
        className="glass rounded-2xl rounded-tl-sm px-4 py-3 shadow-glass-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center space-x-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                y: [0, -8, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}


