import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function SigninForm({ formData, setFormData, errors, onSubmit, isPending }) {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const inputVariants = {
    unfocused: {
      scale: 1,
      boxShadow: "0 0 0 0px rgba(132, 204, 22, 0)",
    },
    focused: {
      scale: 1.02,
      boxShadow: "0 0 0 3px rgba(132, 204, 22, 0.2), 0 0 20px rgba(132, 204, 22, 0.3)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="w-full max-w-lg z-10"
    >
      <div className="glass rounded-3xl p-10 md:p-12 lg:p-14 shadow-glass-lg backdrop-blur-xl" style={{ minHeight: "600px" }}>
        {/* Logo and Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center space-x-4 mb-3"
        >
          <motion.img
            src="/assets/3_remove_bg.png"
            alt="Urban.IQ Logo"
            className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-contain"
          />
          <span className="text-base md:text-lg text-gray-600 font-medium">Your City, Reimagined.</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-gradient mb-3"
        >
          Welcome Back!
        </motion.h1>

        {/* Sign Up Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <span className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-accent font-semibold hover:text-primary transition-colors duration-300"
            >
              Sign Up
            </Link>
          </span>
        </motion.div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-7">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label htmlFor="email" className="block mb-3 text-sm md:text-base font-medium text-gray-700">
              Email
            </label>
            <motion.div
              variants={inputVariants}
              animate={focusedField === "email" ? "focused" : "unfocused"}
              className="relative"
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className="glass-input w-full pl-12 pr-4 py-4 md:py-5 rounded-xl focus:outline-none text-base"
                placeholder="someone@example.com"
                disabled={isPending}
              />
            </motion.div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-500"
              >
                {errors.email}
              </motion.p>
            )}
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label htmlFor="password" className="block mb-3 text-sm md:text-base font-medium text-gray-700">
              Password
            </label>
            <motion.div
              variants={inputVariants}
              animate={focusedField === "password" ? "focused" : "unfocused"}
              className="relative"
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className="glass-input w-full pl-12 pr-12 py-4 md:py-5 rounded-xl focus:outline-none text-base"
                placeholder="Enter your password"
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
            </motion.div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-500"
              >
                {errors.password}
              </motion.p>
            )}
          </motion.div>

          {/* Terms & Conditions Checkbox */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-start space-x-3 pt-2"
          >
            <motion.input
              type="checkbox"
              id="agreeToTerms"
              checked={formData.agreeToTerms || false}
              onChange={(e) =>
                setFormData({ ...formData, agreeToTerms: e.target.checked })
              }
              className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2"
              whileTap={{ scale: 0.9 }}
            />
            <label htmlFor="agreeToTerms" className="text-sm md:text-base text-gray-700">
              I agree to the{" "}
              <Link to="/terms" className="text-accent font-semibold hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
            </label>
          </motion.div>
          {errors.agreeToTerms && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {errors.agreeToTerms}
            </motion.p>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isPending}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 md:py-5 rounded-xl bg-gradient-primary text-white font-semibold text-base md:text-lg shadow-lg hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mt-2"
          >
            <span className="relative z-10">
              {isPending ? "Signing In..." : "Sign In"}
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={false}
            />
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

        {/* Divider with lines on both sides */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="relative my-8"
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300/60" style={{ borderColor: "rgba(156, 163, 175, 0.4)" }} />
          </div>
          <div className="relative flex justify-center items-center">
            <div className="flex-1 border-t border-gray-300/60 mr-4" style={{ borderColor: "rgba(156, 163, 175, 0.4)" }} />
            <span className="px-4 bg-transparent text-sm text-gray-500 font-medium">Or Sign in with</span>
            <div className="flex-1 border-t border-gray-300/60 ml-4" style={{ borderColor: "rgba(156, 163, 175, 0.4)" }} />
          </div>
        </motion.div>

        {/* GitHub Button */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 md:py-5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold text-base md:text-lg flex items-center justify-center space-x-3 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>GitHub</span>
        </motion.button>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-8 text-center text-xs text-gray-500"
        >
          © 2025 Urban.IQ. Licensed under the MIT License.
        </motion.p>
      </div>
    </motion.div>
  );
}

