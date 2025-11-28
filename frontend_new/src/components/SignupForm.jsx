import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import CleanAuthCard from "./ui/CleanAuthCard.jsx";
import CleanInputField from "./ui/CleanInputField.jsx";
import CleanDivider from "./ui/CleanDivider.jsx";

export default function SignupForm({ formData, setFormData, errors, onSubmit, isPending, onGitHubLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Icon components
  const UserIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );

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
          className="flex items-center space-x-4"
        >
          <motion.img
            src="/assets/7_remove_bg.png"
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
          className="text-3xl md:text-4xl font-bold text-primary mb-3 md:leading-normal"
          style={{
            background: "linear-gradient(135deg, #84cc16 0%, #10b981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Join the Community!
        </motion.h1>

        {/* Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-8"
        >
          <span className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:text-accent transition-all duration-300 inline-block hover:scale-105"
            >
              Sign In
            </Link>
          </span>
        </motion.div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Name Field */}
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
          >
            <CleanInputField
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Enter your name"
              icon={UserIcon}
              error={Array.isArray(errors.username) ? errors.username[0] : errors.username}
              disabled={isPending}
            />
          </motion.div>

          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
          >
            <CleanInputField
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="someone@example.com"
              icon={EmailIcon}
              error={Array.isArray(errors.email) ? errors.email[0] : errors.email}
              disabled={isPending}
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
          >
            <CleanInputField
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              icon={PasswordIcon}
              error={Array.isArray(errors.password) ? errors.password[0] : errors.password}
              disabled={isPending}
              showPasswordToggle={true}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
          </motion.div>

          {/* Terms & Conditions Checkbox */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-start space-x-3 pt-2"
          >
            <motion.label
              htmlFor="agreeToTerms"
              className="flex items-start space-x-3 cursor-pointer touch-manipulation min-h-[44px]"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <motion.input
                type="checkbox"
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                className="mt-1 w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2 cursor-pointer"
                style={{ WebkitTapHighlightColor: "transparent" }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              />
              <span className="text-sm md:text-base text-gray-700 pt-0.5">
              I agree to the{" "}
                <button 
                  type="button"
                  onClick={() => setShowTermsPopup(true)}
                  className="text-primary font-semibold hover:text-accent transition-colors underline"
                >
                  Terms & Conditions
                </button>
              </span>
            </motion.label>
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

          {/* Submit Button - Green to teal gradient with enhanced animations */}
          <motion.button
            type="submit"
            disabled={isPending}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1, duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
            whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            className="w-full py-3 md:py-4 rounded-xl bg-gradient-primary text-white font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mt-2 min-h-[48px] touch-manipulation"
            style={{
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <motion.span
              className="relative z-10"
              animate={isPending ? {} : { scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {isPending ? "Creating Account..." : "Create Account"}
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
        <CleanDivider text="Or sign up with" />

        {/* GitHub Button - White with grey border */}
        <motion.button
          type="button"
          onClick={onGitHubLogin}
          disabled={isPending}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
          whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          className="w-full py-3 md:py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold text-base md:text-lg flex items-center justify-center space-x-3 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md min-h-[48px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {GitHubIcon}
          <span>{isPending ? "Loading..." : "GitHub"}</span>
        </motion.button>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-6 text-center text-xs text-gray-500"
        >
          © 2025 Urban.IQ. Licensed under the MIT License.
        </motion.p>
      </CleanAuthCard>

      {/* Terms & Conditions Popup */}
      {showTermsPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTermsPopup(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white rounded-2xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl pl-8 border-2 border-[#999]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">
                Terms & Conditions
              </h2>
              <button
                onClick={() => setShowTermsPopup(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 italic">Last Updated: 28th Nov, 2025</p>
                <p className="my-2">
                  Welcome to Urban.IQ, an AI-powered civic engagement platform designed to help communities access reliable civic information, participate in discussions, and navigate local services. By accessing or using Urban.IQ, you agree to the following Terms and Conditions.
                </p>
                <p className="font-semibold">Please read them carefully.</p>
              </div>

              <h3 className="text-lg font-semibold text-gray-800">1. Acceptance of Terms</h3>
              <p>By using Urban.IQ, you acknowledge that you:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Have read and understood these Terms</li>
                <li>Agree to comply with them</li>
                <li>Are at least 13 years old or have parental permission</li>
              </ul>
              <p>If you do not agree, please discontinue use of the platform.</p>

              <h3 className="text-lg font-semibold text-gray-800">2. Purpose of Urban.IQ</h3>
              <p>Urban.IQ is designed to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide civic information using AI and RAG</li>
                <li>Enable community discussions and engagement</li>
                <li>Assist users in finding polling locations and public services</li>
                <li>Offer a safe and moderated civic-social environment</li>
              </ul>
              <p className="font-semibold">Urban.IQ does not provide legal, political, financial, or professional advice.</p>

              <h3 className="text-lg font-semibold text-gray-800">3. User Responsibilities</h3>
              <p>Users agree to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate information when creating an account</li>
                <li>Use the platform ethically and respectfully</li>
                <li>Not impersonate others or create fake profiles</li>
                <li>Follow community guidelines and moderator instructions</li>
                <li>Report harmful or suspicious activity responsibly</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800">4. AI Assistant Disclaimer</h3>
              <p>The AI assistant:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provides unbiased, neutral, and verified civic information</li>
                <li>May decline to respond to biased, harmful, or manipulative prompts</li>
                <li>Does not provide political recommendations</li>
                <li>Should not be used to influence elections or campaigns</li>
              </ul>
              <p className="font-semibold">Urban.IQ is not responsible for decisions made based on AI output.</p>

              <h3 className="text-lg font-semibold text-gray-800">5. Content Ownership</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Users retain rights to the content they post.</li>
                <li>By posting, users grant Urban.IQ a license to display, modify, and distribute the content within the platform.</li>
                <li>Urban.IQ may remove content that violates these Terms.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800">6. Moderation</h3>
              <p>Moderators (administrative users) may:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Review, flag, or remove content</li>
                <li>Suspend or restrict accounts</li>
                <li>Take actions to maintain platform integrity</li>
              </ul>
              <p>Users agree not to interfere with moderation tools or processes.</p>

              <h3 className="text-lg font-semibold text-gray-800">7. Privacy & Data Usage</h3>
              <p>Urban.IQ may collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Basic profile information</li>
                <li>OAuth data (e.g., GitHub username)</li>
                <li>Activity logs (posts, comments, messages)</li>
                <li>Technical information (device, browser, location approximate)</li>
              </ul>
              <p>Data is used for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Authentication</li>
                <li>Platform functionality</li>
                <li>Personalized content</li>
                <li>Safety monitoring</li>
                <li>Improving user experience</li>
              </ul>
              <p className="font-semibold">Sensitive political preferences are not collected or stored.</p>

              <h3 className="text-lg font-semibold text-gray-800">8. Accessibility Commitment</h3>
              <p>Urban.IQ follows inclusive design principles:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>ARIA tags for assistive technologies</li>
                <li>NVDA screen-reader support</li>
                <li>Keyboard navigability</li>
                <li>Clear, high-contrast UI</li>
              </ul>
              <p>Users may report accessibility issues for improvement.</p>

              <h3 className="text-lg font-semibold text-gray-800">9. Prohibited Behaviors / Misuse</h3>
              <p>Users agree NOT to misuse Urban.IQ in any of the following ways:</p>
              
              <h4 className="text-md font-semibold text-gray-700 mt-3">A. Political Misuse</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Attempting to influence elections or campaigns</li>
                <li>Spreading propaganda or politically biased content</li>
                <li>Using AI to generate political persuasion arguments</li>
              </ul>

              <h4 className="text-md font-semibold text-gray-700 mt-3">B. Misinformation & Harm</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sharing false civic data, hoaxes, or misleading information</li>
                <li>Uploading harmful, hateful, or violent content</li>
                <li>Threatening, harassing, or bullying others</li>
              </ul>

              <h4 className="text-md font-semibold text-gray-700 mt-3">C. Platform Manipulation</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Creating fake accounts, bots, or mass posting</li>
                <li>Attempting to bypass moderation</li>
                <li>Data scraping or reverse engineering the platform</li>
              </ul>

              <h4 className="text-md font-semibold text-gray-700 mt-3">D. Security Violations</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Attempting to breach, probe, or exploit system vulnerabilities</li>
                <li>Injecting malware, phishing, or harmful links</li>
                <li>Misusing OAuth tokens or JWT tokens</li>
              </ul>

              <h4 className="text-md font-semibold text-gray-700 mt-3">E. AI Misuse</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Prompting the AI to generate harmful or biased responses</li>
                <li>Using the assistant for political persuasion</li>
                <li>Attempting to manipulate model behavior</li>
              </ul>

              <h4 className="text-md font-semibold text-gray-700 mt-3">F. Privacy Violations</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sharing others' personal information without consent</li>
                <li>Stalking or tracking users</li>
                <li>Abusing anonymous reporting features</li>
              </ul>

              <p className="font-semibold mt-3">Urban.IQ reserves the right to take action against misuse.</p>

              <h3 className="text-lg font-semibold text-gray-800">10. Messaging & Communication</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Direct messages must remain respectful and safe.</li>
                <li>Harassment, threats, or abusive behavior are prohibited.</li>
                <li>Moderators may review messages if legally required or for safety.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800">11. Account Suspension</h3>
              <p>Urban.IQ may suspend accounts for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Violating any terms listed here</li>
                <li>Engaging in harmful or illegal activities</li>
                <li>Repeatedly posting reported content</li>
              </ul>
              <p>Appeals may be submitted via the support channel.</p>

              <h3 className="text-lg font-semibold text-gray-800">12. Liability Limitation</h3>
              <p>Urban.IQ is not liable for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Incorrect or incomplete civic information</li>
                <li>User-generated content</li>
                <li>Technical issues, outages, or data loss</li>
              </ul>
              <p className="font-semibold">The platform is provided "as is" without guarantees.</p>

              <h3 className="text-lg font-semibold text-gray-800">13. Changes to Terms</h3>
              <p>Urban.IQ may update these Terms at any time. Continued use constitutes acceptance of changes.</p>

              <h3 className="text-lg font-semibold text-gray-800">14. Contact Information</h3>
              <p>For questions or concerns, please contact:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email: rahul.m.muthuswamy@gmail.com</li>
              </ul>
            </div>

            {/* Footer */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowTermsPopup(false)}
                className="px-6 py-2 bg-gradient-to-br from-primary to-accent text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
