import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import ReportedPostCard from "./ReportedPostCard.jsx";
import DeletePostModal from "./DeletePostModal.jsx";

export default function ReportManagement() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const perPage = 10;

  // Fetch reports
  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
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
    retry: 1,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Resolve report mutation (mark as resolved without deleting post)
  const { mutate: resolveReport, isPending: isResolving } = useMutation({
    mutationFn: async (reportId) => {
      const response = await api.put(`/api/reports/${reportId}/resolve`);
      return response.data;
    },
    onSuccess: () => {
      setSuccessMessage("Report resolved successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      refetchReports();
      queryClient.invalidateQueries({ queryKey: ["moderatorAnalytics"] });
      queryClient.invalidateQueries({ queryKey: ["topReportedPosts"] });
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || "Failed to resolve report");
      setTimeout(() => setErrorMessage(""), 3000);
    },
  });

  // Delete post mutation
  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async ({ postId, reason }) => {
      const response = await api.delete(`/api/mod/posts/${postId}`, {
        data: { reason },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      setSuccessMessage("Post deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      setShowDeleteModal(false);
      setSelectedReport(null);
      refetchReports();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["moderatorAnalytics"] });
      queryClient.invalidateQueries({ queryKey: ["topReportedPosts"] });
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || "Failed to delete post");
      setTimeout(() => setErrorMessage(""), 3000);
    },
  });

  const handleKeepPost = (report) => {
    resolveReport(report.id);
  };

  const handleDeletePost = (report) => {
    setSelectedReport(report);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = (reason) => {
    if (selectedReport) {
      deletePost({ postId: selectedReport.post_id, reason });
    }
  };

  const reports = reportsData?.reports || [];
  const totalPages = reportsData?.pages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Report Management</h2>
          <p className="text-gray-600 mt-1">Review and moderate reported posts</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3"
          >
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-700 font-medium">{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
          >
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-medium">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 glass rounded-xl p-2">
        <button
          onClick={() => {
            setStatusFilter("pending");
            setPage(1);
          }}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
            statusFilter === "pending"
              ? "bg-white text-primary shadow-glass"
              : "text-gray-600 hover:bg-white/50"
          }`}
        >
          Pending Reports
          {statusFilter === "pending" && reports.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
              {reportsData?.total || reports.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setStatusFilter("resolved");
            setPage(1);
          }}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
            statusFilter === "resolved"
              ? "bg-white text-primary shadow-glass"
              : "text-gray-600 hover:bg-white/50"
          }`}
        >
          Resolved Reports
        </button>
      </div>

      {/* Reports List */}
      {reportsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      ) : reportsError ? (
        <div className="glass rounded-2xl p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Reports</h3>
          <p className="text-gray-600 mb-4">{reportsError.message || "Failed to load reports"}</p>
          <button
            onClick={() => refetchReports()}
            className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:shadow-glow transition-all"
          >
            Try Again
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {statusFilter === "pending" ? "No Pending Reports" : "No Resolved Reports"}
          </h3>
          <p className="text-gray-600">
            {statusFilter === "pending"
              ? "Great job! All reports have been reviewed."
              : "No resolved reports to display."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reports.map((report, index) => (
              <ReportedPostCard
                key={report.id}
                report={report}
                index={index}
                onKeep={() => handleKeepPost(report)}
                onDelete={() => handleDeletePost(report)}
                isKeeping={isResolving}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl glass font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 transition-all"
              >
                Previous
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                        page === pageNum
                          ? "bg-primary text-white shadow-glass"
                          : "glass hover:bg-white/50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-gray-500">...</span>}
                {totalPages > 5 && (
                  <button
                    onClick={() => setPage(totalPages)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      page === totalPages
                        ? "bg-primary text-white shadow-glass"
                        : "glass hover:bg-white/50"
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl glass font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedReport && (
        <DeletePostModal
          report={selectedReport}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedReport(null);
          }}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
