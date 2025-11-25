import { useState, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api.js";
import Navbar from "../components/Navbar.jsx";
import Logo from "../components/Logo.jsx";
import LeftSidebar from "../components/LeftSidebar.jsx";
import FiltersBar from "../components/FiltersBar.jsx";
import FeedCard from "../components/FeedCard.jsx";
import FloatingActionButton from "../components/FloatingActionButton.jsx";
import Footer from "../components/Footer.jsx";

export default function Home() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("alltime");
  const [selectedSort, setSelectedSort] = useState("top");
  const [selectedCommunity, setSelectedCommunity] = useState(null);

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

  // Fetch posts based on selected community or feed
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: ["posts", selectedCommunity || "all", selectedSort, selectedFilter],
    queryFn: async ({ pageParam = 0 }) => {
      const endpoint = selectedCommunity
        ? `/api/posts/thread/${selectedCommunity}`
        : `/api/posts/all`;
      try {
        const response = await api.get(endpoint, {
          params: {
            limit: 20,
            offset: pageParam * 20,
            sortby: selectedSort,
            duration: selectedFilter,
          },
        });
        return response.data || [];
      } catch (err) {
        console.error("Error fetching posts:", err);
        return [];
      }
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return pages.length;
    },
    initialPageParam: 0,
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

  const handleCommunitySelect = (communityId) => {
    setSelectedCommunity(communityId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 relative">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      
      {/* Navbar */}
      <Navbar />

      {/* Large Logo - Top Left Corner */}
      {/* <Logo /> */}
      <img src='/assets/7_remove_bg.png' alt='urban_iq' className='z-[100] h-6 sm:h-6 md:h-8 lg:h-10 xl:h-12 object-contain pointer-events-auto mt-5 ml-5'></img>

      <div className="flex flex-col md:flex-row max-w-7xl mx-auto pt-20 md:pt-28 pb-20 md:pb-0">
        {/* Left Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0 p-4">
          <LeftSidebar
            onCommunitySelect={handleCommunitySelect}
            selectedCommunity={selectedCommunity}
          />
        </aside>

        {/* Main Content */}
        <main id="main-content" className="flex-1 p-4 md:p-6 space-y-6" role="main">
          {/* Filters Bar */}
          <FiltersBar
            selectedFilter={selectedFilter}
            selectedSort={selectedSort}
            onFilterChange={setSelectedFilter}
            onSortChange={setSelectedSort}
          />

          {/* Accessibility Note */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-sm text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
            <span>Note: Screen-Reader Accessible (NVDA Supported)</span>
          </motion.div>

          {/* Feed Cards */}
          <div className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-8 text-center border-2 border-red-200"
              >
                <p className="text-red-600">Error loading posts. Please try again later.</p>
              </motion.div>
            )}
            {!error && allPosts.length === 0 && !isFetching ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-8 text-center"
              >
                <p className="text-gray-600">No posts found. Be the first to create one!</p>
              </motion.div>
            ) : (
              !error && allPosts.map((post, index) => (
                <FeedCard key={post.post_info?.id || index} post={post} index={index} />
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

      {/* Floating Action Button */}
      <FloatingActionButton />

      {/* Footer */}
      <Footer />
    </div>
  );
}

