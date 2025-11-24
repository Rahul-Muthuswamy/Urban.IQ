import { motion, AnimatePresence } from "framer-motion";

export default function CommunityTabs({ activeTab, sortBy, onTabChange, onSortChange }) {
  const tabs = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "all", label: "All Time" },
  ];

  const sortOptions = [
    { id: "hot", label: "Hot" },
    { id: "new", label: "New" },
    { id: "top", label: "Top" },
  ];

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Time Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  isActive ? "text-gray-900 font-semibold" : "text-gray-600 hover:text-gray-800"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            {sortOptions.map((option) => {
              const isActive = sortBy === option.id;
              return (
                <motion.button
                  key={option.id}
                  onClick={() => onSortChange(option.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {option.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

