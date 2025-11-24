import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Forward cookies
            if (req.headers.cookie) {
              proxyReq.setHeader("Cookie", req.headers.cookie);
            }
            // Forward origin for CORS
            proxyReq.setHeader("Origin", "http://localhost:5000");
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            // Ensure CORS headers are set
            proxyRes.headers["Access-Control-Allow-Credentials"] = "true";
            proxyRes.headers["Access-Control-Allow-Origin"] = req.headers.origin || "http://localhost:5174";
          });
        },
      },
    },
  },
});

