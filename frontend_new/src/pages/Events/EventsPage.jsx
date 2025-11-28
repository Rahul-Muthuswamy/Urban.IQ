/**
 * EventsPage Component
 * Main page for listing all published events.
 * Includes filters, search, and create event button.
 */
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../api.js";
import Navbar from "../../components/Navbar.jsx";
import EventCard from "../../components/EventCard.jsx";
import CreateEventModal from "../../components/events/CreateEventModal.jsx";
import { useAuth } from "../../hooks/useAuth.js";

export default function EventsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  const [communityFilter, setCommunityFilter] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Fetch events
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["events", filter, communityFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "published" });
      if (communityFilter) {
        params.append("community_id", communityFilter);
      }
      
      const response = await api.get(`/api/events?${params.toString()}`);
      // Normalize to ensure we always get an array
      let eventsData = Array.isArray(response.data) ? response.data : [];
      
      // Filter by time
      const now = new Date();
      if (filter === "upcoming") {
        eventsData = eventsData.filter((e) => new Date(e.start_time) > now);
      } else if (filter === "past") {
        eventsData = eventsData.filter((e) => new Date(e.end_time) < now);
      }
      
      return eventsData;
    },
    retry: 1,
  });

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // Handle event creation success
  const handleEventCreated = () => {
    setShowCreateModal(false);
    showToast("Event created! It will be published after moderator approval.", "success");
    queryClient.invalidateQueries({ queryKey: ["events"] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
      <Navbar />
      <img
        src="/assets/7_remove_bg.png"
        alt="Urban.IQ"
        className="fixed top-0 left-0 z-[100] h-6 sm:h-6 md:h-8 lg:h-10 xl:h-12 object-contain pointer-events-auto mt-5 ml-5"
      />

      <div className="max-w-6xl mx-auto pt-20 md:pt-28 px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Events & Meetups</h1>
              <p className="text-gray-600">Discover and join community events near you</p>
            </div>
            
            {isAuthenticated && (
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow-lg transition-all flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Create new event"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Event</span>
              </motion.button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === "all"
                  ? "bg-primary text-white shadow-lg"
                  : "glass text-gray-700 hover:bg-white/40"
              }`}
              aria-label="Show all events"
              aria-pressed={filter === "all"}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === "upcoming"
                  ? "bg-primary text-white shadow-lg"
                  : "glass text-gray-700 hover:bg-white/40"
              }`}
              aria-label="Show upcoming events"
              aria-pressed={filter === "upcoming"}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("past")}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === "past"
                  ? "bg-primary text-white shadow-lg"
                  : "glass text-gray-700 hover:bg-white/40"
              }`}
              aria-label="Show past events"
              aria-pressed={filter === "past"}
            >
              Past
            </button>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 text-center border-2 border-red-200"
          >
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Events</h2>
            <p className="text-gray-600 mb-6">{error.message || "Failed to load events. Please try again."}</p>
            <motion.button
              onClick={() => refetch()}
              className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Retry
            </motion.button>
          </motion.div>
        )}

        {/* Events List */}
        {!isLoading && !error && (
          <>
            {Array.isArray(events) && events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-12 text-center"
              >
                <svg
                  className="w-16 h-16 mx-auto text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No Events Found</h2>
                <p className="text-gray-600 mb-6">
                  {filter === "upcoming"
                    ? "There are no upcoming events at the moment."
                    : filter === "past"
                    ? "No past events found."
                    : "No events have been published yet."}
                </p>
                {isAuthenticated && (
                  <motion.button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create First Event
                  </motion.button>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleEventCreated}
        />
      )}

      {/* Toast Notification */}
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

