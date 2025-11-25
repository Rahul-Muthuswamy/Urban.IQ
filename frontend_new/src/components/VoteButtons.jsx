import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "../api.js";

export default function VoteButtons({ postId, initialVote, initialKarma }) {
  // Convert initialVote to boolean or null
  const normalizedInitialVote = initialVote === true ? true : initialVote === false ? false : null;
  const [vote, setVote] = useState(normalizedInitialVote);
  const [karma, setKarma] = useState(initialKarma || 0);
  const queryClient = useQueryClient();

  // Update state when props change
  useEffect(() => {
    const normalized = initialVote === true ? true : initialVote === false ? false : null;
    console.log(`[VoteButtons] Props updated for post ${postId}:`, {
      initialVote,
      normalized,
      initialKarma,
    });
    setVote(normalized);
    setKarma(initialKarma || 0);
  }, [initialVote, initialKarma, postId]);

  const { mutate: handleVote } = useMutation({
    mutationFn: async ({ isUpvote, shouldDelete, previousVote }) => {
      console.log(`[VoteButtons] mutationFn called: isUpvote=${isUpvote}, shouldDelete=${shouldDelete}, previousVote=${previousVote}`);
      
      if (shouldDelete) {
        console.log(`[VoteButtons] Deleting reaction for post ${postId}`);
        await api.delete(`/api/reactions/post/${postId}`);
      } else if (previousVote === null || previousVote === undefined) {
        // Create new reaction
        console.log(`[VoteButtons] Creating new reaction for post ${postId}: is_upvote=${isUpvote}`);
        await api.put(`/api/reactions/post/${postId}`, { is_upvote: isUpvote });
      } else {
        // Update existing reaction
        console.log(`[VoteButtons] Updating reaction for post ${postId}: is_upvote=${isUpvote}`);
        await api.patch(`/api/reactions/post/${postId}`, { is_upvote: isUpvote });
      }
    },
    onMutate: async ({ isUpvote, shouldDelete }) => {
      // Optimistic update
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
          // Remove old vote effect and add new vote effect
          setVote(newVote);
          if (previousVote === true && newVote === false) {
            // Upvote to downvote: -1 (remove upvote) + -1 (add downvote) = -2
            setKarma((prev) => prev - 2);
          } else if (previousVote === false && newVote === true) {
            // Downvote to upvote: +1 (remove downvote) + 1 (add upvote) = +2
            setKarma((prev) => prev + 2);
          }
        }
        // If previousVote === newVote, shouldDelete should be true, so this shouldn't happen
      }

      return { previousVote, previousKarma };
    },
    onSuccess: (data, variables) => {
      // Invalidate all post-related queries
      console.log(`[VoteButtons] Vote successful for post ${postId}, invalidating cache`);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      
      // Also refetch the post to get updated vote status
      queryClient.refetchQueries({ queryKey: ["post", postId] });
    },
    onError: (err, variables, context) => {
      // Rollback on error
      console.error(`[VoteButtons] Error voting on post ${postId}:`, err);
      if (context) {
        setVote(context.previousVote);
        setKarma(context.previousKarma);
      }
    },
  });

  const handleUpvote = () => {
    console.log(`[VoteButtons] Upvote clicked for post ${postId}, current vote:`, vote);
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
    console.log(`[VoteButtons] Downvote clicked for post ${postId}, current vote:`, vote);
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

