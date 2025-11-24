import { motion } from "framer-motion";

export default function FiltersBar({ selectedFilter, selectedSort, onFilterChange, onSortChange }) {
  const filters = [
    { value: "day", label: "Today" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "alltime", label: "All" },
  ];

  const sorts = [
    { value: "hot", label: "Hot" },
    { value: "new", label: "New" },
    { value: "top", label: "Top" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 shadow-glass flex items-center justify-between flex-wrap gap-4"
    >
      {/* Filter Buttons */}
      <div className="flex items-center space-x-2">
        {filters.map((filter) => (
          <motion.button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              selectedFilter === filter.value
                ? "bg-gradient-primary text-white shadow-lg"
                : "bg-white/50 text-gray-700 hover:bg-white/70"
            }`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>

      {/* Sort Buttons */}
      <div className="flex items-center space-x-2">
        {sorts.map((sort) => (
          <motion.button
            key={sort.value}
            onClick={() => onSortChange(sort.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              selectedSort === sort.value
                ? "bg-gradient-primary text-white shadow-lg"
                : "bg-white/50 text-gray-700 hover:bg-white/70"
            }`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {sort.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}


