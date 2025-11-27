import { useState } from "react";
import { motion } from "framer-motion";

/**
 * CleanInputField - Clean white input with borders (not glassmorphism)
 * Features:
 * - White background
 * - Grey border
 * - Placeholders only (no labels inside)
 * - Focus ring (emerald)
 * - Soft pulse on hover
 */
export default function CleanInputField({
  id,
  type = "text",
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  icon,
  error,
  disabled,
  showPasswordToggle = false,
  showPassword,
  onTogglePassword,
  className = "",
}) {
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        animate={
          isFocused && !prefersReducedMotion
            ? {
                scale: 1.01,
                boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1), 0 0 0 1px rgba(16, 185, 129, 0.3)",
              }
            : {
                scale: 1,
                boxShadow: "0 0 0 0px rgba(16, 185, 129, 0)",
              }
        }
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
        whileHover={prefersReducedMotion ? {} : { scale: 1.005 }}
        className="relative rounded-xl bg-white border border-gray-300 overflow-hidden"
      >
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          id={id}
          type={type === "password" && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={type === "email" ? "email" : type === "password" ? "current-password" : type === "text" && id === "username" ? "username" : "off"}
          inputMode={type === "email" ? "email" : type === "tel" ? "tel" : "text"}
          className={`w-full ${icon ? "pl-12" : "pl-4"} ${showPasswordToggle ? "pr-12" : "pr-4"} py-4 md:py-5 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none text-base md:text-lg transition-all duration-300 border-0 min-h-[48px] touch-manipulation [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-strong-password-auto-fill-button]:hidden`}
          style={{
            WebkitAppearance: "none",
            WebkitTapHighlightColor: "transparent",
            fontSize: "16px", // Prevent iOS zoom on focus
          }}
        />

        {/* Password Toggle */}
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            style={{
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
