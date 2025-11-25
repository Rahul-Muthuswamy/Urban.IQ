import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api.js";
import Navbar from "../../components/Navbar.jsx";
import ProfileSidebar from "./ProfileSidebar.jsx";
import ProfileForm from "./ProfileForm.jsx";
import ChangePasswordForm from "./ChangePasswordForm.jsx";

export default function UserProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("account-settings");

  // Fetch current user data
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/user");
        return response.data;
      } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
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

  // Show loading state
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
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
          className="flex flex-col lg:flex-row gap-6 md:gap-8"
        >
          {/* Left Sidebar - Profile Navigation */}
          <motion.aside
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-80 flex-shrink-0"
          >
            <ProfileSidebar
              user={user}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </motion.aside>

          {/* Right Main Content */}
          <motion.main
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-6">
                Account Settings
              </h1>

              <div className="space-y-6">
                {/* Personal Information Section */}
                <ProfileForm user={user} />

                {/* Change Password Section */}
                <ChangePasswordForm />
              </div>
            </motion.div>
          </motion.main>
        </motion.div>
      </div>
    </div>
  );
}

