import { useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api.js";
import Navbar from "../../components/Navbar.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import FeedCard from "../../components/FeedCard.jsx";
import Footer from "../../components/Footer.jsx";

export default function SavedPostsPage() {
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, userLoading, navigate]);

  // Fetch saved posts
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["savedPosts"],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const response = await api.get("/api/posts/saved", {
          params: {
            limit: 20,
            offset: pageParam * 20,
          },
        });
        return response.data || [];
      } catch (err) {
        console.error("Error fetching saved posts:", err);
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
        }
        return [];
      }
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return pages.length;
    },
    initialPageParam: 0,
    enabled: !!user,
  });

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000 &&
        hasNextPage &&
        !isFetching
      ) {
        fetchNextPage();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetching, fetchNextPage]);

  const allPosts = postsData?.pages.flat() || [];

  // Show loading or redirect if not authenticated
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-col md:flex-row max-w-7xl mx-auto pt-20 md:pt-28 pb-20 md:pb-0">
        {/* Left Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0 p-4">
          <LeftSidebar />
        </aside>

        {/* Main Content */}
        <main id="main-content" className="flex-1 p-4 md:p-6 space-y-6" role="main">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Saved Posts</h1>
              <p className="text-gray-600">Posts you've saved for later</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <span>{allPosts.length} saved</span>
            </div>
          </motion.div>

          {/* Feed Cards */}
          <div className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-8 text-center border-2 border-red-200"
              >
                <p className="text-red-600">Error loading saved posts. Please try again later.</p>
                <motion.button
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Retry
                </motion.button>
              </motion.div>
            )}
            {!error && allPosts.length === 0 && !isFetching ? (
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
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No saved posts yet</h2>
                <p className="text-gray-600 mb-6">
                  Posts you save will appear here. Start exploring and save posts you want to read later!
                </p>
                <motion.button
                  onClick={() => navigate("/home")}
                  className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explore Posts
                </motion.button>
              </motion.div>
            ) : (
              !error &&
              allPosts.map((post, index) => (
                <FeedCard key={post.post_info?.id || index} post={post} index={index} showUnsaveButton={true} />
              ))
            )}

            {/* Loading indicator */}
            {isFetching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-8"
              >
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

