import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../../api.js";

export default function ReportedPostCard({ report, onKeep, onDelete, isKeeping, index }) {
  const [expanded, setExpanded] = useState(false);

  // Fetch full post details
  const { data: postData, isLoading: postLoading } = useQuery({
    queryKey: ["post", report.post_id],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/post/${report.post_id}`);
        return response.data.post;
      } catch (error) {
        console.error("Error fetching post:", error);
        return null;
      }
    },
    enabled: expanded, // Only fetch when expanded
    retry: 1,
  });

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

  const post = postData || {};
  const postInfo = post.post_info || {};
  const userInfo = post.user_info || {};
  const threadInfo = post.thread_info || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-2xl p-6 shadow-glass-lg hover:shadow-glass-xl transition-all duration-300"
    >
      {/* Report Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                report.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {report.status === "pending" ? "Pending" : "Resolved"}
            </span>
            <span className="text-sm text-gray-500">
              Reported {formatDate(report.created_at)}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Reported by:</span>
            <Link
              to={`/user/${report.reporter?.username}`}
              className="font-semibold text-primary hover:text-accent transition-colors"
            >
              u/{report.reporter?.username}
            </Link>
          </div>
        </div>
      </div>

      {/* Report Reason */}
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-red-800 mb-1">Report Reason</h4>
            <p className="text-sm text-red-700">{report.reason}</p>
          </div>
        </div>
      </div>

      {/* Post Preview */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800">
            {report.post?.title || postInfo.title || "Loading post..."}
          </h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary hover:text-accent font-semibold transition-colors"
          >
            {expanded ? "Hide Details" : "View Full Post"}
          </button>
        </div>

        {report.post?.author_username && (
          <div className="text-sm text-gray-600 mb-2">
            By: <span className="font-semibold">u/{report.post.author_username}</span>
          </div>
        )}

        {/* Expanded Post Details */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            {postLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : postData ? (
              <>
                {/* Thread Info */}
                {threadInfo.thread_name && (
                  <div className="flex items-center space-x-2 mb-3">
                    {threadInfo.thread_logo && (
                      <img
                        src={threadInfo.thread_logo}
                        alt={threadInfo.thread_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <Link
                      to={`/t/${threadInfo.thread_name?.replace("t/", "") || threadInfo.thread_name}`}
                      className="text-sm font-semibold text-primary hover:text-accent transition-colors"
                    >
                      r/{threadInfo.thread_name}
                    </Link>
                  </div>
                )}

                {/* Post Content */}
                {postInfo.content && (
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{postInfo.content}</p>
                )}

                {/* Post Media */}
                {postInfo.media && (
                  <div className="mb-3">
                    {postInfo.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={postInfo.media}
                        alt="Post media"
                        className="max-w-full h-auto rounded-xl"
                      />
                    ) : (
                      <a
                        href={postInfo.media}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-accent font-semibold"
                      >
                        View Media
                      </a>
                    )}
                  </div>
                )}

                {/* Post Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 pt-3 border-t border-gray-200">
                  <span>👍 {postInfo.upvotes || 0}</span>
                  <span>👎 {postInfo.downvotes || 0}</span>
                  <span>💬 {postInfo.comments_count || 0} comments</span>
                </div>

                {/* View Full Post Link */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Link
                    to={`/posts/${report.post_id}`}
                    target="_blank"
                    className="text-sm text-primary hover:text-accent font-semibold inline-flex items-center space-x-1"
                  >
                    <span>View Full Post</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Post not found or has been deleted
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Actions */}
      {report.status === "pending" && (
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <motion.button
            onClick={onKeep}
            disabled={isKeeping}
            className="px-6 py-2 rounded-xl bg-green-500 text-white font-semibold shadow-lg hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            whileHover={{ scale: isKeeping ? 1 : 1.05 }}
            whileTap={{ scale: isKeeping ? 1 : 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{isKeeping ? "Processing..." : "Keep Post"}</span>
          </motion.button>
          <motion.button
            onClick={onDelete}
            disabled={isKeeping}
            className="px-6 py-2 rounded-xl bg-red-500 text-white font-semibold shadow-lg hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            whileHover={{ scale: isKeeping ? 1 : 1.05 }}
            whileTap={{ scale: isKeeping ? 1 : 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete Post</span>
          </motion.button>
        </div>
      )}

      {report.status === "resolved" && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>This report has been resolved</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

