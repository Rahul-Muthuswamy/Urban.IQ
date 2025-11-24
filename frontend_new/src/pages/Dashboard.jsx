import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";
import Navbar from "../components/Navbar.jsx";

export default function Dashboard() {
  const navigate = useNavigate();

  // Check authentication
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/user");
        return response.data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, userLoading, navigate]);

  // Check if user is moderator/admin
  const isModerator = user?.roles?.includes("admin") || user?.roles?.includes("mod");

  // Show loading while checking auth
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-7xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-3">
              Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Welcome back, {user?.username || "User"}!
            </p>
          </motion.div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* User Info Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-3xl p-6 md:p-8 shadow-glass-lg backdrop-blur-xl"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-2xl">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{user?.username || "User"}</h3>
                  <p className="text-sm text-gray-500">{user?.email || ""}</p>
                </div>
              </div>
              {user?.bio && (
                <p className="text-gray-600 text-sm mt-4">{user.bio}</p>
              )}
            </motion.div>

            {/* Quick Actions Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-3xl p-6 md:p-8 shadow-glass-lg backdrop-blur-xl"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <motion.button
                  onClick={() => navigate("/community/create")}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-lg hover:shadow-glow-lg transition-all duration-300 text-left flex items-center space-x-3"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Community</span>
                </motion.button>
                <motion.button
                  onClick={() => navigate("/home")}
                  className="w-full px-4 py-3 rounded-xl glass text-gray-700 font-semibold hover:bg-white/40 transition-all duration-300 text-left flex items-center space-x-3"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Go to Home</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Moderator Access Card */}
            {isModerator && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-3xl p-6 md:p-8 shadow-glass-lg backdrop-blur-xl border-2 border-accent/30"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Moderator</h3>
                    <p className="text-sm text-gray-500">Access moderation tools</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => navigate("/moderator/dashboard")}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-primary text-white font-semibold shadow-lg hover:shadow-glow-lg transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Open Moderator Dashboard
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-3xl p-6 md:p-8 shadow-glass-lg backdrop-blur-xl"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">Your Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient mb-2">—</div>
                <div className="text-sm text-gray-600">Posts Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient mb-2">—</div>
                <div className="text-sm text-gray-600">Comments Made</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient mb-2">—</div>
                <div className="text-sm text-gray-600">Communities Joined</div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              Activity stats coming soon
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

