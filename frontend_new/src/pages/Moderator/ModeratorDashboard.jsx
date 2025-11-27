import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import Navbar from "../../components/Navbar.jsx";
import ReportedPostCard from "./ReportedPostCard.jsx";
import DeletePostModal from "./DeletePostModal.jsx";

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showReportsView, setShowReportsView] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Deletion filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [reporterId, setReporterId] = useState("");
  
  const perPage = 10;

  // Check authentication and moderator role
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

  // Fetch reports
  const {
    data: reportsData,
    isLoading: reportsLoading,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ["moderatorReports", statusFilter, page],
    queryFn: async () => {
      const response = await api.get("/api/mod/reports", {
        params: {
          status: statusFilter,
          page: page,
          per_page: perPage,
        },
      });
      return response.data;
    },
    enabled: !!user && (user.roles?.includes("admin") || user.roles?.includes("mod")) && showReportsView,
    retry: 1,
    refetchInterval: showReportsView ? 10000 : false, // Refetch every 10 seconds when reports view is open
  });

  // Fetch analytics
  const { data: analyticsData, refetch: refetchAnalytics } = useQuery({
    queryKey: ["moderatorAnalytics"],
    queryFn: async () => {
      const response = await api.get("/api/mod/analytics/summary");
      return response.data;
    },
    enabled: !!user && (user.roles?.includes("admin") || user.roles?.includes("mod")),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch top reported posts
  const { data: topReportedPosts, refetch: refetchTopReported } = useQuery({
    queryKey: ["topReportedPosts"],
    queryFn: async () => {
      const response = await api.get("/api/mod/analytics/top_reported_posts", {
        params: { limit: 10 },
      });
      return response.data;
    },
    enabled: !!user && (user.roles?.includes("admin") || user.roles?.includes("mod")),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch top reporters
  const { data: topReporters, refetch: refetchTopReporters } = useQuery({
    queryKey: ["topReporters"],
    queryFn: async () => {
      const response = await api.get("/api/mod/analytics/top_reporters", {
        params: { limit: 10 },
      });
      return response.data;
    },
    enabled: !!user && (user.roles?.includes("admin") || user.roles?.includes("mod")),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch deletions
  const { data: deletionsData, refetch: refetchDeletions } = useQuery({
    queryKey: ["deletions", fromDate, toDate, authorId, reporterId],
    queryFn: async () => {
      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (authorId) params.author_id = parseInt(authorId);
      if (reporterId) params.reporter_id = parseInt(reporterId);
      
      const response = await api.get("/api/mod/deletions", {
        params: { page: 1, per_page: 20, ...params },
      });
      return response.data;
    },
    enabled: !!user && (user.roles?.includes("admin") || user.roles?.includes("mod")),
  });

  // Keep post mutation
  const { mutate: keepPost, isPending: isKeepingPost } = useMutation({
    mutationFn: async (reportId) => {
      const response = await api.put(`/api/reports/${reportId}/resolve`, {
        keep_post: true,
      });
      return response.data;
    },
    onSuccess: () => {
      setSuccessMessage("Report resolved. Post kept.");
      setTimeout(() => setSuccessMessage(""), 3000);
      queryClient.invalidateQueries({ queryKey: ["moderatorReports"] });
      queryClient.invalidateQueries({ queryKey: ["moderatorAnalytics"] });
      queryClient.invalidateQueries({ queryKey: ["topReportedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["topReporters"] });
      refetchReports();
      refetchAnalytics();
      refetchTopReported();
      refetchTopReporters();
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || "Failed to resolve report");
      setTimeout(() => setErrorMessage(""), 5000);
    },
  });

  // Redirect if not authenticated or not moderator
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login", { replace: true });
    } else if (!userLoading && user && !user.roles?.includes("admin") && !user.roles?.includes("mod")) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, userLoading, navigate]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Refetch when window becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Refetch all data when user returns to the tab
        refetchAnalytics();
        if (showReportsView) {
          refetchReports();
        }
        refetchTopReported();
        refetchTopReporters();
        refetchDeletions();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [showReportsView, refetchAnalytics, refetchReports, refetchTopReported, refetchTopReporters, refetchDeletions]);

  const handleKeepPost = (reportId) => {
    if (window.confirm("Are you sure you want to keep this post and resolve the report?")) {
      keepPost(reportId);
    }
  };

  const handleDeletePost = (report) => {
    setSelectedReport(report);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setSelectedReport(null);
    queryClient.invalidateQueries({ queryKey: ["moderatorReports"] });
    queryClient.invalidateQueries({ queryKey: ["moderatorAnalytics"] });
    queryClient.invalidateQueries({ queryKey: ["deletions"] });
    queryClient.invalidateQueries({ queryKey: ["topReportedPosts"] });
    queryClient.invalidateQueries({ queryKey: ["topReporters"] });
    refetchReports();
    refetchAnalytics();
    refetchDeletions();
    refetchTopReported();
    refetchTopReporters();
  };

  const handleExportCSV = () => {
    const deletions = deletionsData?.deletions || [];
    if (deletions.length === 0) {
      alert("No deletions to export");
      return;
    }

    const headers = ["Deleted At", "Post ID", "Title", "Author", "Deleted By", "Reason", "Report ID"];
    const rows = deletions.map((d) => [
      d.deleted_at || "",
      d.post_id || "",
      d.original_title || "",
      d.original_author_username || "",
      d.deleted_by_username || "",
      d.reason || "",
      d.report_id || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `deletions_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatChartDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.getDate().toString();
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (!user.roles?.includes("admin") && !user.roles?.includes("mod"))) {
    return null;
  }

  const reports = reportsData?.reports || [];
  const totalPages = reportsData?.pages || 1;
  const totalReports = reportsData?.total || 0;
  const deletions = deletionsData?.deletions || [];

  // If showing reports view, show the reports list
  if (showReportsView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pb-20 md:pb-0">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  Moderator Dashboard
                </h1>
                <p className="text-gray-600">Review and manage reported posts</p>
              </div>
              <motion.button
                onClick={() => setShowReportsView(false)}
                className="px-4 py-2 rounded-xl glass text-gray-700 font-semibold hover:bg-white/40 transition-all duration-300 flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Success/Error Messages */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700"
              >
                {successMessage}
              </motion.div>
            )}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
              >
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 mb-6 shadow-glass-lg"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setStatusFilter("pending")}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      statusFilter === "pending"
                        ? "bg-yellow-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Pending ({analyticsData?.pending_reports || 0})
                  </button>
                  <button
                    onClick={() => setStatusFilter("resolved")}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      statusFilter === "resolved"
                        ? "bg-green-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Resolved ({analyticsData?.resolved_reports || 0})
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Showing {reports.length} of {totalReports} reports
              </div>
            </div>
          </motion.div>

          {/* Reports List */}
          {reportsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-12 text-center shadow-glass-lg"
            >
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Reports Found</h3>
              <p className="text-gray-600">
                {statusFilter === "pending"
                  ? "All reports have been resolved. Great job!"
                  : "No resolved reports yet."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {reports.map((report, index) => (
                  <ReportedPostCard
                    key={report.id}
                    report={report}
                    onKeep={() => handleKeepPost(report.id)}
                    onDelete={() => handleDeletePost(report)}
                    isKeeping={isKeepingPost}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center space-x-2 mt-8"
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl glass text-gray-700 font-semibold hover:bg-white/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl glass text-gray-700 font-semibold hover:bg-white/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </motion.div>
          )}
        </div>

        {/* Delete Post Modal */}
        {showDeleteModal && selectedReport && (
          <DeletePostModal
            report={selectedReport}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedReport(null);
            }}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pb-20 md:pb-0">
      <Navbar />
        <img src='/assets/7_remove_bg.png' alt='urban_iq' className='fixed top-0 left-20 md:left-0 z-[100] h-6 sm:h-6 md:h-8 lg:h-10 xl:h-12 object-contain pointer-events-auto mt-5 md:ml-5'></img>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Moderator Dashboard
            </h1>
            <motion.button
              onClick={() => setShowReportsView(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>View Reports</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Analytics Cards */}
        {analyticsData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass rounded-2xl p-6 shadow-glass-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Reports</h3>
              <p className="text-3xl font-bold text-red-600">{analyticsData.total_reports || 0}</p>
            </div>

            <div className="glass rounded-2xl p-6 shadow-glass-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Reports</h3>
              <p className="text-3xl font-bold text-red-600">{analyticsData.pending_reports || 0}</p>
            </div>

            <div className="glass rounded-2xl p-6 shadow-glass-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Resolved Reports</h3>
              <p className="text-3xl font-bold text-green-600">{analyticsData.resolved_reports || 0}</p>
            </div>

            <div className="glass rounded-2xl p-6 shadow-glass-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Deletions</h3>
              <p className="text-3xl font-bold text-gray-800">{analyticsData.total_deletions || 0}</p>
            </div>
          </motion.div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Reports Last 7 Days */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 shadow-glass-lg"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reports Last 7 Days</h3>
            <div className="h-48 flex items-end justify-between space-x-2">
              {analyticsData?.reports_last_7_days?.length > 0 ? (
                analyticsData.reports_last_7_days.map((item, index) => {
                  const maxCount = Math.max(...analyticsData.reports_last_7_days.map((d) => d.count), 1);
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-orange-500 rounded-t-lg transition-all hover:bg-orange-600"
                        style={{ height: `${height}%`, minHeight: item.count > 0 ? "4px" : "0" }}
                        title={`${item.count} reports on ${formatChartDate(item.date)}`}
                      />
                      <span className="text-xs text-gray-600 mt-2">{formatChartDate(item.date)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-gray-500 py-8">No data available</div>
              )}
            </div>
          </motion.div>

          {/* Deletions Last 7 Days */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6 shadow-glass-lg"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Deletions Last 7 Days</h3>
            <div className="h-48 flex items-end justify-between space-x-2">
              {analyticsData?.deletions_last_7_days?.length > 0 ? (
                analyticsData.deletions_last_7_days.map((item, index) => {
                  const maxCount = Math.max(...analyticsData.deletions_last_7_days.map((d) => d.count), 1);
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-red-500 rounded-t-lg transition-all hover:bg-red-600"
                        style={{ height: `${height}%`, minHeight: item.count > 0 ? "4px" : "0" }}
                        title={`${item.count} deletions on ${formatChartDate(item.date)}`}
                      />
                      <span className="text-xs text-gray-600 mt-2">{formatChartDate(item.date)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-gray-500 py-8">No data available</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Top Reported Posts and Top Reporters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Top Reported Posts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6 shadow-glass-lg"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Reported Posts</h3>
            <div className="space-y-3">
              {topReportedPosts && topReportedPosts.length > 0 ? (
                topReportedPosts.map((item) => (
                  <div key={item.post_id} className="flex items-center justify-between">
                    <Link
                      to={`/posts/${item.post_id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium flex-1 truncate"
                    >
                      {item.title}
                    </Link>
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                      {item.report_count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No reported posts yet</p>
              )}
            </div>
          </motion.div>

          {/* Top Reporters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6 shadow-glass-lg"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Reporters</h3>
            <div className="space-y-3">
              {topReporters && topReporters.length > 0 ? (
                topReporters.map((item) => (
                  <div key={item.reporter_id} className="flex items-center justify-between">
                    <Link
                      to={`/user/${item.username}`}
                      className="text-blue-600 hover:text-blue-800 font-medium flex-1"
                    >
                      u/{item.username}
                    </Link>
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                      {item.reports_count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No reporters yet</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Deletions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-6 shadow-glass-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Recent Deletions</h3>
            <motion.button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Export CSV
            </motion.button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author ID</label>
              <input
                type="number"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                placeholder="Filter by author"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporter ID</label>
              <input
                type="number"
                value={reporterId}
                onChange={(e) => setReporterId(e.target.value)}
                placeholder="Filter by reporter"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Deletions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Deleted At</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Post ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Author</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Deleted By</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reason</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Report ID</th>
                </tr>
              </thead>
              <tbody>
                {deletions.length > 0 ? (
                  deletions.map((deletion) => (
                    <tr key={deletion.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {deletion.deleted_at
                          ? new Date(deletion.deleted_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{deletion.post_id}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 truncate max-w-xs">
                        {deletion.original_title || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {deletion.original_author_username || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {deletion.deleted_by_username || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-xs">
                        {deletion.reason || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{deletion.report_id || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No deletions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Delete Post Modal */}
      {showDeleteModal && selectedReport && (
        <DeletePostModal
          report={selectedReport}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedReport(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
