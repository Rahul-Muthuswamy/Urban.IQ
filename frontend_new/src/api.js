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

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
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
      if (error.response.status === 401 && !window.location.pathname.includes("/login")) {
        // Don't redirect if already on login/signup pages
        if (!window.location.pathname.includes("/signup")) {
          console.log("[API] Unauthorized, redirecting to login...");
          window.location.href = "/login";
        }
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

