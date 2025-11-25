import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";
import VoteButtons from "./VoteButtons.jsx";
import PostActionMenu from "./posts/PostActionMenu.jsx";
import EditPostModal from "./posts/EditPostModal.jsx";
import DeleteConfirmModal from "./posts/DeleteConfirmModal.jsx";
import ReportPostModal from "./posts/ReportPostModal.jsx";

export default function FeedCard({ post, index, showUnsaveButton = false }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const postInfo = post.post_info || {};
  const userInfo = post.user_info || {};
  const threadInfo = post.thread_info || {};
  const isSaved = post.current_user?.saved || false;

  // Get current user
  const { data: currentUser } = useQuery({
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

  // Save/Unsave mutation
  const { mutate: toggleSave, isPending: isSavePending } = useMutation({
    mutationFn: async (shouldSave) => {
      if (shouldSave) {
        await api.put(`/api/posts/saved/${postInfo.id}`);
      } else {
        await api.delete(`/api/posts/saved/${postInfo.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postInfo.id] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      console.error("Error toggling save:", error);
      alert(error.response?.data?.message || "Failed to save post. Please try again.");
    },
  });

  // Delete mutation
  const { mutate: deletePost, isPending: isDeletePending } = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/post/${postInfo.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postInfo.id] });
      setShowDeleteModal(false);
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
      alert(error.response?.data?.message || "Failed to delete post. Please try again.");
    },
  });

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

  // Handle comments click - navigate to post detail
  const handleCommentsClick = (e) => {
    e.preventDefault();
    navigate(`/posts/${postInfo.id}`);
  };

  // Handle share
  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${postInfo.id}`;

    // Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: postInfo.title,
          text: postInfo.content?.substring(0, 200) || "",
          url: postUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
        return;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    }

    // Fallback to copy to clipboard
    try {
      await navigator.clipboard.writeText(postUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      // Fallback: select text
      const textArea = document.createElement("textarea");
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  // Handle save
  const handleSave = () => {
    toggleSave(!isSaved);
  };

  // Handle edit
  const handleEdit = () => {
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  // Handle report
  const handleReport = () => {
    setShowReportModal(true);
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
              <motion.button
                onClick={handleCommentsClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
              </motion.button>

              <motion.button
                onClick={handleShare}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSavePending}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="text-sm font-medium">Share</span>
              </motion.button>

              <PostActionMenu
                post={post}
                onSave={handleSave}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReport={handleReport}
              />

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

      {/* Modals */}
      {showEditModal && (
        <EditPostModal
          post={post}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["post", postInfo.id] });
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          postTitle={postInfo.title}
          onConfirm={() => deletePost()}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeletePending}
        />
      )}

      {showReportModal && (
        <ReportPostModal
          postId={postInfo.id}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            setShowReportModal(false);
          }}
        />
      )}

      {/* Share Success Toast */}
      <AnimatePresence>
        {shareSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed top-24 right-4 z-50 glass rounded-xl px-4 py-3 shadow-glass-lg border border-green-200 bg-green-50"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-medium">Link copied!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


