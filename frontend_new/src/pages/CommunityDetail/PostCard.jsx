import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../../api.js";
import VoteButtons from "../../components/VoteButtons.jsx";

export default function PostCard({ post, index }) {
  const postInfo = post.post_info || {};
  const userInfo = post.user_info || {};
  const threadInfo = post.thread_info || {};

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
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
    } catch {
      return dateString;
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass p-4 hover:shadow-md transition-all duration-300"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Vote Section */}
        <div className="flex md:flex-col items-center md:items-start justify-center md:justify-start space-y-2 md:space-y-0 md:space-x-0 space-x-4">
          <VoteButtons
            postId={postInfo.id}
            initialVote={post.current_user?.has_upvoted}
            initialKarma={postInfo.post_karma || 0}
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
            {threadInfo.thread_logo && (
              <img
                src={threadInfo.thread_logo}
                alt={threadInfo.thread_name}
                className="w-5 h-5 rounded-full object-cover"
              />
            )}
            <Link
              to={`/community/${threadInfo.thread_name?.replace("t/", "")}`}
              className="font-semibold hover:text-primary transition-colors"
            >
              r/{threadInfo.thread_name?.replace("t/", "") || "community"}
            </Link>
            <span>•</span>
            <span>Posted by</span>
            <Link
              to={`/user/${userInfo.user_name}`}
              className="font-semibold hover:text-primary transition-colors"
            >
              u/{userInfo.user_name || "Unknown"}
            </Link>
            <span>•</span>
            <span>{formatDate(postInfo.created_at)}</span>
          </div>

          {/* Title */}
          <Link to={`/posts/${postInfo.id}`} className="block group mb-3">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-2">
              {postInfo.title || "Untitled Post"}
            </h3>
          </Link>

          {/* Media Preview */}
          {postInfo.media && (
            <motion.div
              className="mb-4 rounded-xl overflow-hidden bg-gray-100 max-h-96"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {postInfo.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={postInfo.media}
                  alt={postInfo.title}
                  className="w-full h-auto object-contain max-h-96"
                  loading="lazy"
                />
              ) : postInfo.media.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={postInfo.media}
                  controls
                  className="w-full max-h-96"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              ) : null}
            </motion.div>
          )}

          {/* Content Preview */}
          {postInfo.content && (
            <p className="text-gray-700 mb-4 line-clamp-3">{postInfo.content}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <Link
                to={`/posts/${postInfo.id}`}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {postInfo.comments_count || 0} Comment{postInfo.comments_count !== 1 ? "s" : ""}
                </span>
              </Link>

              <button className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

