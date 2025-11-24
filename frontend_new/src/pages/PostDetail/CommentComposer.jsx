import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "../../api.js";

export default function CommentComposer({ postId, parentId = null, onCommentAdded, onCancel }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Create comment mutation
  const { mutate: createComment, isPending } = useMutation({
    mutationFn: async (commentData) => {
      const response = await api.post("/api/comments", commentData);
      return response.data;
    },
    onSuccess: () => {
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      if (onCommentAdded) {
        onCommentAdded();
      }
    },
    onError: (error) => {
      console.error("Error creating comment:", error);
      alert(error.response?.data?.message || "Failed to post comment. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    const commentData = {
      content: content.trim(),
      post_id: postId,
    };

    if (parentId) {
      commentData.has_parent = true;
      commentData.parent_id = parentId;
    }

    createComment(commentData);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-3"
    >
      <motion.div
        className="relative"
        animate={{
          scale: focused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={parentId ? "Write a reply..." : "What are your thoughts?"}
          disabled={isPending}
          rows={3}
          className="w-full glass-input rounded-xl p-4 resize-none focus:outline-none text-base transition-all duration-300"
          style={{
            boxShadow: focused
              ? "0 0 0 3px rgba(132, 204, 22, 0.2), 0 0 20px rgba(132, 204, 22, 0.3)"
              : "none",
            minHeight: "80px",
          }}
        />
      </motion.div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Press {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Enter to submit
        </p>
        <div className="flex items-center space-x-2">
          {onCancel && (
            <motion.button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="px-4 py-2 glass text-gray-600 rounded-lg text-sm font-semibold hover:bg-white/40 transition-all disabled:opacity-50"
              whileHover={{ scale: isPending ? 1 : 1.05 }}
              whileTap={{ scale: isPending ? 1 : 0.95 }}
            >
              Cancel
            </motion.button>
          )}
          <motion.button
            type="submit"
            disabled={!content.trim() || isPending}
            className="px-6 py-2 bg-gradient-primary text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            whileHover={{ scale: !content.trim() || isPending ? 1 : 1.05 }}
            whileTap={{ scale: !content.trim() || isPending ? 1 : 0.95 }}
          >
            {isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </motion.div>
                <span>Posting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span>Comment</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
}


