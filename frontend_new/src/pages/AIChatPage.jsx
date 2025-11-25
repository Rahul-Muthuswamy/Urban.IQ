import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import Navbar from "../components/Navbar.jsx";
import MessageBubble from "../components/MessageBubble.jsx";
import TypingIndicator from "../components/TypingIndicator.jsx";
import ChatInputBar from "../components/ChatInputBar.jsx";

export default function AIChatPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [showHero, setShowHero] = useState(true);
  const [ragServiceStatus, setRagServiceStatus] = useState(null);

  // Check authentication
  const { data: user, isLoading: userLoading } = useQuery({
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

  // Fetch chat history
  const { data: chatHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["chatHistory"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/chat/history", {
          params: { limit: 50 },
        });
        return response.data;
      } catch (error) {
        console.error("Error fetching chat history:", error);
        return { history: [] };
      }
    },
    enabled: !!user,
    retry: false,
  });

  // Load chat history into messages
  useEffect(() => {
    if (chatHistory?.history && Array.isArray(chatHistory.history) && chatHistory.history.length > 0) {
      // History comes newest first, so reverse to show oldest first
      const sortedHistory = [...chatHistory.history].reverse();
      const historyMessages = sortedHistory.flatMap((entry) => [
        {
          id: `user-${entry.id}`,
          type: "user",
          text: entry.query || "",
          timestamp: entry.created_at,
        },
        {
          id: `ai-${entry.id}`,
          type: "ai",
          text: entry.answer || "",
          sources: Array.isArray(entry.sources) ? entry.sources : [],
          timestamp: entry.created_at,
          isPolitical: entry.is_political || false,
        },
      ]);
      setMessages(historyMessages);
      setShowHero(false);
    }
  }, [chatHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (queryText) => {
      const response = await api.post("/api/chat/query", {
        query: queryText,
        k: 5,
      });
      return response.data;
    },
    onMutate: async (queryText) => {
      // Optimistically add user message
      const userMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        text: queryText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setShowHero(false);
      return { userMessage };
    },
    onSuccess: (data, variables, context) => {
      // Add AI response
      const aiMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        text: data.answer || "No response available.",
        sources: data.sources || [],
        timestamp: new Date().toISOString(),
        isPolitical: data.meta?.is_political || false,
      };
      setMessages((prev) => [...prev, aiMessage]);
      
      // Invalidate chat history to refresh
      queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
    },
    onError: (error) => {
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
      
      // Determine error message based on status code
      let errorText = "Sorry, I encountered an error. Please try again.";
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || "";
        
        if (status === 503 || message.includes("unavailable")) {
          errorText = "The AI Assistant service is currently unavailable. Please make sure the RAG service is running on port 8000 and try again later.";
        } else if (status === 429) {
          errorText = "You're sending messages too quickly. Please wait a moment and try again.";
        } else if (status === 400) {
          errorText = message || "Invalid request. Please check your message and try again.";
        } else if (status === 401) {
          errorText = "You need to be logged in to use the AI Assistant.";
        } else {
          errorText = message || `Error: ${status}. Please try again.`;
        }
      } else if (error.request) {
        errorText = "Unable to connect to the server. Please check your internet connection and make sure the backend is running.";
      }
      
      // Show error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: "ai",
        text: errorText,
        isError: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSendMessage = (text) => {
    if (text.trim() && !isSending) {
      sendMessage(text.trim());
    }
  };

  // Check RAG service health on mount
  useEffect(() => {
    const checkRAGService = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/ping", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          setRagServiceStatus("online");
          console.log("RAG service is online:", data);
        } else {
          setRagServiceStatus("error");
          console.warn("RAG service health check failed:", response.status);
        }
      } catch (error) {
        setRagServiceStatus("offline");
        console.warn("RAG service is not running. Please start it using: python backend/threaddit/rag/start_rag_service.py or run: python backend/start_rag_service.py");
      }
    };
    
    if (user) {
      checkRAGService();
      // Check every 30 seconds
      const interval = setInterval(checkRAGService, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, userLoading, navigate]);

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
      <img src='/assets/7_remove_bg.png' alt='urban_iq' className='fixed top-0 left-0 z-[100] h-6 sm:h-6 md:h-8 lg:h-10 xl:h-12 object-contain pointer-events-auto mt-5 ml-5'></img>

      <div className="max-w-4xl mx-auto pt-20 md:pt-28 px-4 md:px-6 min-h-screen flex flex-col">
        {/* Hero Section - Shows when no messages */}
        <AnimatePresence>
          {showHero && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-12"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-8"
              >
                <img
                  src="/assets/4_remove_bg.png"
                  alt="AI Assistant"
                  className="w-24 h-24 md:w-32 md:h-32 object-contain mx-auto"
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold text-gradient mb-4"
              >
                Automate, Engage and Grow with AI Chat
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-gray-600 max-w-2xl"
              >
                Ask me anything about your city, civic engagement, or community matters. I'm here to help!
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RAG Service Status Warning */}
        {ragServiceStatus === "offline" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm"
          >
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  AI Assistant Service Unavailable
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  The RAG service is not running. Please start it by running: <code className="bg-yellow-100 px-1 rounded">python backend/start_rag_service.py</code>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                index={index}
              />
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isSending && <TypingIndicator />}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar - Fixed at bottom */}
        <ChatInputBar
          onSend={handleSendMessage}
          disabled={isSending}
          isLoading={historyLoading}
        />
      </div>
    </div>
  );
}

