import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function CarouselPanel({ slides, currentSlide, onSlideChange }) {
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Logo path - using the logo asset
  const logoPath = "/assets/3_remove_bg.png";

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 via-accent/30 to-primary/20 h-64 md:h-screen"
    >
      {/* Carousel Images - Full bleed with parallax effect */}
      <div className="absolute inset-0">
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
                <motion.div
                  className="w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${slide.image})`,
                    filter: "brightness(0.7) contrast(1.1)",
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Dynamic overlay gradient with subtle animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent"
                  animate={{
                    opacity: [0.8, 0.85, 0.8],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Subtle glass overlay effect */}
                <div className="absolute inset-0 backdrop-blur-[2px] bg-gradient-to-br from-white/5 via-transparent to-black/10" />
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Animated background particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full blur-sm"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              opacity: 0,
            }}
            animate={{
              y: [null, "-100%"],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-6 md:p-8 lg:p-12 h-full">
          {/* Logo - Huge logo without text */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hidden md:flex items-center"
          >
            <motion.img
              src={logoPath}
              alt="Urban.IQ Logo"
              className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain drop-shadow-2xl"
              onLoad={() => setLogoLoaded(true)}
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: logoLoaded ? 1 : 0,
                rotate: logoLoaded ? 0 : -180,
              }}
              transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              style={{ filter: "drop-shadow(0 0 15px rgba(255,255,255,0.6))" }}
            />
          </motion.div>

        {/* Quote Content - Enhanced with floating animation */}
        <div className="flex-1 flex flex-col justify-center items-start space-y-4 md:space-y-6">
          <AnimatePresence mode="wait">
            {slides.map((slide, index) => (
              index === currentSlide && (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, x: -20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, y: -30, x: 20 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-2 md:space-y-4 max-w-lg"
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight"
                    style={{
                      textShadow: "0 4px 20px rgba(0,0,0,0.7), 0 2px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {slide.quote}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm md:text-base lg:text-lg text-white/95 font-medium mt-3"
                    style={{
                      textShadow: "0 2px 10px rgba(0,0,0,0.6)",
                    }}
                  >
                    — {slide.author}
                  </motion.p>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* Slide Indicators - Enhanced with glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center space-x-2 pb-4 md:pb-0"
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
                animate={
                  index === currentSlide
                    ? {
                        boxShadow: [
                          "0 0 0px rgba(255,255,255,0.5)",
                          "0 0 10px rgba(255,255,255,0.8)",
                          "0 0 0px rgba(255,255,255,0.5)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: index === currentSlide ? Infinity : 0,
                  ease: "easeInOut",
                }}
              />
            </button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

