import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "../../api.js";

export default function PostActionMenu({ post, onSave, onEdit, onDelete, onReport }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const postInfo = post?.post_info || {};
  const userInfo = post?.user_info || {};
  const isSaved = post?.current_user?.saved || false;

  // Get current user to check ownership
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

  // Check if current user owns this post
  const isOwner = currentUser?.username === userInfo?.user_name || currentUser?.id === userInfo?.user_id;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action) => {
    setIsOpen(false);
    if (action === "save" && onSave) onSave();
    if (action === "edit" && onEdit) onEdit();
    if (action === "delete" && onDelete) onDelete();
    if (action === "report" && onReport) onReport();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 rounded-xl glass text-gray-600 hover:bg-white/40 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="More options"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-glass-lg overflow-hidden z-50 border border-white/20"
          >
            {/* Save/Unsave Option */}
            {onSave && (
              <motion.button
                onClick={() => handleAction("save")}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/30 transition-colors text-left"
                whileHover={{ x: 4 }}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    fill={isSaved ? "currentColor" : "none"}
                  />
                </svg>
                <span className="text-gray-700 font-medium">{isSaved ? "Unsave" : "Save"}</span>
              </motion.button>
            )}

            {/* Edit Option - Only for post owner */}
            {isOwner && onEdit && (
              <motion.button
                onClick={() => handleAction("edit")}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/30 transition-colors text-left"
                whileHover={{ x: 4 }}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="text-gray-700 font-medium">Edit</span>
              </motion.button>
            )}

            {/* Delete Option - Only for post owner */}
            {isOwner && onDelete && (
              <motion.button
                onClick={() => handleAction("delete")}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors text-left border-t border-gray-200"
                whileHover={{ x: 4 }}
              >
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="text-red-600 font-medium">Delete</span>
              </motion.button>
            )}

            {/* Report Option - Always available for reporting violations */}
            {onReport && (
              <motion.button
                onClick={() => handleAction("report")}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left border-t border-gray-200"
                whileHover={{ x: 4 }}
              >
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-orange-600 font-medium">Report Post</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
