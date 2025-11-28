import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import VoteButtons from "../../components/VoteButtons.jsx";
import PostActionMenu from "../../components/posts/PostActionMenu.jsx";
import EditPostModal from "../../components/posts/EditPostModal.jsx";
import DeleteConfirmModal from "../../components/posts/DeleteConfirmModal.jsx";
import ReportPostModal from "../../components/posts/ReportPostModal.jsx";

export default function ActionsBar({ post }) {
  const queryClient = useQueryClient();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const postInfo = post.post_info || {};
  const currentUser = post.current_user || {};
  
  // Get current user for ownership checks
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
  });

  // Debug logging
  console.log("[ActionsBar] Post data:", {
    postId: postInfo.id,
    postKarma: postInfo.post_karma,
    currentUser: currentUser,
    has_upvoted: currentUser.has_upvoted,
    saved: currentUser.saved,
  });

  // Save/Unsave mutation
  const { mutate: toggleSave, isPending: isSavePending } = useMutation({
    mutationFn: async (shouldSave) => {
      console.log("[ActionsBar] Toggling save:", shouldSave);
      if (shouldSave) {
        const response = await api.put(`/api/posts/saved/${postInfo.id}`);
        console.log("[ActionsBar] Save response:", response.data);
        return response.data;
      } else {
        const response = await api.delete(`/api/posts/saved/${postInfo.id}`);
        console.log("[ActionsBar] Unsave response:", response.data);
        return response.data;
      }
    },
    onSuccess: () => {
      console.log("[ActionsBar] Save/Unsave successful, invalidating queries...");
      queryClient.invalidateQueries({ queryKey: ["post", postInfo.id] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
    onError: (error) => {
      console.error("[ActionsBar] Save/Unsave error:", error);
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
      // Navigate back or to home
      window.location.href = "/home";
    },
    onError: (error) => {
      console.error("[ActionsBar] Delete error:", error);
      alert(error.response?.data?.message || "Failed to delete post. Please try again.");
    },
  });

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${postInfo.id}`;
    console.log("[ActionsBar] Sharing post:", postUrl);

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
        setShowShareMenu(false);
        return;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("[ActionsBar] Share failed:", error);
        } else {
          // User cancelled, just close menu
          setShowShareMenu(false);
          return;
        }
      }
    }

    // Fallback to copy to clipboard
    try {
      await navigator.clipboard.writeText(postUrl);
      console.log("[ActionsBar] Link copied to clipboard");
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (error) {
      console.error("[ActionsBar] Copy failed:", error);
      // Fallback: select text
      const textArea = document.createElement("textarea");
      textArea.value = postUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        console.log("[ActionsBar] Link copied using fallback method");
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err) {
        console.error("[ActionsBar] Fallback copy failed:", err);
        alert("Failed to copy link. Please copy manually: " + postUrl);
      }
      document.body.removeChild(textArea);
    }
    setShowShareMenu(false);
  };

  const handleSave = () => {
    console.log("[ActionsBar] Handle save called, current saved state:", currentUser.saved);
    toggleSave(!currentUser.saved);
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 md:p-6 shadow-glass-lg"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: Vote Buttons */}
        <div className="flex items-center space-x-4">
          <VoteButtons
            postId={postInfo.id}
            initialVote={currentUser.has_upvoted}
            initialKarma={postInfo.post_karma || 0}
          />
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Save Button */}
          <motion.button
            onClick={handleSave}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              currentUser.saved
                ? "bg-primary/20 text-primary"
                : "glass text-gray-600 hover:bg-white/40"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={currentUser.saved ? "Unsave post" : "Save post"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={currentUser.saved ? "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" : "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"}
                fill={currentUser.saved ? "currentColor" : "none"}
              />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">
              {currentUser.saved ? "Saved" : "Save"}
            </span>
          </motion.button>

          {/* Share Button */}
          <div className="relative">
            <motion.button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl glass text-gray-600 hover:bg-white/40 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Share post"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">Share</span>
            </motion.button>

            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-glass-lg overflow-hidden z-50"
                >
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/30 transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-700 font-medium">Copy Link</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* More Menu Button */}
          <PostActionMenu
            post={post}
            onSave={handleSave}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReport={handleReport}
          />
        </div>
      </div>

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

      {/* Modals */}
      {showEditModal && post && (
        <EditPostModal
          post={post}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            queryClient.invalidateQueries({ queryKey: ["post", postInfo.id] });
            queryClient.invalidateQueries({ queryKey: ["posts"] });
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
            alert("Post reported successfully. Thank you for keeping the community safe!");
          }}
        />
      )}
    </motion.div>
  );
}

