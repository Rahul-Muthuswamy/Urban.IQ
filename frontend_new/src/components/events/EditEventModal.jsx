/**
 * EditEventModal Component
 * Modal for editing existing events with full accessibility support.
 */
import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";

export default function EditEventModal({ event, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    start_time: event?.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : "",
    end_time: event?.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : "",
    pincode: event?.pincode || "",
    address: event?.address || "",
    community_id: event?.community_id || "",
  });
  const [errors, setErrors] = useState({});

  // Fetch communities for dropdown
  // Use the same pattern as LeftSidebar.jsx to ensure consistency
  const { data: communitiesData, isLoading: communitiesLoading, error: communitiesError } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/threads");
        // Return the full response data object (same as LeftSidebar)
        return response.data;
      } catch (error) {
        console.error("[EditEventModal] Error fetching communities:", error);
        // Return empty object structure on error to prevent crashes
        return { subscribed: [], all: [], popular: [] };
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Extract all communities from the response (same pattern as LeftSidebar)
  // Ensure it's always an array
  const allCommunities = communitiesData?.all || [];
  const safeCommunities = Array.isArray(allCommunities) ? allCommunities : [];

  // Focus trap
  useEffect(() => {
    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener("keydown", handleTabKey);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
    return () => {
      if (modal) modal.removeEventListener("keydown", handleTabKey);
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, isPending]);

  // Update mutation
  const { mutate: updateEvent, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await api.patch(`/api/events/${event.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Failed to update event. Please try again.";
      setErrors({ submit: errorMessage });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.start_time) newErrors.start_time = "Start time is required";
    if (!formData.end_time) newErrors.end_time = "End time is required";
    if (!formData.community_id) newErrors.community_id = "Community is required";

    if (formData.start_time && formData.end_time) {
      if (new Date(formData.end_time) <= new Date(formData.start_time)) {
        newErrors.end_time = "End time must be after start time";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      ...formData,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      community_id: parseInt(formData.community_id),
    };

    updateEvent(submitData);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-event-title"
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 id="edit-event-title" className="text-2xl font-bold text-gray-800">
              Edit Event
            </h2>
            <button
              onClick={onClose}
              disabled={isPending}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="edit-title" className="block text-sm font-semibold text-gray-700 mb-2">
                Event Title <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                ref={firstInputRef}
                id="edit-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={200}
                className={`w-full bg-gray-100 rounded-xl p-4 border ${
                  errors.title ? "border-red-500" : "border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-primary/50`}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "edit-title-error" : undefined}
              />
              {errors.title && (
                <p id="edit-title-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500" aria-label="required">*</span>
              </label>
              <textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                maxLength={5000}
                className={`w-full bg-gray-100 rounded-xl p-4 resize-none border ${
                  errors.description ? "border-red-500" : "border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-primary/50`}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? "edit-description-error" : undefined}
              />
              {errors.description && (
                <p id="edit-description-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-community" className="block text-sm font-semibold text-gray-700 mb-2">
                Community <span className="text-red-500" aria-label="required">*</span>
              </label>
              <select
                id="edit-community"
                name="community_id"
                value={formData.community_id}
                onChange={handleChange}
                required
                className={`w-full bg-gray-100 rounded-xl p-4 border ${
                  errors.community_id ? "border-red-500" : "border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-primary/50`}
                aria-invalid={!!errors.community_id}
              >
                <option value="">Select a community</option>
                {safeCommunities.length > 0 ? (
                  safeCommunities.map((community) => (
                    <option key={community.id} value={community.id}>
                      r/{community.name} - {community.title}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {communitiesLoading ? "Loading communities..." : communitiesError ? "Error loading communities" : "No communities available"}
                  </option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-start-time" className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Time <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="edit-start-time"
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  className={`w-full bg-gray-100 rounded-xl p-4 border ${
                    errors.start_time ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  aria-invalid={!!errors.start_time}
                />
                {errors.start_time && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.start_time}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="edit-end-time" className="block text-sm font-semibold text-gray-700 mb-2">
                  End Time <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="edit-end-time"
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  className={`w-full bg-gray-100 rounded-xl p-4 border ${
                    errors.end_time ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  aria-invalid={!!errors.end_time}
                />
                {errors.end_time && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.end_time}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-pincode" className="block text-sm font-semibold text-gray-700 mb-2">
                  Pincode (Optional)
                </label>
                <input
                  id="edit-pincode"
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={20}
                  className="w-full bg-gray-100 rounded-xl p-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label htmlFor="edit-address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Address (Optional)
                </label>
                <input
                  id="edit-address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  maxLength={500}
                  className="w-full bg-gray-100 rounded-xl p-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm" role="alert">
                {errors.submit}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={isPending}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
                whileHover={{ scale: isPending ? 1 : 1.05 }}
                whileTap={{ scale: isPending ? 1 : 0.95 }}
              >
                {isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </motion.div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Event</span>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

