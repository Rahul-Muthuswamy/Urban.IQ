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
      },
    },
  },
  plugins: [],
};

