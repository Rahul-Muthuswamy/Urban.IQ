/**
 * EventCard Component
 * Displays a single event in a card format with all relevant information.
 * Includes accessibility features for screen readers.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function EventCard({ event }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = date - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return "Past event";
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Tomorrow";
      if (diffDays < 7) return `In ${diffDays} days`;
      
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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

  const statusBadge = {
    pending: { text: "Pending Approval", color: "bg-yellow-100 text-yellow-800" },
    published: { text: "Published", color: "bg-green-100 text-green-800" },
    rejected: { text: "Rejected", color: "bg-red-100 text-red-800" },
  }[event.status] || { text: event.status, color: "bg-gray-100 text-gray-800" };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 shadow-glass-lg hover:shadow-glass-xl transition-all duration-300"
      role="article"
      aria-labelledby={`event-title-${event.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            to={`/events/${event.id}`}
            className="block group"
            aria-label={`View event: ${event.title}`}
          >
            <h3
              id={`event-title-${event.id}`}
              className="text-xl md:text-2xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors"
            >
              {event.title}
            </h3>
          </Link>
          
          {/* Community Badge */}
          {event.community && (
            <Link
              to={`/community/${event.community.name}`}
              className="inline-flex items-center space-x-2 text-sm text-primary hover:text-accent transition-colors mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>r/{event.community.name}</span>
            </Link>
          )}
        </div>
        
        {/* Status Badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}
          aria-label={`Event status: ${statusBadge.text}`}
        >
          {statusBadge.text}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 line-clamp-3" aria-label="Event description">
        {event.description}
      </p>

      {/* Date and Time */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">
            {formatDate(event.start_time)} • {formatTime(event.start_time)} - {formatTime(event.end_time)}
          </span>
        </div>

        {/* Location */}
        {(event.address || event.pincode) && (
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">
              {event.address || `Pincode: ${event.pincode}`}
            </span>
          </div>
        )}
      </div>

      {/* RSVP Stats */}
      {event.status === "published" && (
        <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-medium">
              {event.rsvp_counts?.going || 0} Going
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-medium">
              {event.rsvp_counts?.interested || 0} Interested
            </span>
          </div>
        </div>
      )}

      {/* User RSVP Status */}
      {event.user_rsvp && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>You're {event.user_rsvp === "going" ? "Going" : "Interested"}</span>
          </span>
        </div>
      )}
    </motion.article>
  );
}


