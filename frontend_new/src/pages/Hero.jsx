import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // PWA Install Detection
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [-2, 2, -2],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 overflow-hidden"
      role="main"
      aria-label="Urban.IQ Hero Section"
    >
      {/* Gradient Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 md:px-6 lg:px-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div
          variants={itemVariants}
          className="mb-10"
        >
          <motion.img
            src="/assets/7_remove_bg.png"
            alt="Urban.IQ Logo - Your City, Reimagined"
            className="w-24 md:w-32 lg:w-40 mx-auto"
            variants={floatingVariants}
            animate="animate"
            whileHover={{
              scale: 1.1,
              rotate: 5,
              transition: { duration: 0.3 },
            }}
          />
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl h-[5rem]"
          style={{
            background: "linear-gradient(135deg, #84cc16 0%, #10b981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          aria-label="Your City, Reimagined"
        >
          Your City, Reimagined.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={itemVariants}
          className="text-base md:text-lg lg:text-xl text-gray-700 mb-12 max-w-3xl leading-relaxed"
          aria-describedby="hero-description"
        >
          Join the future of civic engagement. Connect with your community, 
          participate in local discussions, and help shape the cities we call home 
          through AI-powered insights and collaborative democracy.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Primary CTA */}
          <motion.button
            onClick={() => navigate("/login")}
            className="px-8 py-4 bg-gradient-primary text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-glow-lg transition-all duration-300 min-w-[200px]"
            whileHover={{ 
              scale: 1.05, 
              y: -2,
              boxShadow: "0 20px 40px rgba(132, 204, 22, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            aria-label="Explore Communities and join Urban.IQ"
          >
            Explore Communities
          </motion.button>

          {/* PWA Install Button */}
          {showInstallPrompt && isInstallable && (
            <motion.button
              onClick={handleInstallClick}
              className="px-8 py-4 bg-white border-2 border-primary text-primary font-semibold text-lg rounded-xl shadow-lg hover:bg-primary hover:text-white transition-all duration-300 min-w-[200px]"
              whileHover={{ 
                scale: 1.05, 
                y: -2,
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              aria-label="Install Urban.IQ as a Progressive Web App"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Install App
              </span>
            </motion.button>
          )}
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mt-16"
        >
          <motion.div
            className="flex flex-col items-center text-center"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Community First</h3>
            <p className="text-gray-600">Connect with neighbors and engage in meaningful civic discussions</p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center text-center"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">AI-Powered Insights</h3>
            <p className="text-gray-600">Get intelligent civic information and unbiased local insights</p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center text-center"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Local Impact</h3>
            <p className="text-gray-600">Make real change in your neighborhood and city governance</p>
          </motion.div>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          variants={itemVariants}
          className="text-sm text-gray-500 mt-16 max-w-2xl"
        >
          Built for accessibility, powered by community. Join thousands of citizens 
          already making a difference in their cities.
        </motion.p>
      </motion.div>

      {/* Hidden content for screen readers */}
      <div className="sr-only" id="hero-description">
        Urban.IQ is an AI-powered civic engagement platform that helps you connect 
        with your local community, participate in democratic processes, and access 
        reliable civic information to help improve your city and neighborhood.
      </div>
    </div>
  );
}