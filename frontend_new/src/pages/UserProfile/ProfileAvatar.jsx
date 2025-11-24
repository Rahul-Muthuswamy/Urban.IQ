import { motion } from "framer-motion";

export default function ProfileAvatar({ user, size = "medium" }) {
  const sizeClasses = {
    small: "w-10 h-10 text-sm",
    medium: "w-16 h-16 text-lg",
    large: "w-24 h-24 text-2xl md:w-28 md:h-28 md:text-3xl",
  };

  const getInitials = () => {
    if (user?.username) {
      const parts = user.username.split(/[\s_]/);
      if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-glass-lg relative overflow-hidden`}
      animate={{
        scale: [1, 1.02, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Background gradient animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-80"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Avatar image or initials */}
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.username || "User"}
          className="w-full h-full object-cover relative z-10"
        />
      ) : (
        <span className="relative z-10">{getInitials()}</span>
      )}
    </motion.div>
  );
}


