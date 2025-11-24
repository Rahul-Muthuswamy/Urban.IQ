import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "../../api.js";

export default function CommentVoteButtons({ commentId, initialVote, initialKarma }) {
  const queryClient = useQueryClient();
  const [vote, setVote] = useState(initialVote);
  const [karma, setKarma] = useState(initialKarma || 0);

  const { mutate: handleVote } = useMutation({
    mutationFn: async ({ isUpvote, shouldDelete }) => {
      if (shouldDelete) {
        await api.delete(`/api/reactions/comment/${commentId}`);
      } else if (vote === null) {
        await api.put(`/api/reactions/comment/${commentId}`, { is_upvote: isUpvote });
      } else {
        await api.patch(`/api/reactions/comment/${commentId}`, { is_upvote: isUpvote });
      }
    },
    onMutate: async ({ isUpvote, shouldDelete }) => {
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
          setVote(null);
          setKarma((prev) => prev + (newVote ? -1 : 1));
        }
      }

      return { previousVote, previousKarma };
    },
    onError: (err, variables, context) => {
      if (context) {
        setVote(context.previousVote);
        setKarma(context.previousKarma);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
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
    <div className="flex items-center space-x-2">
      <motion.button
        onClick={handleUpvote}
        className={`p-1.5 rounded-lg transition-all duration-300 ${
          vote === true
            ? "bg-primary/20 text-primary"
            : "text-gray-500 hover:bg-primary/10 hover:text-primary"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Upvote comment"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </motion.button>

      <motion.span
        className="text-xs font-semibold text-gray-700 min-w-[2ch] text-center"
        animate={{ scale: vote !== null ? 1.2 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {karma}
      </motion.span>

      <motion.button
        onClick={handleDownvote}
        className={`p-1.5 rounded-lg transition-all duration-300 ${
          vote === false
            ? "bg-primary/20 text-primary"
            : "text-gray-500 hover:bg-primary/10 hover:text-primary"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Downvote comment"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>
    </div>
  );
}

