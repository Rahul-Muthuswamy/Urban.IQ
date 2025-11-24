import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function PostCard({ post }) {
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
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 md:p-8 shadow-glass-lg hover:shadow-glass-xl transition-all duration-300"
    >
      {/* Community/Thread Header */}
      <div className="flex items-center space-x-3 mb-4">
        {threadInfo.thread_logo && (
          <motion.img
            src={threadInfo.thread_logo}
            alt={threadInfo.thread_name}
            className="w-8 h-8 rounded-full object-cover"
            whileHover={{ scale: 1.1 }}
          />
        )}
        <Link
          to={`/thread/${threadInfo.thread_id}`}
          className="text-sm font-semibold text-primary hover:text-accent transition-colors"
        >
          r/{threadInfo.thread_name || "Community"}
        </Link>
        <span className="text-gray-400">•</span>
        <span className="text-xs text-gray-500" title={formatFullDate(postInfo.created_at)}>
          {formatDate(postInfo.created_at)}
        </span>
        {postInfo.is_edited && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-500 italic">edited</span>
          </>
        )}
      </div>

      {/* Post Title */}
      <Link to={`/posts/${postInfo.id}`} className="block group">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 leading-tight group-hover:text-primary transition-colors">
          {postInfo.title || "Untitled Post"}
        </h1>
      </Link>

      {/* Author Info */}
      <div className="flex items-center space-x-3 mb-6">
        {userInfo.user_avatar ? (
          <img
            src={userInfo.user_avatar}
            alt={userInfo.user_name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
            {userInfo.user_name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <div>
          <Link
            to={`/user/${userInfo.user_name}`}
            className="text-sm font-semibold text-gray-800 hover:text-primary transition-colors"
          >
            u/{userInfo.user_name || "Unknown"}
          </Link>
          <p className="text-xs text-gray-500">Posted {formatDate(postInfo.created_at)}</p>
        </div>
      </div>

      {/* Media/Image */}
      {postInfo.media && (
        <motion.div
          className="mb-6 rounded-xl overflow-hidden bg-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {postInfo.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <img
              src={postInfo.media}
              alt={postInfo.title}
              className="w-full max-h-[600px] object-contain"
              loading="lazy"
            />
          ) : postInfo.media.match(/\.(mp4|webm|ogg)$/i) ? (
            <video
              src={postInfo.media}
              controls
              className="w-full max-h-[600px]"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <a
              href={postInfo.media}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 text-primary hover:text-accent transition-colors"
            >
              <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              View attachment
            </a>
          )}
        </motion.div>
      )}

      {/* Post Content */}
      {postInfo.content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="prose prose-sm md:prose-base max-w-none mb-6"
        >
          <div
            className="text-gray-700 whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{
              __html: postInfo.content
                .replace(/\n/g, "<br />")
                .replace(
                  /(https?:\/\/[^\s]+)/g,
                  '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-accent underline">$1</a>'
                ),
            }}
          />
        </motion.div>
      )}

      {/* Post Stats */}
      <div className="flex items-center space-x-6 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-gray-600">
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
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 11l5-5m0 0l5 5m-5-5v12"
            />
          </svg>
          <span className="text-sm font-medium">{postInfo.post_karma || 0} Karma</span>
        </div>
      </div>
    </motion.article>
  );
}

