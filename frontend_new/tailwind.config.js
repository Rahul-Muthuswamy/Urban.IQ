/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#84cc16", // Lime green
        accent: "#10b981", // Emerald green
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #84cc16 0%, #10b981 100%)",
        "gradient-glass": "linear-gradient(135deg, rgba(132, 204, 22, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "glass-lg": "0 20px 60px 0 rgba(31, 38, 135, 0.5)",
        "glass-xl": "0 25px 80px 0 rgba(31, 38, 135, 0.6)",
        glow: "0 0 20px rgba(132, 204, 22, 0.5)",
        "glow-lg": "0 0 40px rgba(16, 185, 129, 0.6)",
      },
      animation: {
        "slide-in": "slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.8s ease-out",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "sheen-sweep": "sheenSweep 3s ease-in-out infinite",
        "blob-float": "blobFloat 25s ease-in-out infinite",
        "zoom-pan": "zoomPan 10s ease-out infinite",
        "shimmer-line": "shimmerLine 3s ease-in-out infinite",
        "spring-slide-up": "springSlideUp 0.7s cubic-bezier(0.2, 0.9, 0.2, 1)",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(132, 204, 22, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(16, 185, 129, 0.8)" },
        },
        sheenSweep: {
          "0%": { transform: "translateX(-100%) translateY(-100%)", opacity: "0" },
          "50%": { opacity: "0.5" },
          "100%": { transform: "translateX(100%) translateY(100%)", opacity: "0" },
        },
        blobFloat: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -30px) scale(1.2)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
        zoomPan: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        shimmerLine: {
          "0%": { backgroundPosition: "0% 50%", opacity: "0.4" },
          "50%": { backgroundPosition: "100% 50%", opacity: "1" },
          "100%": { backgroundPosition: "0% 50%", opacity: "0.4" },
        },
        springSlideUp: {
          "0%": { transform: "translateY(30px) scale(0.95)", opacity: "0" },
          "60%": { transform: "translateY(-5px) scale(1.02)", opacity: "0.8" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

