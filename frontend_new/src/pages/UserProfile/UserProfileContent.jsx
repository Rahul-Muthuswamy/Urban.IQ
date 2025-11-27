import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../../api.js";
import FeedCard from "../../components/FeedCard.jsx";

export default function UserProfileContent({ user }) {
  const [sortBy, setSortBy] = useState("top");
  const [duration, setDuration] = useState("alltime");

  // Debug: Log when user data changes
  useEffect(() => {
    console.log("[UserProfileContent] User prop updated:", {
      username: user?.username,
      bio: user?.bio,
      bioExists: !!user?.bio,
      bioLength: user?.bio?.length || 0,
    });
  }, [user]);

  // Fetch user posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["userPosts", user.username, sortBy, duration],
    queryFn: async () => {
      const response = await api.get(`/api/posts/user/${user.username}`, {
        params: {
          sortby: sortBy,
          duration: duration,
          limit: 20,
          offset: 0,
        },
      });
      return response.data;
    },
    enabled: !!user?.username,
  });

  // Format registration date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const registrationDate = user?.registrationDate || user?.registration_date;
  const postsKarma = user?.karma?.posts_karma || 0;
  const commentsKarma = user?.karma?.comments_karma || 0;
  const userBio = user?.bio?.trim() || "";

  return (
    <div className="space-y-6">
      {/* User Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 md:p-8 shadow-glass-lg"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              u/{user?.username || "User"}
            </h1>
            <div className="mt-3">
              {userBio ? (
                <p className="text-gray-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words">
                  {userBio}
                </p>
              ) : (
                <p className="text-gray-400 text-sm md:text-base italic">
                  No bio yet. Add one in your profile settings!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Cake Day</p>
            <p className="text-base font-semibold text-gray-800">
              {formatDate(registrationDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Posts Community Points</p>
            <p className="text-base font-semibold text-gray-800">{postsKarma}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Comments Community Points</p>
            <p className="text-base font-semibold text-gray-800">{commentsKarma}</p>
          </div>
        </div>
      </motion.div>

      {/* Posts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {/* Sort/Filter Controls */}
        <div className="glass rounded-2xl p-4 shadow-glass-lg">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSortBy("top")}
              className={`px-4 py-2 rounded-xl transition-colors ${
                sortBy === "top"
                  ? "bg-gradient-to-br from-primary to-accent text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              Top
            </button>
            <button
              onClick={() => setSortBy("hot")}
              className={`px-4 py-2 rounded-xl transition-colors ${
                sortBy === "hot"
                  ? "bg-gradient-to-br from-primary to-accent text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              Hot
            </button>
            <button
              onClick={() => setSortBy("new")}
              className={`px-4 py-2 rounded-xl transition-colors ${
                sortBy === "new"
                  ? "bg-gradient-to-br from-primary to-accent text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              New
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setDuration("day")}
              className={`px-4 py-2 rounded-xl transition-colors ${
                duration === "day"
                  ? "bg-gradient-to-br from-primary to-accent text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDuration("week")}
              className={`px-4 py-2 rounded-xl transition-colors ${
                duration === "week"
                  ? "bg-gradient-to-br from-primary to-accent text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setDuration("month")}
              className={`px-4 py-2 rounded-xl transition-colors ${
                duration === "month"
                  ? "bg-gradient-to-br from-primary to-accent text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setDuration("alltime")}
              className={`px-4 py-2 rounded-xl transition-colors ${
                duration === "alltime"
                  ? "bg-gradient-to-br from-primary to-accent text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Posts List */}
        {postsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.post_info?.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <FeedCard post={post} index={index} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-12 text-center"
          >
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-600 text-lg mb-2">No posts yet</p>
            <p className="text-gray-500 text-sm">This user hasn't posted anything yet.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

