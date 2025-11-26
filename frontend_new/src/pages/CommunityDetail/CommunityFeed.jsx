import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import PostCard from "./PostCard.jsx";

export default function CommunityFeed({ communityId, initialPosts = [], activeTab, sortBy }) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(initialPosts.length);

  // Fetch posts based on tab and sort
  const {
    data: postsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["communityPosts", communityId, activeTab, sortBy],
    queryFn: async () => {
      // Use existing endpoint with query params
      const response = await api.get(`/api/posts/thread/${communityId}`, {
        params: {
          sortby: sortBy,
          limit: 20,
          offset: 0,
        },
      });
      return response.data;
    },
    enabled: !!communityId,
    initialData: initialPosts.length > 0 ? initialPosts : undefined,
  });

  useEffect(() => {
    if (postsData) {
      setPosts(postsData);
      setHasMore(postsData.length >= 20);
      setOffset(postsData.length);
    }
  }, [postsData]);

  const loadMore = async () => {
    try {
      const response = await api.get(`/api/posts/thread/${communityId}`, {
        params: {
          sortby: sortBy,
          limit: 20,
          offset: offset,
        },
      });
      const newPosts = response.data;
      if (newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts]);
        setOffset((prev) => prev + newPosts.length);
        setHasMore(newPosts.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    }
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass p-12 text-center"
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
        <p className="text-gray-500 text-sm">Be the first to post in this community!</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {posts.map((post, index) => (
          <motion.div
            key={post.post_info?.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <PostCard post={post} index={index} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-4"
        >
          <motion.button
            onClick={loadMore}
            className="px-6 py-3 glass rounded-xl text-gray-700 font-semibold hover:bg-white/40 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Load More
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

