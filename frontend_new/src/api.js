import axios from "axios";

// Use relative URL when proxying through Vite, or absolute when running standalone
const baseURL = import.meta.env.PROD 
  ? "http://localhost:5000" 
  : ""; // Empty string uses Vite proxy in development

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for debugging and FormData handling
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    // If data is FormData, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    console.error("[API] Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] Error ${error.response.status}:`, error.response.data);
      // Handle 401 unauthorized - redirect to login
      // But only if we're not already on login/signup pages and not during initial auth check
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.includes("/login") || currentPath.includes("/signup");
      const isAuthCheck = error.config?.url?.includes("/api/user") && error.config?.method === "get";
      
      if (error.response.status === 401 && !isAuthPage && !isAuthCheck) {
        console.log("[API] Unauthorized, redirecting to login...");
        // Use setTimeout to avoid interfering with React Router navigation
        setTimeout(() => {
          if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/signup")) {
            window.location.href = "/login";
          }
        }, 100);
      }
    } else if (error.request) {
      console.error("[API] No response received:", error.request);
    } else {
      console.error("[API] Error setting up request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

