import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api.js";
import Navbar from "../../components/Navbar.jsx";
import ChatView from "./ChatView.jsx";

export default function InboxPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("conversations"); // "conversations" or "new"

  // Check authentication
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/user");
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 0,
    cacheTime: 0,
  });

  // Fetch inbox conversations
  const { data: inboxData, isLoading: inboxLoading, refetch: refetchInbox } = useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      const response = await api.get("/api/messages/inbox");
      return response.data;
    },
    enabled: !!user,
    retry: 1,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Fetch all users for new conversations
  const { data: allUsersData, isLoading: allUsersLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const response = await api.get("/api/users/all");
      return response.data;
    },
    enabled: !!user,
    retry: 1,
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      const response = await api.get("/api/messages/unread/count");
      return response.data;
    },
    enabled: !!user,
    retry: 1,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user && userError?.response?.status === 401) {
      navigate("/login", { replace: true });
    }
  }, [user, userLoading, userError, navigate]);

  // Get usernames of users we already have conversations with
  const existingConversationUsernames = new Set(
    inboxData?.map((conv) => conv.contact?.username).filter(Boolean) || []
  );

  // Filter conversations by search
  const filteredConversations = inboxData?.filter((conv) =>
    conv.contact?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter users by search and exclude those we already have conversations with
  const filteredUsers = allUsersData?.filter((user) => {
    const matchesSearch = user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const hasConversation = existingConversationUsernames.has(user.username);
    // In "new" mode, show users without conversations. In "conversations" mode, show all users.
    return matchesSearch && (viewMode === "new" ? !hasConversation : true);
  }) || [];

  // Handle starting a new conversation
  const handleStartConversation = (username) => {
    setSelectedConversation(username);
    setViewMode("conversations"); // Switch back to conversations view
    setSearchQuery(""); // Clear search
  };

  // Show loading while checking auth
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pb-20 md:pb-0">
      <Navbar />
      <img
        src="/assets/7_remove_bg.png"
        alt="urban_iq"
        className="fixed top-0 left-0 z-[100] h-6 sm:h-6 md:h-8 lg:h-10 xl:h-12 object-contain pointer-events-auto mt-5 ml-5"
      />

      <div className="max-w-7xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-6 h-[calc(100vh-12rem)]"
        >
          {/* Conversations List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`glass rounded-3xl shadow-glass-lg backdrop-blur-xl overflow-hidden flex flex-col ${
              selectedConversation ? "hidden md:flex md:w-1/3" : "w-full md:w-1/3"
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
                {unreadData && unreadData.unread_count > 0 && (
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                    {unreadData.unread_count}
                  </span>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 mb-4 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode("conversations");
                    setSearchQuery("");
                  }}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    viewMode === "conversations"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Conversations
                </button>
                <button
                  onClick={() => {
                    setViewMode("new");
                    setSearchQuery("");
                  }}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    viewMode === "new"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  New Chat
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={viewMode === "conversations" ? "Search conversations..." : "Search users..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white/80"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Conversations List or Users List */}
            <div className="flex-1 overflow-y-auto">
              {viewMode === "conversations" ? (
                // Show existing conversations
                inboxLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredConversations.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredConversations.map((conversation, index) => (
                      <motion.button
                        key={conversation.message_id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedConversation(conversation.contact?.username)}
                        className={`w-full p-4 text-left hover:bg-white/40 transition-colors ${
                          selectedConversation === conversation.contact?.username
                            ? "bg-primary/10 border-l-4 border-primary"
                            : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Avatar */}
                          {conversation.contact?.avatar ? (
                            <img
                              src={conversation.contact.avatar}
                              alt={conversation.contact.username}
                              className="w-12 h-12 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {conversation.contact?.username?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {conversation.contact?.username || "Unknown User"}
                              </h3>
                              {conversation.latest_message?.created_at && (
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                  {new Date(conversation.latest_message.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600 truncate">
                                {conversation.latest_message?.is_from_me ? "You: " : ""}
                                {conversation.latest_message?.content || "No messages"}
                              </p>
                              {conversation.unread_count > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs font-semibold rounded-full flex-shrink-0">
                                  {conversation.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-300 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium mb-2">No conversations yet</p>
                    <p className="text-sm">Start a conversation by messaging a user!</p>
                    <button
                      onClick={() => setViewMode("new")}
                      className="mt-4 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Start New Chat
                    </button>
                  </div>
                )
              ) : (
                // Show available users for new conversations
                allUsersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredUsers.map((user, index) => (
                      <motion.button
                        key={user.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleStartConversation(user.username)}
                        className="w-full p-4 text-left hover:bg-white/40 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {/* Avatar */}
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-12 h-12 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {user.username?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {user.username || "Unknown User"}
                              </h3>
                              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full flex-shrink-0 ml-2">
                                New
                              </span>
                            </div>
                            {user.bio && (
                              <p className="text-sm text-gray-600 truncate">{user.bio}</p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-300 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <p className="text-lg font-medium mb-2">
                      {searchQuery ? "No users found" : "All users have conversations"}
                    </p>
                    <p className="text-sm">
                      {searchQuery
                        ? "Try a different search term"
                        : "You've started conversations with everyone!"}
                    </p>
                  </div>
                )
              )}
            </div>
          </motion.div>

          {/* Chat View */}
          <AnimatePresence mode="wait">
            {selectedConversation ? (
              <motion.div
                key={selectedConversation}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 glass rounded-3xl shadow-glass-lg backdrop-blur-xl overflow-hidden flex flex-col"
              >
                <ChatView
                  contactUsername={selectedConversation}
                  onBack={() => setSelectedConversation(null)}
                  onMessageSent={() => {
                    // Refresh inbox to show new conversation
                    refetchInbox();
                    // Switch to conversations view if we were in "new" mode
                    setViewMode("conversations");
                    // Invalidate all related queries
                    queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
                    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden md:flex flex-1 glass rounded-3xl shadow-glass-lg backdrop-blur-xl items-center justify-center"
              >
                <div className="text-center text-gray-500">
                  <svg
                    className="w-24 h-24 mx-auto text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-xl font-medium mb-2">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list to start chatting</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

