import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar.jsx";
import Logo from "../../components/Logo.jsx";
import SearchBar from "./SearchBar.jsx";
import SearchFilters from "./SearchFilters.jsx";
import SearchResults from "./SearchResults.jsx";
import LoadingSkeleton from "./LoadingSkeleton.jsx";

export default function FindPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeFilter, setActiveFilter] = useState("all");

  // Update query from URL params
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    setQuery(urlQuery);
  }, [searchParams]);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
      <Navbar />
      <Logo />

      <main className="max-w-6xl mx-auto pt-24 md:pt-32 px-4 md:px-6 py-8 md:py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            Discover Content
          </h1>
          <p className="text-gray-600 text-lg">
            Search posts, communities, and users across Threaddit
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <SearchBar
            initialQuery={query}
            onSearch={handleSearch}
            autoFocus={!query}
          />
        </motion.div>

        {/* Filters */}
        {query && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <SearchFilters
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
          </motion.div>
        )}

        {/* Results */}
        {query ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <SearchResults query={query} filter={activeFilter} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="glass rounded-2xl p-12 max-w-md mx-auto">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Start Searching
              </h2>
              <p className="text-gray-600">
                Enter a search query above to find posts, communities, and users
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}


