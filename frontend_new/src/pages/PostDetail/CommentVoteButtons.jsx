import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "../../api.js";

export default function CommentVoteButtons({ commentId, initialVote, initialKarma }) {
  const queryClient = useQueryClient();
  // Convert initialVote to boolean or null
  const normalizedInitialVote = initialVote === true ? true : initialVote === false ? false : null;
  const [vote, setVote] = useState(normalizedInitialVote);
  const [karma, setKarma] = useState(initialKarma || 0);

  // Update state when props change
  useEffect(() => {
    const normalized = initialVote === true ? true : initialVote === false ? false : null;
    setVote(normalized);
    setKarma(initialKarma || 0);
  }, [initialVote, initialKarma]);

  const { mutate: handleVote } = useMutation({
    mutationFn: async ({ isUpvote, shouldDelete, previousVote }) => {
      console.log(`[CommentVoteButtons] mutationFn called: isUpvote=${isUpvote}, shouldDelete=${shouldDelete}, previousVote=${previousVote}`);
      
      if (shouldDelete) {
        console.log(`[CommentVoteButtons] Deleting reaction for comment ${commentId}`);
        await api.delete(`/api/reactions/comment/${commentId}`);
      } else if (previousVote === null || previousVote === undefined) {
        // Create new reaction
        console.log(`[CommentVoteButtons] Creating new reaction for comment ${commentId}: is_upvote=${isUpvote}`);
        await api.put(`/api/reactions/comment/${commentId}`, { is_upvote: isUpvote });
      } else {
        // Update existing reaction
        console.log(`[CommentVoteButtons] Updating reaction for comment ${commentId}: is_upvote=${isUpvote}`);
        await api.patch(`/api/reactions/comment/${commentId}`, { is_upvote: isUpvote });
      }
    },
    onMutate: async ({ isUpvote, shouldDelete }) => {
      const previousVote = vote;
      const previousKarma = karma;

      if (shouldDelete) {
        // Removing vote - reverse the karma change
        setVote(null);
        if (previousVote === true) {
          // Was upvoted, removing upvote decreases karma by 1
          setKarma((prev) => prev - 1);
        } else if (previousVote === false) {
          // Was downvoted, removing downvote increases karma by 1
          setKarma((prev) => prev + 1);
        }
      } else {
        const newVote = isUpvote;
        if (previousVote === null) {
          // No previous vote - add new vote
          setVote(newVote);
          setKarma((prev) => prev + (newVote ? 1 : -1));
        } else if (previousVote !== newVote) {
          // Changing vote (upvote to downvote or vice versa)
          setVote(newVote);
          if (previousVote === true && newVote === false) {
            // Upvote to downvote: -1 (remove upvote) + -1 (add downvote) = -2
            setKarma((prev) => prev - 2);
          } else if (previousVote === false && newVote === true) {
            // Downvote to upvote: +1 (remove downvote) + 1 (add upvote) = +2
            setKarma((prev) => prev + 2);
          }
        }
      }

      return { previousVote, previousKarma };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      console.log(`[CommentVoteButtons] Vote successful for comment ${commentId}, cache invalidated`);
    },
    onError: (err, variables, context) => {
      console.error(`[CommentVoteButtons] Error voting on comment ${commentId}:`, err);
      if (context) {
        setVote(context.previousVote);
        setKarma(context.previousKarma);
      }
    },
  });

  const handleUpvote = () => {
    console.log(`[CommentVoteButtons] Upvote clicked for comment ${commentId}, current vote:`, vote);
    const currentVote = vote;
    if (currentVote === true) {
      // Already upvoted - remove vote
      handleVote({ isUpvote: true, shouldDelete: true, previousVote: currentVote });
    } else {
      // Not upvoted or downvoted - add/change to upvote
      handleVote({ isUpvote: true, shouldDelete: false, previousVote: currentVote });
    }
  };

  const handleDownvote = () => {
    console.log(`[CommentVoteButtons] Downvote clicked for comment ${commentId}, current vote:`, vote);
    const currentVote = vote;
    if (currentVote === false) {
      // Already downvoted - remove vote
      handleVote({ isUpvote: false, shouldDelete: true, previousVote: currentVote });
    } else {
      // Not downvoted or upvoted - add/change to downvote
      handleVote({ isUpvote: false, shouldDelete: false, previousVote: currentVote });
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

