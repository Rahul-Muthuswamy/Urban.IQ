/**
 * EventDetailPage Component
 * Detailed view of a single event with RSVP functionality and Azure Maps integration.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import Navbar from "../../components/Navbar.jsx";
import EditEventModal from "../../components/events/EditEventModal.jsx";
import DeleteConfirmModal from "../../components/posts/DeleteConfirmModal.jsx";
import { useAuth } from "../../hooks/useAuth.js";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const eventId = parseInt(id, 10);

  // Fetch event
  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const response = await api.get(`/api/events/${eventId}`);
      return response.data;
    },
    enabled: !!eventId && !isNaN(eventId),
    retry: 1,
  });

  // RSVP mutation
  const { mutate: updateRSVP, isPending: isRSVPPending } = useMutation({
    mutationFn: async ({ status }) => {
      if (status === null) {
        await api.delete(`/api/events/${eventId}/rsvp`);
      } else {
        await api.post(`/api/events/${eventId}/rsvp`, { status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showToast("RSVP updated successfully!", "success");
    },
    onError: (error) => {
      showToast(error.response?.data?.message || "Failed to update RSVP", "error");
    },
  });

  // Delete mutation
  const { mutate: deleteEvent, isPending: isDeletePending } = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/events");
    },
    onError: (error) => {
      showToast(error.response?.data?.message || "Failed to delete event", "error");
    },
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getAzureMapsUrl = () => {
    if (event?.address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;
    } else if (event?.pincode) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.pincode)}`;
    }
    return null;
  };

  const isOwner = user && event && user.id === event.organizer_id;

  if (isNaN(eventId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Event</h1>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
            <motion.button
              onClick={() => navigate("/events")}
              className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go to Events
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-12">
          <div className="glass rounded-2xl p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 text-center border-2 border-red-200"
          >
            <h1 className="text-2xl font-bold text-red-600 mb-4">Event Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error?.response?.data?.message || "The event you're looking for doesn't exist or has been deleted."}
            </p>
            <motion.button
              onClick={() => navigate("/events")}
              className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go to Events
            </motion.button>
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
        alt="Urban.IQ"
        className="fixed top-0 left-0 z-[100] h-6 sm:h-6 md:h-8 lg:h-10 xl:h-12 object-contain pointer-events-auto mt-5 ml-5"
      />

      <div className="max-w-4xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-8 md:py-12">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
          whileHover={{ x: -4 }}
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </motion.button>

        {/* Event Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 md:p-8 shadow-glass-lg mb-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{event.title}</h1>
              {event.community && (
                <Link
                  to={`/community/${event.community.name}`}
                  className="inline-flex items-center space-x-2 text-primary hover:text-accent transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold">r/{event.community.name}</span>
                </Link>
              )}
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 rounded-lg glass hover:bg-white/40 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Edit event"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </motion.button>
                <motion.button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 rounded-lg glass hover:bg-red-50 transition-colors text-red-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Delete event"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-lg max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Date and Time */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-primary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-800">{formatDate(event.start_time)}</p>
                <p className="text-gray-600">
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                </p>
              </div>
            </div>

            {/* Location */}
            {(event.address || event.pincode) && (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-primary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-800">
                    {event.address || `Pincode: ${event.pincode}`}
                  </p>
                  {getAzureMapsUrl() && (
                    <a
                      href={getAzureMapsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-accent transition-colors inline-flex items-center space-x-1 mt-1"
                    >
                      <span>Open in Maps</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RSVP Section */}
          {event.status === "published" && isAuthenticated && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">RSVP</h3>
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={() => updateRSVP({ status: event.user_rsvp === "going" ? null : "going" })}
                  disabled={isRSVPPending}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                    event.user_rsvp === "going"
                      ? "bg-primary text-white shadow-lg"
                      : "glass text-gray-700 hover:bg-white/40"
                  } disabled:opacity-50`}
                  whileHover={{ scale: isRSVPPending ? 1 : 1.05 }}
                  whileTap={{ scale: isRSVPPending ? 1 : 0.95 }}
                  aria-label={event.user_rsvp === "going" ? "Remove going RSVP" : "RSVP as going"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{event.user_rsvp === "going" ? "Going" : "I'm Going"}</span>
                </motion.button>

                <motion.button
                  onClick={() => updateRSVP({ status: event.user_rsvp === "interested" ? null : "interested" })}
                  disabled={isRSVPPending}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                    event.user_rsvp === "interested"
                      ? "bg-primary text-white shadow-lg"
                      : "glass text-gray-700 hover:bg-white/40"
                  } disabled:opacity-50`}
                  whileHover={{ scale: isRSVPPending ? 1 : 1.05 }}
                  whileTap={{ scale: isRSVPPending ? 1 : 0.95 }}
                  aria-label={event.user_rsvp === "interested" ? "Remove interested RSVP" : "RSVP as interested"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{event.user_rsvp === "interested" ? "Interested" : "Interested"}</span>
                </motion.button>
              </div>

              {/* RSVP Stats */}
              <div className="mt-4 flex items-center space-x-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">{event.rsvp_counts?.going || 0} Going</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-medium">{event.rsvp_counts?.interested || 0} Interested</span>
                </div>
              </div>
            </div>
          )}

          {event.status === "pending" && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-800">
                <strong>Pending Approval:</strong> This event is awaiting moderator approval before it can be published.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditEventModal
          event={event}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            refetch();
            showToast("Event updated successfully!", "success");
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          postTitle={event.title}
          onConfirm={() => deleteEvent()}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeletePending}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg ${
              toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center space-x-3">
              {toast.type === "success" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

