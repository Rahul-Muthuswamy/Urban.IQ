import { motion } from "framer-motion";

export default function CommunitySidebar({ community }) {
  // Parse rules - handle both JSON string and array formats
  let rules = [];
  if (community.rules) {
    try {
      if (typeof community.rules === "string") {
        // Try to parse as JSON first
        try {
          rules = JSON.parse(community.rules);
          // If it's not an array, wrap it
          if (!Array.isArray(rules)) {
            rules = [rules];
          }
        } catch {
          // If not JSON, treat as plain text (split by newlines or commas)
          rules = community.rules.split(/\n|,/).filter(r => r.trim());
        }
      } else if (Array.isArray(community.rules)) {
        rules = community.rules;
      }
    } catch (error) {
      console.error("Error parsing rules:", error);
      rules = [];
    }
  }
  const modList = community.modList || [];

  return (
    <div className="space-y-6">
      {/* Rules Section */}
      {rules && rules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-comm p-6"
        >
          <h2 className="text-xl font-bold text-gradient mb-4">Rules</h2>
          <ol className="space-y-3">
            {rules.map((rule, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold text-sm flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-gray-700 text-sm flex-1">{rule}</span>
              </li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* Moderators Section */}
      {modList && modList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-comm p-6"
        >
          <h2 className="text-xl font-bold text-gradient mb-4">Moderators</h2>
          <div className="space-y-3">
            {modList.map((mod, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                  {mod.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-700 font-medium text-sm">u/{mod}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-comm p-6"
      >
        <h2 className="text-xl font-bold text-gradient mb-4">Quick Links</h2>
        <div className="space-y-2">
          <a
            href={`/community/${community.name?.replace("t/", "")}`}
            className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>View All Posts</span>
          </a>
          {community.created_by && (
            <div className="flex items-center space-x-2 text-gray-600 text-sm pt-2 border-t border-gray-200">
              <span>Created by</span>
              <span className="font-semibold text-primary">u/{community.created_by}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

