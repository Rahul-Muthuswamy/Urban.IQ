import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import SearchResultItem from "./SearchResultItem.jsx";
import LoadingSkeleton from "./LoadingSkeleton.jsx";

export default function SearchResults({ query, filter }) {
  // Search posts
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ["searchPosts", query],
    queryFn: async () => {
      // TODO: Replace with actual post search endpoint when available
      // For now, fetch all posts and filter client-side
      try {
        const response = await api.get("/api/posts/all", {
          params: { limit: 50 },
        });
        const allPosts = response.data || [];
        // Client-side filtering by title/content
        const searchLower = query.toLowerCase();
        return allPosts.filter(
          (post) =>
            post.post_info?.title?.toLowerCase().includes(searchLower) ||
            post.post_info?.content?.toLowerCase().includes(searchLower) ||
            post.user_info?.user_name?.toLowerCase().includes(searchLower) ||
            post.thread_info?.thread_name?.toLowerCase().includes(searchLower)
        );
      } catch (error) {
        console.error("Error searching posts:", error);
        return [];
      }
    },
    enabled: query.trim().length > 0 && (filter === "all" || filter === "posts"),
  });

  // Search communities
  const {
    data: communitiesData,
    isLoading: communitiesLoading,
    error: communitiesError,
  } = useQuery({
    queryKey: ["searchCommunities", query],
    queryFn: async () => {
      try {
        const response = await api.get("/api/threads/search", {
          params: { name: query },
        });
        return response.data || [];
      } catch (error) {
        console.error("Error searching communities:", error);
        return [];
      }
    },
    enabled: query.trim().length > 0 && (filter === "all" || filter === "communities"),
  });

  const isLoading = postsLoading || communitiesLoading;
  const hasError = postsError || communitiesError;

  // Filter results based on active filter
  let posts = filter === "all" || filter === "posts" ? postsData || [] : [];
  let communities = filter === "all" || filter === "communities" ? communitiesData || [] : [];

  const hasResults = posts.length > 0 || communities.length > 0;
  const showNoResults = !isLoading && !hasError && query.trim() && !hasResults;

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && <LoadingSkeleton />}

      {/* Error State */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 text-center border-2 border-red-200"
        >
          <p className="text-red-600">Error loading search results. Please try again.</p>
        </motion.div>
      )}

      {/* No Results */}
      {showNoResults && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or browse different categories
          </p>
        </motion.div>
      )}

      {/* Results */}
      {!isLoading && !hasError && hasResults && (
        <div className="space-y-4">
          {/* Communities */}
          {communities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>Communities ({communities.length})</span>
              </h2>
              <AnimatePresence>
                {communities.map((community, index) => (
                  <SearchResultItem
                    key={`community-${community.id || index}`}
                    type="community"
                    data={community}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Posts */}
          {posts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Posts ({posts.length})</span>
              </h2>
              <AnimatePresence>
                {posts.map((post, index) => (
                  <SearchResultItem
                    key={`post-${post.post_info?.id || index}`}
                    type="post"
                    data={post}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}


