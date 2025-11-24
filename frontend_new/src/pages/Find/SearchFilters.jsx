import { motion } from "framer-motion";

const filters = [
  { id: "all", label: "All" },
  { id: "posts", label: "Posts" },
  { id: "communities", label: "Communities" },
];

export default function SearchFilters({ activeFilter, onFilterChange }) {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              isActive
                ? "text-primary bg-white/50"
                : "text-gray-600 hover:text-gray-800 hover:bg-white/30"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {filter.label}
            {isActive && (
              <motion.div
                layoutId="activeFilter"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}


