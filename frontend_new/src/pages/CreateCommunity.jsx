import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";
import Navbar from "../components/Navbar.jsx";
import Logo from "../components/Logo.jsx";
import CommunityForm from "../components/CommunityForm.jsx";
import SuccessModal from "../components/SuccessModal.jsx";

export default function CreateCommunity() {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCommunity, setCreatedCommunity] = useState(null);

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, userLoading, navigate]);

  const handleSuccess = (communityData) => {
    setCreatedCommunity(communityData);
    setShowSuccessModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to the community page or home
    if (createdCommunity?.subthread?.name) {
      navigate(`/${createdCommunity.subthread.name}`, { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  };

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
      <Logo />

      <div className="max-w-3xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-8 md:py-12">
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
              Create Community
            </h1>
            <p className="text-lg text-gray-600">
              Start a new community and bring people together
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <CommunityForm onSuccess={handleSuccess} />
          </motion.div>
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <SuccessModal
            community={createdCommunity}
            onClose={handleModalClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


