import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";

export default function ManageModsModal({ community, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [newModUsername, setNewModUsername] = useState("");
  const [errors, setErrors] = useState({});

  // Get current user to check if they can remove mods
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

  const isAdmin = currentUser?.roles?.includes("admin");

  const { mutate: addModerator, isPending: isAdding } = useMutation({
    mutationFn: async (username) => {
      const response = await api.put(`/api/threads/thread/mod/${community.id}/${username}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community"] });
      setNewModUsername("");
      setErrors({});
      // Refresh page to show updated mod list
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error) => {
      console.error("Error adding moderator:", error);
      setErrors({
        add: error.response?.data?.message || "Failed to add moderator. User may not exist or already be a moderator.",
      });
    },
  });

  const { mutate: removeModerator, isPending: isRemoving } = useMutation({
    mutationFn: async (username) => {
      const response = await api.delete(`/api/threads/thread/mod/${community.id}/${username}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community"] });
      setErrors({});
      // Refresh page to show updated mod list
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error) => {
      console.error("Error removing moderator:", error);
      setErrors({
        remove: error.response?.data?.message || "Failed to remove moderator.",
      });
    },
  });

  const handleAddMod = (e) => {
    e.preventDefault();
    setErrors({});

    if (!newModUsername.trim()) {
      setErrors({ add: "Username is required" });
      return;
    }

    addModerator(newModUsername.trim());
  };

  const handleRemoveMod = (username) => {
    if (window.confirm(`Are you sure you want to remove ${username} as a moderator?`)) {
      removeModerator(username);
    }
  };

  const modList = community?.modList || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-glass-xl border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Manage Moderators</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Add Moderator Form */}
          <div className="mb-6 pb-6 border-b border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Moderator</h3>
            <form onSubmit={handleAddMod} className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newModUsername}
                  onChange={(e) => {
                    setNewModUsername(e.target.value);
                    setErrors({});
                  }}
                  className="flex-1 glass-input rounded-xl px-4 py-2.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800"
                  placeholder="Enter username"
                  disabled={isAdding}
                />
                <motion.button
                  type="submit"
                  disabled={isAdding || !newModUsername.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-primary text-white font-semibold shadow-lg hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isAdding ? 1 : 1.05 }}
                  whileTap={{ scale: isAdding ? 1 : 0.95 }}
                >
                  {isAdding ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.div>
                  ) : (
                    "Add"
                  )}
                </motion.button>
              </div>
              {errors.add && (
                <p className="text-red-500 text-sm">{errors.add}</p>
              )}
            </form>
          </div>

          {/* Moderators List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Moderators</h3>
            {modList.length === 0 ? (
              <p className="text-gray-500 text-sm">No moderators yet.</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {modList.map((username, index) => {
                    // Check if this mod is the creator (created_by is username string from backend)
                    const isCreator = community.created_by === username;
                    // Can remove if admin, or if not the creator and not yourself
                    // Only admins can remove creators (backend enforces this)
                    const canRemove = isAdmin || (!isCreator && username !== currentUser?.username);
                    
                    return (
                      <motion.div
                        key={username}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between glass rounded-xl p-3 hover:bg-white/30 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                            {username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{username}</p>
                            {isCreator && (
                              <p className="text-xs text-gray-500">Creator</p>
                            )}
                          </div>
                        </div>
                        {canRemove && (
                          <motion.button
                            onClick={() => handleRemoveMod(username)}
                            disabled={isRemoving}
                            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {isRemoving ? "Removing..." : "Remove"}
                          </motion.button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
            {errors.remove && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                {errors.remove}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end pt-6 mt-6 border-t border-white/20">
            <motion.button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

