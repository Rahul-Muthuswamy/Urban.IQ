import { motion, AnimatePresence } from "framer-motion";

/**
 * AnimatedLeftPanel - Atmospheric left panel with intense blur, gradients, blobs, parallax, and vignette
 * Features:
 * - backdrop-blur-3xl (extremely deep blur)
 * - Multi-layer gradient overlay
 * - Darkened edges (vignette)
 * - Moving blobs / soft noise texture
 * - Parallax effect (slow & subtle)
 * - Tagline displayed bottom-left
 */
export default function AnimatedLeftPanel({ slides, currentSlide, onSlideChange }) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const currentSlideData = slides[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="hidden md:flex md:w-[35%] lg:w-1/2 relative overflow-hidden h-screen"
    >
      {/* Background Image with Intense Blur */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          {slides.map((slide, index) => (
            index === currentSlide && (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: 1, scale: prefersReducedMotion ? 1 : 1.05 }}
                exit={{ opacity: 0, scale: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0.3 : 10,
                  ease: "easeOut",
                }}
                className="absolute inset-0"
              >
                <motion.div
                  className="w-full h-full bg-cover bg-center bg-no-repeat backdrop-blur-3xl"
                  style={{
                    backgroundImage: `url(${slide.image})`,
                    filter: "brightness(0.6) contrast(1.2) saturate(0.8)",
                    backdropFilter: "blur(64px)",
                  }}
                  animate={
                    prefersReducedMotion
                      ? {}
                      : {
                          scale: [1, 1.05, 1],
                        }
                  }
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Multi-layer Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

      {/* Vignette - Darkened Edges (Reduced) */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* Moving Blobs / Soft Noise Texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${200 + Math.random() * 300}px`,
              height: `${200 + Math.random() * 300}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, rgba(132, 204, 22, 0.4) 0%, rgba(16, 185, 129, 0.3) 50%, transparent 70%)`,
              filter: "blur(80px)",
              mixBlendMode: "overlay",
              transform: "translate(-50%, -50%)",
            }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    x: [0, Math.random() * 100 - 50, 0],
                    y: [0, Math.random() * 100 - 50, 0],
                    scale: [1, 1.2, 1],
                  }
            }
            transition={{
              duration: 25 + Math.random() * 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Intense Backdrop Blur Layer */}
      <div className="absolute inset-0 backdrop-blur-3xl" />

      {/* Content - Logo Top Left, Tagline Bottom Left */}
      <div className="relative z-10 flex flex-col justify-between p-6 md:p-8 lg:p-12 h-full w-full">
        {/* Huge Logo - Top Left */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.2, 0.9, 0.2, 1] }}
          className="flex items-start"
        >
          <motion.img
            src="/assets/1_rem_bg.png"
            alt="Urban.IQ Logo"
            className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 object-contain drop-shadow-2xl"
            style={{
              filter: "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
            }}
            whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Tagline Bottom Left */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.2, 0.9, 0.2, 1] }}
          className="space-y-4 max-w-lg"
        >
          {currentSlideData?.quote && (
            <motion.p
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight"
              style={{
                textShadow: "0 4px 20px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6)",
                letterSpacing: "0.02em",
              }}
            >
              {currentSlideData.quote}
            </motion.p>
          )}
          {currentSlideData?.author && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-base md:text-lg lg:text-xl text-white/95 font-medium"
              style={{
                textShadow: "0 2px 10px rgba(0,0,0,0.7)",
              }}
            >
              — {currentSlideData.author}
            </motion.p>
          )}
        </motion.div>

        {/* Slide Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center space-x-2 mt-8"
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => onSlideChange(index)}
              className="focus:outline-none group"
              aria-label={`Go to slide ${index + 1}`}
            >
              <motion.div
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-8 bg-white shadow-lg"
                    : "w-1 bg-white/40 group-hover:bg-white/60"
                }`}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
              />
            </button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

