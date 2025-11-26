import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function ChatInputBar({ onSend, disabled, isLoading }) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky bottom-0 py-4 md:py-6"
    >
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          className="glass rounded-2xl shadow-glass-lg overflow-hidden"
          animate={{
            boxShadow: focused
              ? "0 0 0 3px rgba(132, 204, 22, 0.2), 0 9px 36px 0 rgba(31, 38, 135, 0.5)"
              : "0 8px 32px 0 rgba(31, 38, 135, 0.1)",
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3 p-3 md:p-4">
            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={isLoading ? "Loading chat history..." : "Type your message..."}
                disabled={disabled || isLoading}
                rows={1}
                className="w-full bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400 text-sm md:text-base pr-2 max-h-32 overflow-y-auto"
                style={{ minHeight: "24px" }}
              />
            </div>

            {/* Send Button */}
            <motion.button
              type="submit"
              disabled={!input.trim() || disabled || isLoading}
              className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-primary text-white flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {disabled ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </motion.div>
              ) : (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Helper Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-500 text-center mt-2"
        >
          Press Enter to send, Shift+Enter for new line
        </motion.p>
      </form>
    </motion.div>
  );
}


