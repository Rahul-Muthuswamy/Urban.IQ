import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";

export default function UserMessageBubble({ message, index, formatTime }) {
  // Get current user to determine if message is sent or received
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

  const isSent = message.is_sent !== undefined 
    ? message.is_sent 
    : (message.sender?.username === currentUser?.username);

  const senderUsername = message.sender?.username || "Unknown";
  const senderAvatar = message.sender?.avatar;
  const content = message.content || "";
  const timestamp = message.created_at;
  const seen = message.seen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`flex items-end space-x-2 ${isSent ? "flex-row-reverse space-x-reverse" : ""}`}
    >
      {/* Avatar (only for received messages) */}
      {!isSent && (
        <div className="flex-shrink-0">
          {senderAvatar ? (
            <img src={senderAvatar} alt={senderUsername} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
              {senderUsername[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      )}

      {/* Message Bubble */}
      <div className={`flex flex-col ${isSent ? "items-end" : "items-start"} max-w-[75%] md:max-w-[60%]`}>
        {!isSent && (
          <span className="text-xs text-gray-500 mb-1 px-2">{senderUsername}</span>
        )}
        <motion.div
          className={`rounded-2xl px-4 py-2 shadow-glass ${
            isSent
              ? "bg-gradient-to-br from-primary/20 to-accent/20 rounded-tr-sm"
              : "bg-white/80 rounded-tl-sm"
          }`}
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-gray-800 text-sm md:text-base whitespace-pre-wrap break-words">
            {content}
          </p>
          <div className={`flex items-center space-x-1 mt-1 ${isSent ? "justify-end" : "justify-start"}`}>
            <span className="text-xs text-gray-500">
              {formatTime ? formatTime(timestamp) : timestamp ? new Date(timestamp).toLocaleTimeString() : ""}
            </span>
            {isSent && (
              <svg
                className={`w-4 h-4 ${seen ? "text-blue-500" : "text-gray-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {seen ? (
                  // Double checkmark (read)
                  <>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                      style={{ transform: "translateX(4px)" }}
                    />
                  </>
                ) : (
                  // Single checkmark (sent)
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                )}
              </svg>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

