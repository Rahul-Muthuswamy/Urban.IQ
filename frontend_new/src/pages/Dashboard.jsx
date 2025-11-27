import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";
import Navbar from "../components/Navbar.jsx";

export default function Dashboard() {
  const navigate = useNavigate();

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user && userError?.response?.status === 401) {
      navigate("/login", { replace: true });
    }
  }, [user, userLoading, userError, navigate]);

  // Check if user is moderator/admin
  const isModerator = user?.roles?.includes("admin") || user?.roles?.includes("mod");

  // Fetch user activity data (for regular users)
  const { data: activityData, isLoading: activityLoading, error: activityError, refetch: refetchActivity } = useQuery({
    queryKey: ["userActivity", user?.id],
    queryFn: async () => {
      try {
        const response = await api.get("/api/user/activity");
        return response.data;
      } catch (error) {
        console.error("[Dashboard] Error fetching user activity:", error);
        throw error;
      }
    },
    enabled: !!user && !isModerator,
    retry: 1,
  });

  // Fetch all users activity data (for moderators)
  const [searchQuery, setSearchQuery] = useState("");
  const [usersPage, setUsersPage] = useState(0);
  const usersLimit = 20;

  const { data: usersActivityData, isLoading: usersActivityLoading, error: usersActivityError, refetch: refetchUsersActivity } = useQuery({
    queryKey: ["usersActivity", searchQuery, usersPage],
    queryFn: async () => {
      try {
        const response = await api.get("/api/users/activity", {
          params: {
            search: searchQuery,
            limit: usersLimit,
            offset: usersPage * usersLimit,
          },
        });
        return response.data;
      } catch (error) {
        console.error("[Dashboard] Error fetching users activity:", error);
        throw error;
      }
    },
    enabled: !!user && isModerator,
    retry: 1,
  });

  const [activeTab, setActiveTab] = useState("overview"); // overview, posts, comments, communities, saved
  const [selectedUser, setSelectedUser] = useState(null);

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

      <div className="max-w-7xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-3">
              Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              {isModerator ? "Moderator Dashboard - Users Activity" : `Welcome back, ${user?.username || "User"}!`}
            </p>
          </motion.div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* User Info Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-3xl p-6 md:p-8 shadow-glass-lg backdrop-blur-xl"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-2xl">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{user?.username || "User"}</h3>
                  <p className="text-sm text-gray-500">{user?.email || ""}</p>
                </div>
              </div>
              {user?.bio && (
                <p className="text-gray-600 text-sm mt-4">{user.bio}</p>
              )}
            </motion.div>

            {/* Quick Actions Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-3xl p-6 md:p-8 shadow-glass-lg backdrop-blur-xl"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <motion.button
                  onClick={() => navigate("/community/create")}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-lg hover:shadow-glow-lg transition-all duration-300 text-left flex items-center space-x-3"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Community</span>
                </motion.button>
                <motion.button
                  onClick={() => navigate("/home")}
                  className="w-full px-4 py-3 rounded-xl glass text-gray-700 font-semibold hover:bg-white/40 transition-all duration-300 text-left flex items-center space-x-3"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Go to Home</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Moderator Access Card */}
            {isModerator && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-3xl p-6 md:p-8 shadow-glass-lg backdrop-blur-xl border-2 border-accent/30"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Moderator</h3>
                    <p className="text-sm text-gray-500">Access moderation tools</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => navigate("/moderator/dashboard")}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-primary text-white font-semibold shadow-lg hover:shadow-glow-lg transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Open Moderator Dashboard
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Activity Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-3xl p-6 md:p-8 shadow-glass-lg backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {isModerator ? "Users Activity" : "Your Activity"}
              </h3>
              {isModerator ? (
                usersActivityData && (
                  <button
                    onClick={() => refetchUsersActivity()}
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                )
              ) : (
                activityData && (
                  <button
                    onClick={() => refetchActivity()}
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                )
              )}
            </div>

            {/* Moderator View - All Users Activity */}
            {isModerator ? (
              usersActivityLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : usersActivityData ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-4 border border-blue-500/20">
                      <div className="text-2xl font-bold text-gray-800 mb-1">
                        {usersActivityData.summary?.total_users || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-2xl p-4 border border-yellow-500/20">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {usersActivityData.summary?.suspicious_users || 0}
                      </div>
                      <div className="text-sm text-gray-600">Suspicious Users</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl p-4 border border-red-500/20">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {usersActivityData.summary?.high_risk_users || 0}
                      </div>
                      <div className="text-sm text-gray-600">High Risk Users</div>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search users by username..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setUsersPage(0);
                        }}
                        className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                      <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="space-y-4">
                    {usersActivityData.users && usersActivityData.users.length > 0 ? (
                      usersActivityData.users.map((userActivity, index) => (
                        <motion.div
                          key={userActivity.user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-5 rounded-xl border-2 transition-all ${
                            userActivity.suspicious_activity.is_suspicious
                              ? userActivity.suspicious_activity.level === "high"
                                ? "bg-red-50 border-red-300"
                                : userActivity.suspicious_activity.level === "medium"
                                ? "bg-yellow-50 border-yellow-300"
                                : "bg-orange-50 border-orange-300"
                              : "bg-white/50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4 flex-1">
                              {userActivity.user.avatar ? (
                                <img src={userActivity.user.avatar} alt={userActivity.user.username} className="w-12 h-12 rounded-full" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                                  {userActivity.user.username?.[0]?.toUpperCase() || "U"}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-bold text-gray-800">{userActivity.user.username}</h4>
                                  {userActivity.suspicious_activity.is_suspicious && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      userActivity.suspicious_activity.level === "high"
                                        ? "bg-red-500 text-white"
                                        : userActivity.suspicious_activity.level === "medium"
                                        ? "bg-yellow-500 text-white"
                                        : "bg-orange-500 text-white"
                                    }`}>
                                      {userActivity.suspicious_activity.level.toUpperCase()} RISK
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{userActivity.user.email}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Joined: {userActivity.user.registration_date ? new Date(userActivity.user.registration_date).toLocaleDateString() : "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-800">{userActivity.stats.total_karma}</div>
                              <div className="text-xs text-gray-500">Karma</div>
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className="grid grid-cols-4 gap-3 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-800">{userActivity.stats.posts_count}</div>
                              <div className="text-xs text-gray-500">Posts</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-800">{userActivity.stats.comments_count}</div>
                              <div className="text-xs text-gray-500">Comments</div>
                            </div>
              <div className="text-center">
                              <div className="text-lg font-semibold text-red-600">{userActivity.moderation.reports_count}</div>
                              <div className="text-xs text-gray-500">Reports</div>
              </div>
              <div className="text-center">
                              <div className="text-lg font-semibold text-orange-600">{userActivity.moderation.deleted_posts_count}</div>
                              <div className="text-xs text-gray-500">Deleted</div>
                            </div>
                          </div>

                          {/* Suspicious Activity Alerts */}
                          {userActivity.suspicious_activity.flags && userActivity.suspicious_activity.flags.length > 0 && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h5 className="font-semibold text-red-800">Suspicious Activity Detected</h5>
                                <span className="ml-auto text-sm font-bold text-red-600">
                                  Score: {userActivity.suspicious_activity.score}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {userActivity.suspicious_activity.flags.map((flag, flagIndex) => (
                                  <div key={flagIndex} className="text-sm text-red-700 flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    <span>{flag.message}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recent Activity */}
                          {userActivity.recent_posts && userActivity.recent_posts.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2">Recent Posts:</h5>
                              <div className="space-y-2">
                                {userActivity.recent_posts.map((post) => (
                                  <Link key={post.id} to={`/posts/${post.id}`} className="block text-sm text-gray-600 hover:text-primary transition-colors">
                                    • {post.title} (r/{post.community}) - {post.karma} karma
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p>No users found.</p>
                      </div>
                    )}

                    {/* Pagination */}
                    {usersActivityData.pagination && (
                      <div className="flex items-center justify-between mt-6">
                        <button
                          onClick={() => setUsersPage(Math.max(0, usersPage - 1))}
                          disabled={usersPage === 0}
                          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {usersPage + 1} of {Math.ceil((usersActivityData.pagination.total || 0) / usersLimit)}
                        </span>
                        <button
                          onClick={() => setUsersPage(usersPage + 1)}
                          disabled={!usersActivityData.pagination.has_more}
                          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : usersActivityError ? (
                <div className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-700 font-semibold mb-2">Unable to load users activity data</p>
                    <p className="text-sm text-red-600 mb-4">
                      {usersActivityError?.response?.data?.message || "An error occurred. Please try again."}
                    </p>
                    <button
                      onClick={() => refetchUsersActivity()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Unable to load users activity data. Please try again.</p>
                  <button
                    onClick={() => refetchUsersActivity()}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )
            ) : activityLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activityData ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 text-center border border-primary/20"
                  >
                    <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                      {activityData.stats?.posts_count || 0}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Posts</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.75 }}
                    className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-4 text-center border border-accent/20"
                  >
                    <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                      {activityData.stats?.comments_count || 0}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Comments</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-4 text-center border border-green-500/20"
                  >
                    <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                      {activityData.stats?.communities_joined || 0}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Communities</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.85 }}
                    className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-2xl p-4 text-center border border-yellow-500/20"
                  >
                    <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                      {activityData.stats?.saved_posts_count || 0}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Saved</div>
                  </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
                  {[
                    { id: "overview", label: "Overview", icon: "📊" },
                    { id: "posts", label: "Posts", icon: "📝" },
                    { id: "comments", label: "Comments", icon: "💬" },
                    { id: "communities", label: "Communities", icon: "🏘️" },
                    { id: "saved", label: "Saved", icon: "⭐" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? "bg-gradient-primary text-white shadow-lg"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === "overview" && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity Timeline</h4>
                      {activityData.timeline && activityData.timeline.length > 0 ? (
                        <div className="space-y-3">
                          {activityData.timeline.map((item, index) => (
                            <motion.div
                              key={`${item.type}-${item.id}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 hover:bg-white/70 transition-colors border border-gray-200"
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                item.type === "post" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
                              }`}>
                                {item.type === "post" ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-semibold text-gray-500 uppercase">
                                    {item.type === "post" ? "Post" : "Comment"}
                                  </span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">
                                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                                  </span>
                                </div>
                                {item.type === "post" ? (
                                  <>
                                    <Link to={item.url} className="block">
                                      <h5 className="font-semibold text-gray-800 hover:text-primary transition-colors truncate">
                                        {item.title}
                                      </h5>
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</p>
                                      <span className="text-xs text-primary mt-1 inline-block">r/{item.community}</span>
                                    </Link>
                                  </>
                                ) : (
                                  <>
                                    <Link to={item.url} className="block">
                                      <p className="text-sm text-gray-700 line-clamp-2">{item.content}</p>
                                      <span className="text-xs text-gray-500 mt-1 inline-block">on: {item.post_title}</span>
                                    </Link>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>No recent activity yet. Start engaging with the community!</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "posts" && (
                    <motion.div
                      key="posts"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {activityData.recent_posts && activityData.recent_posts.length > 0 ? (
                        activityData.recent_posts.map((post, index) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-xl bg-white/50 hover:bg-white/70 transition-colors border border-gray-200"
                          >
                            <Link to={post.url} className="block">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-800 hover:text-primary transition-colors mb-2">
                                    {post.title}
                                  </h5>
                                  {post.content && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.content}</p>
                                  )}
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span className="text-primary">r/{post.community}</span>
                                    <span>•</span>
                                    <span>👍 {post.karma} karma</span>
                                    <span>•</span>
                                    <span>💬 {post.comments_count} comments</span>
                                    <span>•</span>
                                    <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}</span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>You haven't created any posts yet.</p>
                          <Link to="/home" className="text-primary hover:underline mt-2 inline-block">
                            Create your first post
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "comments" && (
                    <motion.div
                      key="comments"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {activityData.recent_comments && activityData.recent_comments.length > 0 ? (
                        activityData.recent_comments.map((comment, index) => (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-xl bg-white/50 hover:bg-white/70 transition-colors border border-gray-200"
                          >
                            <Link to={comment.url} className="block">
                              <p className="text-sm text-gray-700 mb-2 line-clamp-3">{comment.content}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="font-medium text-gray-700">on: {comment.post_title}</span>
                                <span>•</span>
                                <span>👍 {comment.karma} karma</span>
                                <span>•</span>
                                <span>{comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ""}</span>
                              </div>
                            </Link>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>You haven't made any comments yet.</p>
                          <Link to="/home" className="text-primary hover:underline mt-2 inline-block">
                            Start commenting
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "communities" && (
                    <motion.div
                      key="communities"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {activityData.communities && activityData.communities.length > 0 ? (
                        activityData.communities.map((community, index) => (
                          <motion.div
                            key={community.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-xl bg-white/50 hover:bg-white/70 transition-colors border border-gray-200"
                          >
                            <Link to={community.url} className="block">
                              <div className="flex items-center space-x-3 mb-2">
                                {community.logo ? (
                                  <img src={community.logo} alt={community.name} className="w-10 h-10 rounded-full" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                                    {community.name?.[0]?.toUpperCase() || "C"}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-gray-800 hover:text-primary transition-colors truncate">
                                    {community.title}
                                  </h5>
                                  <p className="text-xs text-gray-500 truncate">{community.name}</p>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                👥 {community.members_count} members
                              </div>
                            </Link>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12 text-gray-500">
                          <p>You haven't joined any communities yet.</p>
                          <Link to="/find" className="text-primary hover:underline mt-2 inline-block">
                            Explore communities
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "saved" && (
                    <motion.div
                      key="saved"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {activityData.saved_posts && activityData.saved_posts.length > 0 ? (
                        activityData.saved_posts.map((post, index) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-xl bg-white/50 hover:bg-white/70 transition-colors border border-gray-200"
                          >
                            {post.url ? (
                              <Link to={post.url} className="block">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-800 hover:text-primary transition-colors mb-2">
                                      {post.title}
                                    </h5>
                                    {post.content && (
                                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.content}</p>
                                    )}
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      {post.community && <span className="text-primary">r/{post.community}</span>}
                                      {post.community && <span>•</span>}
                                      <span>👍 {post.karma} karma</span>
                                      <span>•</span>
                                      <span>⭐ Saved {post.saved_at ? new Date(post.saved_at).toLocaleDateString() : ""}</span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ) : (
                              <div className="opacity-60">
                                <h5 className="font-semibold text-gray-600 mb-2">{post.title}</h5>
                                <p className="text-xs text-gray-500">This post has been deleted</p>
                              </div>
                            )}
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>You haven't saved any posts yet.</p>
                          <Link to="/home" className="text-primary hover:underline mt-2 inline-block">
                            Browse posts to save
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : activityError ? (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                  <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-700 font-semibold mb-2">Unable to load activity data</p>
                  <p className="text-sm text-red-600 mb-4">
                    {activityError?.response?.data?.message || "An error occurred. Please try again."}
                  </p>
                  <button
                    onClick={() => refetchActivity()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Unable to load activity data. Please try again.</p>
                <button
                  onClick={() => refetchActivity()}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

