import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "../../api.js";
import Navbar from "../../components/Navbar.jsx";
import Logo from "../../components/Logo.jsx";
import PostCard from "./PostCard.jsx";
import ActionsBar from "./ActionsBar.jsx";
import CommentsList from "./CommentsList.jsx";
import CommentComposer from "./CommentComposer.jsx";
import SkeletonLoader from "./SkeletonLoader.jsx";

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const postId = parseInt(id, 10);

  // Fetch post data
  const {
    data: postData,
    isLoading: postLoading,
    error: postError,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const response = await api.get(`/api/post/${postId}`);
      return response.data.post;
    },
    enabled: !!postId && !isNaN(postId),
    retry: 1,
  });

  // Fetch comments
  const {
    data: commentsData,
    isLoading: commentsLoading,
    error: commentsError,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const response = await api.get(`/api/comments/post/${postId}`);
      return response.data;
    },
    enabled: !!postId && !isNaN(postId),
    retry: 1,
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [postId]);

  // Handle invalid post ID
  if (isNaN(postId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <Navbar />
        <Logo />
        <div className="max-w-4xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Post</h1>
            <p className="text-gray-600 mb-6">The post you're looking for doesn't exist.</p>
            <motion.button
              onClick={() => navigate("/home")}
              className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go to Home
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Loading state
  if (postLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <Navbar />
        <Logo />
        <div className="max-w-4xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-12">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  // Error state
  if (postError || !postData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 text-center border-2 border-red-200"
          >
            <h1 className="text-2xl font-bold text-red-600 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">
              {postError?.response?.data?.message || "The post you're looking for doesn't exist or has been deleted."}
            </p>
            <motion.button
              onClick={() => navigate("/home")}
              className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go to Home
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  const post = postData;
  const comments = commentsData?.comment_info || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pb-20 md:pb-0">
      <Navbar />
      <Logo />

      <div className="max-w-4xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-8 md:py-12">
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
          whileHover={{ x: -4 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </motion.button>

        {/* Main Content */}
        <main id="main-content" className="space-y-6" role="main">
          {/* Post Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <PostCard post={post} />
          </motion.div>

          {/* Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <ActionsBar post={post} />
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-2xl p-6 md:p-8 shadow-glass-lg"
          >
            <h2 className="text-2xl font-bold text-gradient mb-6">Comments</h2>

            {/* Comment Composer */}
            <div className="mb-6">
              <CommentComposer postId={postId} onCommentAdded={refetchComments} />
            </div>

            {/* Comments List */}
            {commentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : commentsError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Error loading comments. Please try again.</p>
                <motion.button
                  onClick={() => refetchComments()}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Retry
                </motion.button>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-gray-600 text-lg mb-2">No comments yet</p>
                <p className="text-gray-500 text-sm">Be the first to comment!</p>
              </div>
            ) : (
              <CommentsList comments={comments} postId={postId} onCommentUpdate={refetchComments} />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}


