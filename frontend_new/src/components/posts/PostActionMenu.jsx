import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "../../api.js";

export default function PostActionMenu({ post, onEdit, onDelete, onReport, onSave }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

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

  const postInfo = post.post_info || {};
  const userInfo = post.user_info || {};
  const isOwner = currentUser?.username === userInfo.user_name;
  const isSaved = post.current_user?.saved || false;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    setIsOpen(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setIsOpen(false);
  };

  const handleReport = () => {
    if (onReport) {
      onReport();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Three Dots Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="More options"
        aria-expanded={isOpen}
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

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-white border-[1.5px] border-[#00000022] rounded-xl shadow-glass-lg overflow-hidden z-50"
          >
            <div className="py-1">
              {/* Save/Unsave */}
              <motion.button
                onClick={handleSave}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-white/40 transition-colors flex items-center space-x-2"
                whileHover={{ x: 4 }}
              >
                <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <span>{isSaved ? "Unsave" : "Save"}</span>
              </motion.button>

              {/* Edit - Only for owner */}
              {isOwner && (
                <motion.button
                  onClick={handleEdit}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-white/40 transition-colors flex items-center space-x-2"
                  whileHover={{ x: 4 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Edit</span>
                </motion.button>
              )}

              {/* Delete - Only for owner */}
              {isOwner && (
                <motion.button
                  onClick={handleDelete}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                  whileHover={{ x: 4 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Delete</span>
                </motion.button>
              )}

              {/* Report */}
              <motion.button
                onClick={handleReport}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-white/40 transition-colors flex items-center space-x-2"
                whileHover={{ x: 4 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>Report</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}












