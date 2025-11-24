import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "../api.js";

export default function VoteButtons({ postId, initialVote, initialKarma }) {
  const [vote, setVote] = useState(initialVote);
  const [karma, setKarma] = useState(initialKarma || 0);
  const queryClient = useQueryClient();

  const { mutate: handleVote } = useMutation({
    mutationFn: async ({ isUpvote, shouldDelete }) => {
      if (shouldDelete) {
        await api.delete(`/api/reactions/post/${postId}`);
      } else if (vote === null) {
        // Create new reaction
        await api.put(`/api/reactions/post/${postId}`, { is_upvote: isUpvote });
      } else {
        // Update existing reaction
        await api.patch(`/api/reactions/post/${postId}`, { is_upvote: isUpvote });
      }
    },
    onMutate: async ({ isUpvote, shouldDelete }) => {
      // Optimistic update
      const previousVote = vote;
      const previousKarma = karma;

      if (shouldDelete) {
        setVote(null);
        setKarma((prev) => prev + (previousVote ? 1 : -1));
      } else {
        const newVote = isUpvote;
        if (previousVote === null) {
          setVote(newVote);
          setKarma((prev) => prev + (newVote ? 1 : -1));
        } else if (previousVote !== newVote) {
          setVote(newVote);
          setKarma((prev) => prev + (newVote ? 2 : -2));
        } else {
          // Same vote clicked - remove vote
          setVote(null);
          setKarma((prev) => prev + (newVote ? -1 : 1));
        }
      }

      return { previousVote, previousKarma };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context) {
        setVote(context.previousVote);
        setKarma(context.previousKarma);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const handleUpvote = () => {
    if (vote === true) {
      handleVote({ isUpvote: true, shouldDelete: true });
    } else {
      handleVote({ isUpvote: true, shouldDelete: false });
    }
  };

  const handleDownvote = () => {
    if (vote === false) {
      handleVote({ isUpvote: false, shouldDelete: true });
    } else {
      handleVote({ isUpvote: false, shouldDelete: false });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <motion.button
        onClick={handleUpvote}
        className={`p-2 rounded-full transition-all duration-300 ${
          vote === true
            ? "bg-primary/20 text-primary"
            : "bg-white/50 text-gray-600 hover:bg-primary/10 hover:text-primary"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Upvote"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </motion.button>

      <motion.span
        className="text-sm font-semibold text-gray-700"
        animate={{ scale: vote !== null ? 1.2 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {karma} Vote{karma !== 1 ? "s" : ""}
      </motion.span>

      <motion.button
        onClick={handleDownvote}
        className={`p-2 rounded-full transition-all duration-300 ${
          vote === false
            ? "bg-primary/20 text-primary"
            : "bg-white/50 text-gray-600 hover:bg-primary/10 hover:text-primary"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Downvote"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </motion.button>
    </div>
  );
}

