import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CommentItem from "./CommentItem.jsx";

export default function CommentsList({ comments, postId, onCommentUpdate }) {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {comments.map((commentData, index) => (
        <CommentItem
          key={commentData.comment.comment_info.id}
          commentData={commentData}
          postId={postId}
          depth={0}
          index={index}
          onCommentUpdate={onCommentUpdate}
        />
      ))}
    </div>
  );
}


