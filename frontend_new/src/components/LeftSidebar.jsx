import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api.js";

export default function LeftSidebar({ onCommunitySelect, selectedCommunity }) {

  // Fetch communities
  const { data: communitiesData } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const response = await api.get("/api/threads");
      return response.data;
    },
  });

  const allCommunities = communitiesData?.all || [];
  const popularCommunities = communitiesData?.popular || [];

  return (
    <div className="space-y-4 sticky top-24">
      {/* Create Community Button */}
      <Link to="/community/create">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full px-4 py-3 rounded-xl bg-gradient-primary text-white font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-glow-lg transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Create Community</span>
        </motion.button>
      </Link>

      {/* All Communities Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4 shadow-glass"
      >
        <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">All Communities</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allCommunities.slice(0, 10).map((community, index) => {
            const communitySlug = community.name?.replace("t/", "") || community.title?.toLowerCase().replace(/\s+/g, "");
            return (
              <Link
                key={community.id || community.name}
                to={`/community/${communitySlug}`}
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                    selectedCommunity === community.id
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-white/30 text-gray-700"
                  }`}
                  whileHover={{ x: 4 }}
                >
                  {community.logo ? (
                    <img
                      src={community.logo}
                      alt={community.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-primary" />
                  )}
                  <span className="text-sm font-medium truncate flex-1 text-left">
                    {community.name || community.title}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Popular Communities Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-4 shadow-glass"
      >
        <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Popular Communities</h3>
        <div className="space-y-2">
          {popularCommunities.slice(0, 5).map((community, index) => {
            const communitySlug = community.name?.replace("t/", "") || community.title?.toLowerCase().replace(/\s+/g, "");
            return (
              <Link
                key={community.id || community.name}
                to={`/community/${communitySlug}`}
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                    selectedCommunity === community.id
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-white/30 text-gray-700"
                  }`}
                  whileHover={{ x: 4 }}
                >
                  {community.logo ? (
                    <img
                      src={community.logo}
                      alt={community.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-primary" />
                  )}
                  <span className="text-sm font-medium truncate flex-1 text-left">
                    {community.name || community.title}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

