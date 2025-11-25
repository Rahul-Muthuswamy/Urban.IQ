import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../api.js";
import ProfileAvatar from "./ProfileAvatar.jsx";

export default function ProfileSidebar({ user, isOwnProfile, onActionSelect }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await api.get("/api/user/logout");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAction = (action) => {
    setShowDropdown(false);
    if (onActionSelect) {
      onActionSelect(action);
    }
  };

  const karma = user?.karma?.user_karma || 0;
  const postsCount = user?.karma?.posts_count || 0;
  const commentsCount = user?.karma?.comments_count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 md:p-8 shadow-glass-lg h-fit"
    >
      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center mb-6"
      >
        <ProfileAvatar user={user} size="large" />
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl font-bold text-gray-800 mt-4 text-center"
        >
          u/{user?.username || "User"}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-gray-600 mt-1 text-center"
        >
          Community Points: {karma}
        </motion.p>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 mb-6 pb-6 border-b border-gray-200"
      >
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Posts:</span>
          <span className="text-sm font-semibold text-gray-800">{postsCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Comments:</span>
          <span className="text-sm font-semibold text-gray-800">{commentsCount}</span>
        </div>
      </motion.div>

      {/* Action Dropdown */}
      {isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mb-6"
        >
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
          >
            <span>Choose an action</span>
            <svg
              className={`w-5 h-5 transition-transform ${showDropdown ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10"
              >
                <button
                  onClick={() => handleAction("update-profile")}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Update Profile
                </button>
                <button
                  onClick={() => handleAction("change-password")}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Change Password
                </button>
                <button
                  onClick={() => handleAction("delete-account")}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors text-red-600"
                >
                  Delete Account
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Message Button (for other users) */}
      {!isOwnProfile && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => handleAction("message")}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Message</span>
        </motion.button>
      )}

      {/* Sign Out Button (only for own profile) */}
      {isOwnProfile && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50/50 transition-all duration-300 border border-red-200"
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium text-sm md:text-base">Sign Out</span>
        </motion.button>
      )}
    </motion.div>
  );
}
