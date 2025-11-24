import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import CleanAuthCard from "./ui/CleanAuthCard.jsx";
import CleanInputField from "./ui/CleanInputField.jsx";
import CleanDivider from "./ui/CleanDivider.jsx";

export default function SigninForm({ formData, setFormData, errors, onSubmit, isPending }) {
  const [showPassword, setShowPassword] = useState(false);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Icon components
  const EmailIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  const PasswordIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );

  const GitHubIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="w-full max-w-lg mx-auto">
      <CleanAuthCard delay={0.2} className="w-full">
        {/* Logo with Quote - Top */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-6 flex items-center space-x-4"
        >
          <motion.img
            src="/assets/3_remove_bg.png"
            alt="Urban.IQ Logo"
            className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 200, damping: 15 }}
            whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 5 }}
          />
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-base md:text-lg lg:text-xl font-medium text-gray-600"
          >
            Your City, Reimagined.
          </motion.span>
        </motion.div>

        {/* Heading - Green with animations */}
        <motion.h1
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.2, 0.9, 0.2, 1] }}
          className="text-4xl md:text-5xl font-bold text-primary mb-3"
          style={{
            background: "linear-gradient(135deg, #84cc16 0%, #10b981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Welcome Back!
        </motion.h1>

        {/* Sign Up Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-8"
        >
          <span className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary font-semibold hover:text-accent transition-colors duration-300"
            >
              Sign Up
            </Link>
          </span>
        </motion.div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
          >
            <CleanInputField
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="someone@example.com"
              icon={EmailIcon}
              error={errors.email}
              disabled={isPending}
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
          >
            <CleanInputField
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              icon={PasswordIcon}
              error={errors.password}
              disabled={isPending}
              showPasswordToggle={true}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
          </motion.div>

          {/* Submit Button - Green to teal gradient with enhanced animations */}
          <motion.button
            type="submit"
            disabled={isPending}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
            whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            className="w-full py-4 md:py-5 rounded-xl bg-gradient-primary text-white font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mt-2"
          >
            <motion.span
              className="relative z-10"
              animate={isPending ? {} : { scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {isPending ? "Signing In..." : "Sign In"}
            </motion.span>
            {/* Animated gradient overlay */}
            {!prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent opacity-0 group-hover:opacity-20"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 100%",
                }}
              />
            )}
            {/* Ripple effect on click */}
            {!prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 4, opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.6 }}
              />
            )}
          </motion.button>

          {/* General Error */}
          {errors.general && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 text-center"
            >
              {errors.general}
            </motion.p>
          )}
        </form>

        {/* Clean Divider */}
        <CleanDivider text="Or sign in with" />

        {/* GitHub Button - White with grey border */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
          whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          className="w-full py-4 md:py-5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold text-base md:text-lg flex items-center justify-center space-x-3 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          {GitHubIcon}
          <span>GitHub</span>
        </motion.button>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-8 text-center text-xs text-gray-500"
        >
          © 2025 Urban.IQ. Licensed under the MIT License.
        </motion.p>
      </CleanAuthCard>
    </div>
  );
}
