import { useQuery } from "@tanstack/react-query";
import api from "../api.js";

/**
 * Custom hook for authentication state management
 * Returns user data, loading state, and authentication status
 */
export function useAuth() {
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/user");
        return response.data;
      } catch (error) {
        // Return null for 401 (unauthorized), throw for other errors
        if (error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    staleTime: 0, // Always refetch on mount
    cacheTime: 0, // Don't cache
  });

  // Calculate authentication status
  const isAuthenticated = !!user && !userLoading;

  return {
    user,
    isLoading: userLoading,
    error: userError,
    isAuthenticated,
  };
}

