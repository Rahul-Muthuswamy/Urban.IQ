import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import CommentVoteButtons from "./CommentVoteButtons.jsx";
import CommentComposer from "./CommentComposer.jsx";

export default function CommentItem({ commentData, postId, depth = 0, index, onCommentUpdate }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(commentData.comment.comment_info.content || "");
  const [showReplies, setShowReplies] = useState(depth === 0); // Auto-expand top-level comments
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const comment = commentData.comment.comment_info || {};
  const userInfo = commentData.comment.user_info || {};
  const currentUser = commentData.comment.current_user || {};
  const children = commentData.children || [];

  // Get current user for edit/delete checks
  const { data: currentUserData } = useQuery({
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if current user can edit/delete (match by username)
  const canEdit = currentUserData?.username === userInfo.user_name;
  const canDelete = canEdit;

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

  // Edit comment mutation
  const { mutate: updateComment, isPending: isUpdating } = useMutation({
    mutationFn: async (content) => {
      const response = await api.patch(`/api/comments/${comment.id}`, { content });
      return response.data;
    },
    onSuccess: () => {
      setIsEditing(false);
      onCommentUpdate();
    },
    onError: (error) => {
      console.error("Error updating comment:", error);
      alert("Failed to update comment. Please try again.");
    },
  });

  // Delete comment mutation
  const { mutate: deleteComment } = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/comments/${comment.id}`);
    },
    onSuccess: () => {
      onCommentUpdate();
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
      setIsDeleting(false);
    },
  });

  const handleEdit = () => {
    setEditContent(comment.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      updateComment(editContent.trim());
    } else {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      setIsDeleting(true);
      deleteComment();
    }
  };

  const handleReplyAdded = () => {
    setShowReplyComposer(false);
    setShowReplies(true);
    onCommentUpdate();
  };

  if (isDeleting) {
    return null; // Comment is being deleted
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`glass rounded-xl p-4 ${depth > 0 ? "ml-6 md:ml-8 border-l-2 border-primary/20" : ""}`}
    >
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {userInfo.user_avatar ? (
            <img
              src={userInfo.user_avatar}
              alt={userInfo.user_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold">
              {userInfo.user_name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div>
            <span className="text-sm font-semibold text-gray-800">u/{userInfo.user_name || "Unknown"}</span>
            <span className="text-xs text-gray-500 ml-2">{formatDate(comment.created_at)}</span>
            {comment.is_edited && <span className="text-xs text-gray-500 italic ml-2">(edited)</span>}
          </div>
        </div>

        {/* Comment Actions */}
        {(canEdit || canDelete) && (
          <div className="flex items-center space-x-2">
            {canEdit && (
              <button
                onClick={handleEdit}
                className="text-xs text-gray-500 hover:text-primary transition-colors"
                disabled={isEditing}
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
                disabled={isDeleting}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Comment Content */}
      {isEditing ? (
        <div className="space-y-3 mb-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full glass-input rounded-lg p-3 resize-none focus:outline-none"
            rows={3}
            autoFocus
          />
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={handleSaveEdit}
              disabled={isUpdating || !editContent.trim()}
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              whileHover={{ scale: isUpdating ? 1 : 1.05 }}
              whileTap={{ scale: isUpdating ? 1 : 0.95 }}
            >
              {isUpdating ? "Saving..." : "Save"}
            </motion.button>
            <button
              onClick={handleCancelEdit}
              disabled={isUpdating}
              className="px-4 py-2 glass text-gray-600 rounded-lg text-sm font-semibold hover:bg-white/40"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-gray-700 whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
      )}

      {/* Comment Actions Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Vote Buttons */}
          <CommentVoteButtons
            commentId={comment.id}
            initialVote={currentUser.has_upvoted}
            initialKarma={comment.comment_karma || 0}
          />

          {/* Reply Button */}
          {depth < 3 && (
            <motion.button
              onClick={() => setShowReplyComposer(!showReplyComposer)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-primary transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              <span>Reply</span>
            </motion.button>
          )}
        </div>

        {/* Show Replies Toggle */}
        {children.length > 0 && (
          <motion.button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-primary transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: showReplies ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
            <span>{children.length} {children.length === 1 ? "reply" : "replies"}</span>
          </motion.button>
        )}
      </div>

      {/* Reply Composer */}
      <AnimatePresence>
        {showReplyComposer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <CommentComposer
              postId={postId}
              parentId={comment.id}
              onCommentAdded={handleReplyAdded}
              onCancel={() => setShowReplyComposer(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nested Replies */}
      <AnimatePresence>
        {showReplies && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 space-y-4"
          >
            {children.map((childData, childIndex) => (
              <CommentItem
                key={childData.comment.comment_info.id}
                commentData={childData}
                postId={postId}
                depth={depth + 1}
                index={childIndex}
                onCommentUpdate={onCommentUpdate}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

