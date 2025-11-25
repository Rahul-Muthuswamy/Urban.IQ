import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "../../api.js";
import Navbar from "../../components/Navbar.jsx";
import Logo from "../../components/Logo.jsx";
import CommunityHeader from "./CommunityHeader.jsx";
import CommunitySidebar from "./CommunitySidebar.jsx";
import CommunityTabs from "./CommunityTabs.jsx";
import CommunityFeed from "./CommunityFeed.jsx";
import FloatingActionButton from "./FloatingActionButton.jsx";
import CreatePostModal from "./CreatePostModal.jsx";
import { useState } from "react";

export default function CommunityDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("hot");

  // Fetch community data
  const {
    data: communityData,
    isLoading: communityLoading,
    error: communityError,
    refetch: refetchCommunity,
  } = useQuery({
    queryKey: ["community", slug],
    queryFn: async () => {
      const response = await api.get(`/api/subthread/${slug}`);
      return response.data;
    },
    enabled: !!slug,
    retry: 1,
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  // Loading state
  if (communityLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-12">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 animate-pulse">
              <div className="flex gap-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
            {/* Feed Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (communityError || !communityData) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 text-center border-2 border-red-200 shadow-lg"
          >
            <h1 className="text-2xl font-bold text-red-600 mb-4">Community Not Found</h1>
            <p className="text-gray-600 mb-6">
              {communityError?.response?.data?.message || `The community "${slug}" doesn't exist.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                onClick={() => navigate("/home")}
                className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go to Home
              </motion.button>
              <motion.button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go Back
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const community = communityData.subthread;
  const initialPosts = communityData.posts || [];

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Navbar />
      <Logo />

      <div className="max-w-7xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-8 md:py-12">
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Main Content */}
        <main id="main-content" className="space-y-6" role="main">
          {/* Community Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <CommunityHeader
              community={community}
              onJoinChange={refetchCommunity}
            />
          </motion.div>

          {/* Layout: Sidebar + Feed */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Feed Area */}
            <div className="flex-1 space-y-6">
              {/* Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <CommunityTabs
                  activeTab={activeTab}
                  sortBy={sortBy}
                  onTabChange={setActiveTab}
                  onSortChange={setSortBy}
                />
              </motion.div>

              {/* Feed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <CommunityFeed
                  communityId={community.id}
                  initialPosts={initialPosts}
                  activeTab={activeTab}
                  sortBy={sortBy}
                />
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full lg:w-80 flex-shrink-0"
            >
              <CommunitySidebar community={community} />
            </motion.aside>
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setShowCreateModal(true)} />

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          communityId={community.id}
          communityName={community.name}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={() => {
            setShowCreateModal(false);
            // Refetch feed
            window.location.reload(); // Simple refresh for now
          }}
        />
      )}
    </div>
  );
}

