import axios from "axios";

// Determine base URL: in development we may override via VITE_API_URL,
// otherwise (production build) we always point to the Render backend.
const baseURL =
  (import.meta.env.DEV && import.meta.env.VITE_API_URL) ||
  "https://project-e506628f-8ee9-434a-9890.onrender.com";

// Axios instance configured with the resolved base URL.
const api = axios.create({
  baseURL,
});

// Helper that returns the currently stored access token (if any).
function getAccessToken(): string {
  return localStorage.getItem("accessToken") || "";
}

// Attach Authorization header automatically when the token exists.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export default api;
