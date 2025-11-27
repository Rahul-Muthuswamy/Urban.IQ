import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../../api.js";
import UserMessageBubble from "../../components/UserMessageBubble.jsx";

export default function ChatView({ contactUsername, onBack, onMessageSent }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Fetch contact user info
  const { data: contactUser, isLoading: contactLoading } = useQuery({
    queryKey: ["user", contactUsername],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/user/${contactUsername}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching contact user:", error);
        return null;
      }
    },
    enabled: !!contactUsername,
    retry: 1,
  });

  // Fetch conversation messages
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["messages", contactUsername],
    queryFn: async () => {
      const response = await api.get(`/api/messages/all/${contactUsername}`);
      return response.data;
    },
    enabled: !!contactUsername,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messagesData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content) => {
      if (!contactUsername) {
        throw new Error("Contact username is required");
      }
      
      console.log("[ChatView] Sending message:", {
        receiver: contactUsername,
        content: content,
        contentLength: content.length,
      });
      
      try {
        const response = await api.post("/api/messages", {
          receiver: contactUsername,
          content: content,
        });
        
        console.log("[ChatView] Message sent successfully, response:", response.data);
        return response.data;
      } catch (error) {
        console.error("[ChatView] API Error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("[ChatView] Message sent successfully:", data);
      setMessage("");
      setError("");
      // Refetch messages to show the new message
      refetchMessages();
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["messages", contactUsername] });
      if (onMessageSent) onMessageSent();
      // Scroll to bottom after a short delay to ensure message is rendered
      setTimeout(scrollToBottom, 200);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to send message. Please try again.";
      setError(errorMessage);
      // Clear error after 5 seconds
      setTimeout(() => setError(""), 5000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any previous errors
    setError("");
    
    // Validation
    if (!contactUsername) {
      console.error("[ChatView] Contact username is missing");
      setError("Contact username is missing. Please refresh the page.");
      return;
    }
    
    if (!message.trim()) {
      setError("Message cannot be empty");
      return;
    }
    
    if (isSending) {
      console.log("[ChatView] Already sending, ignoring submit");
      return;
    }
    
    console.log("[ChatView] Sending message to:", contactUsername, "Content:", message.trim());
    
    // Send the message
    sendMessage(message.trim());
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 md:p-6 border-b border-gray-200 bg-white/50">
        <div className="flex items-center space-x-4">
          {/* Back Button (Mobile) */}
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Contact Info */}
          <Link to={`/user/${contactUsername}`} className="flex items-center space-x-3 flex-1">
            {contactUser?.avatar ? (
              <img src={contactUser.avatar} alt={contactUsername} className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                {contactUsername?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-800">{contactUsername}</h3>
              {contactUser?.bio && (
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{contactUser.bio}</p>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-white/30 to-transparent"
      >
        {messagesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messagesData && messagesData.length > 0 ? (
          <>
            {messagesData.map((msg, index) => (
              <UserMessageBubble
                key={msg.message_id || index}
                message={msg}
                index={index}
                formatTime={formatTime}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 text-gray-300 mb-4"
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
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message!</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 md:p-6 border-t border-gray-200 bg-white/50">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-end space-x-3" noValidate>
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none bg-white/80"
              style={{
                minHeight: "48px",
                maxHeight: "120px",
              }}
              disabled={isSending}
            />
          </div>
          <motion.button
            type="submit"
            disabled={!message.trim() || isSending || !contactUsername}
            className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            whileHover={{ scale: !message.trim() || isSending || !contactUsername ? 1 : 1.05 }}
            whileTap={{ scale: !message.trim() || isSending || !contactUsername ? 1 : 0.95 }}
          >
            {isSending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </motion.div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span>Send</span>
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}

