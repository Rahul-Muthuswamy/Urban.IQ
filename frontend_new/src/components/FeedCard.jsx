import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../api.js";
import VoteButtons from "./VoteButtons.jsx";

export default function FeedCard({ post, index, showUnsaveButton = false }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const queryClient = useQueryClient();

  const postInfo = post.post_info || {};
  const userInfo = post.user_info || {};
  const threadInfo = post.thread_info || {};

  // Unsave mutation for saved posts page
  const { mutate: unsavePost, isPending: isUnsavePending } = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/posts/saved/${postInfo.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postInfo.id] });
    },
    onError: (error) => {
      console.error("Error unsaving post:", error);
      alert(error.response?.data?.message || "Failed to unsave post. Please try again.");
    },
  });

  // Fetch comments
  const fetchComments = async () => {
    if (!comments && !showComments) {
      try {
        const response = await api.get(`/api/comments/post/${postInfo.id}`);
        setComments(response.data.comment_info || []);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
    setShowComments(!showComments);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="glass rounded-2xl p-6 shadow-glass-lg hover:shadow-glass-xl transition-all duration-300"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Media/Image Section */}
        {postInfo.media && (
          <motion.div
            className="w-full md:w-64 h-48 md:h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={postInfo.media}
              alt={postInfo.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>
        )}

        {/* Content Section */}
        <div className="flex-1 flex flex-col">
          {/* Title and Meta */}
          <div className="mb-3">
            <Link to={`/posts/${postInfo.id}`} className="block group">
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
                #{postInfo.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-600">
              #By {userInfo.user_name || "Unknown"} in {threadInfo.thread_name || "Community"}
            </p>
          </div>

          {/* Content Preview */}
          {postInfo.content && (
            <p className="text-gray-700 mb-4 line-clamp-3">{postInfo.content}</p>
          )}

          {/* Actions Row */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
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

              <button className="text-gray-600 hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>

              {/* Unsave Button - Only shown on saved posts page */}
              {showUnsaveButton && (
                <motion.button
                  onClick={() => unsavePost()}
                  disabled={isUnsavePending}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Unsave post"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  <span className="text-sm font-medium">{isUnsavePending ? "Unsaving..." : "Unsave"}</span>
                </motion.button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">
                {formatDate(postInfo.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Vote Section */}
        <div className="flex md:flex-col items-center md:items-start justify-center md:justify-start space-y-2 md:space-y-0 md:space-x-0 space-x-4">
          <VoteButtons postId={postInfo.id} initialVote={post.current_user?.has_upvoted} initialKarma={postInfo.post_karma || 0} />
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && comments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass rounded-lg p-3"
                  >
                    <p className="text-sm text-gray-700">{comment.comment?.content || "Comment"}</p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


