import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import LiveSuggestions from "../pages/Find/LiveSuggestions.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function Navbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isFindHovered, setIsFindHovered] = useState(false);
  const [isFindFocused, setIsFindFocused] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const findSearchRef = useRef(null);

  // Use custom auth hook for authentication state
  const { user, isLoading: userLoading, isAuthenticated } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
      if (findSearchRef.current && !findSearchRef.current.contains(event.target)) {
        setIsFindHovered(false);
        setIsFindFocused(false);
        setShowSearchSuggestions(false);
      }
    };
    if (showUserMenu || showMobileMenu || isFindHovered || isFindFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu, isFindHovered, isFindFocused]);

  // Fetch unread messages count (only when authenticated)
  const { data: unreadData } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/messages/unread/count");
        return response.data;
      } catch {
        return { unread_count: 0 };
      }
    },
    enabled: isAuthenticated,
    retry: 1,
    refetchInterval: 15000, // Poll every 15 seconds
  });

  const handleLogout = async () => {
    console.log("[Navbar] Logout initiated");
    try {
      // Close user menu if open
      setShowUserMenu(false);
      
      console.log("[Navbar] Calling logout API...");
      // Call logout endpoint (works even if session expired)
      await api.get("/api/user/logout");
      console.log("[Navbar] Logout API call successful");
    } catch (error) {
      console.error("[Navbar] Logout API error (continuing with cleanup):", error);
      // Continue with cleanup even if API call fails
    } finally {
      // Always perform cleanup regardless of API response
      console.log("[Navbar] Clearing local storage and cache...");
      
      // Remove user from localStorage
      localStorage.removeItem("user");
      console.log("[Navbar] Local storage cleared");
      
      // Clear all React Query cache
      queryClient.clear();
      console.log("[Navbar] Query cache cleared");
      
      // Cancel all ongoing queries
      queryClient.cancelQueries();
      console.log("[Navbar] Ongoing queries cancelled");
      
      // Reset query client state
      queryClient.resetQueries();
      console.log("[Navbar] Query client reset");
      
      // Small delay to ensure cleanup completes
      setTimeout(() => {
        console.log("[Navbar] Redirecting to login...");
        // Use window.location for full page reload to clear all state
        window.location.href = "/login";
      }, 100);
    }
  };

  const navItems = [
    { to: "/home", icon: "home", label: "Home" },
    { to: "/find", icon: "search", label: "Find" },
    { to: "/chat", icon: "ai", label: "AI Assistant" },
    { to: "/maps", icon: "map", label: "Maps" },
    { to: "/inbox", icon: "inbox", label: "Chat" },
    { to: "/saved", icon: "save", label: "Save" },
  ];

  const getIcon = (iconName) => {
    const icons = {
      save: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
      inbox: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14a2 2 0 0 0 2-2V8h-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14a2 2 0 0 0 2-2V8H8" />
        </svg>
      ),
      home: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      search: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      discover: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      ai: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/><path d="M20 2v4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/><path d="M22 4h-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/><circle cx="4" cy="20" r="2" strokeWidth={2}/>
        </svg>
      ),
      map: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    };
    return icons[iconName] || icons.home;
  };

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex fixed top-4 left-36 right-4 z-50 items-center justify-between gap-3"
      >
        {/* Navigation Items as Individual Islands - Centered */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          {/* Discover Button - Special Icon Button */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="relative"
          >
            <Link to="/find">
              <motion.button
                className="nav rounded-xl p-2.5 shadow-glass transition-all duration-300 relative overflow-hidden group text-gray-700 hover:bg-white/40 hover:text-primary"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                title="Discover Content"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="relative z-10"
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 2,
                  }}
                  whileHover={{
                    rotate: [0, -15, 15, -15, 0],
                    scale: 1.2,
                    transition: { duration: 0.5 },
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </motion.div>
              </motion.button>
            </Link>
          </motion.div>

          {navItems.map((item, index) => {
            // Special handling for Find button with expandable search
            if (item.to === "/find") {
              return (
                <motion.div
                  key={item.to}
                  initial={{ scale: 0.9, opacity: 0, y: -20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="relative"
                  ref={findSearchRef}
                  onMouseEnter={() => setIsFindHovered(true)}
                  onMouseLeave={() => {
                    // Always set hover to false when mouse leaves
                    setIsFindHovered(false);
                    // If input is not focused or has no content, close everything
                    setTimeout(() => {
                      if (!isFindFocused || !searchQuery.trim()) {
                        setIsFindFocused(false);
                        setShowSearchSuggestions(false);
                      }
                    }, 100);
                  }}
                >
                  <motion.div
                    className="relative"
                    animate={{
                      width: isFindHovered || isFindFocused ? 320 : "auto",
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <motion.div
                      className={`nav rounded-xl shadow-glass transition-all duration-300 relative overflow-hidden flex items-center ${
                        isFindHovered || isFindFocused
                          ? "bg-white/50 shadow-glass-xl"
                          : "bg-transparent"
                      }`}
                      animate={{
                        paddingLeft: isFindHovered || isFindFocused ? "2rem" : "1rem",
                        paddingRight: isFindHovered || isFindFocused ? "2.5rem" : "1rem",
                        paddingTop: "0.625rem",
                        paddingBottom: "0.625rem",
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Search Input - Hidden until hover */}
                      <AnimatePresence>
                        {(isFindHovered || isFindFocused) && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "100%" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center"
                          >
                            <motion.input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSearchSuggestions(e.target.value.trim().length >= 2);
                              }}
                              onFocus={() => {
                                setIsFindFocused(true);
                                if (searchQuery.trim().length >= 2) {
                                  setShowSearchSuggestions(true);
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  setIsFindFocused(false);
                                  // If not hovering and no search query, close completely
                                  if (!isFindHovered && !searchQuery.trim()) {
                                    setShowSearchSuggestions(false);
                                  }
                                }, 150);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && searchQuery.trim()) {
                                  navigate(`/find?q=${encodeURIComponent(searchQuery.trim())}`);
                                  setSearchQuery("");
                                  setShowSearchSuggestions(false);
                                  setIsFindHovered(false);
                                  setIsFindFocused(false);
                                }
                                if (e.key === "Escape") {
                                  setShowSearchSuggestions(false);
                                  setIsFindHovered(false);
                                  setIsFindFocused(false);
                                  setSearchQuery("");
                                }
                              }}
                              placeholder="Search communities, posts..."
                              className="w-full bg-transparent border-none outline-none px-3 py-2 text-gray-800 placeholder-gray-400 text-sm"
                            />
                            {searchQuery && (
                              <motion.button
                                onClick={() => {
                                  setSearchQuery("");
                                  setShowSearchSuggestions(false);
                                  // Don't immediately close if user might want to type again
                                  setTimeout(() => {
                                    if (!searchQuery.trim()) {
                                      setIsFindHovered(false);
                                      setIsFindFocused(false);
                                    }
                                  }, 100);
                                }}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/20 transition-colors"
                                whileHover={{ scale: 1.2, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </motion.button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Find Button Icon/Label */}
                      <motion.div
                        className={`flex items-center space-x-2 ${
                          isFindHovered || isFindFocused ? "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0" : "opacity-100"
                        }`}
                        animate={{
                          opacity: isFindHovered || isFindFocused ? 0 : 1,
                          scale: isFindHovered || isFindFocused ? 0.8 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                      <motion.div
                        className="relative z-10"
                        whileHover={{
                          scale: 1.2,
                          rotate: [0, -10, 10, 0],
                          transition: { duration: 0.3 },
                        }}
                      >
                        {getIcon(item.icon)}
                        {/* Unread count badge for inbox */}
                        {item.icon === "inbox" && unreadData && unreadData.unread_count > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                          >
                            {unreadData.unread_count > 9 ? "9+" : unreadData.unread_count}
                          </motion.span>
                        )}
                      </motion.div>
                        <motion.span className="font-medium text-sm relative z-10">
                          {item.label}
                        </motion.span>
                      </motion.div>

                      {/* Search Icon in expanded state */}
                      <AnimatePresence>
                        {(isFindHovered || isFindFocused) && (
                          <motion.svg
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                            className="absolute left-3 w-5 h-5 text-gray-800 pointer-events-none"
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
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Live Suggestions Dropdown */}
                    <AnimatePresence>
                      {showSearchSuggestions && (isFindHovered || isFindFocused) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 right-0 mt-2 z-50"
                        >
                          <LiveSuggestions
                            query={searchQuery}
                            onSelect={() => {
                              setSearchQuery("");
                              setShowSearchSuggestions(false);
                              setIsFindHovered(false);
                              setIsFindFocused(false);
                            }}
                            onClose={() => {
                              setShowSearchSuggestions(false);
                              setIsFindHovered(false);
                              setIsFindFocused(false);
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            }

            // Regular nav items
            return (
              <motion.div
                key={item.to}
                initial={{ scale: 0.9, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `nav rounded-xl pl-2 pr-4 py-2.5 flex items-center space-x-2 shadow-glass transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? "bg-primary/30 text-primary shadow-glow"
                        : "text-gray-700 hover:bg-white/40 hover:text-primary"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0"
                        animate={{
                          opacity: isActive ? 0.3 : 0,
                          scale: isActive ? 1 : 0.8,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.div
                        className="relative z-10"
                        animate={{
                          scale: isActive ? 1.15 : 1,
                          rotate: isActive ? [0, -5, 5, 0] : 0,
                        }}
                        transition={{
                          duration: 0.3,
                          rotate: {
                            duration: 0.5,
                            repeat: isActive ? Infinity : 0,
                            repeatDelay: 2,
                          },
                        }}
                        whileHover={{
                          scale: 1.2,
                          rotate: [0, -10, 10, 0],
                          transition: { duration: 0.3 },
                        }}
                      >
                        <div className="relative">
                          {getIcon(item.icon)}
                          {/* Unread count badge for inbox */}
                          {item.icon === "inbox" && unreadData && unreadData.unread_count > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-20"
                            >
                              {unreadData.unread_count > 9 ? "9+" : unreadData.unread_count}
                            </motion.span>
                          )}
                        </div>
                      </motion.div>
                      <motion.span
                        className="font-medium text-sm relative z-10"
                        animate={{
                          x: isActive ? [0, 2, 0] : 0,
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: isActive ? Infinity : 0,
                          repeatDelay: 2,
                        }}
                      >
                        {item.label}
                      </motion.span>
                      {isActive && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                          layoutId={`activeNavIndicator-${item.to}`}
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </div>

        {/* User Menu Island - Positioned on the right */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative ml-auto"
          ref={menuRef}
        >
          {isAuthenticated ? (
            <>
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="nav rounded-xl pl-1.5 pr-4 py-2.5 flex items-center space-x-3 shadow-glass-lg hover:shadow-glow transition-all duration-300 relative overflow-hidden group"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm relative z-10"
                  whileHover={{
                    scale: 1.15,
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.4 },
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(132, 204, 22, 0.4)",
                      "0 0 0 8px rgba(132, 204, 22, 0)",
                      "0 0 0 0 rgba(132, 204, 22, 0)",
                    ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </motion.div>
                <div className="text-left relative z-10">
                  <motion.p
                    className="text-xs text-gray-500 leading-tight"
                    animate={{
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    Hi,
                  </motion.p>
                  <motion.p
                    className="text-sm font-semibold text-gray-800 leading-tight"
                    whileHover={{ x: 2 }}
                  >
                    {user?.username || "User"}
                  </motion.p>
                </div>
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 nav rounded-xl shadow-glass-lg overflow-hidden z-50"
                  >
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-white/30 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="text-gray-700 font-medium">Dashboard</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-white/30 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-gray-700 font-medium">Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/30 transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-gray-700 font-medium">Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <Link
              to="/login"
              className="nav rounded-xl px-4 py-2.5 bg-gradient-primary text-white font-semibold shadow-glass-lg hover:shadow-glow transition-all duration-300 flex items-center"
            >
              Sign In
            </Link>
          )}
        </motion.div>
      </motion.nav>

      {/* Mobile Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="md:hidden fixed top-0 left-0 right-0 z-50 nav backdrop-blur-xl border-b border-white/20"
      >
        <div className="px-4 h-16 flex items-center justify-between">
          {/* Hamburger Menu Button */}
          <motion.button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="nav rounded-lg p-2"
            whileTap={{ scale: 0.9 }}
          >
            {showMobileMenu ? (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </motion.button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2 border-t border-white/20">
                {/* Mobile Discover Button */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0 }}
                >
                  <Link
                    to="/find"
                    onClick={() => setShowMobileMenu(false)}
                    className="nav rounded-xl px-4 py-3 flex items-center space-x-3 shadow-glass transition-all duration-300 bg-primary/20 text-primary hover:bg-primary/30"
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </motion.div>
                    <span className="font-medium">Discover</span>
                  </Link>
                </motion.div>

                {navItems.map((item, index) => (
                  <motion.div
                    key={item.to}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NavLink
                      to={item.to}
                      onClick={() => setShowMobileMenu(false)}
                      className={({ isActive }) =>
                        `nav rounded-xl px-4 py-3 flex items-center space-x-3 shadow-glass transition-all duration-300 ${
                          isActive
                            ? "bg-primary/30 text-primary"
                            : "text-gray-700 hover:bg-white/40"
                        }`
                      }
                    >
                      <div className="relative">
                        {getIcon(item.icon)}
                        {/* Unread count badge for inbox */}
                        {item.icon === "inbox" && unreadData && unreadData.unread_count > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-20"
                          >
                            {unreadData.unread_count > 9 ? "9+" : unreadData.unread_count}
                          </motion.span>
                        )}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </motion.div>
                ))}

                {/* User Section */}
                {isAuthenticated ? (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: navItems.length * 0.05 }}
                    className="pt-4 border-t border-white/20 space-y-2"
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => setShowMobileMenu(false)}
                      className="nav rounded-xl px-4 py-3 flex items-center space-x-3 shadow-glass hover:bg-white/40 transition-all"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="font-medium text-gray-700">Dashboard</span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="nav rounded-xl px-4 py-3 flex items-center space-x-3 shadow-glass hover:bg-white/40 transition-all"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium text-gray-700">Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                      }}
                      className="w-full nav rounded-xl px-4 py-3 flex items-center space-x-3 shadow-glass hover:bg-white/40 transition-all text-left"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium text-gray-700">Logout</span>
                    </button>
                    <div className="nav rounded-xl px-4 py-3 flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Hi,</p>
                        <p className="text-sm font-semibold text-gray-800">{user?.username || "User"}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: navItems.length * 0.05 }}
                    className="pt-4 border-t border-white/20"
                  >
                    <Link
                      to="/login"
                      onClick={() => setShowMobileMenu(false)}
                      className="nav rounded-xl px-4 py-3 bg-gradient-primary text-white font-semibold shadow-glass-lg flex items-center justify-center"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Bottom Navigation Bar for Mobile (PWA-friendly) */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 nav backdrop-blur-xl border-t border-white/20 safe-area-inset-bottom"
      >
        <div className="px-2 py-2 flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-primary/30 text-primary"
                    : "text-gray-600 hover:bg-white/30"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    {getIcon(item.icon)}
                    {/* Unread count badge for inbox */}
                    {item.icon === "inbox" && unreadData && unreadData.unread_count > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-20"
                      >
                        {unreadData.unread_count > 9 ? "9+" : unreadData.unread_count}
                      </motion.span>
                    )}
                  </motion.div>
                  <span className="text-xs font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          <motion.button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 ${
              showMobileMenu
                ? "bg-primary/30 text-primary"
                : "text-gray-600 hover:bg-white/30"
            }`}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            <span className="text-xs font-medium">More</span>
          </motion.button>
        </div>
      </motion.nav>
    </>
  );
}
