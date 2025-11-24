import { motion, AnimatePresence } from "framer-motion";

// Mobile-optimized carousel component
export default function MobileCarousel({ slides, currentSlide, onSlideChange }) {
  return (
    <div className="md:hidden relative h-64 overflow-hidden bg-gradient-to-br from-primary/20 via-accent/30 to-primary/20">
      <AnimatePresence mode="wait">
        {slides.map((slide, index) => (
          index === currentSlide && (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute inset-0"
            >
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  filter: "brightness(0.7) contrast(1.1)",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Quote overlay for mobile */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-bold mb-2"
                >
                  {slide.quote}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-white/80"
                >
                  — {slide.author}
                </motion.p>
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => onSlideChange(index)}
            className="focus:outline-none"
          >
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentSlide ? "w-8 bg-white" : "w-1 bg-white/40"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}


