import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../api.js";

export default function LiveSuggestions({ query, onSelect, onClose }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Search communities
  const { data: communitiesData } = useQuery({
    queryKey: ["searchCommunities", query],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) return [];
      try {
        const response = await api.get("/api/threads/search", {
          params: { name: query },
        });
        return (response.data || []).slice(0, 3); // Limit to 3
      } catch {
        return [];
      }
    },
    enabled: query.trim().length >= 2,
  });

  // Search posts (client-side filtering for now)
  const { data: postsData } = useQuery({
    queryKey: ["searchPostsSuggestions", query],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) return [];
      try {
        const response = await api.get("/api/posts/all", {
          params: { limit: 20 },
        });
        const allPosts = response.data || [];
        const searchLower = query.toLowerCase();
        return allPosts
          .filter(
            (post) =>
              post.post_info?.title?.toLowerCase().includes(searchLower) ||
              post.post_info?.content?.toLowerCase().includes(searchLower)
          )
          .slice(0, 2); // Limit to 2
      } catch {
        return [];
      }
    },
    enabled: query.trim().length >= 2,
  });

  const communities = communitiesData || [];
  const posts = postsData || [];
  const hasResults = communities.length > 0 || posts.length > 0;
  const showSuggestions = query.trim().length >= 2 && hasResults;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (onClose) onClose();
      }
    };
    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions, onClose]);

  const handleSelect = (type, data) => {
    if (type === "community") {
      const slug = data.name?.replace("t/", "") || "";
      navigate(`/community/${slug}`);
    } else if (type === "post") {
      navigate(`/posts/${data.post_info?.id}`);
    }
    if (onSelect) onSelect();
  };

  if (!showSuggestions) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 nav rounded-2xl shadow-glass-xl border border-white/20 overflow-hidden z-50"
      >
        <div className="max-h-96 overflow-y-auto">
          {/* Communities */}
          {communities.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Communities
              </div>
              {communities.map((community, index) => (
                <motion.button
                  key={`suggestion-community-${community.id || index}`}
                  onClick={() => handleSelect("community", community)}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-left"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {community.logo ? (
                    <img
                      src={community.logo}
                      alt={community.title}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
                      {community.name?.replace("t/", "").charAt(0).toUpperCase() || "C"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate">
                      {community.title || community.name?.replace("t/", "")}
                    </div>
                    <div className="text-xs text-gray-500">r/{community.name?.replace("t/", "")}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              ))}
            </div>
          )}

          {/* Posts */}
          {posts.length > 0 && (
            <div className="p-2 border-t border-white/10">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Posts</div>
              {posts.map((post, index) => (
                <motion.button
                  key={`suggestion-post-${post.post_info?.id || index}`}
                  onClick={() => handleSelect("post", post)}
                  className="w-full flex items-start space-x-3 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-left"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 line-clamp-1">
                      {post.post_info?.title || "Untitled Post"}
                    </div>
                    <div className="text-xs text-gray-500">
                      r/{post.thread_info?.thread_name?.replace("t/", "") || "community"}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              ))}
            </div>
          )}

          {/* View All Results */}
          <div className="p-2 border-t border-white/10">
            <motion.button
              onClick={() => {
                navigate(`/find?q=${encodeURIComponent(query)}`);
                if (onSelect) onSelect();
              }}
              className="w-full px-3 py-2 text-sm font-semibold text-primary hover:bg-white/20 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View all results →
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


