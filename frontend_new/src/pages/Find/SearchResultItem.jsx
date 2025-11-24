import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function SearchResultItem({ type, data, index }) {
  if (type === "community") {
    const community = data;
    const communitySlug = community.name?.replace("t/", "") || "";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
      >
        <Link to={`/community/${communitySlug}`}>
          <motion.div
            className="glass rounded-2xl p-6 shadow-glass-lg hover:shadow-glass-xl transition-all duration-300 cursor-pointer group"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start space-x-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                {community.logo ? (
                  <img
                    src={community.logo}
                    alt={community.title}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                    {community.name?.replace("t/", "").charAt(0).toUpperCase() || "C"}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors">
                  {community.title || community.name?.replace("t/", "")}
                </h3>
                <p className="text-sm text-gray-600 mb-2">r/{community.name?.replace("t/", "") || "community"}</p>
                {community.description && (
                  <p className="text-gray-700 line-clamp-2">{community.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  {community.members_count !== undefined && (
                    <span>{community.members_count} members</span>
                  )}
                  {community.posts_count !== undefined && (
                    <span>{community.posts_count} posts</span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <motion.div
                className="flex-shrink-0 text-gray-400 group-hover:text-primary transition-colors"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  if (type === "post") {
    const postInfo = data.post_info || {};
    const userInfo = data.user_info || {};
    const threadInfo = data.thread_info || {};

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
      >
        <Link to={`/posts/${postInfo.id}`}>
          <motion.div
            className="glass rounded-2xl p-6 shadow-glass-lg hover:shadow-glass-xl transition-all duration-300 cursor-pointer group"
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Media Preview */}
              {postInfo.media && (
                <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={postInfo.media}
                    alt={postInfo.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  {threadInfo.thread_logo && (
                    <img
                      src={threadInfo.thread_logo}
                      alt={threadInfo.thread_name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  <Link
                    to={`/community/${threadInfo.thread_name?.replace("t/", "")}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    r/{threadInfo.thread_name?.replace("t/", "") || "community"}
                  </Link>
                  <span>•</span>
                  <span>by</span>
                  <Link
                    to={`/user/${userInfo.user_name}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    u/{userInfo.user_name || "Unknown"}
                  </Link>
                  <span>•</span>
                  <span>{formatDate(postInfo.created_at)}</span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {postInfo.title || "Untitled Post"}
                </h3>

                {postInfo.content && (
                  <p className="text-gray-700 line-clamp-2 mb-3">{postInfo.content}</p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span>{postInfo.comments_count || 0} comments</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 11l5-5m0 0l5 5m-5-5v12"
                      />
                    </svg>
                    <span>{postInfo.post_karma || 0} votes</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return null;
}


