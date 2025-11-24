import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../api.js";
import MoreDropdown from "./MoreDropdown.jsx";

export default function CommunityHeader({ community, onJoinChange }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);

  const isSubscribed = community.has_subscribed || false;

  // Join/Leave mutation
  const { mutate: toggleSubscription } = useMutation({
    mutationFn: async (shouldJoin) => {
      if (shouldJoin) {
        await api.post(`/api/threads/subscription/${community.id}`);
      } else {
        await api.delete(`/api/threads/subscription/${community.id}`);
      }
    },
    onMutate: async (shouldJoin) => {
      setIsJoining(true);
      // Optimistic update
      return { previousState: isSubscribed };
    },
    onSuccess: () => {
      // Invalidate both community queries (by name and by slug)
      const communitySlug = community.name?.replace("t/", "") || community.name;
      queryClient.invalidateQueries({ queryKey: ["community"] });
      if (onJoinChange) onJoinChange();
    },
    onError: (err, variables, context) => {
      // Rollback handled by refetch
      console.error("Subscription error:", err);
    },
    onSettled: () => {
      setIsJoining(false);
    },
  });

  const handleJoin = () => {
    toggleSubscription(!isSubscribed);
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format date for "Since" display
  const formatSinceDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100"
    >
      {/* Header Content - Matching Reference Layout */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Logo - Left Side */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-shrink-0"
          >
            {community.logo ? (
              <img
                src={community.logo}
                alt={community.title}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                {community.name?.replace("t/", "").charAt(0).toUpperCase() || "C"}
              </div>
            )}
            {/* Subscriber count below logo */}
            <p className="text-sm text-gray-600 mt-2 text-center">
              {formatNumber(community.subscriberCount || 0)} subscribers
            </p>
          </motion.div>

          {/* Title and Info - Center */}
          <div className="flex-1 min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-1"
            >
              {community.name?.replace("t/", "") || community.title}
            </motion.h1>
            {community.created_at && (
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-gray-500 mb-2"
              >
                Since: {formatSinceDate(community.created_at)}
              </motion.p>
            )}
            {community.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-700 mb-3 text-sm"
              >
                {community.description}
              </motion.p>
            )}
            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-4 text-sm text-gray-600"
            >
              <span>{formatNumber(community.PostsCount || 0)} posts</span>
              <span className="text-gray-300">•</span>
              <span>{formatNumber(community.CommentsCount || 0)} comments</span>
            </motion.div>
          </div>

          {/* Join Button and More - Right Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col items-end gap-3 flex-shrink-0"
          >
            <motion.button
              onClick={handleJoin}
              disabled={isJoining}
              className={`px-8 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-300 ${
                isSubscribed
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
              whileHover={{ scale: isJoining ? 1 : 1.05 }}
              whileTap={{ scale: isJoining ? 1 : 0.95 }}
              animate={{
                scale: isJoining ? 0.95 : 1,
              }}
            >
              <AnimatePresence mode="wait">
                {isJoining ? (
                  <motion.span
                    key="joining"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </motion.div>
                    <span>Joining...</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="join"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {isSubscribed ? "Joined" : "Join"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            {/* More Dropdown */}
            <MoreDropdown community={community} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

