import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function SearchBar({ initialQuery = "", onSearch, autoFocus = false }) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    if (onSearch) {
      onSearch("");
    }
    inputRef.current?.focus();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="relative"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className={`glass rounded-2xl p-4 md:p-6 shadow-glass-lg transition-all duration-300 ${
          isFocused
            ? "ring-2 ring-primary/50 shadow-glow-lg border border-primary/30"
            : "border border-white/20"
        }`}
      >
        <div className="flex items-center space-x-4">
          {/* Search Icon */}
          <motion.div
            animate={{ scale: isFocused ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-6 h-6 text-primary"
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
          </motion.div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search posts, communities, users..."
            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-lg md:text-xl"
            aria-label="Search"
          />

          {/* Clear Button */}
          {query && (
            <motion.button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              aria-label="Clear search"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
          )}

          {/* Search Button */}
          <motion.button
            type="submit"
            disabled={!query.trim()}
            className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: query.trim() ? 1.05 : 1 }}
            whileTap={{ scale: query.trim() ? 0.95 : 1 }}
            aria-label="Search"
          >
            Search
          </motion.button>
        </div>
      </div>

      {/* Focus Glow Effect */}
      {isFocused && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.form>
  );
}


