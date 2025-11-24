import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api.js";
import EditSubthreadModal from "./EditSubthreadModal.jsx";
import ManageModsModal from "./ManageModsModal.jsx";

export default function MoreDropdown({ community }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageModsModal, setShowManageModsModal] = useState(false);
  const dropdownRef = useRef(null);

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

  // Check if user is moderator/admin for this specific community
  const isModerator = 
    currentUser?.roles?.includes("admin") || 
    currentUser?.roles?.includes("mod") ||
    (community?.modList && Array.isArray(community.modList) && community.modList.includes(currentUser?.username)) ||
    (currentUser?.mod_in && Array.isArray(currentUser.mod_in) && currentUser.mod_in.includes(community?.id));

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('MoreDropdown Debug:', {
      currentUser: currentUser?.username,
      isModerator,
      communityModList: community?.modList,
      userModIn: currentUser?.mod_in,
      communityId: community?.id,
      userRoles: currentUser?.roles
    });
  }

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

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          More
          <motion.svg
            className="w-4 h-4 inline-block ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-64 glass rounded-xl shadow-glass-lg overflow-hidden z-50 border border-white/20"
            >
              {/* More Header */}
              <div className="px-4 py-3 bg-primary/20 text-primary font-semibold border-b border-white/20">
                More
              </div>

              {/* Subthread Options Section - Only show if moderator */}
              {isModerator && (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Subthread Options
                  </div>
                  <motion.button
                    onClick={() => {
                      setShowEditModal(true);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-white/30 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Subthread</span>
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowManageModsModal(true);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-white/30 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Manage Mods</span>
                  </motion.button>
                </div>
              )}

              {/* ModList Section - Always show */}
              <div className={`py-2 ${isModerator ? 'border-t border-white/20' : ''}`}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ModList
                </div>
                <div className="px-4 py-2 max-h-48 overflow-y-auto">
                  {community?.modList && Array.isArray(community.modList) && community.modList.length > 0 ? (
                    <div className="space-y-2">
                      {community.modList.map((modUsername, index) => (
                        <motion.div
                          key={modUsername || index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center space-x-2 py-1"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold">
                            {(modUsername && modUsername.charAt(0)) ? modUsername.charAt(0).toUpperCase() : "?"}
                          </div>
                          <span className="text-sm text-gray-700">{modUsername || "Unknown"}</span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No moderators</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEditModal && (
          <EditSubthreadModal
            community={community}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              // Invalidate queries and refresh
              queryClient.invalidateQueries({ queryKey: ["community"] });
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }}
          />
        )}

        {showManageModsModal && (
          <ManageModsModal
            community={community}
            onClose={() => setShowManageModsModal(false)}
            onSuccess={() => {
              setShowManageModsModal(false);
              // Invalidate queries and refresh
              queryClient.invalidateQueries({ queryKey: ["community"] });
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

