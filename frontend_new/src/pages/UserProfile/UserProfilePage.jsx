import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api.js";
import Navbar from "../../components/Navbar.jsx";
import ProfileSidebar from "./ProfileSidebar.jsx";
import UserProfileContent from "./UserProfileContent.jsx";
import UpdateProfileModal from "./UpdateProfileModal.jsx";
import ChangePasswordModal from "./ChangePasswordModal.jsx";
import DeleteAccountModal from "./DeleteAccountModal.jsx";
import MessageModal from "./MessageModal.jsx";

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { username } = useParams();
  const queryClient = useQueryClient();
  const [action, setAction] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Determine if viewing own profile or another user's profile
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

  const isOwnProfile = !username || (currentUser && currentUser.username === username);
  const profileUsername = username || currentUser?.username;

  // Fetch profile user data
  const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useQuery({
    queryKey: ["userProfile", profileUsername],
    queryFn: async () => {
      try {
        console.log(`[UserProfilePage] Fetching user profile for: ${profileUsername}`);
        const response = await api.get(`/api/user/${profileUsername}`);
        console.log(`[UserProfilePage] User data received:`, response.data);
        return response.data;
      } catch (error) {
        console.error("[UserProfilePage] Error fetching user:", error);
        throw error;
      }
    },
    enabled: !!profileUsername,
    retry: false,
  });

  // Log when user data changes
  useEffect(() => {
    if (user) {
      console.log("[UserProfilePage] User data updated:", {
        username: user.username,
        bio: user.bio,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
      });
    }
  }, [user]);

  // Handle action selection
  useEffect(() => {
    if (action === "update-profile") {
      setShowUpdateModal(true);
      setAction(null);
    } else if (action === "change-password") {
      setShowPasswordModal(true);
      setAction(null);
    } else if (action === "delete-account") {
      setShowDeleteModal(true);
      setAction(null);
    } else if (action === "message") {
      setShowMessageModal(true);
      setAction(null);
    }
  }, [action]);

  // Redirect if not authenticated and viewing own profile
  useEffect(() => {
    if (!userLoading && isOwnProfile && !currentUser) {
      navigate("/login", { replace: true });
    }
  }, [currentUser, userLoading, isOwnProfile, navigate]);

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

  if (userError || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              Go Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pb-20 md:pb-0">
      <Navbar />
      <img
        src="/assets/7_remove_bg.png"
        alt="urban_iq"
        className="fixed top-0 left-0 z-[100] h-6 sm:h-6 md:h-8 lg:h-10 xl:h-12 object-contain pointer-events-auto mt-5 ml-5"
      />

      <div className="max-w-7xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row gap-6 md:gap-8"
        >
          {/* Left Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-80 flex-shrink-0"
          >
            <ProfileSidebar
              key={`sidebar-${user?.username}-${user?.avatar}`}
              user={user}
              isOwnProfile={isOwnProfile}
              onActionSelect={setAction}
            />
          </motion.aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            <UserProfileContent key={`content-${user?.username}-${user?.bio}`} user={user} />
          </motion.main>
        </motion.div>
      </div>

      {/* Modals */}
      {showUpdateModal && isOwnProfile && (
        <UpdateProfileModal
          user={user}
          profileUsername={profileUsername}
          onClose={async () => {
            setShowUpdateModal(false);
            // Additional refetch after modal closes to ensure UI is updated
            console.log("[UserProfilePage] Modal closed, refetching user data...");
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["userProfile", profileUsername] }),
              queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
            ]);
            // Explicitly refetch the user profile
            await refetchUser();
            // Also refetch current user
            await queryClient.refetchQueries({ queryKey: ["currentUser"] });
            console.log("[UserProfilePage] User data refetched");
          }}
        />
      )}

      {showPasswordModal && isOwnProfile && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
        />
      )}

      {showDeleteModal && isOwnProfile && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            setShowDeleteModal(false);
            navigate("/login", { replace: true });
          }}
        />
      )}

      {showMessageModal && !isOwnProfile && (
        <MessageModal
          receiverUsername={user.username}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
}
